import time
from datetime import datetime, date
from typing import Dict, Any, Optional, List
from .db import documents_collection, kyc_data_collection, alerts_collection, audit_logs_collection, aml_blacklist_collection
from .utils import doc_type_from_parsed

# lazy import
def _verify_document_bytes(image_bytes: bytes) -> Dict[str, Any]:
    from .verification import verify_document
    from .pdf_utils import convert_pdf_to_image
    
    # Try converting PDF to image first
    converted_bytes = convert_pdf_to_image(image_bytes)
    final_bytes = converted_bytes if converted_bytes else image_bytes
    
    return verify_document(final_bytes)

def _fraud_analyze(user: Dict[str, Any], file_bytes: bytes, parsed: Dict[str, Any], document_id: Optional[str] = None, device_fingerprint: Dict[str, Any] = None, cnn_prob: float = None, gnn_prob: float = None) -> Dict[str, Any]:
    from .fraud import analyze_for_fraud
    return analyze_for_fraud(user, file_bytes, parsed, document_id=document_id, device_fingerprint=device_fingerprint, cnn_prob=cnn_prob, gnn_prob=gnn_prob)

# --- AML CHECKS ---

def aml_check_aadhaar(aadhaar: Optional[str]) -> Dict[str, Any]:
    if not aadhaar: return {"flagged": False, "reason": None}
    entry = aml_blacklist_collection.find_one({"aadhaar": aadhaar})
    if entry:
        return {"flagged": True, "reason": f"Aadhaar in AML blacklist: {entry.get('reason', 'Generic')}"}
    return {"flagged": False, "reason": None}

def aml_check_pan(pan: Optional[str]) -> Dict[str, Any]:
    if not pan: return {"flagged": False, "reason": None}
    entry = aml_blacklist_collection.find_one({"pan": pan})
    if entry:
        return {"flagged": True, "reason": f"PAN in AML blacklist: {entry.get('reason', 'Generic')}"}
    return {"flagged": False, "reason": None}

def aml_check_dl(dl: Optional[str]) -> Dict[str, Any]:
    if not dl: return {"flagged": False, "reason": None}
    entry = aml_blacklist_collection.find_one({"dl": dl})
    if entry:
        return {"flagged": True, "reason": f"DL in AML blacklist: {entry.get('reason', 'Generic')}"}
    return {"flagged": False, "reason": None}

def aml_check_age(dob: Optional[str]) -> Dict[str, Any]:
    if not dob: return {"flagged": False, "reason": None}
    try:
        sep = "-" if "-" in dob else "/"
        clean_dob = dob.strip().split()[0] 
        d, m, y = [int(x) for x in clean_dob.split(sep)]
        born = date(y, m, d)
        today = date.today()
        age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        if age < 18:
            return {"flagged": True, "reason": f"Underage applicant ({age} years)"}
    except Exception:
        pass 
    return {"flagged": False, "reason": None}

def check_duplicate(aadhaar: Optional[str], pan: Optional[str], dl: Optional[str] = None) -> Dict[str, Any]:
    reasons: List[str] = []
    dup = False
    
    if aadhaar and documents_collection.find_one({"parsed.aadhaarNumber": aadhaar}):
        dup = True; reasons.append("Aadhaar already used")
    if pan and documents_collection.find_one({"parsed.panNumber": pan}):
        dup = True; reasons.append("PAN already used")
    if dl and documents_collection.find_one({"parsed.dlNumber": dl}):
        dup = True; reasons.append("DL already used")
        
    return {"duplicate": dup, "reasons": reasons}

def add_alert(aadhaar, pan, dl, user_email, risk, reason):
    alert = {
        "aadhaar": aadhaar, "pan": pan, "dl": dl, "user": user_email,
        "risk": risk, "alert": reason, "timestamp": datetime.utcnow().isoformat(), "seen": False
    }
    res = alerts_collection.insert_one(alert)
    alert["_id"] = str(res.inserted_id)
    return alert

# --- MAIN PIPELINE ---

