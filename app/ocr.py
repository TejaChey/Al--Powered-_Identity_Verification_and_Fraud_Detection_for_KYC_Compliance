import io, re
import numpy as np
from typing import Dict
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

def extract_text_from_bytes(image_bytes: bytes) -> str:
    if pytesseract is None:
        return ""
    try:
        # Use the new pre-processing function
        img = preprocess_image(image_bytes)
        
        # Config: psm 6 assumes a single uniform block of text
        custom_config = r'--oem 3 --psm 6'
        return pytesseract.image_to_string(img, config=custom_config)
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

    return parsed