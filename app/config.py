import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "kyc_db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

TESSERACT_CMD = os.getenv("TESSERACT_CMD", None)


UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)


import shutil

if not TESSERACT_CMD:

    found = shutil.which("tesseract")
    if found:
        TESSERACT_CMD = found
    else:

        win_paths = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"
        ]
        for p in win_paths:
            if os.path.exists(p):
                TESSERACT_CMD = p
                break

