import io, re
import numpy as np
from typing import Dict, List
from PIL import Image
from .config import settings

# Try imports for OCR and Image Processing
try:
    import pytesseract
    if settings.TESSERACT_CMD:
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
except Exception:
    pytesseract = None

try:
    import cv2
except Exception:
    cv2 = None

try:
    from pdf2image import convert_from_bytes
except Exception:
    convert_from_bytes = None

def preprocess_image(image_bytes: bytes):
    """
    Advanced Pre-processing: Resizing + Binarization to fix small fonts/wavy backgrounds.
    """
    if cv2 is None:
        return Image.open(io.BytesIO(image_bytes))

    # 1. Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 2. Resize (Upscale) - Crucial for small fonts like 'Y Teja'
    # We double the size of the image so the OCR sees 'big' text
    img = cv2.resize(img, None, fx=2.5, fy=2.5, interpolation=cv2.INTER_CUBIC)

    # 3. Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 4. Adaptive Thresholding (Removes the wavy background patterns)
    # This turns the image into pure Black & White
    processed = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2
    )

    # Convert back to PIL Image for Tesseract
    return Image.fromarray(processed)

def _pdf_bytes_to_images(pdf_bytes: bytes) -> List[Image.Image]:
    if convert_from_bytes is None:
        return []
    try:
        return convert_from_bytes(pdf_bytes, fmt="png")
    except Exception as e:
        print(f"PDF convert error: {e}")
        return []

def extract_text_from_bytes(image_bytes: bytes) -> str:
    if pytesseract is None:
        return ""
    try:
        # detect PDF
        is_pdf = image_bytes[:4] == b"%PDF"
        pages: List[Image.Image] = []
        if is_pdf:
            pages = _pdf_bytes_to_images(image_bytes)
            if not pages:
                return ""
        else:
            pages = [preprocess_image(image_bytes)]

        texts = []
        custom_config = r'--oem 3 --psm 6'
        for img in pages:
            try:
                texts.append(pytesseract.image_to_string(img, config=custom_config))
            except Exception as e:
                print(f"OCR page error: {e}")
        if texts:
            return "\n".join(texts)

        # retry once with raw bytes if preprocessing failed
        if not is_pdf:
            img = Image.open(io.BytesIO(image_bytes))
            return pytesseract.image_to_string(img, config=custom_config)
        return ""
    except Exception as e:
        print(f"OCR Error: {e}")
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
    }
    
    # Filter out empty lines and very short noise
    lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 2]
    full = " ".join(lines)

    # 1. Extract IDs
    # Flexible Aadhaar Regex (Handles "2170 9645 6960" or "217096456960")
    m = re.search(r"\b(\d{4}\s?\d{4}\s?\d{4})\b", full)
    if m: parsed["aadhaarNumber"] = m.group(1).replace(" ", "")
    
    m = re.search(r"\b[A-Z]{5}\d{4}[A-Z]\b", full)
    if m: parsed["panNumber"] = m.group().upper()

    # 2. Extract DOB
    m = re.search(r"\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b", full)
    if m: 
        parsed["dob"] = m.group(1)
    else:
        m_yob = re.search(r"(?i)(year|yob)[\s:\-]*(\d{4})", full)
        if m_yob: parsed["dob"] = m_yob.group(2)

    # 3. Extract Gender
    m = re.search(r"(?i)\b(male|female|transgender)\b", full)
    if m:
        parsed["gender"] = m.group(1).capitalize()
    elif " M " in full or full.endswith(" M"): # Fallback for just "M"
        parsed["gender"] = "Male"
    elif " F " in full or full.endswith(" F"):
        parsed["gender"] = "Female"

    # 4. ROBUST NAME EXTRACTION
    # Strategy A: Explicit "Name:" label
    m_name = re.search(r"(?i)name\s*[:\-]?\s*([A-Za-z\s\.]{3,50})", full)
    if m_name:
        parsed["name"] = m_name.group(1).strip()
    
    # Strategy B: Look for the line immediately ABOVE "DOB"
    # This is specific for cards like "Y Teja" where name is just floating above DOB
    if not parsed["name"] and parsed["dob"]:
        for i, line in enumerate(lines):
            # Find the line with the DOB
            if parsed["dob"] in line or "DOB" in line.upper():
                # Look at the line strictly BEFORE it
                if i > 0:
                    candidate = lines[i-1]
                    # Clean it: Remove non-english chars (handling Kannada/Hindi noise)
                    clean_candidate = re.sub(r'[^A-Za-z\s\.]', '', candidate).strip()
                    
                    # Validation: Must not be "Government of India" or "Father"
                    bad_words = ["GOVERNMENT", "INDIA", "FATHER", "ADDRESS", "YEAR", "MALE", "FEMALE"]
                    if len(clean_candidate) >= 3 and not any(b in clean_candidate.upper() for b in bad_words):
                        parsed["name"] = clean_candidate
                        break
    
    # 5. Extract Father's Name
    m = re.search(r"(?i)father['s]*\s*name[:\-]?\s*([A-Za-z\s]{2,100})", full)
    if m: parsed["fatherName"] = m.group(1).strip()

    # 6. Extract Address (Simple heuristic: look for pin code or 'Address')
    m_addr = re.search(r"(?i)address[:\-]?\s*(.+)", full)
    if m_addr:
        addr = m_addr.group(1)
        # Remove ID numbers from address if captured by mistake
        addr = re.sub(r"\d{4}\s?\d{4}\s?\d{4}", "", addr).strip()
        parsed["address"] = addr

    # Extract Driver's License Number
    m = re.search(r"(?i)(dl|license|licence)\s*(?:no|number|#)?[\s:\-]*([A-Z]{2}[\d\-]{11,15})", full)
    if m:
        parsed["dlNumber"] = m.group(2).strip()
    else:
        # Alternative pattern: standalone 13-16 char DL format
        m = re.search(r"\b([A-Z]{2}\d{2}\s?\d{11})\b", full)
        if m:
            parsed["dlNumber"] = m.group(1).replace(" ", "")
    
    # Extract Issue Date / Valid Until
    m = re.search(r"(?i)(issue|issued|iss)[\s:\-]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})", full)
    if m:
        parsed["issueDate"] = m.group(2)
    
    m = re.search(r"(?i)(valid|validity|exp|expiry)[\s:\-]*(\d{1,2}[-/]\d{1,2}[-/]\d{4})", full)
    if m:
        parsed["validUntil"] = m.group(2)
    
    return parsed