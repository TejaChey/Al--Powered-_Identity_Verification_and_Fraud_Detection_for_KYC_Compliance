import io, re
import numpy as np
from typing import Dict, List
from PIL import Image
from .config import settings

# Try imports for OCR and Image Processing
try:
    import cv2
except Exception:
    cv2 = None

try:
    from pdf2image import convert_from_bytes
except Exception:
    convert_from_bytes = None

# ============================================
# EasyOCR - Better for Indian Documents
# ============================================
easyocr_reader = None

def _get_easyocr_reader():
    """Lazy-load EasyOCR reader (Hindi + English for Aadhaar)"""
    global easyocr_reader
    if easyocr_reader is None:
        try:
            import easyocr
            # Load reader with English and Hindi (common on Indian IDs)
            # GPU=False for compatibility, can set to True if CUDA available
            easyocr_reader = easyocr.Reader(['en', 'hi'], gpu=False, verbose=False)
            print("✅ EasyOCR initialized with English + Hindi")
        except ImportError:
            print("⚠️ EasyOCR not installed. Falling back to pytesseract.")
            return None
        except Exception as e:
            print(f"⚠️ EasyOCR init error: {e}")
            return None
    return easyocr_reader

# Fallback to pytesseract if EasyOCR not available
try:
    import pytesseract
    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
except Exception:
    pytesseract = None


