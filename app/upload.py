import time, io
from datetime import datetime
from .utils import save_upload_file
from .ocr import extract_text_from_bytes, parse_text
from .db import documents_collection, kyc_data_collection
from .verification import verify_document
from .fraud import analyze_for_fraud

def process_upload(user: dict, filename: str, file_bytes: bytes):
    start = time.time()
    # persist file
    saved_path = save_upload_file(type("Upload", (), {"filename": filename, "file": io.BytesIO(file_bytes)}))

    verification_result = verify_document(file_bytes)
    parsed = verification_result.get("parsed", {})

    record = {
        "userId": str(user["_id"]),
        "filename": filename,
        "savedPath": saved_path,
        "docType": "Aadhaar" if parsed.get("aadhaarNumber") else ("PAN" if parsed.get("panNumber") else "UNKNOWN"),
        "rawText": verification_result.get("rawText"),
        "parsed": parsed,
        "uploadedAt": datetime.utcnow().isoformat(),
        "processingTimeMs": int((time.time() - start) * 1000),
        "verification": verification_result,
        "fraud": None,
    }

    inserted = documents_collection.insert_one(record)
    record["_id"] = str(inserted.inserted_id)

    fraud_result = analyze_for_fraud(user, file_bytes, parsed, document_id=record["_id"])
    record["fraud"] = fraud_result
    documents_collection.update_one({"_id": inserted.inserted_id}, {"$set": {
        "fraud": fraud_result,
        "fileHash": fraud_result["details"]["fileHash"]
    }})

    kyc_data_collection.insert_one({
        "userId": str(user["_id"]),
        "docId": record["_id"],
        "docType": record["docType"],
        "parsedData": parsed,
        "verification": verification_result,
        "fraud": fraud_result,
        "createdAt": datetime.utcnow().isoformat(),
    })
    return record
