"""
Simple PII masking. Runs BEFORE any text is sent to the AI or saved in the feed.

It hides a few kinds of very sensitive data:
  - Social Security numbers   -> [SSN]
  - Birth dates               -> [BIRTHDATE]   (only dates that are written next to a birth word)
  - Credit/debit card numbers -> [CARD_NUMBER]
  - Bank account / routing    -> [ACCOUNT_NUMBER]  (only when the number follows the word "account" or "routing")

This is a basic, regex based filter. It is NOT a full privacy solution:
it will miss PII written in unusual ways (names, addresses, spelled-out numbers).
A real product would add a trained PII detector and an enterprise AI agreement.

Dates that are not birth dates (leave dates, due dates, wedding dates) are kept on purpose,
because the policy answer needs them.
"""

import re
from typing import Dict, Tuple

MONTH = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
)

# 04/12/1990, 4-12-90, 1990-04-12, April 12 1990, April 12th, 1990, 12 April 1990, April 12
DATE = (
    r"(?:\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}"
    r"|\d{4}[/.\-]\d{1,2}[/.\-]\d{1,2}"
    rf"|{MONTH}\.?\s+\d{{1,2}}(?:st|nd|rd|th)?(?:,?\s+\d{{4}})?"
    rf"|\d{{1,2}}(?:st|nd|rd|th)?\s+{MONTH}\.?(?:,?\s+\d{{4}})?)"
)

# A birth word, then a few filler characters or words, then the date
BIRTH_WORDS = r"(?:born|dob|d\.o\.b\.?|date\s+of\s+birth|birth\s*date|birthday)"
FILLER = r"(?:\s|:|=|-|#|,|\(|\)|\bis\b|\bwas\b|\bon\b|\bin\b|\bthe\b|\bmy\b){0,20}"
BIRTHDATE_RE = re.compile(rf"(\b{BIRTH_WORDS}\b{FILLER})({DATE})", re.IGNORECASE)

# 123-45-6789 or 123 45 6789
SSN_FORMATTED_RE = re.compile(r"(?<!\d)\d{3}[- ]\d{2}[- ]\d{4}(?!\d)")
# "SSN 123456789", "social security number is 123456789"
SSN_LABELED_RE = re.compile(
    r"(\b(?:ssn|social\s+security(?:\s+(?:number|no\.?|#))?)\b[\s:=#\-]*(?:is\s+)?)(\d{9})(?!\d)",
    re.IGNORECASE,
)

# 13 to 19 digits, spaces or dashes allowed between them. Only masked if it passes the Luhn check.
CARD_RE = re.compile(r"(?<![\d-])(?:\d[ -]?){12,18}\d(?![\d-])")

# "account number 12345678", "routing # 021000021"
ACCOUNT_RE = re.compile(
    r"(\b(?:account|acct|routing|aba)\b(?:\s+(?:number|no\.?|num))?[\s:=#\-]*(?:is\s+)?)(\d[\d \-]{6,16}\d)",
    re.IGNORECASE,
)


def _luhn_ok(digits: str) -> bool:
    """Checks the number the way card numbers are checked (fewer false alarms)."""
    total = 0
    for i, ch in enumerate(reversed(digits)):
        n = int(ch)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


def redact_pii(text: str) -> Tuple[str, Dict[str, int]]:
    """
    Returns (masked_text, counts).
    counts looks like {"SSN": 1, "Birthdate": 1}, and is empty when nothing was found.
    Running it again on already masked text changes nothing.
    """
    if not text:
        return text, {}

    counts: Dict[str, int] = {}

    def bump(name: str) -> None:
        counts[name] = counts.get(name, 0) + 1

    # Social Security numbers
    def ssn_formatted(_m):
        bump("SSN")
        return "[SSN]"

    def ssn_labeled(m):
        bump("SSN")
        return m.group(1) + "[SSN]"

    text = SSN_LABELED_RE.sub(ssn_labeled, text)
    text = SSN_FORMATTED_RE.sub(ssn_formatted, text)

    # Birth dates (keeps the label, hides the date)
    def birthdate(m):
        bump("Birthdate")
        return m.group(1) + "[BIRTHDATE]"

    text = BIRTHDATE_RE.sub(birthdate, text)

    # Card numbers (Luhn checked)
    def card(m):
        digits = re.sub(r"\D", "", m.group(0))
        if 13 <= len(digits) <= 19 and _luhn_ok(digits):
            bump("Card number")
            return "[CARD_NUMBER]"
        return m.group(0)

    text = CARD_RE.sub(card, text)

    # Bank account / routing numbers
    def account(m):
        bump("Account number")
        return m.group(1) + "[ACCOUNT_NUMBER]"

    text = ACCOUNT_RE.sub(account, text)

    return text, counts


if __name__ == "__main__":
    # Quick self-check: python pii.py
    samples = [
        "My SSN is 123-45-6789 and my date of birth is 04/12/1990. Can I add my wife?",
        "social security number 987654321, born March 3rd, 1988",
        "Baby is due Aug 15, 2026. I got married on 09/27/2026.",  # these dates must stay
        "Card 4111 1111 1111 1111 was charged twice",
        "Please deposit to account number 000123456789 routing 021000021",
        "Order 12345678901234 is late",  # fails the Luhn check, so it stays
        "Call me at 555-123-4567 about EMP-90421",
    ]
    for s in samples:
        out, found = redact_pii(s)
        print(s)
        print("  ->", out, found)
