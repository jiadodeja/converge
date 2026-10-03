"""
Script to generate a 2-page enterprise HR handbook (handbook.pdf)
Contains realistic policies for FMLA (Family and Medical Leave Act) and PTO (Paid Time Off).
Uses reportlab if available; otherwise falls back to a pure-Python standard PDF generator.
"""

import os
import sys

PDF_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PDF = os.path.join(PDF_DIR, "handbook.pdf")

PAGE_1_CONTENT = """Acme Global Enterprise - Employee Handbook 2024-2025
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

PAGE_2_CONTENT = """Acme Global Enterprise - Employee Handbook 2024-2025
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

def generate_with_reportlab():
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    doc = SimpleDocTemplate(
        OUTPUT_PDF,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=54,
        bottomMargin=54,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=8,
    )

    story = []

    # Page 1
    for line in PAGE_1_CONTENT.strip().split('\n\n'):
        if line.startswith('Acme Global'):
            parts = line.split('\n')
            story.append(Paragraph(parts[0], title_style))
            story.append(Paragraph(parts[1], heading_style))
        elif line.startswith('4.'):
            parts = line.split('\n', 1)
            story.append(Paragraph(parts[0], heading_style))
            if len(parts) > 1:
                story.append(Paragraph(parts[1].replace('\n', '<br/>'), body_style))
        else:
            story.append(Paragraph(line.replace('\n', '<br/>'), body_style))

    story.append(PageBreak())

    # Page 2
    for line in PAGE_2_CONTENT.strip().split('\n\n'):
        if line.startswith('Acme Global'):
            parts = line.split('\n')
            story.append(Paragraph(parts[0], title_style))
            story.append(Paragraph(parts[1], heading_style))
        elif line.startswith('5.'):
            parts = line.split('\n', 1)
            story.append(Paragraph(parts[0], heading_style))
            if len(parts) > 1:
                story.append(Paragraph(parts[1].replace('\n', '<br/>'), body_style))
        else:
            story.append(Paragraph(line.replace('\n', '<br/>'), body_style))

    doc.build(story)
    print(f"Generated handbook.pdf using reportlab: {OUTPUT_PDF}")


def generate_with_pure_python():
    """Generates a valid, parseable 2-page PDF file using pure standard library."""
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
            elif line_str.startswith("Section ") or (len(line_str) > 2 and line_str[0].isdigit() and line_str[1] == '.'):
                stream_lines.append("T*")
                stream_lines.append("/F2 11 Tf")
                stream_lines.append(f"({escape_pdf(line_str)}) Tj")
                stream_lines.append("T*")
                stream_lines.append("/F1 10 Tf")
            else:
                # Wrap long lines if needed
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

    stream1 = format_page_stream(PAGE_1_CONTENT)
    stream2 = format_page_stream(PAGE_2_CONTENT)

    objects = []
    # 1: Catalog
    objects.append("<< /Type /Catalog /Pages 2 0 R >>")
    # 2: Pages
    objects.append("<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>")
    # 3: Page 1
    objects.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>")
    # 4: Contents 1
    objects.append(f"<< /Length {len(stream1)} >>\nstream\n{stream1}\nendstream")
    # 5: Page 2
    objects.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R /F2 8 0 R >> >> >>")
    # 6: Contents 2
    objects.append(f"<< /Length {len(stream2)} >>\nstream\n{stream2}\nendstream")
    # 7: Font 1
    objects.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    # 8: Font 2
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

    trailer_str = f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n"
    pdf_parts.append(trailer_str)

    with open(OUTPUT_PDF, "wb") as f:
        f.write("".join(pdf_parts).encode("latin-1"))

    print(f"Generated 2-page handbook.pdf using built-in PDF writer: {OUTPUT_PDF}")


def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    try:
        import reportlab
        generate_with_reportlab()
    except ImportError:
        generate_with_pure_python()

if __name__ == "__main__":
    main()
