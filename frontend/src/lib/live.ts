// Helpers for Live Mode: ask the backend for Slack messages and turn them
// into the same card shapes the demo data uses.

import { ConvergenceInsight, MessyDataItem } from '../types/converge';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// What the backend sends at /api/slack/feed
export interface LiveFeedItem {
  id: string;
  employee_id: string;
  employee_name?: string;
  manager_id: string;
  channel_id?: string;
  message: string;
  received_at?: string;
  replied_in_slack?: boolean;
  sources?: { text: string; page: number | null }[];
  insight: {
    eligibility_summary: string;
    recommended_action: string;
    adp_api_endpoint: string;
    headline?: string;
    category?: string;
    urgency?: string;
    eligibility_status?: string;
    eligibility_headline?: string;
    key_points?: string[];
    statutory_citation?: string;
    checklist?: string[];
    suggested_slack_reply?: string;
  };
}

export interface LiveCase {
  insight: ConvergenceInsight;
  messy: MessyDataItem[];
}

const CATEGORIES: ConvergenceInsight['category'][] = [
  'Parental Leave',
  'Cross-Border Remote Work',
  'Medical / FMLA',
  'Equipment & Wellness Stipend',
  'PTO Carryover',
  'General HR Question',
];

// Use the category from the AI. If it is missing, guess from the words used.
function pickCategory(given: string | undefined, text: string): ConvergenceInsight['category'] {
  const exact = CATEGORIES.find((c) => c.toLowerCase() === (given || '').toLowerCase());
  if (exact) return exact;
  const t = text.toLowerCase();
  if (/parental|baby|expecting|maternity|paternity|newborn/.test(t)) return 'Parental Leave';
  if (/fmla|medical|surgery|sick/.test(t)) return 'Medical / FMLA';
  if (/remote|abroad|overseas|another country|work from/.test(t)) return 'Cross-Border Remote Work';
  if (/stipend|equipment|wellness|monitor|chair/.test(t)) return 'Equipment & Wellness Stipend';
  if (/pto|carryover|carry over|vacation/.test(t)) return 'PTO Carryover';
  return 'General HR Question';
}

function pickUrgency(given?: string): ConvergenceInsight['urgency'] {
  return given === 'High' || given === 'Low' ? given : 'Medium';
}

function pickStatus(given?: string): 'Eligible' | 'Conditional' | 'Ineligible' {
  return given === 'Eligible' || given === 'Ineligible' ? given : 'Conditional';
}

function initials(name: string) {
  const parts = name.replace(/[^a-zA-Z ]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function splitSentences(text: string, max: number) {
  return (text.match(/[^.!?]+[.!?]?/g) || [])
    .map((x) => x.trim())
    .filter((x) => x.length > 3)
    .slice(0, max);
}

// "1. Do this 2. Do that" -> ["Do this", "Do that"]
function splitSteps(text: string) {
  const parts = text.split(/(?:^|\s)\d+[.)]\s+/).map((x) => x.trim()).filter(Boolean);
  return parts.length > 1 ? parts : splitSentences(text, 5);
}

function formatTime(iso?: string) {
  if (!iso) return 'Just now';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Just now';
  return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function toLiveCase(item: LiveFeedItem): LiveCase {
  const ai = item.insight;
  const name = item.employee_name || item.employee_id;
  const firstName = name.split(' ')[0];
  const category = pickCategory(ai.category, item.message);
  const insightId = `live-${item.id}`;
  const time = formatTime(item.received_at);

  const keyPoints = ai.key_points && ai.key_points.length > 0
    ? ai.key_points
    : splitSentences(ai.eligibility_summary, 4);

  const steps = ai.checklist && ai.checklist.length > 0
    ? ai.checklist
    : splitSteps(ai.recommended_action);

  const insight: ConvergenceInsight = {
    id: insightId,
    managerId: item.manager_id,
    origin: 'live',
    // Sample values: the backend does not know these yet (no Workday connection)
    employee: {
      name,
      role: 'Team Member',
      department: 'Core Infrastructure & Platform',
      avatar: initials(name),
      tenure: 'Pending HRIS sync',
      location: 'Not synced',
      email: '',
      workdayId: item.employee_id,
    },
    category,
    urgency: pickUrgency(ai.urgency),
    status: 'Pending Manager Action',
    aiConfidence: 0, // 0 means "do not show a confidence number"
    headline: ai.headline || `${name} asked about ${category.toLowerCase()}.`,
    summary: ai.eligibility_summary,
    eligibility: {
      status: pickStatus(ai.eligibility_status),
      headline: ai.eligibility_headline || 'See policy details below',
      keyPoints,
      statutoryAddendum:
        ai.statutory_citation || 'Cross-referenced against the Employee Handbook excerpts shown on the left.',
    },
    actionChecklist: steps.map((text, i) => ({ id: `${insightId}-step-${i}`, text, completed: false })),
    adpEndpoint: ai.adp_api_endpoint,
    adpPayload: {
      transactionType: ai.adp_api_endpoint,
      employeeWorkdayId: item.employee_id,
      adpRecordCode: 'PENDING-MANAGER-REVIEW',
      effectivePeriod: 'To be confirmed with employee',
      benefitSchedule: category,
      autoTriggerPayrollAdjustment: false,
    },
    suggestedSlackReply:
      ai.suggested_slack_reply ||
      `Hi ${firstName}, thanks for reaching out! I checked the handbook and here is the short version: ${ai.eligibility_summary}`,
    messySourceIds: [`messy-${insightId}-slack`],
  };

  const messy: MessyDataItem[] = [
    {
      id: `messy-${insightId}-slack`,
      type: 'slack',
      title: `Slack Message: ${category}`,
      channelOrDoc: item.channel_id ? `#${item.channel_id}` : '#slack',
      timestamp: time,
      sourceBadge: 'Live Slack Events API',
      author: { name, role: 'Team Member', avatar: initials(name) },
      summarySnippet: item.message,
      slackThread: [
        {
          id: `${insightId}-msg`,
          sender: name,
          handle: `@${item.employee_id}`,
          avatar: initials(name),
          time: time.replace('Today at ', ''),
          text: item.message,
          isDirectReport: true,
        },
      ],
      relatedInsightId: insightId,
    },
  ];

  // The handbook excerpts the AI used show up as "document" cards
  (item.sources || []).slice(0, 2).forEach((src, i) => {
    const id = `messy-${insightId}-doc-${i}`;
    insight.messySourceIds.push(id);
    messy.push({
      id,
      type: 'pdf',
      title: `Handbook Excerpt ${i + 1} (retrieved by AI)`,
      channelOrDoc: 'Employee Handbook',
      timestamp: time,
      sourceBadge: 'ChromaDB vector search',
      author: { name: 'People Ops', role: 'Policy owner', avatar: 'PO' },
      summarySnippet: src.text.slice(0, 120),
      pdfSnippet: {
        docName: 'Employee Handbook',
        version: 'Current',
        pageNumber: src.page || 0, // 0 means "page unknown"
        totalPages: 0,
        section: `Top match #${i + 1}`,
        highlightedText: src.text,
        surroundingContext: '',
        clauseId: `match-${i + 1}`,
      },
      relatedInsightId: insightId,
    });
  });

  return { insight, messy };
}
