"""
Makes the SAMPLE policy PDFs used by Converge (all text is made up for the hackathon):

  handbook.pdf          HR: Employee Handbook (leave and PTO)
  payroll_guide.pdf     Payroll: Payroll Policy Guide
  benefits_guide.pdf    Insurance: Benefits Enrollment Guide
  retirement_plan.pdf   Retirement: 401(k) Plan Summary

By default it only makes files that are missing, so it never touches a PDF you already have.
Run `python data/generate_pdf.py --force` to rebuild all of them.
Uses reportlab if installed. Otherwise it falls back to a small pure-Python PDF writer.
"""

import os
import re
import sys

PDF_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# HR (this is the original handbook text, unchanged)
# ---------------------------------------------------------------------------

HR_PAGE_1 = """Acme Global Enterprise - Employee Handbook 2024-2025
Section 4: Family and Medical Leave Act (FMLA) & Parental Leave Policy

4.1 Eligibility Criteria
All full-time and part-time regular employees are eligible for FMLA coverage if they have:
(a) Completed at least twelve (12) consecutive months of service with Acme Global.
(b) Worked a minimum of 1,250 hours during the previous twelve-month period.
(c) Work at a facility with fifty (50) or more employees within a 75-mile radius.

4.2 Parental Bonding Leave Duration and Compensation
Acme Global provides up to twelve (12) weeks of job-protected parental leave for the birth, adoption, or foster placement of a child.
(a) Primary and secondary caregivers are entitled to twelve (12) weeks of fully subsidized employer leave at 100% of standard base salary.
(b) California and New York residents may coordinate with state Paid Family Leave (PFL) funds for supplemental wage replacement.
(c) Leave must be taken within twelve (12) months following the qualifying birth or placement event.

4.3 Intermittent Leave and Medical Certification
Employees requiring non-consecutive or reduced-schedule leave for serious health conditions or family care must furnish Department of Labor Form WH-380-F signed by an authorized healthcare provider within fifteen (15) calendar days of request.
Intermittent leave schedules must be registered under ADP tracking code FMLA-INT.
"""

HR_PAGE_2 = """Acme Global Enterprise - Employee Handbook 2024-2025
Section 5: Paid Time Off (PTO) & Leave Coordination Rules

5.1 Annual Accrual and Rollover Ceiling
Full-time employees accrue Paid Time Off (PTO) on a bi-weekly payroll cycle up to a maximum standard allotment of twenty (20) days per calendar year.
(a) A maximum of five (5) accrued, unused PTO days may be carried over into the following calendar year.
(b) Any carried-over PTO days must be scheduled and taken prior to March 31 of the new calendar year, after which they expire without cash payout.

5.2 Non-Mandatory PTO Burn-Down Coordination
Employees taking parental leave, FMLA, or short-term medical disability are NOT required to exhaust accrued PTO days prior to commencing statutory leave.
(a) Use of PTO during approved FMLA leave is strictly voluntary at the employee's sole discretion.
(b) Front-line people managers may not mandate that employees burn down vacation or sick banks before initiating FMLA.
(c) Unused PTO balances remain protected and intact during the full 12-week parental leave period.

5.3 System of Record Filing via ADP Workforce Now
All life event leaves and PTO adjustments must be recorded through the ADP Workforce Now API integration. Front-line managers must submit the approved leave schedule to trigger appropriate payroll wage continuity.
"""

# ---------------------------------------------------------------------------
# Payroll (sample)
# ---------------------------------------------------------------------------

