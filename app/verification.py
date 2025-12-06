import json, re, requests
from pathlib import Path
from typing import Dict, Any, Optional
from .ocr import extract_text_from_bytes, parse_text 
from .config import settings
from .utils import mask_aadhaar, mask_pan, mask_dl

# ---------------- REGISTRY HELPERS (RESTORED) ----------------

def _reg_path() -> Path:
    p = Path(settings.UIDAI_REGISTRY_FILE)
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        p.write_text(json.dumps({"aadhaar": {}, "pan": {}, "dl": {}}))
    return p

def load_registry() -> Dict[str, Any]:
    try:
        return json.loads(_reg_path().read_text())
    except Exception:
        return {"aadhaar": {}, "pan": {}, "dl": {}}

def save_registry(data: Dict[str, Any]):
    _reg_path().write_text(json.dumps(data, indent=2))

def seed_registry(entries: Dict[str, Any], key: str) -> Dict[str, Any]:
    """
    Restored function to allow admin seeding of valid IDs.
    """
    if key != settings.ADMIN_SEED_KEY:
        raise PermissionError("Invalid admin seed key")

    reg = load_registry()
    for t in ("aadhaar", "pan", "dl"):
        if t in entries and isinstance(entries[t], dict):
            reg.setdefault(t, {}).update(entries[t])

    save_registry(reg)
    return reg

# ---------------- VERHOEFF ALGORITHM (RESTORED) ----------------

