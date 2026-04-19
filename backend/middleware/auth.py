from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
from services.auth_service import AuthService
from core.security import get_current_user_data
import json

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for auth endpoints and static files
        skip_paths = ["/auth", "/docs", "/redoc", "/openapi.json", "/favicon.ico"]
        
        # Check if path should be skipped
        for skip_path in skip_paths:
            if request.url.path.startswith(skip_path):
                print(f"Skipping authentication for {skip_path}")
                response = await call_next(request)
                return response
        print(f"Checking authentication for {request.url.path}")
        # Check for access token in Authorization header and cookies
        # authorization = request.headers.get("Authorization")
        user_data = None
        
        # Try to get token from cookies first
        token = request.cookies.get("access_token")
        print("Token from cookies:", token)
        # if not token:
        #     authorization = request.headers.get("Authorization")
        #     if authorization and authorization.startswith("Bearer "):
        #         token = authorization.split(" ")[1]
        
        if token:
            try:
                # Verify token and get user data
                token_data = get_current_user_data(token)
                # Use token data directly (same as /auth/me endpoint)
                user_data = {
                    "email": token_data.get("email"),
                    "username": token_data.get("username"),
                    "sub": token_data.get("sub")  # Add sub for user ID
                }
            except Exception as e:
                print("Token verification error:", e)
                user_data = {"error": "Invalid token"}
        else:
            user_data = {"error": "User not logged in"}
        
        # Add user data to request state for routes to access
        request.state.user = user_data
        
        # If user is not logged in and this is a simple route request, return user data
        if "error" in user_data and request.method == "GET":
            return JSONResponse(
                status_code=200,
                content={"user": user_data}
            )
        print("User data Passed Forward:", user_data)
        response = await call_next(request)
        return response
