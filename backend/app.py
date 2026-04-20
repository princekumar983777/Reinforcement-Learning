from fastapi import FastAPI, Request
# from contextlib import asynccontextmanager
# from db.session import connect_to_mongo, disconnect_from_mongo
# from api.auth import router as auth_router
# from api.user import router as user_router
# from api.tictactoe import router as tictactoe_router
# from middleware.auth import AuthMiddleware
from fastapi.middleware.cors import CORSMiddleware
# from core.security import verify_token

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     database = await connect_to_mongo()
#     app.state.db = database
#     # Create indexes for Tic Tac Toe collection
#     from db.tictactoe import ensure_indexes
#     await ensure_indexes(database)
#     yield
#     # Shutdown
#     await disconnect_from_mongo()

# app = FastAPI(title="Game Verse", lifespan=lifespan)
app = FastAPI(title="Game Verse")


# Add middleware - CORS must be first
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Development frontend
        "https://gameversefrontend.vercel.app",  # Production frontend
        "https://your-backend.vercel.app"  # Backend self-reference (if needed)
    ],
    allow_credentials=True,  # Allow cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
# app.add_middleware(AuthMiddleware)

# # Include routers
# app.include_router(auth_router)
# app.include_router(user_router)
# app.include_router(tictactoe_router)

@app.get("/")
async def root(request):
    return {"message": "Simple VErsion"}

# @app.get("/me")
# async def me(request: Request):
#     """Get current user information"""
#     print("User Try to visit /me endpoint")
    
#     token = request.cookies.get("access_token")
#     if not token:
#         return {"user": {"error": "No access token found"}}
    
#     try:
#         payload = verify_token(token)
#         return {"user": payload}
#     except Exception as e:
#         return {"user": {"error": "Invalid token"}}

# For Vercel serverless deployment