_d = [
    [0,1,2,3,4,5,6,7,8,9], [1,2,3,4,0,6,7,8,9,5], [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7], [4,0,1,2,3,9,5,6,7,8], [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2], [7,6,5,9,8,2,1,0,4,3], [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
]
_p = [
    [0,1,2,3,4,5,6,7,8,9], [1,5,9,8,7,6,0,4,3,2], [5,8,4,7,6,9,1,3,2,0],
    [8,9,7,6,5,3,2,1,0,4], [9,4,6,5,3,2,1,0,7,8], [4,6,3,2,1,0,7,8,9,5],
    [6,3,2,1,0,7,8,9,5,4], [3,2,1,0,7,8,9,5,4,6]
]

def _verhoeff_check_with_offset(number: str, offset: int) -> bool:
    if not number.isdigit(): return False
    c = 0
    for i, ch in enumerate(reversed(number)):
        c = _d[c][_p[(i + offset) % 8][int(ch)]]
    return c == 0

def verhoeff_validate(number: str) -> bool:
    num = re.sub(r"\D", "", str(number))
    if not num or len(num) != 12: return False
    for off in range(8):
        if _verhoeff_check_with_offset(num, off): return True
    return False

def verhoeff_check_variants(number: str) -> Dict[str, Any]:
    """
    Restored diagnostic helper for routes that need detailed checksum info.
    """
    num = re.sub(r"\D", "", str(number))
    out = {"num": num, "offsets": {}, "any": False}
    if not (num.isdigit() and len(num) == 12):
        return out
    any_ok = False
    for off in range(8):
        ok = _verhoeff_check_with_offset(num, off)
        out["offsets"][f"offset_{off}"] = bool(ok)
        any_ok = any_ok or ok
    out["any"] = any_ok
    return out

# ---------------- ID VALIDATORS ----------------

def _is_obviously_fake(number: str) -> bool:
    if not number or not number.isdigit() or len(number) != 12: return True
    if len(set(number)) == 1: return True
    if number[:4] * 3 == number: return True
    return False

def is_plausible_aadhaar(number: str) -> bool:
    num = re.sub(r"\D", "", str(number))
    if not re.fullmatch(r"\d{12}", num): return False
    return not _is_obviously_fake(num)

def verify_aadhaar(number: str) -> Dict[str, Any]:
    number = re.sub(r"\s+", "", str(number))
    reg = load_registry()
    if number in reg.get("aadhaar", {}):
        return {"ok": True, "source": "registry", "result": reg["aadhaar"][number]}
    
    # Local check fallback
    local_ok = verhoeff_validate(number) or is_plausible_aadhaar(number)
    return {"ok": local_ok, "source": "local"}

def verify_pan(number: str) -> Dict[str, Any]:
    num = str(number).strip().upper()
    reg = load_registry()
    if num in reg.get("pan", {}):
        return {"ok": True, "source": "registry", "result": reg["pan"][num]}
        
    local_ok = bool(re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]", num))
    return {"ok": local_ok, "source": "local"}

def verify_dl_local(number: str) -> bool:
    """
    Validate DL format covering:
    1. Standard: MH1420110012345 (State + Digits)
    2. Old/Kerala: 1/1626/2006 (Slash separated)
    """
    if not number: return False
    num = str(number).strip().upper().replace(" ", "")
    
    # Pattern 1: Standard (State Code 2 chars + 11-16 digits/chars)
    if re.fullmatch(r"[A-Z]{2}[0-9\-\s]{11,16}", num.replace("-", "")):
        return True
    
    # Pattern 2: Slash format (e.g., 1/1626/2006)
    if re.fullmatch(r"\d{1,4}/\d{3,6}/\d{2,4}", num):
        return True
        
    return False

def verify_dl(number: str) -> Dict[str, Any]:
    num = str(number).strip().upper()
    reg = load_registry()
    if num in reg.get("dl", {}):
        return {"ok": True, "source": "registry", "result": reg["dl"][num]}

    local_ok = verify_dl_local(num)
    return {"ok": local_ok, "source": "local", "local_ok": local_ok}

# ---------------- PERFECTED EXTRACTION LOGIC ----------------

def heuristic_refine_parsing(parsed: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
    """
    Refined extraction for Indian Driving Licenses (Smart Card & Old Book formats).
    """
    raw_clean = raw_text.replace("\r", "\n")
    
    # Detect DL Context
    is_dl = bool(re.search(r"(Driving\s*Licence|Motor\s*Driving|Union\s*of\s*India|Form\s*7)", raw_clean, re.IGNORECASE))

    if is_dl:
        # 1. DL Number Extraction
        # Priority A: Kerala Style (1/1626/2006)
        match_dl_slash = re.search(r"(?:No\.?|Licence\s*No)\s*[:\.]?\s*(\d{1,4}/\d{1,6}/\d{2,4})", raw_clean, re.IGNORECASE)
        # Priority B: Standard Style (MH14...)
        match_dl_std = re.search(r"(?:DL\s*No|Licence\s*No)\s*[:\.]?\s*([A-Z]{2}[0-9\s\-/]+)", raw_clean, re.IGNORECASE)
        
        if match_dl_slash:
            parsed["dlNumber"] = match_dl_slash.group(1).strip()
        elif match_dl_std:
            parsed["dlNumber"] = match_dl_std.group(1).strip()

        # 2. Name Extraction
        if not parsed.get("name"):
            match_name = re.search(r"Name\s*[:\-\.]\s*([A-Za-z\s\.]+?)(?:\n|S/D/W|S/W/D|Address|$)", raw_clean, re.IGNORECASE)
            if match_name:
                parsed["name"] = match_name.group(1).strip()

        # 3. Father/Husband Name
        if not parsed.get("fatherName"):
            match_father = re.search(r"(?:S/D/W|S/W/D|Father)\s*(?:of)?\s*[:\-\.]\s*([A-Za-z\s\.]+?)(?:\n|Address|$)", raw_clean, re.IGNORECASE)
            if match_father:
                parsed["fatherName"] = match_father.group(1).strip()

        # 4. Address Extraction
        if not parsed.get("address"):
            match_addr = re.search(r"(?:Address|Add)\s*[:\-\.]\s*([\w\s,/\.\-\(\)]+?)(?:\n\s*(?:PIN|Date|DOB|Valid|Sign|Issuing)|$)", raw_clean, re.IGNORECASE | re.DOTALL)
            if match_addr:
                addr_raw = match_addr.group(1)
                addr_clean = re.sub(r'\s+', ' ', addr_raw).strip()
                if len(addr_clean) > 5:
                    parsed["address"] = addr_clean

        # 5. Dates
        if not parsed.get("dob"):
            match_dob = re.search(r"(?:DOB|Date\s*of\s*Birth)\s*[:\-\.]\s*(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})", raw_clean, re.IGNORECASE)
            if match_dob:
                parsed["dob"] = match_dob.group(1)

        if not parsed.get("validUntil"):
            match_valid_to = re.search(r"Valid\s*(?:Till|To)\s*[:\-\.]?\s*(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})", raw_clean, re.IGNORECASE)
            if match_valid_to:
                parsed["validUntil"] = match_valid_to.group(1)

    # Fallback for PAN/Aadhaar
    if not parsed.get("panNumber"):
        match_pan = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", raw_clean)
        if match_pan: parsed["panNumber"] = match_pan.group(1)

    if not parsed.get("aadhaarNumber"):
        match_aadhaar = re.search(r"\b\d{4}\s\d{4}\s\d{4}\b", raw_clean)
        if match_aadhaar: parsed["aadhaarNumber"] = match_aadhaar.group(0).replace(" ", "")

    return parsed

# ---------------- MAIN VERIFIER ----------------

def verify_document(image_bytes: bytes) -> Dict[str, Any]:
    text = extract_text_from_bytes(image_bytes)
    parsed = parse_text(text)
    
    parsed = heuristic_refine_parsing(parsed, text)

    res: Dict[str, Any] = {
        "rawText": text,
        "parsed": parsed,
    }

    aadhaar = parsed.get("aadhaarNumber")
    pan = parsed.get("panNumber")
    dl = parsed.get("dlNumber")

    res["maskedAadhaar"] = mask_aadhaar(aadhaar)
    res["maskedPan"] = mask_pan(pan)
    res["maskedDl"] = mask_dl(dl)
    
    if res["maskedAadhaar"]: parsed["maskedAadhaar"] = res["maskedAadhaar"]
    if res["maskedPan"]: parsed["maskedPan"] = res["maskedPan"]
    if res["maskedDl"]: parsed["maskedDl"] = res["maskedDl"]

    res["aadhaar"] = verify_aadhaar(aadhaar) if aadhaar else {"ok": False, "source": "not_found"}
    res["pan"] = verify_pan(pan) if pan else {"ok": False, "source": "not_found"}
    res["dl"] = verify_dl(dl) if dl else {"ok": False, "source": "not_found"}

    return res