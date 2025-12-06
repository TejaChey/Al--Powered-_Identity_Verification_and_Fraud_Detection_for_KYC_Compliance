import os, uuid, hashlib, re
from pathlib import Path
from .config import settings

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def save_upload_file(upload_file, subdir: str = "") -> str:
    ext = os.path.splitext(upload_file.filename)[1]
    fname = f"{uuid.uuid4().hex}{ext}"
    dst_dir = Path(settings.UPLOAD_DIR) / subdir
    dst_dir.mkdir(parents=True, exist_ok=True)
    fpath = dst_dir / fname
    with fpath.open("wb") as f:
        f.write(upload_file.file.read())
    return str(fpath)

def mask_aadhaar(value: str | None) -> str | None:
    if not value: return None
    digits = re.sub(r"\D", "", str(value))
    return f"XXXX-XXXX-{digits[-4:]}" if len(digits) >= 4 else "****"

def mask_pan(value: str | None) -> str | None:
    if not value: return None
    pan = re.sub(r"\s+", "", str(value)).upper()
    return f"{'*' * (len(pan) - 4)}{pan[-4:]}" if len(pan) >= 4 else "****"

def mask_dl(value: str | None) -> str | None:
    if not value: return None
    dl = str(value).upper().replace(" ", "")
    
    # Handle Kerala Slash Format: 1/1626/2006 -> 1/***/2006
    if "/" in dl:
        parts = dl.split("/")
        if len(parts) >= 2:
            return f"{parts[0]}/***/{parts[-1]}"
    
    # Handle Standard Format: MH123456... -> *****3456
    if len(dl) > 4:
        return f"{'*' * (len(dl) - 4)}{dl[-4:]}"
    return "****"

def doc_type_from_parsed(parsed: dict) -> str:
    if not parsed: return "UNKNOWN"
    if parsed.get("dlNumber"): return "DL"
    if parsed.get("aadhaarNumber"): return "AADHAAR"
    if parsed.get("panNumber"): return "PAN"
    return "UNKNOWN"