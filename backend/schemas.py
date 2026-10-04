from typing import List
from pydantic import BaseModel, Field


class InsightRequest(BaseModel):
    employee_id: str = Field(..., description="Unique employee identifier (e.g. Workday ID or system ID)")
    manager_id: str = Field(..., description="Identifier for the person handling the request")
    message: str = Field(..., description="Raw unstructured Slack message or communication from employee")
    domain: str = Field(
        default="hr",
        description="Business line: hr, payroll, insurance or retirement"
    )
    employee_name: str = Field(default="", description="Optional display name for the dashboard")


class Highlight(BaseModel):
    label: str = Field(..., description="Short name of the fact, for example Deadline")
    value: str = Field(..., description="The value in under 8 words, for example 30 days after the birth")


class HRActionPlan(BaseModel):
    eligibility_summary: str = Field(
        ...,
        description="Clear, plain-English summary of eligibility and policy cross-reference"
    )
    recommended_action: str = Field(
        ...,
        description="Recommended next steps and operational guidance for the person handling the request"
    )
    adp_api_endpoint: str = Field(
        ...,
        description="Mocked REST API endpoint for the matching ADP product (e.g. POST /events/hr/v1/leaves/parental-leave-requests)"
    )

    # Extra fields so the dashboard can look as rich as the demo cards.
    # They all have defaults, so the app still works if the model leaves one out.
    headline: str = Field(
        default="",
        description="One sentence saying what the employee is asking for"
    )
    category: str = Field(
        default="",
        description="One category from the list given in the instructions"
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
        description="Very short label (max 8 words) for the result, e.g. '12 weeks paid leave'"
    )
    key_points: List[str] = Field(
        default_factory=list,
        description="2 to 4 short bullet points of the key policy facts that apply"
    )
    statutory_citation: str = Field(
        default="",
        description="The policy section or law the answer is based on. Empty if none was found"
    )
    checklist: List[str] = Field(
        default_factory=list,
        description="3 to 5 short action steps, in order"
    )
    suggested_slack_reply: str = Field(
        default="",
        description="A friendly, short reply that can be sent to the employee"
    )
    highlights: List[Highlight] = Field(
        default_factory=list,
        description="3 or 4 key facts as label and value pairs, for example Deadline: 30 days after the birth"
    )
    domain: str = Field(
        default="",
        description="Leave this empty. The server fills it in."
    )


class RouteDecision(BaseModel):
    domains: List[str] = Field(
        ...,
        description="Business lines involved. Any of: hr, payroll, insurance, retirement"
    )
    reason: str = Field(default="", description="One short sentence on why")
