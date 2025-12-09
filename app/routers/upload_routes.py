# app/upload_routes.py
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException, status, Form
from typing import List, Dict, Any, Optional
from app.security import get_current_user

from app.upload import process_upload
from app.db import documents_collection
import traceback

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/file")
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    """
    Upload a single file and run the full pipeline (verification + fraud + DB).
    Returns the single file result (same shape as process_upload()).
    """
    try:
        content = await file.read()
        # process_upload is expected to accept: user, filename, bytes -> dict/result
        record = process_upload(current_user, file.filename, content)
        return {"message": "File uploaded successfully", "data": record}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/files")
async def upload_files(
    files: List[UploadFile] = File(...), 
    device_fingerprint: Optional[str] = Form(None),
    current_user=Depends(get_current_user)
):
    """
    Upload multiple files in one request.
    Each file is processed with the existing process_upload pipeline.
    Accepts optional device_fingerprint JSON string for fraud analytics.
    Returns a list of per-file results with success/error details.
    """
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files provided")

    # Parse device fingerprint if provided
    device_info = None
    if device_fingerprint:
        try:
            import json
            device_info = json.loads(device_fingerprint)
        except Exception:
            device_info = {"raw": device_fingerprint}

    results = []
    for f in files:
        try:
            content = await f.read()
            res = process_upload(current_user, f.filename, content, device_info=device_info)
            results.append({"filename": f.filename, "success": True, "result": res})
        except Exception as e:
            traceback.print_exc()
            results.append({"filename": f.filename, "success": False, "error": str(e)})

    return {"message": f"Processed {len(files)} files", "files": results}


@router.get("/my-docs", response_model=List[Dict[str, Any]])
def list_my_docs(current_user=Depends(get_current_user)):
    """
    Return documents uploaded by the current user.
    """
    docs = list(documents_collection.find({"userId": str(current_user["_id"])}))
    # convert _id to string for JSON compatibility
    for d in docs:
        d["_id"] = str(d["_id"])
    return docs
