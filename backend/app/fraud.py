# fraud.py
import io
import hashlib
from typing import Dict, Any, List, Optional
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
    "name_mismatch": 15,
    "blur": 20,
    "cropped": 15,
    "new_device": 5,
    "device_multi_user": 20,
    "timezone_mismatch": 10,
    "suspicious_device": 8,
    "cnn_manipulation": 35,
    "gnn_fraud": 30,
}

# =========================================
# AI NAME MATCHING - Multi-Algorithm Engine
# =========================================

def _soundex(name: str) -> str:
    """
    Generate Soundex code for phonetic matching.
    Useful for catching spelling variations of the same name.
    """
    if not name:
        return ""
    
    name = name.upper()
    name = re.sub(r'[^A-Z]', '', name)
    
    if not name:
        return ""
    
    # Soundex code table
    codes = {
        'B': '1', 'F': '1', 'P': '1', 'V': '1',
        'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
        'D': '3', 'T': '3',
        'L': '4',
        'M': '5', 'N': '5',
        'R': '6'
    }
    
    first_letter = name[0]
    coded = first_letter
    
    prev_code = codes.get(first_letter, '0')
    for char in name[1:]:
        code = codes.get(char, '0')
        if code != '0' and code != prev_code:
            coded += code
        prev_code = code
    
    # Pad with zeros and truncate to 4 characters
    return (coded + '000')[:4]


def _normalize_name(name: str) -> str:
    """Normalize name for comparison."""
    if not name:
        return ""
    
    # Uppercase and remove special characters
    normalized = name.upper().strip()
    normalized = re.sub(r'[^A-Z\s]', '', normalized)
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized


def _get_name_variations(name: str) -> List[str]:
    """
    Generate common variations of Indian names.
    Handles initials, middle names, titles, etc.
    """
    variations = [name]
    normalized = _normalize_name(name)
    
    if not normalized:
        return variations
    
    parts = normalized.split()
    
    # Variation 1: Just first and last name
    if len(parts) >= 3:
        variations.append(f"{parts[0]} {parts[-1]}")
    
    # Variation 2: First name with initials for middle/last
    if len(parts) >= 2:
        initials = " ".join([p[0] for p in parts[1:]])
        variations.append(f"{parts[0]} {initials}")
    
    # Variation 3: Last name first (some documents have this)
    if len(parts) >= 2:
        variations.append(f"{parts[-1]} {' '.join(parts[:-1])}")
    
    # Variation 4: Remove common titles/suffixes
    titles = ["MR", "MRS", "MS", "DR", "SHRI", "SMT", "KUM", "KUMAR", "KUMARI", "PROF", "LATE"]
    cleaned_parts = [p for p in parts if p not in titles]
    if cleaned_parts:
        variations.append(" ".join(cleaned_parts))
    
    # Variation 5: First name only
    if parts:
        variations.append(parts[0])
    
    return list(set(variations))


def _cross_document_name_check(user_id: str, document_name: str) -> Dict[str, Any]:
    """
    Check if the name matches with names from other documents uploaded by the same user.
    This helps detect if someone is uploading documents with different names.
    """
    if not user_id or not document_name:
        return {"checked": False, "reason": "Missing data"}
    
    try:
        # Find other documents from the same user
        other_docs = list(documents_collection.find(
            {"userId": user_id},
            {"parsed.name": 1, "_id": 1}
        ).limit(10))
        
        if not other_docs:
            return {"checked": True, "matches": [], "consistent": True}
        
        matches = []
        for doc in other_docs:
            other_name = doc.get("parsed", {}).get("name")
            if other_name:
                similarity = fuzz.token_set_ratio(
                    _normalize_name(document_name),
                    _normalize_name(other_name)
                )
                matches.append({
                    "doc_id": str(doc.get("_id")),
                    "name": other_name,
                    "similarity": similarity
                })
        
        # Check consistency
        high_matches = [m for m in matches if m["similarity"] >= 80]
        low_matches = [m for m in matches if m["similarity"] < 60]
        
        consistent = len(low_matches) == 0
        
        return {
            "checked": True,
            "total_docs": len(matches),
            "consistent": consistent,
            "avg_similarity": sum(m["similarity"] for m in matches) / len(matches) if matches else 100,
            "low_matches": len(low_matches)
        }
    except Exception as e:
        return {"checked": False, "error": str(e)}


