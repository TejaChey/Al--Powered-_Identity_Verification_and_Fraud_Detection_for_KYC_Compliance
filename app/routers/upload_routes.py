from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from typing import List
from ..security import get_current_user
from ..upload import process_upload
from ..db import documents_collection

router = APIRouter(prefix="/docs", tags=["upload"])

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user = Depends(get_current_user)):
	try:
		content = await file.read()
		record = process_upload(current_user, file.filename, content)
		return {"message": "File uploaded successfully", "data": record}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))

@router.get("/my-docs", response_model=List[dict])
def list_my_docs(current_user = Depends(get_current_user)):
	docs = list(documents_collection.find({"userId": str(current_user["_id"])}))
	for d in docs:
		d["_id"] = str(d["_id"])
	return docs
