// The four ADP business lines Converge works for
export type DomainId = 'hr' | 'payroll' | 'insurance' | 'retirement';

export interface Persona {
  id: string;
  name: string;
  role: string;
  department: string;
  teamSize: number;
  avatar: string;
  email: string;
  location: string;
  securityClearance: string;
  domain?: DomainId;
}

export interface SlackMessage {
  id: string;
  sender: string;
  handle: string;
  avatar: string;
  time: string;
  text: string;
  isDirectReport?: boolean;
  isManager?: boolean;
  reactions?: { emoji: string; count: number }[];
}

export interface PDFSnippet {
  docName: string;
  version: string;
  pageNumber: number;
  totalPages: number;
  section: string;
  highlightedText: string;
  surroundingContext: string;
  clauseId: string;
}

export interface MessyDataItem {
  id: string;
  type: 'slack' | 'pdf' | 'jira' | 'email';
  title: string;
  channelOrDoc: string;
  timestamp: string;
  sourceBadge: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  summarySnippet: string;
  slackThread?: SlackMessage[];
  pdfSnippet?: PDFSnippet;
  emailDetails?: {
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string;
  };
  relatedInsightId: string;
}

export interface ConvergenceInsight {
  id: string;
  managerId: string;
  employee: {
    name: string;
    role: string;
    department: string;
    avatar: string;
    tenure: string;
    location: string;
    email: string;
    workdayId: string;
  };
  category: string; // for example 'Parental Leave', 'Short or Missing Pay', '401(k) Loan'
  urgency: 'High' | 'Medium' | 'Low';
  status: 'Pending Manager Action' | 'Submitted to ADP' | 'Synced with ADP';
  aiConfidence: number;
  headline: string;
  summary: string;
  eligibility: {
    status: 'Eligible' | 'Conditional' | 'Ineligible';
    headline: string;
    keyPoints: string[];
    statutoryAddendum: string;
  };
  actionChecklist: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  adpPayload: {
    transactionType: string;
    employeeWorkdayId: string;
    adpRecordCode: string;
    effectivePeriod: string;
    benefitSchedule: string;
    autoTriggerPayrollAdjustment: boolean;
  };
  suggestedSlackReply: string;
  adpEndpoint?: string; // real endpoint text from the backend (live mode)
  origin?: 'demo' | 'live';
  domain?: DomainId; // missing means HR (the original demo data)
  groupId?: string; // cases from the same message share a groupId
  originalMessage?: string; // the employee message that started the case
  highlights?: { label: string; value: string }[]; // key facts shown as tiles
  messySourceIds: string[];
}
