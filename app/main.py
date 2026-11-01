
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth import get_current_user
from app.routers.auth import router as auth_router
from app.routers.reports import router as reports_router

app = FastAPI(
    title="SATYAMAP AI Backend",
    description="Crowdsourced Disaster Verification and GIS De-duplication",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "apikey"],
)

app.include_router(auth_router)
app.include_router(reports_router)


@app.get("/")
def home():
    return {
        "message": "SATYAMAP AI Backend is running",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/auth/me")
def my_profile(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user.get("email"),
        "role": user["role"],
    }