def ai_name_match(user_name: Optional[str], document_name: Optional[str], user_id: str = "") -> Dict[str, Any]:
    """
    AI-powered name matching using multiple algorithms.
    
    Returns:
        - overall_match_pct: 0-100 score
        - fuzzy_score: Basic fuzzy matching score
        - phonetic_match: Whether names sound similar (Soundex)
        - variation_match: Whether name matches common variations
        - cross_doc_check: Consistency with other documents
        - reason: Explanation of match/mismatch
    """
    result = {
        "user_name": user_name,
        "document_name": document_name,
        "overall_match_pct": 100,
        "fuzzy_score": 100,
        "phonetic_match": True,
        "variation_match_score": 100,
        "cross_doc_consistent": True,
        "reason": "Match verified"
    }
    
    # If either name is missing, skip matching
    if not user_name or not document_name:
        result["reason"] = "Name comparison skipped (missing data)"
        return result
    
    user_norm = _normalize_name(user_name)
    doc_norm = _normalize_name(document_name)
    
    if not user_norm or not doc_norm:
        result["reason"] = "Name comparison skipped (empty after normalization)"
        return result
    
    # ----------------------
    # 1. Fuzzy String Matching (rapidfuzz)
    # ----------------------
    fuzzy_ratio = fuzz.ratio(user_norm, doc_norm)
    fuzzy_partial = fuzz.partial_ratio(user_norm, doc_norm)
    fuzzy_token_set = fuzz.token_set_ratio(user_norm, doc_norm)
    fuzzy_token_sort = fuzz.token_sort_ratio(user_norm, doc_norm)
    
    # Take the best fuzzy score
    result["fuzzy_score"] = max(fuzzy_ratio, fuzzy_partial, fuzzy_token_set, fuzzy_token_sort)
    result["fuzzy_details"] = {
        "ratio": fuzzy_ratio,
        "partial_ratio": fuzzy_partial,
        "token_set_ratio": fuzzy_token_set,
        "token_sort_ratio": fuzzy_token_sort
    }
    
    # ----------------------
    # 2. Phonetic Matching (Soundex)
    # ----------------------
    user_words = user_norm.split()
    doc_words = doc_norm.split()
    
    # Compare Soundex codes of first and last names
    phonetic_matches = 0
    phonetic_total = min(len(user_words), len(doc_words))
    
    if phonetic_total > 0:
        for i in range(phonetic_total):
            if _soundex(user_words[i]) == _soundex(doc_words[i if i < len(doc_words) else -1]):
                phonetic_matches += 1
        
        result["phonetic_match"] = (phonetic_matches / phonetic_total) >= 0.5
        result["phonetic_score"] = int((phonetic_matches / phonetic_total) * 100)
    
    # ----------------------
    # 3. Name Variation Matching
    # ----------------------
    user_variations = _get_name_variations(user_name)
    doc_variations = _get_name_variations(document_name)
    
    best_variation_match = 0
    for uv in user_variations:
        for dv in doc_variations:
            match = fuzz.token_set_ratio(_normalize_name(uv), _normalize_name(dv))
            best_variation_match = max(best_variation_match, match)
    
    result["variation_match_score"] = best_variation_match
    
    # ----------------------
    # 4. Cross-Document Consistency
    # ----------------------
    if user_id:
        cross_check = _cross_document_name_check(user_id, document_name)
        result["cross_doc_check"] = cross_check
        result["cross_doc_consistent"] = cross_check.get("consistent", True)
    
    # ----------------------
    # 5. Calculate Overall Score
    # ----------------------
    # Weight different algorithms
    overall = (
        result["fuzzy_score"] * 0.4 +
        result["variation_match_score"] * 0.35 +
        (100 if result["phonetic_match"] else 60) * 0.15 +
        (100 if result["cross_doc_consistent"] else 50) * 0.1
    )
    
    result["overall_match_pct"] = int(overall)
    
    # ----------------------
    # 6. Determine Reason
    # ----------------------
    if overall >= 90:
        result["reason"] = "Strong name match verified"
    elif overall >= 80:
        result["reason"] = "Good name match with minor variations"
    elif overall >= 70:
        result["reason"] = f"Possible name variation: '{user_name}' vs '{document_name}'"
    elif overall >= 50:
        result["reason"] = f"Weak name match - review required"
    else:
        result["reason"] = f"Name mismatch: '{user_name}' different from '{document_name}'"
    
    print(f"   🔤 Name Match: {result['overall_match_pct']}% - {result['reason']}")
    
    return result


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


