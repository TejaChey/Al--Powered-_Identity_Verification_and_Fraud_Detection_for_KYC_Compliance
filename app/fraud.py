import io
import hashlib
from typing import Dict, Any
from PIL import Image, UnidentifiedImageError
from rapidfuzz import fuzz
from .db import documents_collection
import numpy as np
import re

# Try to import cv2 for a robust Laplacian-based sharpness check; fall back gracefully.
try:
    import cv2
except Exception:
    cv2 = None

# Weights for heuristics; tune as needed.
_WEIGHTS = {
    "aadhaar_invalid": 40,
    "pan_invalid": 30,
    "dl_invalid": 25,
    "duplicate": 20,
    "manipulation": 10,
    "name_mismatch": 10,
}

def _normalize_pan(pan_raw: str) -> tuple[str | None, bool, bool]:
    """
    Normalize PAN-like strings.
    Returns (normalized_value, masked_flag, format_ok_flag)
    """
    if pan_raw is None:
        return None, False, False

    s = str(pan_raw).upper()
    s = re.sub(r"[\s\-]", "", s)
    s = "".join(ch for ch in s if ch.isalnum() or ch == "*")

    if not s:
        return None, False, False

    masked = "*" in s

    # Valid PAN pattern: 5 letters + 4 digits + 1 letter
    pan_regex = r"^[A-Z]{5}[0-9]{4}[A-Z]$"
    full_valid = bool(re.fullmatch(pan_regex, s))

    if masked:
        return s, True, True

    if full_valid:
        return s, False, True

    # INVALID format → still return string (so scoring can penalize)
    return s, False, False


def _is_duplicate(file_hash: str, parsed: Dict[str, Any], user_id: str, document_id: str | None = None) -> bool:
    # Duplicate by file hash
    q_hash = {"fileHash": file_hash}
    if document_id:
        q_hash["_id"] = {"$ne": document_id}
    if documents_collection.find_one(q_hash):
        return True

    # Aadhaar / PAN checks
    aid = parsed.get("aadhaarNumber")
    pan_raw = parsed.get("panNumber")
    pan_norm, pan_masked, pan_format_ok = _normalize_pan(pan_raw) if pan_raw else (None, False, False)

    q = []
    if aid:
        q.append({"parsed.aadhaarNumber": aid})
    if pan_norm:
        if pan_masked:
            regex = "^" + re.escape(pan_norm).replace("\\*", ".") + "$"
            q.append({"parsed.panNumber": {"$regex": regex, "$options": "i"}})
        else:
            q.append({"parsed.panNumber": pan_norm})

    if q:
        base = {"$or": q, "userId": {"$ne": str(user_id)}}
        if document_id:
            base["_id"] = {"$ne": document_id}
        if documents_collection.find_one(base):
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
    reasons = []

    # SHA256 hash
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    details["fileHash"] = file_hash

    from . import verification as _verification

    # -------------------------
    # Aadhaar Check
    # -------------------------
    aadhaar = parsed.get("aadhaarNumber")
    if aadhaar is not None:
        ok = _verification.verify_aadhaar_local(aadhaar)
        details["aadhaar_valid_local"] = ok
        if not ok:
            score += _WEIGHTS["aadhaar_invalid"]
            reasons.append("Invalid Aadhaar format/checksum")

    # -------------------------
    # PAN VALIDATION
    # -------------------------
    pan_raw = parsed.get("panNumber")
    details["pan_raw"] = pan_raw

    if not pan_raw:
        ocr_text = parsed.get("ocrText", "")
        if ocr_text:
            candidates = re.findall(r"[A-Z0-9]{3,10}", ocr_text.upper())
            if candidates:
                pan_raw = max(candidates, key=len)
                details["pan_from_ocr"] = pan_raw

    if not pan_raw:
        details["pan_normalized"] = None
        details["pan_valid_local"] = None
        details["pan_format_valid"] = False
    else:
        pan_norm, pan_masked, pan_format_ok = _normalize_pan(pan_raw)
        details["pan_normalized"] = pan_norm
        details["pan_masked"] = pan_masked
        details["pan_format_valid"] = pan_format_ok

        if not pan_format_ok:
            score += _WEIGHTS["pan_invalid"]
            details["pan_valid_local"] = False
            reasons.append("PAN format invalid")
        elif not pan_masked:
            okp = _verification.verify_pan_local(pan_norm)
            details["pan_valid_local"] = okp
            if not okp:
                score += _WEIGHTS["pan_invalid"]
                reasons.append("PAN checksum/format failed")
        else:
            details["pan_valid_local"] = None

    # -------------------------
    # DL VALIDATION
    # -------------------------
    dl = parsed.get("dlNumber")
    if dl:
        ok_dl = _verification.verify_dl_local(dl)
        details["dl_valid_local"] = ok_dl
        if not ok_dl:
            score += _WEIGHTS["dl_invalid"]
            reasons.append("Invalid DL format")
    
    # -------------------------
    # Duplicate Check
    # -------------------------
    is_dup = _is_duplicate(file_hash, parsed, str(user.get("_id")), document_id=document_id)
    details["duplicate"] = is_dup
    if is_dup:
        score += _WEIGHTS["duplicate"]
        reasons.append("Duplicate Aadhaar/PAN/DL or file hash")

    # -------------------------
    # Image Manipulation Check
    # -------------------------
    manipulated = _detect_manipulation(file_bytes)
    details["manipulation_suspected"] = manipulated
    if manipulated:
        score += _WEIGHTS["manipulation"]
        reasons.append("Image metadata missing or manipulation suspected")

    # -------------------------
    # Name Matching
    # -------------------------
    if user.get("name") and parsed.get("name"):
        match = int(fuzz.token_set_ratio(str(user["name"]).upper(), str(parsed["name"]).upper()))
        details["name_match_pct"] = match
        if match < 80:
            score += _WEIGHTS["name_mismatch"]
            reasons.append("Name mismatch with account profile")
    else:
        details["name_match_pct"] = None

    # -------------------------
    # Final Risk Band
    # -------------------------
    score = max(0.0, min(100.0, score))
    band = "Low" if score <= 30 else "Medium" if score <= 70 else "High"

    return {
        "score": score,
        "band": band,
        "details": details,
        "reasons": reasons,
        "modelVersion": details.get("modelVersion", "heuristic-v1.0")
    }
