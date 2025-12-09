from pathlib import Path
import os
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = str(BASE_DIR / "uploads")

class Settings(BaseSettings):
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    MONGO_DB: str = os.getenv("MONGO_DB", "kyc_database")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key_here")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    AADHAAR_VERIFICATION_API: str = os.getenv("AADHAAR_VERIFICATION_API", "")
    PAN_VERIFICATION_API: str = os.getenv("PAN_VERIFICATION_API", "")

    ADMIN_SEED_KEY: str = os.getenv("ADMIN_SEED_KEY", "")

    UIDAI_REGISTRY_FILE: str = str(BASE_DIR / "data" / "uidai_registry.json")

    TESSERACT_CMD: str | None = os.getenv("TESSERACT_CMD", None)

    UPLOAD_DIR: str = str(BASE_DIR / "uploads")   # ✅ ADD THIS BACK

settings = Settings()

# --- FS prep ---
# ensure *directory* exists for registry JSON
os.makedirs(os.path.dirname(settings.UIDAI_REGISTRY_FILE), exist_ok=True)

UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# try to auto-detect tesseract on Windows if not set
if not settings.TESSERACT_CMD:
    import shutil
    found = shutil.which("tesseract")
    if found:
        settings.TESSERACT_CMD = found
    else:
        for p in (r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                  r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"):
            if os.path.exists(p):
                settings.TESSERACT_CMD = p
                break