def preprocess_image_for_ocr(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess image for better OCR accuracy on Indian ID cards.
    Returns numpy array (for EasyOCR) or PIL Image (for pytesseract fallback).
    """
    if cv2 is None:
        # Return raw bytes if cv2 not available
        return image_bytes

    # 1. Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return image_bytes

    # 2. Get image dimensions
    h, w = img.shape[:2]
    
    # 3. Resize if too small (upscale for better OCR)
    min_dim = min(h, w)
    if min_dim < 800:
        scale = 1200 / min_dim
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    
    # 4. Denoise (helps with scanned documents)
    img = cv2.fastNlMeansDenoisingColored(img, None, 10, 10, 7, 21)
    
    # 5. Optional: Enhance contrast (uncomment if needed)
    # lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    # l, a, b = cv2.split(lab)
    # clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    # l = clahe.apply(l)
    # img = cv2.merge([l, a, b])
    # img = cv2.cvtColor(img, cv2.COLOR_LAB2BGR)
    
    return img


def _pdf_bytes_to_images(pdf_bytes: bytes) -> List[np.ndarray]:
    """Convert PDF to list of numpy arrays (for EasyOCR)"""
    if convert_from_bytes is None:
        return []
    try:
        pil_images = convert_from_bytes(pdf_bytes, fmt="png")
        np_images = []
        for pil_img in pil_images:
            np_img = np.array(pil_img)
            # Convert RGB to BGR for OpenCV compatibility
            if len(np_img.shape) == 3 and np_img.shape[2] == 3:
                np_img = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)
            np_images.append(np_img)
        return np_images
    except Exception as e:
        print(f"PDF convert error: {e}")
        return []


def extract_text_from_bytes(image_bytes: bytes) -> str:
    """
    Extract text from image using EasyOCR (primary) or Tesseract (fallback).
    EasyOCR is preferred for Indian documents (Aadhaar, PAN, DL).
    """
    try:
        # Detect PDF
        is_pdf = image_bytes[:4] == b"%PDF"
        
        if is_pdf:
            images = _pdf_bytes_to_images(image_bytes)
            if not images:
                return ""
        else:
            preprocessed = preprocess_image_for_ocr(image_bytes)
            images = [preprocessed] if isinstance(preprocessed, np.ndarray) else []
        
        # Try EasyOCR first (better for Indian documents)
        reader = _get_easyocr_reader()
        if reader and images:
            all_texts = []
            for img in images:
                try:
                    # EasyOCR returns list of (bbox, text, confidence)
                    # Use text_threshold for better detection
                    results = reader.readtext(
                        img, 
                        detail=1, 
                        paragraph=False,
                        text_threshold=0.5,  # Lower threshold for text detection
                        low_text=0.3,        # Lower threshold for low confidence text
                        link_threshold=0.3,  # Link nearby characters
                        width_ths=0.5,       # Width threshold for merging
                        decoder='greedy'     # Faster decoder
                    )
                    
                    # Debug: Print what EasyOCR found
                    print(f"🔍 EasyOCR found {len(results)} text regions")
                    
                    # Sort results by vertical position (top to bottom), then horizontal
                    results_sorted = sorted(results, key=lambda x: (x[0][0][1], x[0][0][0]))
                    
                    # Extract text, filter low confidence
                    for bbox, text, conf in results_sorted:
                        if conf > 0.15 and len(text.strip()) > 0:  # Further lowered threshold
                            all_texts.append(text.strip())
                            print(f"   📝 [{conf:.2f}] {text.strip()}")
                    
                except Exception as e:
                    print(f"EasyOCR page error: {e}")
                    import traceback
                    traceback.print_exc()
            
            if all_texts:
                combined_text = "\n".join(all_texts)
                print(f"\n📄 Combined OCR Text ({len(combined_text)} chars):\n{combined_text[:500]}...")
                return combined_text
        
        # Fallback to pytesseract
        if pytesseract is not None:
            print("⚠️ Falling back to pytesseract")
            if is_pdf:
                pil_images = convert_from_bytes(image_bytes, fmt="png") if convert_from_bytes else []
            else:
                pil_images = [Image.open(io.BytesIO(image_bytes))]
            
            texts = []
            for pil_img in pil_images:
                try:
                    # Use PSM 6 for uniform block of text
                    text = pytesseract.image_to_string(pil_img, config='--oem 3 --psm 6')
                    texts.append(text)
                except Exception as e:
                    print(f"Tesseract error: {e}")
            
            return "\n".join(texts)
        
        return ""
    except Exception as e:
        print(f"OCR Error: {e}")
        import traceback
        traceback.print_exc()
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
        "dlNumber": None,
        "issueDate": None,
        "validUntil": None,
        "pinCode": None,      # NEW: 6-digit Indian postal code
        "pinZone": None,      # NEW: Region derived from PIN
        "state": None,        # NEW: Indian state from address
        "documentType": None, # Detect early
    }
    
    # Filter out empty lines and very short noise
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 2]
    full = " ".join(lines)
    full_upper = full.upper()

    # ==========================================
    # STEP 0: Detect Document Type FIRST (Critical for avoiding misclassification)
    # ==========================================
    if any(kw in full_upper for kw in ["AADHAAR", "UNIQUE IDENTIFICATION", "UIDAI", "आधार"]):
        parsed["documentType"] = "Aadhaar"
    elif any(kw in full_upper for kw in ["INCOME TAX", "PERMANENT ACCOUNT", "INCOME TAX DEPARTMENT", "PAN CARD", "आयकर विभाग"]):
        parsed["documentType"] = "PAN"
    elif any(kw in full_upper for kw in ["DRIVING LICENCE", "DRIVING LICENSE", "MOTOR DRIVING", "FORM 7", "LMV", "MCWG"]):
        parsed["documentType"] = "DrivingLicence"
    # Additional DL detection for poor OCR - look for patterns unique to DL
    elif "NO.:" in full_upper or "NO. :" in full_upper:
        # "No.:" pattern is unique to DL (Kerala format)
        parsed["documentType"] = "DrivingLicence"
    elif any(kw in full_upper for kw in ["VALID TO", "VALID FROM", "NON TRANSPORT", "NON TRANSPON", "BLOOD GROUP", "KERAL", "STATE DRIVING"]):
        # These patterns are common on DL but not on other documents
        parsed["documentType"] = "DrivingLicence"
    elif "TRANSPORT" in full_upper and "DATE OF BIRTH" not in full_upper.replace(" ", ""):
        # TRANSPORT alone might be DL if no other doc indicators
        parsed["documentType"] = "DrivingLicence"
    
    print(f"   🔍 Detected document type: {parsed['documentType']}")

    # ==========================================
    # STEP 1: Extract IDs based on document type
    # ==========================================
    
    # Aadhaar: 12 digits (may have spaces)
    m = re.search(r"\b(\d{4}\s?\d{4}\s?\d{4})\b", full)
    if m: 
        aadhaar_candidate = m.group(1).replace(" ", "")
        # Validate: should not be all same digits
        if len(set(aadhaar_candidate)) > 2:
            parsed["aadhaarNumber"] = aadhaar_candidate

    # PAN: 5 letters + 4 digits + 1 letter (exactly 10 chars)
    # First try exact match
    m = re.search(r"\b[A-Z]{5}\d{4}[A-Z]\b", full)
    if m:
        parsed["panNumber"] = m.group().upper()
        print(f"   ✓ Found exact PAN match: {parsed['panNumber']}")
    
    # If not found, look for partial matches (OCR sometimes misses last char)
    if not parsed.get("panNumber"):
        # Look for patterns like ABCD1234 followed by any letter
        m = re.search(r"\b([A-Z]{4,5}\d{4}[A-Z]?)\b", full)
        if m:
            candidate = m.group(1).upper()
            print(f"   🔍 Checking PAN candidate: {candidate}")
            
            # If it's 9-10 chars and starts with letters and has digits
            if len(candidate) >= 8:
                # Pad if needed to look for nearby letter
                if len(candidate) == 9 and candidate[:5].isalpha() and candidate[5:9].isdigit():
                    # Missing last letter, try to find it nearby
                    idx = full.find(candidate)
                    if idx >= 0 and idx + 10 <= len(full):
                        next_char = full[idx + 9:idx + 10]
                        if next_char.isalpha():
                            parsed["panNumber"] = candidate + next_char.upper()
                            print(f"   ✓ Repaired PAN: {parsed['panNumber']}")
                elif len(candidate) == 10:
                    parsed["panNumber"] = candidate
                    print(f"   ✓ Found PAN: {parsed['panNumber']}")

    # If PAN not found, attempt to detect common OCR-messed candidates and repair them
    def _normalize_token(t: str) -> str:
        return re.sub(r"[^A-Za-z0-9]", "", t).upper()

    def _generate_variants_for_pan(token: str):
        # Map common OCR confusions both directions
        mapping = {
            '0': ['O'], 'O': ['0'],
            '1': ['I', 'L'], 'I': ['1', 'L'], 'L': ['1', 'I'],
            '2': ['Z'], 'Z': ['2'],
            '5': ['S'], 'S': ['5'],
            '8': ['B'], 'B': ['8'],
            '6': ['G'], 'G': ['6'],
            '9': ['g'], 'g': ['9']
        }
        token = _normalize_token(token)
        # Only consider tokens of length 10 (PAN canonical length)
        if len(token) != 10:
            return []
        variants = set()
        # Simple backtracking limited to ambiguous positions
        amb_positions = [i for i, ch in enumerate(token) if ch in mapping]
        # limit branching by only allowing up to 4 ambiguous positions to expand
        if len(amb_positions) > 4:
            amb_positions = amb_positions[:4]

        def backtrack(idx, cur):
            if idx == len(amb_positions):
                candidates = list(cur)
                variants.add(''.join(candidates))
                return
            pos = amb_positions[idx]
            # move to next ambiguous position
            backtrack(idx+1, cur)
            # replace with each mapped alternative
            for alt in mapping[cur[pos]]:
                saved = cur[pos]
                cur[pos] = alt
                backtrack(idx+1, cur)
                cur[pos] = saved

        backtrack(0, list(token))
        return variants

    if not parsed.get("panNumber"):
        # Find alphanumeric tokens that could be PAN (8-12 chars)
        for t in re.findall(r"[A-Za-z0-9][A-Za-z0-9\s\-]{6,12}[A-Za-z0-9]", full):
            norm = _normalize_token(t)
            if len(norm) == 10:
                # test direct
                if re.match(r"^[A-Z]{5}\d{4}[A-Z]$", norm):
                    parsed["panNumber"] = norm
                    print(f"   ✓ Found PAN from token scan: {norm}")
                    break
                # try variants
                for v in _generate_variants_for_pan(norm):
                    if re.match(r"^[A-Z]{5}\d{4}[A-Z]$", v):
                        parsed["panNumber"] = v
                        print(f"   ✓ Found PAN via variant repair: {v}")
                        break
                if parsed.get("panNumber"):
                    break
        
        # Last resort: look for any sequence that looks like it could be a partial PAN
        if not parsed.get("panNumber") and parsed.get("documentType") == "PAN":
            # On a PAN card, look for anything that looks like XXXX1234X pattern
            for line in lines:
                # Find tokens that are mostly alphanumeric and 8-12 chars
                tokens = re.findall(r"[A-Za-z0-9]{8,12}", line.replace(" ", ""))
                for tok in tokens:
                    tok = tok.upper()
                    letters = sum(1 for c in tok if c.isalpha())
                    digits = sum(1 for c in tok if c.isdigit())
                    # PAN has 6 letters and 4 digits
                    if letters >= 4 and digits >= 3:
                        parsed["panNumber"] = tok[:10] if len(tok) >= 10 else tok
                        print(f"   ⚠️ Partial PAN detected: {parsed['panNumber']}")
                        break
                if parsed.get("panNumber"):
                    break

    # 2. Extract DOB - Multiple strategies
    m = re.search(r"\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b", full)
    if m: 
        parsed["dob"] = m.group(1)
    else:
        # Try alternative patterns
        m_yob = re.search(r"(?i)(year|yob|dob)[\s:\-]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})", full)
        if m_yob: 
            parsed["dob"] = m_yob.group(2)
        else:
            m_yob = re.search(r"(?i)(year|yob)[\s:\-]*(\d{4})", full)
            if m_yob: 
                parsed["dob"] = m_yob.group(2)

    # 3. Extract Gender
    m = re.search(r"(?i)\b(male|female|transgender)\b", full)
    if m:
        parsed["gender"] = m.group(1).capitalize()
    elif " M " in full or " M\n" in text or re.search(r"\bM\b", full):
        parsed["gender"] = "Male"
    elif " F " in full or " F\n" in text or re.search(r"\bF\b", full):
        parsed["gender"] = "Female"

    # 4. ROBUST NAME EXTRACTION
    # Extended bad patterns to avoid department names, headers, and government text
    bad_patterns = [
        "GOVERNMENT", "INDIA", "FATHER", "ADDRESS", "YEAR", "MALE", "FEMALE", 
        "AADHAAR", "PAN", "LICENSE", "LICENCE", "DOB", "DATE", "PSSST", "SSS", 
        "SRI", "SHRI", "GOVT", "PROOF", "BIRTH", "CITIZENSHIP", "VERIFICATION", 
        "AUTHENTICATION", "CODE", "OFFLINE", "BLOOD", "GROUP", "CATEGORY", 
        "TRANSPORT", "VALID", "FROM", "MP", "OOOS", "ES", "LON", "ENC", "RAS", "NEU",
        # Department and header text to exclude
        "INCOME TAX", "DEPARTMENT", "PERMANENT ACCOUNT", "NUMBER CARD", "SIGNATURE",
        "HOLDER", "PHOTO", "CARD", "UNION", "REPUBLIC", "MINISTRY", "UNIQUE",
        "IDENTIFICATION", "AUTHORITY", "REVENUE", "CENTRAL", "MOTOR", "DRIVING",
        "REPUBLIC OF INDIA", "GOVT OF INDIA", "TAX DEPARTMENT", "ACCOUNT NUMBER",
        # State names (to avoid header text like "KERALA STATE" being parsed as name)
        "KERALA", "KARNATAKA", "TAMIL NADU", "ANDHRA", "TELANGANA", "MAHARASHTRA",
        "GUJARAT", "RAJASTHAN", "PUNJAB", "HARYANA", "DELHI", "UTTAR PRADESH",
        "MADHYA PRADESH", "WEST BENGAL", "BIHAR", "ODISHA", "JHARKHAND", 
        "CHHATTISGARH", "ASSAM", "MEGHALAYA", "TRIPURA", "MANIPUR", "NAGALAND",
        "MIZORAM", "SIKKIM", "GOA", "HIMACHAL", "UTTARAKHAND", "JAMMU",
        # DL-specific headers
        "INDIAN UNION", "STATE DRIVING", "FORM", "PILLAI", "CATEGORY",
        "NON-TRANSPORT", "TRANSPORT", "LMV", "MCWG", "THIRUVANANTHAPURAM"
    ]
    bad_words = {"THE", "AND", "OR", "NOT", "FOR", "WITH", "ONLY", "SHOULD", "USED", "BE", "IT", "IS", "OF", "TO", "IN", "AT", "BY", "FROM", "ON", "A", "AN", "NO", "TAX", "DEPARTMENT", "INCOME", "STATE", "KERALA", "KERAL"}
    
    # For DL documents, skip general name extraction - we'll handle it specially later
    # This prevents picking up header text like "KERALA STATE"
    if parsed.get("documentType") != "DrivingLicence":
        # Strategy A (PRIORITY): Look for "Name:" anywhere, even with weird punctuation/spacing
        # Very flexible - handles "S. Name:", "Name:", "S.Name:", etc.
        m_name = re.search(r"(?i)(?:s\.?\s*)?name['\s:\-]*([A-Za-z][A-Za-z\s\.]{2,60}?)(?=\n|$|[0-9]|Date|DOB)", full)
        if m_name:
            candidate = m_name.group(1).strip()
            # Remove trailing single letters that are artifacts
            candidate = re.sub(r'\s+[A-Z]$', '', candidate).strip()
            words = candidate.split()
            # Must have at least 1 word, and not be a bad pattern
            if words and 3 <= len(candidate) <= 60 and not any(bp in candidate.upper() for bp in bad_patterns):
                parsed["name"] = candidate
    
    # Strategy B: Look for multi-word lines that look like names - but ONLY if they have real English names
    # Require minimum word length per word to filter out garbage like "MP OOOS" or "ES A"
    # Only if name not found yet
    if not parsed.get("name"):
        for idx, line in enumerate(lines):
            clean_line = re.sub(r'[^A-Za-z\s\.]', '', line).strip()
            words_in_line = clean_line.split()
            word_count = len(words_in_line)
            
            # Name heuristics:
            # - 2+ words (handles "SUNIL BHASKAR U" or "Y TEJA")
            # - 3-60 chars total
            # - All alphabetic
            # - Starts with uppercase
            # - Each word should be 2+ chars (filters out "MP OOOS" which has "MP" = 2 but "OOOS" = 4)
            # - At least one word with 4+ chars (to avoid acronyms/abbreviations)
            # - Not matching bad patterns/words
            word_lengths = [len(w) for w in words_in_line]
            has_long_word = any(wl >= 4 for wl in word_lengths)
            all_words_sufficient = all(wl >= 2 for wl in word_lengths)
            
            if (3 <= len(clean_line) <= 60 and 
                word_count >= 2 and
                all_words_sufficient and
                has_long_word and
                clean_line.replace(" ", "").isalpha() and
                not any(bp in clean_line.upper() for bp in bad_patterns) and
                not all(w.upper() in bad_words for w in words_in_line)):
                
                if clean_line and clean_line[0].isupper():
                    parsed["name"] = clean_line
                    break
    
    # Strategy C: Look for lines immediately before DOB marker (position-based fallback)
    if not parsed.get("name") and parsed.get("dob"):
        for i, line in enumerate(lines):
            if parsed["dob"] in line or "DOB" in line.upper() or "DATE OF BIRTH" in line.upper():
                # Check line before
                if i > 0:
                    candidate = re.sub(r'[^A-Za-z\s\.]', '', lines[i-1]).strip()
                    if (3 <= len(candidate) <= 60 and
                        candidate.replace(" ", "").isalpha() and
                        not any(b in candidate.upper() for b in bad_patterns)):
                        parsed["name"] = candidate
                        break
    
    # 5. Extract Father's Name
    m = re.search(r"(?i)father['s]*\s*name[:\-]?\s*([A-Za-z][A-Za-z\s]{2,100}?)(?=\n|$)", full)
    if m: 
        parsed["fatherName"] = m.group(1).strip()

    # 6. Extract Address
    m_addr = re.search(r"(?i)address[:\-]?\s*(.+?)(?=\n|$)", full)
    if m_addr:
        addr = m_addr.group(1)
        # Remove ID numbers from address if captured by mistake
        addr = re.sub(r"\d{4}\s?\d{4}\s?\d{4}", "", addr).strip()
        if len(addr) > 3:
            parsed["address"] = addr

    # 6b. Extract PIN Code (Indian 6-digit postal code)
    pin_patterns = [
        r"(?:PIN|Pin|Pincode|Pin\s*Code|Postal\s*Code)[:\s\-]*(\d{6})\b",  # Explicit PIN label
        r"\b(\d{6})\s*(?:India|INDIA)?\s*$",  # 6 digits at end of text
        r"[\-,\s](\d{6})\b",  # 6 digits after separator
    ]
    for pat in pin_patterns:
        m_pin = re.search(pat, full, re.IGNORECASE)
        if m_pin:
            pin = m_pin.group(1)
            # Validate: Indian PIN codes start with 1-9 (not 0)
            if pin[0] != '0':
                parsed["pinCode"] = pin
                # Extract zone from PIN (first digit indicates region)
                pin_zone_map = {
                    '1': 'Delhi/Haryana/Punjab/HP/J&K',
                    '2': 'UP/Uttarakhand',
                    '3': 'Rajasthan/Gujarat',
                    '4': 'Maharashtra/Goa/MP/Chhattisgarh',
                    '5': 'AP/Telangana/Karnataka',
                    '6': 'Kerala/Tamil Nadu',
                    '7': 'West Bengal/Odisha/NE States',
                    '8': 'Bihar/Jharkhand',
                    '9': 'Army Post Office'
                }
                parsed["pinZone"] = pin_zone_map.get(pin[0], 'Unknown')
                break

    # 6c. Extract State (common Indian states from address)
    state_keywords = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Delhi", "Chandigarh", "Puducherry", "Jammu", "Kashmir", "Ladakh"
    ]
    for state in state_keywords:
        if re.search(rf"\b{re.escape(state)}\b", full, re.IGNORECASE):
            parsed["state"] = state
            break


    # 7. Extract Driver's License Number - ONLY for DL documents
    # This prevents false detection on PAN/Aadhaar cards
    if parsed.get("documentType") == "DrivingLicence":
        # Add state-specific bad words for DL
        dl_bad_patterns = ["KERALA", "STATE", "INDIAN", "UNION", "DRIVING", "LICENCE", 
                          "LICENSE", "TRANSPORT", "MOTOR", "FORM", "PILLAI", "KERAL", 
                          "TRANSPON", "BLOOD", "GROUP", "CATEGORY", "VALID"]
        
        print(f"   🚗 Processing DL document...")
        print(f"   📝 Raw text first 500 chars: {full[:500]}")
        
        # Process line by line for DL - EasyOCR returns separate lines
        dl_lines = [l.strip() for l in text.splitlines() if l.strip()]
        print(f"   📋 DL lines count: {len(dl_lines)}")
        
        # Find name - look for line after "Name" or line starting with ":"
        found_name_label = False
        for i, line in enumerate(dl_lines):
            line_clean = line.strip()
            
            # Check if this line is the "Name" label
            if line_clean.upper() == "NAME" or line_clean.upper().startswith("NAME "):
                found_name_label = True
                continue
            
            # If previous line was "Name", this line might be the actual name
            if found_name_label or line_clean.startswith(":"):
                # Extract name from line like ":SUNIL BHASKARU" or "SUNIL BHASKAR"
                candidate = line_clean
                if candidate.startswith(":"):
                    candidate = candidate[1:].strip()
                
                # Clean up the name
                candidate = re.sub(r'[^A-Za-z\s\.]', '', candidate).strip()
                candidate = re.sub(r'\s+', ' ', candidate)  # Normalize spaces
                
                # Remove trailing single letter artifacts
                candidate = re.sub(r'\s+[A-Z]$', '', candidate).strip()
                
                print(f"   🔍 Checking name candidate: '{candidate}'")
                
                # Validate - must be alphabetic, reasonable length, not bad pattern
                if (5 <= len(candidate) <= 50 and 
                    candidate.replace(" ", "").replace(".", "").isalpha() and
                    not any(bp in candidate.upper() for bp in dl_bad_patterns)):
                    parsed["name"] = candidate
                    print(f"   ✓ DL Name found: {parsed['name']}")
                    break
                
                found_name_label = False  # Reset if this wasn't a valid name
        
        # Find DL Number - look for "No.:" pattern or line with format X/XXXX/XXXX
        for line in dl_lines:
            line_clean = line.strip()
            
            # Pattern: "No.:  1/1626/2006" 
            if "no" in line_clean.lower() and (":" in line_clean or "/" in line_clean):
                m = re.search(r"(\d{1,2}/\d{2,5}/\d{4})", line_clean)
                if m:
                    dl_num = m.group(1)
                    # Validate: middle part should be > 2 digits (not a date)
                    parts = dl_num.split("/")
                    if len(parts) == 3 and len(parts[1]) >= 3:
                        parsed["dlNumber"] = dl_num
                        print(f"   ✓ DL Number found: {parsed['dlNumber']}")
                        break
        
        # Fallback: Look for any X/XXXX/XXXX pattern that's not a date
        if not parsed.get("dlNumber"):
            for line in dl_lines:
                m = re.search(r"(\d{1,2}/\d{3,5}/\d{4})", line)
                if m:
                    dl_num = m.group(1)
                    parts = dl_num.split("/")
                    # DL number has middle part with 3+ digits (dates have 2)
                    if len(parts) == 3 and len(parts[1]) >= 3:
                        parsed["dlNumber"] = dl_num
                        print(f"   ✓ DL Number found (pattern): {parsed['dlNumber']}")
                        break
        
        # Find DOB - look for "Date of Birth" or "DOB" pattern
        for i, line in enumerate(dl_lines):
            line_clean = line.strip().upper()
            
            # Check for DOB label patterns (OCR might mangle "Birth" to "Binh")
            if any(x in line_clean for x in ["DATE OF BIRTH", "DOB", "BIRTH", "BINH", "D.O.B"]):
                # Look for date in same line or next line
                m = re.search(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})", line)
                if m:
                    parsed["dob"] = m.group(1)
                    print(f"   ✓ DL DOB found (same line): {parsed['dob']}")
                    break
                elif i + 1 < len(dl_lines):
                    # Check next line for date
                    m = re.search(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})", dl_lines[i+1])
                    if m:
                        parsed["dob"] = m.group(1)
                        print(f"   ✓ DL DOB found (next line): {parsed['dob']}")
                        break
        
        # Fallback: Find all dates and use the one that looks like DOB (not issue date)
        if not parsed.get("dob"):
            all_dates = re.findall(r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{4})", full)
            print(f"   📅 All dates found: {all_dates}")
            for date_str in all_dates:
                parts = date_str.replace("-", "/").split("/")
                if len(parts) == 3:
                    try:
                        year = int(parts[2])
                        # DOB year is typically 1950-2010 for adults
                        if 1950 <= year <= 2010:
                            parsed["dob"] = date_str
                            print(f"   ✓ DL DOB found (by year): {parsed['dob']}")
                            break
                    except:
                        pass
        
        # Pattern 1: Explicit DL label
        if not parsed.get("dlNumber"):
            m = re.search(r"(?i)(?:dl|driv|license|licence|lic)\s*(?:no|number|#|:)?[\s:\-]*([A-Za-z0-9\-/]{5,20})", full)
            if m:
                dl_candidate = m.group(1).strip()
                if 5 <= len(dl_candidate) <= 20:
                    parsed["dlNumber"] = dl_candidate
                    print(f"   ✓ DL Number (label pattern): {parsed['dlNumber']}")
        
        # Pattern 2: Look for Indian DL format with state code: "KL01XXXXX12345" or "HR01XXXXX12345"
        if not parsed.get("dlNumber"):
            for t in re.findall(r"[A-Z]{2}[-\s]?\d{1,3}[-\s]?\d{3,15}", full):
                norm = re.sub(r"[\s\-]", "", t).upper()
                if 8 <= len(norm) <= 20:
                    parsed["dlNumber"] = norm
                    print(f"   ✓ DL Number (state code pattern): {parsed['dlNumber']}")
                    break
        
        # Pattern 3: Look for sequences like "1/1626/2006" (Kerala DL format)
        if not parsed.get("dlNumber"):
            m = re.search(r"(\d{1,2}[/]\d{2,4}[/]\d{4})", full)
            if m:
                # Determine if this is DL number vs date by context
                dl_candidate = m.group(1)
                # Check if this appears after "No" or at start
                context_before = full[:m.start()][-20:] if m.start() > 20 else full[:m.start()]
                if "No" in context_before or m.start() < 100:
                    parsed["dlNumber"] = dl_candidate
                    print(f"   ✓ DL Number (slash format): {parsed['dlNumber']}")
        
        # Pattern 4: Fallback - look for standalone sequences that look like DL
        if not parsed.get("dlNumber"):
            for t in re.findall(r"[A-Za-z0-9\-/]{8,20}", full):
                norm = re.sub(r"[^A-Za-z0-9]", "", t).upper()
                if 8 <= len(norm) <= 20:
                    letters = sum(1 for c in norm if c.isalpha())
                    digits = sum(1 for c in norm if c.isdigit())
                    # DL typically has some letters and many digits
                    if letters >= 1 and digits >= 3:
                        parsed["dlNumber"] = norm
                        print(f"   ✓ DL Number (fallback): {parsed['dlNumber']}")
                        break
    
    # 8. Extract Issue Date / Valid Until
    m = re.search(r"(?i)(issue|issued|iss)[\s:\-]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})", full)
    if m:
        parsed["issueDate"] = m.group(2)
    
    m = re.search(r"(?i)(valid|validity|exp|expiry|until)[\s:\-]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})", full)
    if m:
        parsed["validUntil"] = m.group(2)
    
    # Document type already detected at the start of this function
    # Print final parsed result summary
    print(f"   ✅ Final parsed: docType={parsed.get('documentType')}, aadhaar={parsed.get('aadhaarNumber')}, pan={parsed.get('panNumber')}, name={parsed.get('name')}")
    
    return parsed