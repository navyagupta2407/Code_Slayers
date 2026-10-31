from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from supabase import create_client

from app.config import settings

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

def get_auth_client():
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key
    )

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(data: RegisterRequest):
    try:
        result = get_auth_client().auth.sign_up({
            "email": str(data.email),
            "password": data.password
        })

        return {
            "message": "Registration processed. Check your email.",
            "user_id": result.user.id if result.user else None,
            "session_created": result.session is not None
        }

    except Exception as exc:
        print("REGISTRATION ERROR:", type(exc).__name__, str(exc))
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {type(exc).__name__}: {str(exc)}"
        )

@router.post("/login")
def login(data: LoginRequest):
    try:
        result = get_auth_client().auth.sign_in_with_password({
            "email": str(data.email),
            "password": data.password
        })

        if not result.session:
            raise HTTPException(401, "Email confirmation may be required")

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "token_type": "bearer",
            "user_id": result.user.id
        }

    except HTTPException:
        raise
    except Exception as exc:
        print("LOGIN ERROR:", type(exc).__name__, str(exc))
        raise HTTPException(401, "Login failed. Check credentials and Supabase settings.")