# -------------------------
# New image-quality helpers
# -------------------------
def _compute_laplacian_variance(file_bytes: bytes) -> float | None:
    """
    Returns the variance of the Laplacian (higher = sharper).
    If cv2 is not available, returns None.
    """
    if cv2 is None:
        return None
    try:
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Use a small blur to stabilize noise, then Laplacian
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        lap = cv2.Laplacian(gray, cv2.CV_64F)
        var = float(lap.var())
        return var
    except Exception:
        return None


def _compute_crop_ratio(file_bytes: bytes) -> float | None:
    """
    Estimate how 'filled' the detected document is in the image.
    Returns bounding-box-area / image-area (0..1). Lower -> likely cropped or heavy margins.
    If cv2 not available or failure, returns None.
    """
    if cv2 is None:
        return None
    try:
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None
        h, w = img.shape[:2]
        if h == 0 or w == 0:
            return None

        # Convert to grayscale + adaptive threshold to get document region
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Use Otsu threshold to separate foreground from background
        _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        # Find contours
        contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        # Pick the largest contour by area
        largest = max(contours, key=cv2.contourArea)
        x, y, bw, bh = cv2.boundingRect(largest)
        bbox_area = bw * bh
        img_area = w * h
        ratio = float(bbox_area) / float(img_area)
        return ratio
    except Exception:
        return None


# =========================================
# DEVICE FINGERPRINT FRAUD ANALYSIS
# =========================================

