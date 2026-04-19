from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
print("MONGODB_URL:", MONGODB_URL)
DATABASE_NAME = os.getenv("DATABASE_NAME", "game_verse")

# Async MongoDB client for FastAPI
async_client = None
database = None

# Sync MongoDB client for other operations
sync_client = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global async_client, database
    try:
        async_client = AsyncIOMotorClient(MONGODB_URL)
        database = async_client[DATABASE_NAME]
        
        # Test connection
        await database.command('ping')
        print("Connected to MongoDB!")
        return database
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

async def disconnect_from_mongo():
    """Disconnect from MongoDB"""
    global async_client
    if async_client:
        async_client.close()
        print("Disconnected from MongoDB")

def get_sync_db():
    """Get synchronous MongoDB connection"""
    global sync_client
    if sync_client is None:
        sync_client = MongoClient(MONGODB_URL)
    return sync_client[DATABASE_NAME]

async def get_database():
    """Get database instance"""
    return database

# Collection names
USERS_COLLECTION = "users"