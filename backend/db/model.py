from pydantic import BaseModel, EmailStr
from typing import Optional, Dict

# Base user schema
class UserBase(BaseModel):
    username: str
    email: EmailStr
    password: str              # hashed password
    
    access_token: Optional[str] = None
    games: Optional[Dict[str, str]] = {}  
    # Dict of {game_name: mongo_object_id}

# Signup schema
class UserSignup(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

# Login schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str