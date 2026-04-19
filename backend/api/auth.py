from fastapi import APIRouter, HTTPException, responses, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from db.model import UserSignup, UserLogin
from services.auth_service import AuthService
from core.security import get_current_user_data
from db.session import get_database, USERS_COLLECTION

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

print("Auth router registered with /me endpoint")

@router.get("/test")
async def test_auth():
    """Test endpoint to verify auth router works"""
    print("=== /auth/test endpoint called ===")
    return {"message": "Auth router is working"}

@router.post("/signup", response_model=Dict[str, Any])
async def signup(user_data: UserSignup) -> Dict[str, Any]:
    """Register a new user"""
    try:
        result = await AuthService.create_user(user_data)
        # set access token to cookies
        response = responses.JSONResponse(content=result)
        response.set_cookie(
            key="access_token",
            value=result.get("user", {}).get("access_token", ""),
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600*24*30  # 30 days
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/login", response_model=Dict[str, Any])
async def login(login_data: UserLogin) -> Dict[str, Any]:
    """Authenticate user and return access token
      Response : 
      {
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "access_token": access_token
            }
        }
    
    """
    print("=== Login endpoint called ===")
    try:
        result = await AuthService.authenticate_user(login_data)
        # set accesstoken to cookies
        response = responses.JSONResponse(content=result)
        response.set_cookie(
            key="access_token",
            value=result.get("user", {}).get("access_token", ""),
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=3600*24  # 1 day
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(request: Request) -> Dict[str, Any]:
    """Get current user information"""
    print("=== /auth/me endpoint called ===")
    print("Request cookies:", request.cookies)
    
    try:
        token = request.cookies.get("access_token")
        print("Token from cookies:", token)
        
        if not token:
            print("No token found in cookies")
            # Try Authorization header as fallback
            auth_header = request.headers.get("Authorization")
            print("Authorization header:", auth_header)
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                print("Token from header:", token)
        
        if not token:
            print("No token found anywhere")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No access token provided"
            )
        
        user_data = get_current_user_data(token)
        
        print("User data from token:", user_data)
        user = await AuthService.get_user_by_email(user_data["email"])
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return {
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "games": user.get("games", {})
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/logout", response_model=Dict[str, Any])
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Logout user (invalidate token)"""
    try:
        token = credentials.credentials
        user_data = get_current_user_data(token)
        
        # Remove token from user document
        database = await get_database()
        if database is not None:
            await database[USERS_COLLECTION].update_one(
                {"email": user_data["email"]},
                {"$unset": {"access_token": ""}, "$set": {"updated_at": "2026-04-16T01:47:00.000Z"}}
            )
        
        return {"message": "Logout successful"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Refresh access token"""
    try:
        token = credentials.credentials
        user_data = get_current_user_data(token)
        
        # Get user and create new token
        login_data = UserLogin(email=user_data["email"], password="")  # Password not needed for refresh
        user = await AuthService.get_user_by_email(user_data["email"])
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Generate new access token
        from core.security import create_access_token
        access_token = create_access_token(
            data={"sub": user["email"], "username": user["username"]}
        )
        
        # Update user with new token
        database = await get_database()
        if database is not None:
            await database[USERS_COLLECTION].update_one(
                {"email": user["email"]},
                {"$set": {"access_token": access_token, "updated_at": "2026-04-16T01:47:00.000Z"}}
            )
        
        return {
            "message": "Token refreshed successfully",
            "access_token": access_token
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
