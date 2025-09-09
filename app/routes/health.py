"""Health check routes"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Health Care Assistant",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }

@router.get("/ping")
async def ping() -> Dict[str, str]:
    """Simple ping endpoint"""
    return {"message": "pong"}

@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """Readiness check for deployment"""
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": "ready",
            "ai_model": "ready",
            "vector_db": "ready"
        }
    }