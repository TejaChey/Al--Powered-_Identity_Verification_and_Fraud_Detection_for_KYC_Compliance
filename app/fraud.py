import io
from typing import Dict, Any
from PIL import Image, UnidentifiedImageError
from rapidfuzz import fuzz
from .db import documents_collection
from .utils import sha256_hex
from .verification import verify_aadhaar_local, verify_pan_local

_WEIGHTS = {
    "aadhaar_invalid": 40,
    "pan_invalid": 30,
    "duplicate": 20,
    "manipulation": 10,
    "name_mismatch": 10,
}

def _is_duplicate(file_hash: str, parsed: Dict[str, Any], user_id: str) -> bool:
    # duplicate by file OR by Aadhaar/PAN number across *any* user
    if documents_collection.find_one({"fileHash": file_hash}):
        return True
    aid = parsed.get("aadhaarNumber")
    pan = parsed.get("panNumber")
    q = []
    if aid: q.append({"parsed.aadhaarNumber": aid})
    if pan: q.append({"parsed.panNumber": pan})
    if q and documents_collection.find_one({"$or": q, "userId": {"$ne": str(user_id)}}):
        return True
    return False

def _detect_manipulation(file_bytes: bytes) -> bool:
    try:
        img = Image.open(io.BytesIO(file_bytes))
        exif = getattr(img, "_getexif", lambda: None)()
        if not exif:
            return True
        return False
    except UnidentifiedImageError:
        return True
    except Exception:
        return True

def analyze_for_fraud(user: Dict[str, Any], file_bytes: bytes, parsed: Dict[str, Any], document_id: str | None = None) -> Dict[str, Any]:
    details: Dict[str, Any] = {}
    score = 0.0

    file_hash = sha256_hex(file_bytes)
    details["fileHash"] = file_hash

    # Local validations
    aadhaar = parsed.get("aadhaarNumber")
    if aadhaar is not None:
        ok = verify_aadhaar_local(aadhaar)
        details["aadhaar_valid_local"] = ok
        if not ok: score += _WEIGHTS["aadhaar_invalid"]
    pan = parsed.get("panNumber")
    if pan is not None:
        okp = verify_pan_local(pan)
        details["pan_valid_local"] = okp
        if not okp: score += _WEIGHTS["pan_invalid"]

    # Duplicate
    is_dup = _is_duplicate(file_hash, parsed, str(user.get("_id")))
    details["duplicate"] = is_dup
    if is_dup: score += _WEIGHTS["duplicate"]

    # Manipulation
    manipulated = _detect_manipulation(file_bytes)
    details["manipulation_suspected"] = manipulated
    if manipulated: score += _WEIGHTS["manipulation"]

    # Name match vs user profile name (if both present)
    if user.get("name") and parsed.get("name"):
        match = int(fuzz.token_set_ratio(str(user["name"]).upper(), str(parsed["name"]).upper()))
        details["name_match_pct"] = match
        if match < 80:
            score += _WEIGHTS["name_mismatch"]
    else:
        details["name_match_pct"] = None

    score = max(0.0, min(100.0, score))
    band = "Low" if score <= 30 else "Medium" if score <= 70 else "High"
    return {"score": score, "band": band, "details": details}