PAYROLL_PAGE_1 = """Acme Global Enterprise - Payroll Policy Guide (Sample)
Section 1: Pay Schedule, Overtime and Pay Corrections

1.1 Pay Schedule and Cutoffs
Employees are paid semi-monthly, on the 15th and on the last business day of the month.
(a) The timesheet cutoff is 5:00 PM local time, three (3) business days before each pay date.
(b) Changes received after the cutoff are paid in the next pay cycle unless section 1.4 applies.

1.2 Overtime
Non-exempt employees are paid 1.5 times their regular hourly rate for hours worked over forty (40) in a workweek.
(a) State rules may require double time. For example, California requires double time after twelve (12) hours in a day.
(b) Overtime must be on an approved timesheet before the cutoff to be paid in the current cycle.

1.3 Short or Missing Pay
If an employee is underpaid because of a payroll or timesheet error, payroll corrects it as follows:
(a) Shortfalls of fifty dollars ($50) or more are paid by off-cycle payment within one (1) business day after the error is confirmed.
(b) Shortfalls under fifty dollars ($50) are added to the next regular paycheck.
(c) The payroll specialist must confirm the approved hours before an off-cycle payment is released.

1.4 Late Timesheets
A timesheet approved after the cutoff is normally paid in the next cycle.
(a) If the manager certifies in writing that the hours were worked, the employee qualifies for an off-cycle payment.
(b) Repeated late approvals by the same manager must be reported to Payroll Operations.
"""

PAYROLL_PAGE_2 = """Acme Global Enterprise - Payroll Policy Guide (Sample)
Section 2: Leave Pay, Deductions and Tax Withholding

2.1 Pay During Approved Leave
During approved paid parental leave, pay continues at one hundred percent (100%) of base salary through the regular payroll.
(a) Benefit deductions continue on a pre-tax basis during paid leave.
(b) State paid family leave payments are coordinated by Payroll so that the employee never receives more than 100% of base pay.
(c) The leave schedule must be recorded in the system of record before the first affected pay date.

2.2 Deduction Changes
Benefit deductions change when a benefits enrollment change is approved.
(a) The new deduction starts on the first payroll after approval.
(b) If coverage is retroactive, the missed premium is caught up over up to three (3) pay periods.
(c) Payroll sends the employee a new pay statement preview after any deduction change.

2.3 Tax Withholding
A new Form W-4 received before the cutoff takes effect on the next payroll.
(a) State withholding changes require a verified home address.
(b) Payroll cannot give personal tax advice. Employees should talk to a tax professional.

2.4 Recording Adjustments in ADP
All off-cycle payments and pay adjustments must be recorded through the ADP Payroll integration so that taxes and the pay statement are calculated correctly.
"""

# ---------------------------------------------------------------------------
# Insurance (sample)
# ---------------------------------------------------------------------------

BENEFITS_PAGE_1 = """Acme Global Enterprise - Benefits Enrollment Guide (Sample)
Section 1: Enrollment Windows and Qualifying Life Events

1.1 Open Enrollment
Open enrollment runs from November 1 to November 15 each year. Changes made during open enrollment start on January 1.

1.2 Qualifying Life Events (QLE)
Outside open enrollment, an employee may change coverage only after a qualifying life event.
(a) Qualifying events are: marriage, divorce, birth or adoption of a child, and loss of other coverage.
(b) The employee has thirty (30) calendar days from the event to enroll or change coverage.
(c) If the thirty (30) day window is missed, the employee must wait until the next open enrollment unless another qualifying event happens.

1.3 Birth or Adoption of a Child
A new child may be added within thirty (30) days of the birth or adoption.
(a) Coverage is retroactive to the date of birth or adoption.
(b) A copy of the birth certificate or adoption papers must be provided within sixty (60) days of the event.
(c) The employee may also change their coverage tier at the same time.

1.4 Marriage
A new spouse may be added within thirty (30) days of the marriage.
(a) Coverage starts on the first day of the month after the request is approved.
(b) A copy of the marriage certificate is required.
(c) A spouse with other employer coverage may still be added, but the plan may pay second.
"""

BENEFITS_PAGE_2 = """Acme Global Enterprise - Benefits Enrollment Guide (Sample)
Section 2: Coverage Tiers, Premiums and Carrier Updates

2.1 Coverage Tiers and Sample Premiums
Premiums are deducted per semi-monthly pay period. Sample amounts for the Standard Health Plan:
(a) Employee only: $68.00
(b) Employee plus spouse: $131.00
(c) Employee plus child(ren): $118.00
(d) Family: $182.00

2.2 Premium Changes
When a coverage tier changes, the new premium starts on the first payroll after the change is approved.
If coverage is retroactive, payroll catches up the missed premium over up to three (3) pay periods.

2.3 Carrier Notification
The benefits administrator must send the approved change to the insurance carrier within five (5) business days.
The employee receives a confirmation notice and a new insurance card by mail.

2.4 Recording Changes in ADP
All qualifying life events and enrollment changes must be recorded through the ADP Benefits Administration integration. The record triggers the premium change in payroll.
"""

