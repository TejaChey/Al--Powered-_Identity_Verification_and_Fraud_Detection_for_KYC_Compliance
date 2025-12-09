from app.config import settings
from pymongo import MongoClient
c = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
try:
    print("Mongo server OK:", c.server_info().get("version"))
except Exception as e:
    print("Mongo connect error:", repr(e))