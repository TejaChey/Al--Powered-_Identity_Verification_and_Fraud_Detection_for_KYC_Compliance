from fastapi import APIRouter, Form, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from ..models import UserCreate, Token
from ..auth import signup_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=Token)
def signup(name: str = Form(None), email: str = Form(...), password: str = Form(...)):
    user_in = UserCreate(name=name, email=email, password=password)
    try:
        signup_user(user_in)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    token = authenticate_user(email, password)
    if not token:
        raise HTTPException(status_code=400, detail="Could not create token")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    token = authenticate_user(form_data.username, form_data.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": token, "token_type": "bearer"}