# ---------------------------------------------------------------------------
# Retirement (sample)
# ---------------------------------------------------------------------------

RETIREMENT_PAGE_1 = """Acme Global Enterprise - 401(k) Plan Summary (Sample)
Section 1: Eligibility, Contributions and Employer Match

1.1 Eligibility
All employees are eligible to join the plan after thirty (30) days of service.

1.2 Employee Contributions
Employees may contribute between 1% and 75% of eligible pay, either pre-tax or Roth.
(a) The annual IRS limit applies. For 2026 the employee limit is $24,500. Employees age 50 or older may add catch-up contributions. IRS limits change each year, so check the current figure.
(b) Contributions are taken from each paycheck.

1.3 Employer Match
The company matches 100% of the first 4% of pay that the employee contributes.
(a) Employer match contributions are fully vested after two (2) years of service.
(b) Employee contributions are always 100% vested.

1.4 Changing Your Contribution
Employees may change their contribution percentage at any time.
(a) A change received before the payroll cutoff takes effect within two (2) pay periods.
(b) During paid leave, contributions continue from the paid compensation. During unpaid leave, contributions pause.
"""

RETIREMENT_PAGE_2 = """Acme Global Enterprise - 401(k) Plan Summary (Sample)
Section 2: Loans, Hardship Withdrawals and Distributions

2.1 Plan Loans
Participants may borrow from their vested balance.
(a) The maximum loan is the lesser of 50% of the vested balance or $50,000.
(b) The term is up to five (5) years, or up to ten (10) years to buy a main home.
(c) Only one (1) loan may be active at a time. There is a $75 origination fee.
(d) Repayment is by payroll deduction, with interest set by the plan.
(e) If employment ends, the unpaid balance is due or is treated as a taxable distribution.

2.2 Hardship Withdrawals
A hardship withdrawal is allowed only for an immediate and heavy financial need, such as medical costs, preventing eviction, funeral costs, or buying a main home.
(a) The amount cannot be more than the need.
(b) Income tax and a 10% early withdrawal penalty may apply.
(c) Hardship withdrawals cannot be paid back into the plan.

2.3 Distributions and Rollovers
Distributions are allowed after leaving the company or after age 59 and a half.
A rollover to another plan or IRA can avoid taxes if done correctly.

2.4 Recording Requests in ADP
All contribution changes, loans and distributions must be recorded through the ADP Retirement Services integration. This plan summary gives plan information only. It is not personal financial or tax advice.
"""

DOCUMENTS = {
    "handbook.pdf": [HR_PAGE_1, HR_PAGE_2],
    "payroll_guide.pdf": [PAYROLL_PAGE_1, PAYROLL_PAGE_2],
    "benefits_guide.pdf": [BENEFITS_PAGE_1, BENEFITS_PAGE_2],
    "retirement_plan.pdf": [RETIREMENT_PAGE_1, RETIREMENT_PAGE_2],
}

HEADING_PATTERN = re.compile(r"^\d+\.\d+ ")


def generate_with_reportlab(output_path, pages):
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'], fontSize=16, leading=20,
        textColor=colors.HexColor('#1E293B'), spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        'SectionHeading', parent=styles['Heading2'], fontSize=13, leading=16,
        textColor=colors.HexColor('#334155'), spaceBefore=10, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'], fontSize=10, leading=14,
        textColor=colors.HexColor('#0F172A'), spaceAfter=8,
    )

    story = []
    for page_index, page_text in enumerate(pages):
        for block in page_text.strip().split('\n\n'):
            if block.startswith('Acme Global'):
                parts = block.split('\n')
                story.append(Paragraph(parts[0], title_style))
                story.append(Paragraph(parts[1], heading_style))
            elif HEADING_PATTERN.match(block):
                parts = block.split('\n', 1)
                story.append(Paragraph(parts[0], heading_style))
                if len(parts) > 1:
                    story.append(Paragraph(parts[1].replace('\n', '<br/>'), body_style))
            else:
                story.append(Paragraph(block.replace('\n', '<br/>'), body_style))
        if page_index < len(pages) - 1:
            story.append(PageBreak())

    doc.build(story)
    print(f"Generated {os.path.basename(output_path)} using reportlab")


