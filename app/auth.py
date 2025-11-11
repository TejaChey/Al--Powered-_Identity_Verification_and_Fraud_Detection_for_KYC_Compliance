from datetime import datetime
from fastapi import HTTPException
from .db import users_collection
from .models import UserCreate
from .security import hash_password, verify_password, create_access_token

def signup_user(user_in: UserCreate):
    if users_collection.find_one({"email": user_in.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "name": user_in.name,
        "email": user_in.email,
        "password": hash_password(user_in.password),
        "createdAt": datetime.utcnow().isoformat(),
    }
    users_collection.insert_one(doc)
    return {"message": "signup successful"}

def authenticate_user(email: str, password: str):
    user = users_collection.find_one({"email": email})
    if not user or not verify_password(password, user["password"]):
        return None
    return create_access_token({"sub": user["email"]})
