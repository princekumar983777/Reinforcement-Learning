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

# -------------------------------------------
# TicTacToe
# -------------------------------------------
# Collection: tictactoe
# Document shape:
# {
#     _id        : ObjectId,
#     user_id    : str,          # user ObjectId string  OR  "global"
#     state      : str,          # 9-char board  e.g. "XO_X_____"
#     q_values   : {             # only valid move indices present
#         "0": 0.0,
#         "4": 0.12,
#         ...
#     },
#     created_at : datetime,
#     updated_at : datetime,
# }


