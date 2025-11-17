from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Body
from typing import Optional, Dict, Any
from bson import ObjectId  # <--- Added this import
from ..compliance import run_full_pipeline, check_duplicate, aml_check_aadhaar
from ..db import alerts_collection, audit_logs_collection, documents_collection, aml_blacklist_collection

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.post("/verify_identity")
async def verify_identity(file: UploadFile = File(...), user_email: Optional[str] = None):
    """
    Run full KYC pipeline synchronously and return result.
    """
    try:
        content = await file.read()
        user = {"_id": user_email or "anonymous", "email": user_email}
        result = run_full_pipeline(user, file.filename, content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process_kyc")
async def process_kyc(background: BackgroundTasks, file: UploadFile = File(...), user_email: Optional[str] = None):
    """
    Start background KYC processing; returns immediately.
    """
    try:
        content = await file.read()
        user = {"_id": user_email or "anonymous", "email": user_email}
        background.add_task(run_full_pipeline, user, file.filename, content)
        return {"status": "processing"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fraud-score/{aadhaar}")
def fraud_score_for_aadhaar(aadhaar: str):
    try:
        # 1) Try audit logs first
        docs = list(audit_logs_collection.find({"aadhaar": aadhaar}))
        scores = [d.get("fraud_score", 0) for d in docs if d.get("fraud_score") is not None]
        if scores:
            avg = sum(scores) / len(scores)
            label = "Low" if avg <= 30 else "Medium" if avg <= 70 else "High"
            return {"risk_score": int(avg), "risk_label": label, "source": "audit_logs"}

        # 2) No historical scores -> return neutral
        return {"risk_score": 0, "risk_label": "Low", "source": "default"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/aml/check/{aadhaar}")
def aml_check(aadhaar: str):
    try:
        res = aml_check_aadhaar(aadhaar)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- UPDATED: Only fetch alerts that are NOT dismissed ---
@router.get("/alerts")
def get_alerts():
    try:
        # Filter: Only get items where 'seen' is NOT True
        items = list(alerts_collection.find({"seen": {"$ne": True}}).sort("timestamp", -1))
        for i in items:
            i["_id"] = str(i["_id"])
        return items
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: Endpoint to Dismiss an Alert ---
@router.post("/alerts/dismiss/{alert_id}")
def dismiss_alert_endpoint(alert_id: str):
    try:
        # Update the database to mark it as seen
        alerts_collection.update_one(
            {"_id": ObjectId(alert_id)}, 
            {"$set": {"seen": True}}
        )
        return {"status": "dismissed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/logs/add")
def add_log(payload: Dict[str, Any] = Body(...)):
    try:
        res = audit_logs_collection.insert_one(payload)
        return {"ok": True, "id": str(res.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
def get_logs():
    try:
        docs = list(audit_logs_collection.find().sort("createdAt", -1))
        for d in docs:
            d["_id"] = str(d["_id"])
        return docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-duplicate")
def check_duplicate_endpoint(payload: Dict[str, Any] = Body(...)):
    try:
        aadhaar = payload.get("aadhaar")
        pan = payload.get("pan")
        res = check_duplicate(aadhaar, pan)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))