def _analyze_device_fingerprint(user_id: str, device_fingerprint: Dict[str, Any], document_state: str = None) -> Dict[str, Any]:
    """
    Analyze device fingerprint for fraud indicators:
    1. Is this a new device for this user?
    2. Is this device used by multiple users? (fraud farm detection)
    3. Does the timezone match the document's state?
    4. Any suspicious device characteristics?
    """
    result = {
        "analyzed": True,
        "new_device": False,
        "multi_user_device": False,
        "users_on_device": 0,
        "timezone_mismatch": False,
        "suspicious": False,
        "risk_score": 0,
        "reasons": []
    }
    
    if not device_fingerprint:
        result["analyzed"] = False
        result["reasons"].append("No device fingerprint provided")
        return result
    
    device_hash = device_fingerprint.get("hash") or device_fingerprint.get("deviceHash")
    if not device_hash:
        result["analyzed"] = False
        return result
    
    try:
        # -------------------------
        # 1. Check if device is new for this user
        # -------------------------
        user_devices = list(documents_collection.find(
            {"userId": str(user_id), "deviceFingerprint.hash": {"$exists": True}},
            {"deviceFingerprint.hash": 1}
        ).limit(50))
        
        user_device_hashes = set()
        for doc in user_devices:
            fp = doc.get("deviceFingerprint", {})
            if fp.get("hash"):
                user_device_hashes.add(fp.get("hash"))
        
        if device_hash not in user_device_hashes and len(user_device_hashes) > 0:
            result["new_device"] = True
            result["risk_score"] += _WEIGHTS["new_device"]
            result["reasons"].append("First time seeing this device for user")
        
        # -------------------------
        # 2. Check if multiple users use this device (fraud farm)
        # -------------------------
        docs_with_device = list(documents_collection.find(
            {"deviceFingerprint.hash": device_hash},
            {"userId": 1}
        ).limit(100))
        
        unique_users = set(str(d.get("userId")) for d in docs_with_device if d.get("userId"))
        unique_users.discard(str(user_id))  # Exclude current user
        
        result["users_on_device"] = len(unique_users) + 1
        
        if len(unique_users) >= 2:
            result["multi_user_device"] = True
            result["risk_score"] += _WEIGHTS["device_multi_user"]
            result["reasons"].append(f"Device used by {len(unique_users) + 1} different users (possible fraud farm)")
        elif len(unique_users) == 1:
            result["risk_score"] += _WEIGHTS["device_multi_user"] // 2
            result["reasons"].append("Device shared by 2 users")
        
        # -------------------------
        # 3. Timezone vs Document State Check
        # -------------------------
        device_timezone = device_fingerprint.get("timezone", "")
        
        # Map Indian states to expected timezones
        if document_state and device_timezone:
            # All of India is UTC+5:30, so check if it's Indian timezone
            indian_tz_indicators = ["Asia/Kolkata", "Asia/Calcutta", "+05:30", "+0530", "IST"]
            non_indian_states = ["JAMMU", "KASHMIR", "LADAKH"]  # Some border areas might use PDT
            
            is_indian_tz = any(ind in device_timezone for ind in indian_tz_indicators)
            
            # If document is from India but device timezone is not Indian
            if document_state.upper() not in non_indian_states and not is_indian_tz:
                if "America" in device_timezone or "Europe" in device_timezone:
                    result["timezone_mismatch"] = True
                    result["risk_score"] += _WEIGHTS["timezone_mismatch"]
                    result["reasons"].append(f"Device timezone ({device_timezone}) doesn't match document location ({document_state})")
        
        # -------------------------
        # 4. Suspicious Device Characteristics
        # -------------------------
        platform = device_fingerprint.get("platform", "").lower()
        user_agent = device_fingerprint.get("userAgent", "").lower()
        
        # Check for headless browsers / automation
        suspicious_indicators = ["headless", "phantom", "selenium", "puppeteer", "bot", "crawler"]
        if any(ind in user_agent for ind in suspicious_indicators):
            result["suspicious"] = True
            result["risk_score"] += _WEIGHTS["suspicious_device"]
            result["reasons"].append("Possible automated/bot browser detected")
        
        # Check for unusual platform/browser combinations
        if "linux" in platform and "android" not in user_agent and "mobile" not in user_agent:
            # Linux desktop is less common for KYC uploads
            result["risk_score"] += 2
            result["reasons"].append("Unusual platform for KYC (Linux desktop)")
        
        print(f"   🖥️ Device Analysis: new={result['new_device']}, multi_user={result['multi_user_device']}, risk={result['risk_score']}")
        
    except Exception as e:
        result["error"] = str(e)
        print(f"   ⚠️ Device analysis error: {e}")
    
    return result


