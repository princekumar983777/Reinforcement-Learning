from fastapi import APIRouter, Request
from typing import Dict, Any

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/")
async def get_user_status(request: Request) -> Dict[str, Any]:
    """Get current user status - returns user data if logged in, or not logged in message"""
    user_data = getattr(request.state, 'user', {"error": "User not logged in"})
    return {"user": user_data}

@router.get("/profile")
async def get_user_profile(request: Request) -> Dict[str, Any]:
    """Get user profile if logged in"""
    user_data = getattr(request.state, 'user', {"error": "User not logged in"})
    return {"user": user_data}
