// Sample cases for Payroll, Insurance and Retirement (Demo mode).
// Each business has two cases. One of them is part of the "new baby" message that also touches HR.
// All policy text is made-up sample text, not real ADP or legal rules.
//
// A small builder (buildCase) turns each short spec into the full card data the dashboard needs.

import { ConvergenceInsight, DomainId, MessyDataItem } from '../types/converge';

type Source =
  | {
      kind: 'slack';
      title: string;
      channel: string;
      time: string;
      messages: { sender: string; text: string; isManager?: boolean }[];
    }
  | { kind: 'email'; subject: string; from: string; to: string; date: string; body: string }
  | {
      kind: 'pdf';
      title: string;
      docName: string;
      version: string;
      page: number;
      totalPages: number;
      section: string;
      clauseId: string;
      highlighted: string;
      context: string;
    };

interface CaseSpec {
  id: string;
  domain: DomainId;
  managerId: string;
  groupId?: string;
  originalMessage: string;
  employee: ConvergenceInsight['employee'];
  category: string;
  urgency: ConvergenceInsight['urgency'];
  confidence: number;
  headline: string;
  summary: string;
  eligibility: ConvergenceInsight['eligibility'];
  highlights: { label: string; value: string }[];
  checklist: string[];
  stepsDone: number; // how many checklist steps start as done
  adp: { endpoint: string; code: string; period: string; schedule: string; autoPayroll: boolean };
  slackReply: string;
  sources: Source[];
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

function buildCase(spec: CaseSpec): { insight: ConvergenceInsight; messy: MessyDataItem[] } {
  const messy: MessyDataItem[] = spec.sources.map((src, i) => {
    const id = `messy-${spec.id}-${i}`;
    const base = { id, relatedInsightId: spec.id };

    if (src.kind === 'slack') {
      const first = src.messages[0];
      return {
        ...base,
        type: 'slack',
        title: src.title,
        channelOrDoc: src.channel,
        timestamp: src.time,
        sourceBadge: 'Slack Enterprise Grid',
        author: { name: first.sender, role: 'Employee', avatar: initials(first.sender) },
        summarySnippet: first.text.slice(0, 140),
        slackThread: src.messages.map((m, j) => ({
          id: `${id}-m${j}`,
          sender: m.sender,
          handle: '@' + m.sender.toLowerCase().replace(' ', '.'),
          avatar: initials(m.sender),
          time: src.time.replace(/^.* at /, ''),
          text: m.text,
          isManager: m.isManager,
          isDirectReport: !m.isManager,
        })),
      } as MessyDataItem;
    }

    if (src.kind === 'email') {
      return {
        ...base,
        type: 'email',
        title: `Email: ${src.subject}`,
        channelOrDoc: src.to,
        timestamp: src.date,
        sourceBadge: 'Microsoft 365 Mail',
        author: { name: src.from, role: 'Employee', avatar: initials(src.from) },
        summarySnippet: src.body.slice(0, 140),
        emailDetails: {
          subject: src.subject,
          from: src.from,
          to: src.to,
          date: src.date,
          body: src.body,
        },
      } as MessyDataItem;
    }

    return {
      ...base,
      type: 'pdf',
      title: src.title,
      channelOrDoc: src.docName,
      timestamp: 'Sample policy document',
      sourceBadge: `Policy PDF (pg ${src.page})`,
      author: { name: 'Policy Owner', role: 'Document owner', avatar: 'PO' },
      summarySnippet: src.highlighted.slice(0, 140),
      pdfSnippet: {
        docName: src.docName,
        version: src.version,
        pageNumber: src.page,
        totalPages: src.totalPages,
        section: src.section,
        highlightedText: src.highlighted,
        surroundingContext: src.context,
        clauseId: src.clauseId,
      },
    } as MessyDataItem;
  });

  const insight: ConvergenceInsight = {
    id: spec.id,
    managerId: spec.managerId,
    domain: spec.domain,
    groupId: spec.groupId,
    originalMessage: spec.originalMessage,
    employee: spec.employee,
    category: spec.category,
    urgency: spec.urgency,
    status: 'Pending Manager Action',
    aiConfidence: spec.confidence,
    headline: spec.headline,
    summary: spec.summary,
    eligibility: spec.eligibility,
    highlights: spec.highlights,
    actionChecklist: spec.checklist.map((text, i) => ({
      id: `${spec.id}-step-${i}`,
      text,
      completed: i < spec.stepsDone,
    })),
    adpEndpoint: spec.adp.endpoint,
    adpPayload: {
      transactionType: spec.adp.endpoint,
      employeeWorkdayId: spec.employee.workdayId,
      adpRecordCode: spec.adp.code,
      effectivePeriod: spec.adp.period,
      benefitSchedule: spec.adp.schedule,
      autoTriggerPayrollAdjustment: spec.adp.autoPayroll,
    },
    suggestedSlackReply: spec.slackReply,
    messySourceIds: messy.map((m) => m.id),
  };

  return { insight, messy };
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

// Alex Chen is the employee in the HR demo case, so the "new baby" message ties all four businesses together.
const ALEX = {
  name: 'Alex Chen',
  role: 'Senior Full Stack Engineer',
  department: 'Core Infrastructure & Platform',
  avatar: 'AC',
  tenure: '2 yrs 7 mos',
  location: 'San Francisco, CA (Remote)',
  email: 'alex.chen@acme-enterprise.internal',
  workdayId: 'EMP-90421',
};

const BABY_MESSAGE =
  "Expecting our second kid in mid-August. What happens to my pay, my health plan and my 401(k) while I'm on leave?";

const BABY_SLACK: Source = {
  kind: 'slack',
  title: 'Slack Message: Pay, health plan and 401(k) during leave',
  channel: '#eng-platform-private',
  time: 'Today at 09:40 AM',
  messages: [{ sender: 'Alex Chen', text: BABY_MESSAGE }],
};

// ---------------------------------------------------------------------------
// The six cases
// ---------------------------------------------------------------------------

const CASES: CaseSpec[] = [
  // ------------------------------- PAYROLL -------------------------------
  {
    id: 'insight-payroll-alex',
    domain: 'payroll',
    managerId: 'priya-nair',
    groupId: 'grp-baby',
    originalMessage: BABY_MESSAGE,
    employee: ALEX,
    category: 'Pay During Leave',
    urgency: 'Medium',
    confidence: 97.6,
    headline: 'Alex Chen stays on full pay during parental leave. Only the health premium deduction will change.',
    summary:
      'Payroll Policy Guide section 2.1 says pay continues at 100% of base salary through the regular payroll during approved paid parental leave, and benefit deductions stay pre-tax. When the baby is added to the health plan, the premium deduction changes after the benefits change is approved (section 2.2). Any back premium is caught up over up to three pay periods.',
    eligibility: {
      status: 'Eligible',
      headline: '100% base pay continues during leave',
      keyPoints: [
        'Pay continues at 100% of base through the regular semi-monthly payroll',
        'Benefit deductions continue pre-tax during paid leave',
        'State PFL payments are coordinated so the total never goes over 100% of base pay',
        'The leave schedule must be recorded before the first affected pay date',
      ],
      statutoryAddendum: 'Payroll Policy Guide (Sample), sections 2.1 and 2.2.',
    },
    highlights: [
      { label: 'Pay during leave', value: '100% of base salary' },
      { label: 'Pay dates', value: '15th and last business day' },
      { label: 'Deduction change', value: 'Starts on first payroll after approval' },
      { label: 'Back premium', value: 'Caught up over up to 3 pay periods' },
    ],
    checklist: [
      'Confirm the mid-August leave dates with HR',
      'Record the leave schedule in ADP before the first affected pay date',
      'Wait for the benefits change, then update the premium deduction',
      'Send Alex a pay statement preview after the change',
    ],
    stepsDone: 1,
    adp: {
      endpoint: 'POST /payroll/v1/pay-adjustments',
      code: 'ADP-PAY-LEAVE-100',
      period: '2026-08-15 to 2026-11-07',
      schedule: 'Full base pay, pre-tax deductions continue',
      autoPayroll: true,
    },
    slackReply:
      'Hi Alex! Congrats again. Good news: your pay stays at 100% of base while you are on leave, on the normal pay dates. Your health premium will change once the benefits team adds the baby, and I will send you a new pay statement preview when that happens. There is nothing you need to do for payroll right now.',
    sources: [
      BABY_SLACK,
      {
        kind: 'pdf',
        title: 'PDF: Payroll Policy Guide (Sample).pdf',
        docName: 'Payroll Policy Guide (Sample)',
        version: 'Sample',
        page: 2,
        totalPages: 2,
        section: 'Section 2.1 - Pay During Approved Leave',
        clauseId: 'PAY-POL-2.1',
        highlighted:
          'During approved paid parental leave, pay continues at one hundred percent (100%) of base salary through the regular payroll. Benefit deductions continue on a pre-tax basis during paid leave.',
        context:
          '...State paid family leave payments are coordinated by Payroll so that the employee never receives more than 100% of base pay. The leave schedule must be recorded in the system of record before the first affected pay date...',
      },
    ],
  },
  {
    id: 'insight-payroll-short-pay',
    domain: 'payroll',
    managerId: 'priya-nair',
    originalMessage:
      'My last paycheck was about $412 short. I worked 14 hours of overtime over the last two weeks and none of it showed up.',
    employee: {
      name: 'Casey Morgan',
      role: 'Customer Support Specialist',
      department: 'Global Customer Operations',
      avatar: 'CM',
      tenure: '1 yr 4 mos',
      location: 'Austin, TX',
      email: 'casey.morgan@acme-enterprise.internal',
      workdayId: 'EMP-77310',
    },
    category: 'Short or Missing Pay',
    urgency: 'High',
    confidence: 98.3,
    headline: 'Casey Morgan was paid about $412 too little because 14 overtime hours were missing.',
    summary:
      'The overtime was on a timesheet approved after the 5:00 PM cutoff, so it slid to the next pay cycle (section 1.4). Because the shortfall is over $50, Casey qualifies for an off-cycle payment within one business day after the specialist confirms the approved hours (section 1.3). Overtime is paid at 1.5 times the regular rate (section 1.2).',
    eligibility: {
      status: 'Eligible',
      headline: 'Off-cycle payment within 1 business day',
      keyPoints: [
        'The shortfall is over $50, so it is paid off-cycle and not on the next check',
        'Late approval caused the miss, and the manager can certify the hours in writing',
        'Overtime is paid at 1.5 times the regular rate over 40 hours a week',
        'The specialist must confirm the approved hours before the payment is released',
      ],
      statutoryAddendum: 'Payroll Policy Guide (Sample), sections 1.2, 1.3 and 1.4.',
    },
    highlights: [
      { label: 'Shortfall', value: 'About $412 (14 overtime hours)' },
      { label: 'Cause', value: 'Timesheet approved after cutoff' },
      { label: 'Fix', value: 'Off-cycle payment' },
      { label: 'Timing', value: 'Within 1 business day of confirmation' },
    ],
    checklist: [
      'Confirm the 14 overtime hours on the approved timesheet',
      "Get the manager's written certification of the hours",
      'Release the off-cycle payment at 1.5 times the regular rate',
      'Reply to Casey with the payment date',
      'Note the late approval for Payroll Operations',
    ],
    stepsDone: 1,
    adp: {
      endpoint: 'POST /payroll/v1/off-cycle-payments',
      code: 'ADP-PAY-OFFCYCLE-OT',
      period: 'Next business day',
      schedule: 'Off-cycle payment, overtime at 1.5x',
      autoPayroll: true,
    },
    slackReply:
      'Hi Casey, sorry about the short check! I found the problem: your overtime was approved after the cutoff, so it slid to the next cycle. I am sending an off-cycle payment for the missing overtime. You should see it within one business day after your manager confirms the hours, and I will message you the exact date.',
    sources: [
      {
        kind: 'email',
        subject: 'Paycheck is short again?!',
        from: 'Casey Morgan',
        to: 'payroll-help@acme-enterprise.internal',
        date: 'Yesterday, 4:52 PM',
        body:
          'Hi Payroll team,\n\nMy last paycheck was about $412 short. I worked 14 hours of overtime over the last two weeks (the big product launch) and none of it showed up on my pay stub. I have rent due on Friday. Can someone please look at this ASAP?\n\nThanks,\nCasey',
      },
      {
        kind: 'slack',
        title: 'Slack Thread: Timesheet approvals',
        channel: '#payroll-help',
        time: 'Today at 08:15 AM',
        messages: [
          { sender: 'Casey Morgan', text: 'Did my overtime get approved in time? My check looks wrong.' },
          {
            sender: 'Priya Nair',
            isManager: true,
            text: 'Checking the timesheet history now. It looks like it was approved after Monday cutoff.',
          },
        ],
      },
      {
        kind: 'pdf',
        title: 'PDF: Payroll Policy Guide (Sample).pdf',
        docName: 'Payroll Policy Guide (Sample)',
        version: 'Sample',
        page: 1,
        totalPages: 2,
        section: 'Section 1.3 - Short or Missing Pay',
        clauseId: 'PAY-POL-1.3',
        highlighted:
          'Shortfalls of fifty dollars ($50) or more are paid by off-cycle payment within one (1) business day after the error is confirmed. Shortfalls under fifty dollars ($50) are added to the next regular paycheck.',
        context:
          '...If an employee is underpaid because of a payroll or timesheet error, payroll corrects it as follows. The payroll specialist must confirm the approved hours before an off-cycle payment is released...',
      },
    ],
  },

  // ------------------------------ INSURANCE ------------------------------
  {
    id: 'insight-insurance-alex',
    domain: 'insurance',
    managerId: 'daniel-okafor',
    groupId: 'grp-baby',
    originalMessage: BABY_MESSAGE,
    employee: ALEX,
    category: 'Qualifying Life Event',
    urgency: 'High',
    confidence: 98.9,
    headline: 'Alex Chen can add the new baby to health coverage, but only within 30 days of the birth.',
    summary:
      'A birth is a qualifying life event (Benefits Enrollment Guide section 1.2). Alex has 30 calendar days from the birth to add the child, and coverage is retroactive to the date of birth (section 1.3). A birth certificate is due within 60 days. If Alex is on Employee only today, moving to Employee plus child(ren) changes the premium from $68.00 to $118.00 per pay period (section 2.1).',
    eligibility: {
      status: 'Eligible',
      headline: 'Add child within 30 days of birth',
      keyPoints: [
        'Birth of a child is a qualifying life event',
        'Coverage is retroactive to the date of birth',
        'The birth certificate is due within 60 days of the event',
        'The coverage tier can change at the same time',
      ],
      statutoryAddendum: 'Benefits Enrollment Guide (Sample), sections 1.2, 1.3 and 2.1.',
    },
    highlights: [
      { label: 'Deadline', value: '30 days after the birth' },
      { label: 'Coverage starts', value: 'Date of birth (retroactive)' },
      { label: 'Document needed', value: 'Birth certificate within 60 days' },
      { label: 'New premium', value: '$118.00 per pay period' },
    ],
    checklist: [
      'Tell Alex the 30 day window starts on the birth date, not the due date',
      'Collect the birth certificate within 60 days',
      'Enter the qualifying life event and new coverage tier in ADP',
      'Send the change to the carrier within 5 business days',
      'Tell Payroll so the new premium starts on the next payroll',
    ],
    stepsDone: 0,
    adp: {
      endpoint: 'POST /benefits/v1/qualifying-life-events',
      code: 'ADP-BEN-QLE-BIRTH',
      period: 'Birth date + 30 days to enroll',
      schedule: 'Employee + child(ren), Standard Health Plan',
      autoPayroll: true,
    },
    slackReply:
      'Hi Alex! Congratulations again. Once the baby arrives, you have 30 days from the birth date to add the baby to your health plan, and coverage goes back to the birth date. Please send me the birth certificate within 60 days. I can also help you pick the right coverage tier at the same time.',
    sources: [
      BABY_SLACK,
      {
        kind: 'pdf',
        title: 'PDF: Benefits Enrollment Guide (Sample).pdf',
        docName: 'Benefits Enrollment Guide (Sample)',
        version: 'Sample',
        page: 1,
        totalPages: 2,
        section: 'Section 1.3 - Birth or Adoption of a Child',
        clauseId: 'BEN-POL-1.3',
        highlighted:
          'A new child may be added within thirty (30) days of the birth or adoption. Coverage is retroactive to the date of birth or adoption. A copy of the birth certificate must be provided within sixty (60) days of the event.',
        context:
          '...Outside open enrollment, an employee may change coverage only after a qualifying life event. If the thirty (30) day window is missed, the employee must wait until the next open enrollment...',
      },
    ],
  },
  {
    id: 'insight-insurance-marriage',
    domain: 'insurance',
    managerId: 'daniel-okafor',
    originalMessage:
      'I got married last Saturday. Can I add my wife to my health insurance now, or do I have to wait until open enrollment in November?',
    employee: {
      name: 'Taylor Brooks',
      role: 'Senior Account Executive',
      department: 'Enterprise Sales',
      avatar: 'TB',
      tenure: '4 yrs 2 mos',
      location: 'Chicago, IL',
      email: 'taylor.brooks@acme-enterprise.internal',
      workdayId: 'EMP-65208',
    },
    category: 'Add Dependent',
    urgency: 'High',
    confidence: 99.0,
    headline: 'Taylor Brooks can add a new spouse now and does not need to wait for November.',
    summary:
      'Marriage is a qualifying life event, so Taylor has 30 days from the wedding to add the spouse (Benefits Enrollment Guide sections 1.2 and 1.4). Coverage starts on the first day of the month after the request is approved, and a marriage certificate is required. If the 30 day window is missed, Taylor must wait for open enrollment (November 1 to November 15).',
    eligibility: {
      status: 'Eligible',
      headline: 'Add spouse within 30 days of marriage',
      keyPoints: [
        'Marriage is a qualifying life event',
        'Spouse coverage starts on the first day of the month after approval',
        'A marriage certificate is required',
        'If the 30 days are missed, wait until open enrollment (Nov 1 to Nov 15)',
      ],
      statutoryAddendum: 'Benefits Enrollment Guide (Sample), sections 1.2 and 1.4.',
    },
    highlights: [
      { label: 'Deadline', value: '30 days after the marriage' },
      { label: 'Coverage starts', value: '1st of month after approval' },
      { label: 'Document needed', value: 'Marriage certificate' },
      { label: 'New premium', value: '$131.00 per pay period' },
    ],
    checklist: [
      'Confirm the wedding date to set the 30 day deadline',
      'Collect the marriage certificate',
      'Enter the qualifying life event in ADP',
      'Send the enrollment change to the carrier within 5 business days',
      'Tell Payroll about the new premium',
    ],
    stepsDone: 0,
    adp: {
      endpoint: 'POST /benefits/v1/enrollment-changes',
      code: 'ADP-BEN-ENROLL-SPOUSE',
      period: 'Starts 1st of month after approval',
      schedule: 'Employee + spouse, Standard Health Plan',
      autoPayroll: true,
    },
    slackReply:
      'Hi Taylor, congratulations! You do not have to wait for November. Marriage counts as a qualifying life event, so you have 30 days from the wedding to add your wife. Please send me the marriage certificate and I will submit the change. Coverage will start on the first of the month after approval.',
    sources: [
      {
        kind: 'email',
        subject: 'Adding my spouse to insurance?',
        from: 'Taylor Brooks',
        to: 'benefits@acme-enterprise.internal',
        date: 'Today, 8:05 AM',
        body:
          'Hello Benefits,\n\nI got married last Saturday. Can I add my wife to my health insurance now, or do I have to wait until open enrollment in November? She is currently uninsured. Please let me know what paperwork you need.\n\nTaylor',
      },
      {
        kind: 'pdf',
        title: 'PDF: Benefits Enrollment Guide (Sample).pdf',
        docName: 'Benefits Enrollment Guide (Sample)',
        version: 'Sample',
        page: 1,
        totalPages: 2,
        section: 'Section 1.4 - Marriage',
        clauseId: 'BEN-POL-1.4',
        highlighted:
          'A new spouse may be added within thirty (30) days of the marriage. Coverage starts on the first day of the month after the request is approved. A copy of the marriage certificate is required.',
        context:
          '...Qualifying events are: marriage, divorce, birth or adoption of a child, and loss of other coverage. The employee has thirty (30) calendar days from the event to enroll or change coverage...',
      },
    ],
  },

  // ------------------------------ RETIREMENT -----------------------------
  {
    id: 'insight-retirement-alex',
    domain: 'retirement',
    managerId: 'hannah-weiss',
    groupId: 'grp-baby',
    originalMessage: BABY_MESSAGE,
    employee: ALEX,
    category: 'Contribution Change',
    urgency: 'Low',
    confidence: 96.8,
    headline: "Alex Chen's 401(k) contributions and employer match continue during paid leave.",
    summary:
      'During paid leave, contributions continue from the paid compensation, so Alex keeps getting the company match (100% of the first 4% of pay) as long as pay continues (401(k) Plan Summary sections 1.3 and 1.4). Alex can change the contribution percentage at any time, and a change received before the payroll cutoff takes effect within two pay periods. This is plan information, not personal financial advice.',
    eligibility: {
      status: 'Eligible',
      headline: 'Contributions and match continue',
      keyPoints: [
        'Contributions continue from paid compensation during paid leave',
        'The employer match is 100% of the first 4% of pay',
        'A change before the cutoff takes effect within 2 pay periods',
        'Unpaid leave would pause contributions',
      ],
      statutoryAddendum: '401(k) Plan Summary (Sample), sections 1.3 and 1.4. Plan information, not financial advice.',
    },
    highlights: [
      { label: 'During paid leave', value: 'Contributions continue' },
      { label: 'Employer match', value: '100% of first 4% of pay' },
      { label: 'Change election', value: 'Any time, within 2 pay periods' },
      { label: 'Unpaid leave', value: 'Contributions pause' },
    ],
    checklist: [
      'Confirm the leave is paid so contributions continue',
      'Remind Alex about the 4% employer match',
      'Offer a contribution change form if Alex wants one',
      'Record any change in ADP before the payroll cutoff',
    ],
    stepsDone: 1,
    adp: {
      endpoint: 'POST /retirement/v1/contribution-changes',
      code: 'ADP-RET-CONTRIB-LEAVE',
      period: 'No change unless Alex asks',
      schedule: 'Contributions continue during paid leave',
      autoPayroll: false,
    },
    slackReply:
      'Hi Alex! Your 401(k) keeps going while you are on paid leave, and you keep getting the company match on the first 4% of your pay. If you want to change your contribution percentage, tell me before the next payroll cutoff. This is just plan information, so a financial advisor is the best person for personal advice.',
    sources: [
      BABY_SLACK,
      {
        kind: 'pdf',
        title: 'PDF: 401(k) Plan Summary (Sample).pdf',
        docName: '401(k) Plan Summary (Sample)',
        version: 'Sample',
        page: 1,
        totalPages: 2,
        section: 'Section 1.4 - Changing Your Contribution',
        clauseId: 'RET-POL-1.4',
        highlighted:
          'During paid leave, contributions continue from the paid compensation. During unpaid leave, contributions pause. A change received before the payroll cutoff takes effect within two (2) pay periods.',
        context:
          '...The company matches 100% of the first 4% of pay that the employee contributes. Employer match contributions are fully vested after two (2) years of service...',
      },
    ],
  },
  {
    id: 'insight-retirement-loan',
    domain: 'retirement',
    managerId: 'hannah-weiss',
    originalMessage:
      'I want to buy a house and need cash for the down payment. Can I take a loan from my 401(k), and how much could I borrow?',
    employee: {
      name: 'Sam Rivera',
      role: 'Data Analyst',
      department: 'Finance & Strategy',
      avatar: 'SR',
      tenure: '3 yrs 6 mos',
      location: 'Boston, MA',
      email: 'sam.rivera@acme-enterprise.internal',
      workdayId: 'EMP-71544',
    },
    category: '401(k) Loan',
    urgency: 'Medium',
    confidence: 97.4,
    headline: 'Sam Rivera can borrow from the 401(k) for a home purchase, up to the plan limit.',
    summary:
      'The plan allows one loan at a time, up to the lesser of 50% of the vested balance or $50,000 (401(k) Plan Summary section 2.1). Because the loan is for a main home, the term can be up to 10 years instead of 5. There is a $75 fee and repayment is by payroll deduction. If Sam leaves the company, the unpaid balance is due or is treated as a taxable distribution. This is plan information, not personal financial or tax advice, so Sam may want to talk to an advisor.',
    eligibility: {
      status: 'Conditional',
      headline: 'Allowed, up to the lesser of 50% or $50,000',
      keyPoints: [
        'The maximum loan is the lesser of 50% of the vested balance or $50,000',
        'A loan for a main home can run up to 10 years',
        'Only one loan can be active at a time',
        'The unpaid balance becomes taxable if Sam leaves the company',
      ],
      statutoryAddendum: '401(k) Plan Summary (Sample), section 2.1. Plan information, not financial or tax advice.',
    },
    highlights: [
      { label: 'Max loan', value: 'Lesser of 50% vested or $50,000' },
      { label: 'Term', value: 'Up to 10 years for a main home' },
      { label: 'Fee', value: '$75 origination fee' },
      { label: 'Repayment', value: 'Payroll deduction' },
    ],
    checklist: [
      "Check Sam's vested balance and make sure no other loan is active",
      'Send the loan request form and the loan terms',
      'Explain that leaving the company can make the balance taxable',
      'Suggest talking to a financial advisor about the decision',
      'Submit the loan request in ADP after Sam signs',
    ],
    stepsDone: 1,
    adp: {
      endpoint: 'POST /retirement/v1/loan-requests',
      code: 'ADP-RET-LOAN-HOME',
      period: '5 to 10 year repayment term',
      schedule: 'Plan loan, repaid by payroll deduction',
      autoPayroll: true,
    },
    slackReply:
      'Hi Sam, the plan does allow a 401(k) loan for a home purchase. You can borrow up to the lesser of half of your vested balance or $50,000, and a home loan can be repaid over up to 10 years through payroll. If you leave the company, the unpaid balance can become taxable, so please think about that. I can only share plan information, so a financial advisor is the right person for advice.',
    sources: [
      {
        kind: 'slack',
        title: 'Slack Thread: House down payment and 401(k)',
        channel: '#retirement-help',
        time: 'Today at 10:12 AM',
        messages: [
          {
            sender: 'Sam Rivera',
            text: 'I want to buy a house and need cash for the down payment. Can I take a loan from my 401(k), and how much could I borrow?',
          },
          {
            sender: 'Hannah Weiss',
            isManager: true,
            text: 'Good question Sam. Let me check the loan limits in the plan summary.',
          },
        ],
      },
      {
        kind: 'pdf',
        title: 'PDF: 401(k) Plan Summary (Sample).pdf',
        docName: '401(k) Plan Summary (Sample)',
        version: 'Sample',
        page: 2,
        totalPages: 2,
        section: 'Section 2.1 - Plan Loans',
        clauseId: 'RET-POL-2.1',
        highlighted:
          'The maximum loan is the lesser of 50% of the vested balance or $50,000. The term is up to five (5) years, or up to ten (10) years to buy a main home. Only one (1) loan may be active at a time. There is a $75 origination fee.',
        context:
          '...Repayment is by payroll deduction. If employment ends, the unpaid balance is due or is treated as a taxable distribution...',
      },
    ],
  },
];

const BUILT = CASES.map(buildCase);

export const MOCK_NEW_INSIGHTS: ConvergenceInsight[] = BUILT.map((b) => b.insight);
export const MOCK_NEW_MESSY: MessyDataItem[] = BUILT.flatMap((b) => b.messy);
