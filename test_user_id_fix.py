#!/usr/bin/env python3
"""
Test script to verify the user_id resolution fix
"""

# Mock the dependencies to test the logic
class MockRequest:
    def __init__(self, user_data=None):
        self.state = type('obj', (object,), {'user': user_data})()

class MockDB:
    def __init__(self):
        self.users = {
            "test@example.com": {"_id": "507f1f77bcf86cd799439011"}
        }
    
    async def find_one(self, query):
        email = query.get("email")
        return self.users.get(email)

# Mock the USERS_COLLECTION
USERS_COLLECTION = "users"

# Mock get_db function
async def mock_get_db(request):
    return MockDB()

# Test the resolve_user_id function logic
async def test_resolve_user_id():
    print("Testing user_id resolution fix...")
    
    # Test case 1: User with ID in user data
    request1 = MockRequest({"id": "12345", "username": "testuser"})
    user_id1 = await resolve_user_id_logic(request1, mock_get_db)
    print(f"Test 1 - User with ID: {user_id1} (expected: 12345)")
    
    # Test case 2: User with sub (JWT token containing email)
    request2 = MockRequest({"sub": "test@example.com", "username": "testuser"})
    user_id2 = await resolve_user_id_logic(request2, mock_get_db)
    print(f"Test 2 - User with sub (email): {user_id2} (expected: 507f1f77bcf86cd799439011)")
    
    # Test case 3: No user (guest)
    request3 = MockRequest(None)
    user_id3 = await resolve_user_id_logic(request3, mock_get_db)
    print(f"Test 3 - Guest user: {user_id3} (expected: global)")
    
    # Test case 4: User with error
    request4 = MockRequest({"error": "Invalid token"})
    user_id4 = await resolve_user_id_logic(request4, mock_get_db)
    print(f"Test 4 - User with error: {user_id4} (expected: global)")

async def resolve_user_id_logic(request, get_db_func):
    """The fixed resolve_user_id function logic"""
    GLOBAL_USER = "global"
    
    user = getattr(request.state, "user", None)
    if user is not None and "error" not in user:
        # If we have the user ID directly, use it
        if "id" in user:
            return str(user["id"])
        elif "_id" in user:  # MongoDB uses '_id'
            return str(user["_id"])
        elif "sub" in user:  # JWT token uses 'sub' for email, need to get user ID from database
            try:
                db = await get_db_func(request)
                user_doc = await db.find_one({"email": user["sub"]})
                if user_doc:
                    return str(user_doc["_id"])
                else:
                    return str(user["sub"])  # Fallback to email if user not found
            except Exception:
                return str(user["sub"])  # Fallback to email if database error
        elif "email" in user:  # Fallback to email
            return str(user["email"])
    return GLOBAL_USER

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_resolve_user_id())
    print("✅ All tests completed!")
