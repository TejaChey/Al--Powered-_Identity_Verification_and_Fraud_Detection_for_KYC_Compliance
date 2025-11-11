import io, re
from typing import Dict
from PIL import Image
from .config import settings

try:
    import pytesseract
    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
except Exception:
    pytesseract = None  # graceful fallback

def extract_text_from_bytes(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    if pytesseract is None:
        return ""
    try:
        return pytesseract.image_to_string(img)
    except Exception:
        return ""

def parse_text(text: str) -> Dict:
    parsed = {
        "panNumber": None,
        "aadhaarNumber": None,
        "name": None,
        "fatherName": None,
        "dob": None,
        "gender": None,
        "address": None,
    }
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full = " ".join(lines)

    m = re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", full)
    if m: parsed["aadhaarNumber"] = m.group().replace(" ", "")
    m = re.search(r"\b[A-Z]{5}\d{4}[A-Z]\b", full)
    if m: parsed["panNumber"] = m.group().upper()
    m = re.search(r"\b(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})\b", full)
    if m: parsed["dob"] = m.group(1)
    m = re.search(r"(?i)\b(male|female|transgender|m|f)\b", full)
    if m:
        g = m.group(1).lower()
        parsed["gender"] = "Male" if g in {"m","male"} else "Female" if g in {"f","female"} else "Transgender"

    m = re.search(r"(?i)\bname[:\-]?\s*([A-Za-z\s]{2,100})", full)
    if m:
        nm = m.group(1)
        nm = re.split(r"\b(dob|date|gender|address|s/d|w/o|father)\b", nm, flags=re.I)[0].strip()
        parsed["name"] = nm or None

    m = re.search(r"(?i)father('?s)?\s*name[:\-]?\s*([A-Za-z\s]{2,100})", full)
    if m: parsed["fatherName"] = m.group(2).strip()

    m = re.search(r"(?i)address[:\-]?\s*(.+)", full)
    if m:
        addr = m.group(1)
        addr = re.split(r"\b(\d{4}\s?\d{4}\s?\d{4}|dob|date|gender)\b", addr, flags=re.I)[0].strip()
        parsed["address"] = addr or None

    return parsed
