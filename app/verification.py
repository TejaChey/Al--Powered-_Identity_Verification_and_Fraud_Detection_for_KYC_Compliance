import json, re, requests
from pathlib import Path
from typing import Dict, Any
from .ocr import extract_text_from_bytes, parse_text
from .config import settings

# ---------- registry helpers ----------
def _reg_path() -> Path:
    p = Path(settings.UIDAI_REGISTRY_FILE)
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        p.write_text(json.dumps({"aadhaar": {}, "pan": {}}))
    return p

def load_registry() -> Dict[str, Any]:
    try:
        return json.loads(_reg_path().read_text())
    except Exception:
        return {"aadhaar": {}, "pan": {}}

def save_registry(data: Dict[str, Any]):
    _reg_path().write_text(json.dumps(data, indent=2))

def seed_registry(entries: Dict[str, Any], key: str) -> Dict[str, Any]:
    if key != settings.ADMIN_SEED_KEY:
        raise PermissionError("Invalid admin seed key")
    reg = load_registry()
    for t in ("aadhaar", "pan"):
        if t in entries and isinstance(entries[t], dict):
            reg.setdefault(t, {}).update(entries[t])
    save_registry(reg)
    return reg

# ---------- verhoeff ----------
_d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
]
_p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,9,8,7,6,0,4,3,2],
    [5,8,4,7,6,9,1,3,2,0],
    [8,9,7,6,5,3,2,1,0,4],
    [9,4,6,5,3,2,1,0,7,8],
    [4,6,3,2,1,0,7,8,9,5],
    [6,3,2,1,0,7,8,9,5,4],
    [3,2,1,0,7,8,9,5,4,6],
]
def verhoeff_validate(number: str) -> bool:
    if not number.isdigit(): return False
    c = 0
    for i, ch in enumerate(reversed(number)):
        c = _d[c][_p[i % 8][int(ch)]]
    return c == 0

def verify_aadhaar_local(number: str) -> bool:
    return bool(re.fullmatch(r"\d{12}", number)) and verhoeff_validate(number)

def verify_pan_local(number: str) -> bool:
    return bool(re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]", number))

def verify_aadhaar(number: str) -> Dict[str, Any]:
    number = re.sub(r"\s+", "", str(number))
    reg = load_registry()
    if number in reg.get("aadhaar", {}):
        return {"ok": True, "source": "registry", "result": reg["aadhaar"][number]}
    if settings.AADHAAR_VERIFICATION_API:
        try:
            r = requests.post(settings.AADHAAR_VERIFICATION_API, json={"aadhaar": number}, timeout=5)
            r.raise_for_status()
            return {"ok": True, "source": "external", "result": r.json()}
        except Exception as e:
            return {"ok": verify_aadhaar_local(number), "source": "external_fallback", "error": str(e)}
    return {"ok": verify_aadhaar_local(number), "source": "local"}

def verify_pan(number: str) -> Dict[str, Any]:
    number = str(number).strip().upper()
    reg = load_registry()
    if number in reg.get("pan", {}):
        return {"ok": True, "source": "registry", "result": reg["pan"][number]}
    if settings.PAN_VERIFICATION_API:
        try:
            r = requests.post(settings.PAN_VERIFICATION_API, json={"pan": number}, timeout=5)
            r.raise_for_status()
            return {"ok": True, "source": "external", "result": r.json()}
        except Exception as e:
            return {"ok": verify_pan_local(number), "source": "external_fallback", "error": str(e)}
    return {"ok": verify_pan_local(number), "source": "local"}

def verify_document(image_bytes: bytes) -> Dict[str, Any]:
    text = extract_text_from_bytes(image_bytes)
    parsed = parse_text(text)
    res: Dict[str, Any] = {"rawText": text, "parsed": parsed}
    aadhaar = parsed.get("aadhaarNumber")
    pan = parsed.get("panNumber")
    res["aadhaar"] = verify_aadhaar(aadhaar) if aadhaar else {"ok": False, "source": "not_found"}
    res["pan"] = verify_pan(pan) if pan else {"ok": False, "source": "not_found"}
    return res
