# app/routers/__init__.py

from .auth_routes import router as auth_router
from .verification_routes import router as verification_router
from .upload_routes import router as upload_router
from .compliance_routes import router as compliance_router
from .fraud_routes import router as fraud_router
from .docs_routes import router as docs_router
from .ocr_routes import router as ocr_router

routers = [
    auth_router,
    verification_router,
    upload_router,   # <-- THIS WAS THE missing one for /upload/files
    compliance_router,
    fraud_router,
    docs_router,
    ocr_router,      # <-- Real-time OCR preview using EasyOCR
]