def generate_with_pure_python(output_path, pages):
    """Makes a valid, readable PDF using only the standard library."""
    def escape_pdf(text):
        return text.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

    def format_page_stream(content_text):
        lines = content_text.strip().split('\n')
        stream_lines = ["BT", "/F1 10 Tf", "54 740 Td", "14 TL"]
        for line in lines:
            line_str = line.strip()
            if not line_str:
                stream_lines.append("T*")
                continue
            if line_str.startswith("Acme Global"):
                stream_lines.append("/F2 14 Tf")
                stream_lines.append(f"({escape_pdf(line_str)}) Tj")
                stream_lines.append("T*")
                stream_lines.append("/F1 10 Tf")
            elif line_str.startswith("Section ") or HEADING_PATTERN.match(line_str):
                stream_lines.append("T*")
                stream_lines.append("/F2 11 Tf")
                stream_lines.append(f"({escape_pdf(line_str)}) Tj")
                stream_lines.append("T*")
                stream_lines.append("/F1 10 Tf")
            else:
                while len(line_str) > 85:
                    split_idx = line_str[:85].rfind(' ')
                    if split_idx == -1:
                        split_idx = 85
                    stream_lines.append(f"({escape_pdf(line_str[:split_idx])}) Tj")
                    stream_lines.append("T*")
                    line_str = line_str[split_idx:].strip()
                if line_str:
                    stream_lines.append(f"({escape_pdf(line_str)}) Tj")
                    stream_lines.append("T*")
        stream_lines.append("ET")
        return "\n".join(stream_lines)

    page_count = len(pages)
    font1_id = 3 + page_count * 2
    font2_id = font1_id + 1

    objects = ["<< /Type /Catalog /Pages 2 0 R >>"]
    kids = " ".join(f"{3 + i * 2} 0 R" for i in range(page_count))
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {page_count} >>")
    for i, page_text in enumerate(pages):
        page_id = 3 + i * 2
        stream = format_page_stream(page_text)
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {page_id + 1} 0 R "
            f"/Resources << /Font << /F1 {font1_id} 0 R /F2 {font2_id} 0 R >> >> >>"
        )
        objects.append(f"<< /Length {len(stream)} >>\nstream\n{stream}\nendstream")
    objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")

    pdf_parts = ["%PDF-1.4\n"]
    offsets = []
    current_offset = len(pdf_parts[0])
    for i, obj in enumerate(objects, 1):
        offsets.append(current_offset)
        obj_str = f"{i} 0 obj\n{obj}\nendobj\n"
        pdf_parts.append(obj_str)
        current_offset += len(obj_str)

    xref_offset = current_offset
    xref_str = f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    for off in offsets:
        xref_str += f"{off:010d} 00000 n \n"
    pdf_parts.append(xref_str)
    pdf_parts.append(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    )

    with open(output_path, "wb") as f:
        f.write("".join(pdf_parts).encode("latin-1", errors="replace"))
    print(f"Generated {os.path.basename(output_path)} using the built-in PDF writer")


def main(force=False):
    """Makes the sample PDFs. Skips files that already exist unless force=True."""
    os.makedirs(PDF_DIR, exist_ok=True)
    try:
        import reportlab  # noqa: F401
        writer = generate_with_reportlab
    except ImportError:
        writer = generate_with_pure_python

    for file_name, pages in DOCUMENTS.items():
        output_path = os.path.join(PDF_DIR, file_name)
        if os.path.exists(output_path) and not force:
            print(f"Skipping {file_name} (already exists)")
            continue
        writer(output_path, pages)


if __name__ == "__main__":
    main(force="--force" in sys.argv)
