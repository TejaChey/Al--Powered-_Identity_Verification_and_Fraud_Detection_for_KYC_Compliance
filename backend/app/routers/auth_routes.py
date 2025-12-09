from fastapi import APIRouter, Form, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from ..models import UserCreate, Token
from ..auth import signup_user, authenticate_user
from ..security import get_current_user
from ..db import users_collection

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=Token)
def signup(
    name: str = Form(None), 
    email: str = Form(...), 
    password: str = Form(...),
    dob: str = Form(None),
    gender: str = Form(None),
    role: str = Form("user")  # Accept role: "user" or "admin"
):
	# defensive: truncate password to 72 bytes before any processing (bcrypt limit)
	raw_pw = password or ""
	pw_bytes = raw_pw.encode("utf-8")[:72]
	pw = pw_bytes.decode("utf-8", "ignore")
	# Validate role
	valid_role = "admin" if role == "admin" else "user"
	user_in = UserCreate(name=name, email=email, password=pw, dob=dob, gender=gender, role=valid_role)
	try:
		signup_user(user_in)
	except HTTPException:
		raise
	except Exception as e:
		raise HTTPException(status_code=400, detail=str(e))
	# auto-login after signup
	token = authenticate_user(email, pw)
	if not token:
		raise HTTPException(status_code=400, detail="Could not create token")
	return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
	token = authenticate_user(form_data.username, form_data.password)
	if not token:
		raise HTTPException(status_code=401, detail="Invalid credentials")
	return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user's profile info"""
    return {
        "email": current_user.get("email"),
        "name": current_user.get("name", "User"),
        "role": current_user.get("role", "user"),
        "dob": current_user.get("dob"),
        "gender": current_user.get("gender"),
    }