def analyze_for_fraud(user: Dict[str, Any], file_bytes: bytes, parsed: Dict[str, Any], document_id: str | None = None, device_fingerprint: Dict[str, Any] = None, cnn_prob: float = None, gnn_prob: float = None) -> Dict[str, Any]:
    details: Dict[str, Any] = {}
    score = 0
    reasons = []

    # calculate a simple file hash (used for duplicates)
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    details["fileHash"] = file_hash

    # -------------------------
    # DEEP LEARNING MODEL CHECKS
    # -------------------------
    if cnn_prob is not None:
        details["cnn_manipulation_score"] = cnn_prob
        if cnn_prob > 0.5:
            # Scale penalty by probability
            penalty = int(cnn_prob * _WEIGHTS.get("cnn_manipulation", 35))
            score += penalty
            reasons.append(f"🤖 AI detected potential image manipulation ({int(cnn_prob*100)}%)")

    if gnn_prob is not None:
        details["gnn_fraud_score"] = gnn_prob
        if gnn_prob > 0.5:
            penalty = int(gnn_prob * _WEIGHTS.get("gnn_fraud", 30))
            score += penalty
            reasons.append(f"🕸️ GNN detected suspicious network activity ({int(gnn_prob*100)}%)")

    # -------------------------
    # Aadhaar Check
    # -------------------------
    aadhaar = parsed.get("aadhaarNumber")
    if aadhaar is not None:
        # use verify_aadhaar which returns a dict {"ok": bool, .}
        try:
            import verification as _verification
            ok = bool(_verification.verify_aadhaar(aadhaar).get("ok", False))
        except Exception:
            ok = False
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
            try:
                import verification as _verification
                okp = bool(_verification.verify_pan(pan_norm).get("ok", False))
            except Exception:
                okp = False
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
        try:
            import verification as _verification
            ok_dl = _verification.verify_dl_local(dl)
        except Exception:
            ok_dl = False
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
    # New: Image Quality Checks (Blur & Crop)
    # -------------------------
    # 1) Blur (Laplacian variance)
    blur_var = _compute_laplacian_variance(file_bytes)
    details["blur_variance"] = blur_var
    if blur_var is not None:
        # threshold: below this → considered blurry (tunable)
        BLUR_THRESHOLD = 100.0
        if blur_var < BLUR_THRESHOLD:
            score += _WEIGHTS["blur"]
            reasons.append(f"Image appears blurry (laplacian variance={blur_var:.1f})")
    else:
        # can't assess (no cv2) — leave None

        details["blur_assessed"] = False

    # 2) Crop / bounding-box fill ratio
    crop_ratio = _compute_crop_ratio(file_bytes)
    details["crop_bbox_ratio"] = crop_ratio
    if crop_ratio is not None:
        # threshold: if document bbox occupies less than this fraction, it's likely cropped/misaligned
        CROP_THRESHOLD = 0.65
        if crop_ratio < CROP_THRESHOLD:
            score += _WEIGHTS["cropped"]
            reasons.append(f"Image appears cropped or has large margins (bbox_ratio={crop_ratio:.2f})")
    else:
        details["crop_assessed"] = False

    # -------------------------
    # AI NAME MATCHING - Enhanced
    # -------------------------
    name_match_result = ai_name_match(
        user_name=user.get("name"),
        document_name=parsed.get("name"),
        user_id=str(user.get("_id"))
    )
    details["name_matching"] = name_match_result
    
    if name_match_result.get("overall_match_pct", 100) < 70:
        score += _WEIGHTS["name_mismatch"]
        reasons.append(f"Name mismatch ({name_match_result.get('overall_match_pct', 0)}%): {name_match_result.get('reason', 'Unknown')}")
    elif name_match_result.get("overall_match_pct", 100) < 85:
        # Partial match - add smaller penalty
        score += _WEIGHTS["name_mismatch"] // 2
        reasons.append(f"Name partial match ({name_match_result.get('overall_match_pct', 0)}%): {name_match_result.get('reason', 'Check manually')}")

    # -------------------------
    # DEVICE FINGERPRINT ANALYSIS
    # -------------------------
    if device_fingerprint:
        document_state = parsed.get("state")  # Get state from parsed document
        device_analysis = _analyze_device_fingerprint(
            user_id=str(user.get("_id")),
            device_fingerprint=device_fingerprint,
            document_state=document_state
        )
        details["device_fingerprint"] = device_analysis
        
        # Add device risk score
        device_risk = device_analysis.get("risk_score", 0)
        score += device_risk
        
        # Add device-related reasons
        for reason in device_analysis.get("reasons", []):
            reasons.append(f"🖥️ {reason}")
    else:
        details["device_fingerprint"] = {"analyzed": False, "reason": "No fingerprint provided"}

    # -------------------------
    # Final assembly
    # -------------------------
    # Keep the raw reasons and details for explainability
    fraud_res = {
        "score": min(int(score), 100),
        "reasons": reasons,
        "details": details
    }
    return fraud_res
