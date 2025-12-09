# app/routers/ocr_routes.py
# Real-time OCR preview API using EasyOCR
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import traceback

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/preview")
async def ocr_preview(file: UploadFile = File(...)):
    """
    Real-time OCR preview endpoint.
    Returns extracted text and parsed fields using EasyOCR.
    No authentication required for quick preview.
    """
    try:
        from ..ocr import extract_text_from_bytes, parse_text
        from ..utils import mask_aadhaar, mask_pan, mask_dl
        
        # Read file content
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Extract text using EasyOCR
        raw_text = extract_text_from_bytes(content)
        
        # Parse the text
        parsed = parse_text(raw_text)
        
        # Mask sensitive data
        masked_aadhaar = mask_aadhaar(parsed.get("aadhaarNumber"))
        masked_pan = mask_pan(parsed.get("panNumber"))
        masked_dl = mask_dl(parsed.get("dlNumber"))
        
        return {
            "success": True,
            "rawText": raw_text,
            "parsed": parsed,
            "name": parsed.get("name"),
            "aadhaarNumber": parsed.get("aadhaarNumber"),
            "panNumber": parsed.get("panNumber"),
            "dlNumber": parsed.get("dlNumber"),
            "dob": parsed.get("dob"),
            "gender": parsed.get("gender"),
            "documentType": parsed.get("documentType"),
            "maskedAadhaar": masked_aadhaar,
            "maskedPan": masked_pan,
            "maskedDl": masked_dl,
            "source": "easyocr-server",
        }
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )
