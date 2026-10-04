"""
The business lines (domains) Converge can work for.

Every business uses the same engine:
  message -> find rules in documents -> action plan -> ADP endpoint.
Only the settings below change. To add a new business, add one more entry here,
put its policy PDF in data/, and add its text to data/generate_pdf.py.

All policy documents are SAMPLE text for the hackathon, not real ADP or legal rules.
"""

import re
from typing import List

DOMAINS = {
    "hr": {
        "name": "HR",
        "adp_product": "ADP Workforce Now",
        "user_role": "front-line people manager",
        "doc_title": "Employee Handbook",
        "pdf_file": "handbook.pdf",
        "default_category": "General HR Question",
        "categories": [
            "Parental Leave", "Cross-Border Remote Work", "Medical / FMLA",
            "Equipment & Wellness Stipend", "PTO Carryover", "General HR Question",
        ],
        "router_hint": "leave of absence, parental or medical leave, PTO and time off, remote work, stipends, handbook rules",
        "focus": (
            "Work out the employee's eligibility, duration, compensation and any statutory protection "
            "(such as FMLA or state PFL). Answer specific questions, for example whether PTO burn-down is mandatory."
        ),
        "adp_examples": [
            "POST /events/hr/v1/leaves/parental-leave-requests",
            "POST /events/hr/v1/benefits/pto-adjustments",
        ],
        "guardrails": "",
        "keywords": [
            "leave", "pto", "vacation", "parental", "fmla", "maternity", "paternity",
            "remote work", "handbook", "time off", "stipend", "sick day",
        ],
    },
    "payroll": {
        "name": "Payroll",
        "adp_product": "ADP Payroll",
        "user_role": "payroll specialist",
        "doc_title": "Payroll Policy Guide",
        "pdf_file": "payroll_guide.pdf",
        "default_category": "General Payroll Question",
        "categories": [
            "Short or Missing Pay", "Overtime", "Tax Withholding",
            "Deduction Change", "Pay During Leave", "General Payroll Question",
        ],
        "router_hint": "paychecks, short or missing pay, overtime, tax withholding, deductions, pay during leave, direct deposit",
        "focus": (
            "Find the most likely cause of the pay issue, estimate the money impact if the message gives numbers, "
            "and say which payroll cutoff or pay date matters. Say if an off-cycle payment or a pay adjustment is needed."
        ),
        "adp_examples": [
            "POST /payroll/v1/off-cycle-payments",
            "POST /payroll/v1/pay-adjustments",
            "POST /payroll/v1/tax-withholding-changes",
        ],
        "guardrails": "Never invent dollar amounts. Only use numbers from the message or the policy context.",
        "keywords": [
            "paycheck", "payroll", "pay stub", "pay date", "my pay", "overtime", "direct deposit",
            "withholding", "w-4", "w4", "deduction", "salary", "bonus", "off-cycle", "short",
        ],
    },
    "insurance": {
        "name": "Insurance",
        "adp_product": "ADP Benefits Administration",
        "user_role": "benefits administrator",
        "doc_title": "Benefits Enrollment Guide",
        "pdf_file": "benefits_guide.pdf",
        "default_category": "General Benefits Question",
        "categories": [
            "Qualifying Life Event", "Add Dependent", "Open Enrollment",
            "Coverage Change", "Premium Question", "General Benefits Question",
        ],
        "router_hint": "health, dental and vision insurance, adding a spouse or child, qualifying life events, enrollment deadlines, premiums",
        "focus": (
            "Decide whether the message is a qualifying life event, find the enrollment deadline, "
            "the coverage start date and the documents the employee must provide. Say what happens if the deadline is missed."
        ),
        "adp_examples": [
            "POST /benefits/v1/qualifying-life-events",
            "POST /benefits/v1/enrollment-changes",
        ],
        "guardrails": "Always state the enrollment deadline if the policy context has one. Do not promise coverage the policy does not state.",
        "keywords": [
            "insurance", "health plan", "dental", "vision", "coverage", "enroll", "spouse",
            "dependent", "married", "marriage", "baby", "newborn", "premium", "open enrollment",
            "life event", "benefits",
        ],
    },
    "retirement": {
        "name": "Retirement",
        "adp_product": "ADP Retirement Services",
        "user_role": "retirement plan administrator",
        "doc_title": "401(k) Plan Summary",
        "pdf_file": "retirement_plan.pdf",
        "default_category": "General Retirement Question",
        "categories": [
            "Contribution Change", "401(k) Loan", "Hardship Withdrawal",
            "Employer Match", "Rollover or Distribution", "General Retirement Question",
        ],
        "router_hint": "401(k) contributions, employer match, plan loans, hardship withdrawals, rollovers, vesting",
        "focus": (
            "Check eligibility and limits in the plan summary, list the forms or steps needed, "
            "and point out any tax or compliance risk the employee should know about."
        ),
        "adp_examples": [
            "POST /retirement/v1/contribution-changes",
            "POST /retirement/v1/loan-requests",
            "POST /retirement/v1/distribution-requests",
        ],
        "guardrails": (
            "This is plan information, not personal financial or tax advice. Say so in the summary and "
            "suggest a financial advisor or tax professional for personal decisions. Cite the plan section you used."
        ),
        "keywords": [
            "401k", "401(k)", "retirement", "employer match", "match", "contribution", "loan",
            "rollover", "hardship", "withdrawal", "roth", "vesting", "pension",
        ],
    },
}

DOMAIN_IDS = list(DOMAINS.keys())


def get_domain(domain_id: str) -> dict:
    """Returns the settings for a business. Raises KeyError if the name is unknown."""
    return DOMAINS[domain_id]


def keyword_route(message: str) -> List[str]:
    """
    Simple backup router that matches words. It is used if the AI router fails.
    Always returns at least one business (HR).
    """
    text = message.lower()
    found = []
    for domain_id in DOMAIN_IDS:
        for word in DOMAINS[domain_id]["keywords"]:
            if re.search(re.escape(word), text):
                found.append(domain_id)
                break
    return found or ["hr"]
