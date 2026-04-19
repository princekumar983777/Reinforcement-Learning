from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from db.session import get_database, USERS_COLLECTION
from db.model import UserSignup, UserLogin, UserBase
from core.security import get_password_hash, verify_password, create_access_token
from datetime import timedelta

class AuthService:
    
    @staticmethod
    async def create_user(user_data: UserSignup) -> Dict[str, Any]:
        """Create a new user in the database"""
        print("User Trying to login :", user_data)
        database = await get_database()
        if database is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        print("Database connected and object is stored as database -----")
        # Check if user already exists
        existing_user = await database[USERS_COLLECTION].find_one({
            "$or": [{"email": user_data.email}, {"username": user_data.username}]
        })
        print("Existing user:", existing_user)
        if existing_user:
            if existing_user["email"] == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Validate password confirmation
        if user_data.password != user_data.confirm_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Passwords do not match"
            )
        
        # Hash password
        print("Password to hash:", user_data.password)
        hashed_password = get_password_hash(user_data.password)
        print("Hashed password:", hashed_password)
        # Create user document
        user_doc = {
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
            "games": {},
            "created_at": "2026-04-16T01:47:00.000Z",
            "updated_at": "2026-04-16T01:47:00.000Z"
        }
        
        # Insert user into database
        result = await database[USERS_COLLECTION].insert_one(user_doc)
        print("User inserted successfully ----------")
        
        if not result.inserted_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Generate access token
        access_token = create_access_token(
            data={"sub": user_data.email, "username": user_data.username}
        )
        
        # Update user with token
        await database[USERS_COLLECTION].update_one(
            {"_id": result.inserted_id},
            {"$set": {"access_token": access_token, "updated_at": "2026-04-16T01:47:00.000Z"}}
        )
        
        return {
            "message": "User created successfully",
            "user": {
                "id": str(result.inserted_id),
                "username": user_data.username,
                "email": user_data.email,
                "access_token": access_token
            }
        }
    
    @staticmethod
    async def authenticate_user(login_data: UserLogin) -> Dict[str, Any]:
        """Authenticate user and return access token"""
        database = await get_database()
        if database is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        # Find user by email
        user = await database[USERS_COLLECTION].find_one({"email": login_data.email})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Generate new access token
        access_token = create_access_token(
            data={"sub": user["email"], "username": user["username"]}
        )
        
        # Update user with new token
        await database[USERS_COLLECTION].update_one(
            {"_id": user["_id"]},
            {"$set": {"access_token": access_token, "updated_at": "2026-04-16T01:47:00.000Z"}}
        )
        
        return {
            "message": "Login successful",
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "email": user["email"],
                "access_token": access_token
            }
        }
    
    @staticmethod
    async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        database = await get_database()
        if database is None:
            return None
        
        user = await database[USERS_COLLECTION].find_one({"email": email})
        if user:
            user["id"] = str(user.pop("_id"))
        return user
    
    @staticmethod
    async def get_user_by_token(access_token: str) -> Optional[Dict[str, Any]]:
        """Get user by access token"""
        database = await get_database()
        if database is None:
            return None
        
        user = await database[USERS_COLLECTION].find_one({"access_token": access_token})
        if user:
            user["id"] = str(user.pop("_id"))
            # Remove sensitive data
            user.pop("password", None)
        return user
