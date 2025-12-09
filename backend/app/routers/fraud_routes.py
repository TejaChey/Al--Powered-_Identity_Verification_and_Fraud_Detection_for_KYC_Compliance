from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from bson import ObjectId
from ..security import get_current_user
from ..db import documents_collection
from ..verification import verify_document
from ..fraud import analyze_for_fraud

router = APIRouter(prefix="/fraud", tags=["fraud"])

@router.get("/fraud-score")
def fraud_score(doc_id: str = Query(...), current_user = Depends(get_current_user)):
    doc = documents_collection.find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if str(doc["userId"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not allowed")
    fraud = doc.get("fraud")
    if not fraud:
        raise HTTPException(status_code=404, detail="Fraud analysis not found for this document")
    return {"docId": doc_id, "fraud": fraud}

@router.post("/fraud-score", summary="Upload and return fraud score (without saving doc)")
async def fraud_score_upload(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    content = await file.read()
    verification = verify_document(content)
    parsed = verification.get("parsed", {})
    fraud = analyze_for_fraud(current_user, content, parsed)
    return {"verification": verification, "fraud": fraud}
