from typing import List
from pydantic import BaseModel, Field

class InsightRequest(BaseModel):
    employee_id: str = Field(..., description="Unique employee identifier (e.g. Workday ID or system ID)")
    manager_id: str = Field(..., description="Identifier for the front-line manager submitting the request")
    message: str = Field(..., description="Raw unstructured Slack message or communication from employee")

class HRActionPlan(BaseModel):
    eligibility_summary: str = Field(
        ...,
        description="Clear, plain-English summary of employee eligibility and policy cross-reference"
    )
    recommended_action: str = Field(
        ...,
        description="Recommended next steps and operational guidance for the front-line manager"
    )
    adp_api_endpoint: str = Field(
        ...,
        description="Mocked REST API endpoint for ADP Workforce Now (e.g. POST /events/hr/v1/leaves/parental-leave-requests)"
    )

    # Extra fields so the dashboard can look as rich as the demo cards.
    # They all have defaults, so the app still works if the model leaves one out.
    headline: str = Field(
        default="",
        description="One sentence saying what the employee is asking for"
    )
    category: str = Field(
        default="General HR Question",
        description="One of: Parental Leave, Cross-Border Remote Work, Medical / FMLA, Equipment & Wellness Stipend, PTO Carryover, General HR Question"
    )
    urgency: str = Field(
        default="Medium",
        description="One of: High, Medium, Low"
    )
    eligibility_status: str = Field(
        default="Conditional",
        description="One of: Eligible, Conditional, Ineligible"
    )
    eligibility_headline: str = Field(
        default="",
        description="Very short label (max 8 words) for the eligibility result, e.g. '12 weeks paid leave'"
    )
    key_points: List[str] = Field(
        default_factory=list,
        description="2 to 4 short bullet points of the key policy facts that apply"
    )
    statutory_citation: str = Field(
        default="",
        description="The handbook section or law the answer is based on. Empty if none was found"
    )
    checklist: List[str] = Field(
        default_factory=list,
        description="3 to 5 short action steps for the manager, in order"
    )
    suggested_slack_reply: str = Field(
        default="",
        description="A friendly, short Slack reply the manager can send to the employee"
    )
