from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from passlib.context import CryptContext
from fastapi.openapi.utils import get_openapi
import jwt
import pytesseract
from PIL import Image
import io
import re
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

# -------------------- LOAD CONFIG --------------------
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

# -------------------- FASTAPI INIT --------------------
app = FastAPI(title="KYC Verification API")

# CORS: allow your frontend origins (adjust if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Custom Swagger (fix for KeyError)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="KYC Verification API",
        version="1.0.0",
        description="Backend for AI-Powered Identity Verification and Fraud Detection",
        routes=app.routes,
    )

    if "components" not in openapi_schema:
        openapi_schema["components"] = {}

    if "securitySchemes" not in openapi_schema["components"]:
        openapi_schema["components"]["securitySchemes"] = {}

    openapi_schema["components"]["securitySchemes"]["bearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }

    openapi_schema["security"] = [{"bearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# -------------------- DATABASE --------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["kyc_database"]
users_collection = db["users"]
documents_collection = db["uploaded_documents"]
kyc_data_collection = db["kyc_data"]

# -------------------- SECURITY --------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def hash_password(password: str):
    if len(password) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password[:72], hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user = users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# -------------------- VALIDATORS --------------------
def is_valid_email(email: str) -> bool:
    return re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email) is not None

def is_valid_password(password: str) -> bool:
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!#%*?&]{8,16}$"
    return re.match(pattern, password) is not None

# -------------------- AUTH ROUTES --------------------
@app.post("/signup", tags=["Authentication"])
def signup(name: str = Form(...), email: str = Form(...), password: str = Form(...)):
    if not is_valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    if not is_valid_password(password):
        raise HTTPException(
            status_code=400,
            detail="Password must be 8–16 chars, include uppercase, lowercase, number, and special char.",
        )
    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    users_collection.insert_one({
        "name": name,
        "email": email,
        "password": hash_password(password),
        "createdAt": datetime.utcnow()
    })
    return {"message": "Signup successful"}

@app.post("/login", tags=["Authentication"])
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = users_collection.find_one({"email": form_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email")
    if not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user["email"]})
    return {"access_token": token, "token_type": "bearer"}

# -------------------- OCR PARSER --------------------
def parse_text(text: str):
    parsed = {
        "panNumber": None,
        "aadhaarNumber": None,
        "name": None,
        "fatherName": None,
        "dob": None,
        "gender": None,
        "address": None,
    }

    # Clean text
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    full_text = " ".join(lines)

    # --- Aadhaar detection ---
    aadhaar_match = re.search(r"\b\d{4}\s?\d{4}\s?\d{4}\b", full_text)
    if aadhaar_match:
        parsed["aadhaarNumber"] = aadhaar_match.group().replace(" ", "")

    # --- PAN detection ---
    pan_match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", full_text)
    if pan_match:
        parsed["panNumber"] = pan_match.group()

    # --- DOB detection ---
    dob_match = re.search(r"\b(\d{2,4}[-/]\d{2}[-/]\d{2,4})\b", full_text)
    if dob_match:
        parsed["dob"] = dob_match.group(1)

    # --- Gender detection ---
    gender_match = re.search(r"(?i)\b(male|female|transgender|m|f)\b", full_text)
    if gender_match:
        g = gender_match.group(1).lower()
        parsed["gender"] = "Male" if g in ["m", "male"] else "Female" if g in ["f", "female"] else "Transgender"

    # --- Name detection (for both PAN & Aadhaar) ---
    name_match = re.search(r"(?i)\bname[:\-]?\s*([A-Za-z\s]+)", full_text)
    if name_match:
        name = name_match.group(1).strip()
        # Clean out noise (like DOB, Gender, Address words)
        name = re.split(r"\b(dob|date|gender|address|s/d|w/o|father)\b", name, flags=re.I)[0].strip()
        parsed["name"] = name

    # --- Father's name (specific for PAN) ---
    father_match = re.search(r"(?i)Father'?s Name[:\-]?\s*([A-Za-z\s]+?)(?=\s*(photo|signature|$))", full_text)
    if father_match:
        parsed["fatherName"] = father_match.group(1).strip()

    # --- Address detection (specific for Aadhaar) ---
    addr_match = re.search(r"(?i)address[:\-]?\s*(.+)", full_text)
    if addr_match:
        addr = addr_match.group(1).strip()
        # Stop if Aadhaar number or DOB appears afterward
        addr = re.split(r"\b(\d{4}\s?\d{4}\s?\d{4}|dob|date|gender)\b", addr, flags=re.I)[0].strip()
        parsed["address"] = addr
    else:
        # Fallback: try to detect line after "Address" keyword
        for i, line in enumerate(lines):
            if "address" in line.lower() and i + 1 < len(lines):
                parsed["address"] = lines[i + 1]
                break

    return parsed


# -------------------- UPLOAD DOC --------------------
@app.post("/upload/", tags=["KYC Operations"])
async def upload_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    try:
        start_time = time.time()
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))

        text = pytesseract.image_to_string(image)
        parsed = parse_text(text)

        if parsed["aadhaarNumber"]:
            doc_type = "Aadhaar"
        elif parsed["panNumber"]:
            doc_type = "PAN"
        else:
            doc_type = "UNKNOWN"

        record = {
            "userId": str(user["_id"]),
            "filename": file.filename,
            "docType": doc_type,
            "rawText": text,
            "parsed": parsed,
            "processingTimeMs": int((time.time() - start_time) * 1000),
            "uploadedAt": datetime.utcnow().isoformat(),
        }

        record_id = documents_collection.insert_one(record).inserted_id
        record["_id"] = str(record_id)

        kyc_data_collection.insert_one({
            "userId": str(user["_id"]),
            "docType": doc_type,
            "parsedData": parsed,
            "createdAt": datetime.utcnow().isoformat(),
        })

        # return consistent shape expected by frontend: { message, data }
        return JSONResponse(content={"message": "File uploaded successfully", "data": record})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------- FETCH DOCS --------------------
@app.get("/api/get-user-docs", tags=["KYC Operations"])
async def get_user_docs(current_user: dict = Depends(get_current_user)):
    docs = list(documents_collection.find({"userId": str(current_user["_id"])}))
    if not docs:
        raise HTTPException(status_code=404, detail="No documents found for this user")

    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return {"user": current_user["email"], "documents": docs}

# -------------------- ROOT --------------------
@app.get("/", tags=["Root"])
def home():
    return {"message": "✅ KYC OCR API (Signup + Login + Upload + OCR) running successfully!"}