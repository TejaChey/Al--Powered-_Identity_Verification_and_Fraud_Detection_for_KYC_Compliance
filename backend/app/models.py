from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

class UserCreate(BaseModel):
    name: str | None = None
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    dob: Optional[str] = None  # Date of Birth in DD/MM/YYYY or ISO format
    gender: Optional[str] = None  # Male, Female, Other
    role: Literal["user", "admin"] = "user"  # User role

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