def run_full_pipeline(user: Dict[str, Any], filename: str, file_bytes: bytes, device_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    start = time.time()
    
    # 0. Deep Learning Predictions (Real Integration)
    cnn_score = None
    gnn_score = None
    
    # Pre-calculate connections for GNN
    connection_count = 0
    if device_info and device_info.get("hash"):
        # Check how many OTHER users used this device
        d_hash = device_info.get("hash")
        existing_docs = documents_collection.find({"deviceInfo.hash": d_hash}, {"userId": 1})
        users_on_device = set(str(d["userId"]) for d in existing_docs)
        if str(user.get("_id")) in users_on_device:
            users_on_device.remove(str(user.get("_id")))
        connection_count = len(users_on_device)

    try:
        from .ml_integration import predict_cnn_manipulation, predict_gnn_fraud
        
        # Run CNN
        cnn_score = predict_cnn_manipulation(file_bytes)
        
        # Run GNN (Dynamic Graph Construction)
        gnn_input = {
            "connections": connection_count,
            "risk_score": 0.5 if connection_count > 0 else 0.1, # Initial heuristic
            "features": []
        }
        gnn_score = predict_gnn_fraud(gnn_input)
        
    except Exception as e:
        print(f"⚠️ ML Integration failed: {e}")

    # 1. Verification
    verification = _verify_document_bytes(file_bytes)
    parsed = verification.get("parsed", {})
    doc_type = doc_type_from_parsed(parsed)
    masked_id = verification.get("maskedAadhaar") or verification.get("maskedPan") or verification.get("maskedDl")

    # 2. Store Initial Record
    doc_record = {
        "userId": str(user.get("_id")), "userEmail": user.get("email"),
        "filename": filename, "rawText": verification.get("rawText"),
        "parsed": parsed, "verification": verification,
        "docType": doc_type, "maskedId": masked_id, "createdAt": datetime.utcnow().isoformat(),
        "deviceInfo": device_info
    }
    doc_id = documents_collection.insert_one(doc_record).inserted_id
    doc_record["_id"] = str(doc_id)

    # 3. Fraud Analysis
    fraud = _fraud_analyze(
        user, file_bytes, parsed, 
        document_id=str(doc_id), 
        device_fingerprint=device_info,
        cnn_prob=cnn_score,
        gnn_prob=gnn_score
    )
    fraud["modelVersion"] = "heuristic-v2.0 + CNN/GNN"
    documents_collection.update_one({"_id": doc_id}, {"$set": {"fraud": fraud, "fileHash": fraud.get("details", {}).get("fileHash")}})

    # 4. AML Checks
    aadhaar = parsed.get("aadhaarNumber")
    pan = parsed.get("panNumber")
    dl = parsed.get("dlNumber")
    
    aml_results = []
    
    # Run individual checks
    checks = [
        aml_check_aadhaar(aadhaar),
        aml_check_pan(pan),
        aml_check_dl(dl),
        aml_check_age(parsed.get("dob"))
    ]
    for c in checks:
        if c["flagged"]: aml_results.append(c["reason"])

    # 5. Duplicate Check
    dup_res = check_duplicate(aadhaar, pan, dl)
    if dup_res["duplicate"]: aml_results.extend(dup_res["reasons"])

    # 6. Final Decision
    score = fraud.get("score", 0)
    decision = "Pass"
    alerts = []
    
    if aml_results or score >= 71:
        decision = "Flagged"
        reason = "; ".join(aml_results) if aml_results else f"High fraud score {score}"
        alert = add_alert(aadhaar, pan, dl, user.get("email"), "High" if score >= 71 else "Medium", reason)
        alerts.append(alert)
    elif score >= 31:
        decision = "Review"

    # 7. Snapshot & Log
    kyc_snapshot = {
        "userId": str(user.get("_id")), "docId": str(doc_id), "docType": doc_type,
        "verification": verification, "fraud": fraud, "aml_results": aml_results,
        "decision": decision, "alerts": [a.get("_id") for a in alerts], "userEmail": user.get("email"),
        "createdAt": datetime.utcnow().isoformat(), "processingTimeMs": int((time.time() - start) * 1000)
    }
    kyc_data_collection.insert_one(kyc_snapshot)

    audit_logs_collection.insert_one({
        "userId": str(user.get("_id")), "docId": str(doc_id),
        "aadhaar": aadhaar, "pan": pan, "dl": dl,
        "decision": decision, "createdAt": datetime.utcnow().isoformat(),
        "deviceInfo": device_info
    })

    return {
        "docId": str(doc_id), "verification": verification,
        "fraud": fraud, "aml_results": aml_results, "decision": decision, "alerts": alerts
    }