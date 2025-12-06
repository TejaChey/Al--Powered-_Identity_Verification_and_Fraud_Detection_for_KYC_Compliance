import time, io
from datetime import datetime
from .utils import save_upload_file, doc_type_from_parsed
from .db import documents_collection
from .verification import verify_document
from .compliance import run_full_pipeline

def process_upload(user: dict, filename: str, file_bytes: bytes):
    # Delegate everything to the full pipeline in compliance.py for consistency
    return run_full_pipeline(user, filename, file_bytes)