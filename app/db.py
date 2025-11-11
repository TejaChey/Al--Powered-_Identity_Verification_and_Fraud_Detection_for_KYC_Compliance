from pymongo import MongoClient
from .config import settings

_client = MongoClient(settings.MONGO_URI)
_db = _client[settings.MONGO_DB]

users_collection = _db["users"]
documents_collection = _db["uploaded_documents"]
kyc_data_collection = _db["kyc_data"]
