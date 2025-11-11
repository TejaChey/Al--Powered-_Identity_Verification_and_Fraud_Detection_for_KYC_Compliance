import os, uuid, hashlib
from pathlib import Path
from typing import Tuple
from .config import settings

Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

def save_upload_file(upload_file, subdir: str = "") -> str:
    ext = os.path.splitext(upload_file.filename)[1]
    fname = f"{uuid.uuid4().hex}{ext}"
    dst_dir = Path(settings.UPLOAD_DIR) / subdir
    dst_dir.mkdir(parents=True, exist_ok=True)
    fpath = dst_dir / fname
    try:
        upload_file.file.seek(0)
    except Exception:
        pass
    with fpath.open("wb") as f:
        f.write(upload_file.file.read())
    return str(fpath)

def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
