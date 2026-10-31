import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.database import supabase

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        response = httpx.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "apikey": settings.supabase_publishable_key,
                "Authorization": f"Bearer {token}"
            },
            timeout=10
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired authentication token"
            )

        user = response.json()

        profile_response = (
            supabase.table("profiles")
            .select("role")
            .eq("id", user["id"])
            .maybe_single()
            .execute()
        )

        if not profile_response.data:
            raise HTTPException(
                status_code=403,
                detail="User profile not found"
            )

        user["role"] = profile_response.data["role"]
        return user

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Authentication verification service unavailable"
        )


def require_roles(*allowed_roles):
    def role_checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )
        return user

    return role_checker
