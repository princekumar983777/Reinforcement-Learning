# Game Verse Backend API

A FastAPI-based backend with user authentication, MongoDB integration, and JWT token management.

## 🚀 Features

- User registration and login
- JWT access token authentication
- MongoDB database integration
- Automatic token validation middleware
- Password hashing with bcrypt
- RESTful API endpoints

## 📋 Prerequisites

- Python 3.8+
- MongoDB server running locally or remotely
- Virtual environment (recommended)

## 🛠️ Installation

1. **Clone and navigate to the project:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=game_verse

# JWT Secret Key (change this in production!)
SECRET_KEY=your-super-secret-key-change-this-in-production

# Optional: Custom token expiration
# ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 🏃‍♂️ Running the Application

```bash
python main.py
```

The server will start on `http://localhost:8000`

## 📚 API Documentation

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## 🛣️ Available Routes

### Base URL
- **Server:** `http://localhost:8000`

### Authentication Routes (`/auth/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | User login | No |
| GET | `/auth/me` | Get current user info | Yes |
| POST | `/auth/logout` | User logout | Yes |
| POST | `/auth/refresh` | Refresh access token | Yes |

### User Routes (`/user/*`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/` | Get user status | No (auto-checks token) |
| GET | `/user/profile` | Get user profile | No (auto-checks token) |

### Root Route

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Root endpoint | No (auto-checks token) |

## 🧪 Testing with cURL

### 1. User Registration

```bash
curl -X POST "http://localhost:8000/auth/signup" \
-H "Content-Type: application/json" \
-d '{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "confirm_password": "password123"
}'
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. User Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
-H "Content-Type: application/json" \
-d '{
  "email": "test@example.com",
  "password": "password123"
}'
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get Current User (with token)

```bash
curl -X GET "http://localhost:8000/auth/me" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "games": {}
  }
}
```

### 4. Access Root Endpoint (without token)

```bash
curl -X GET "http://localhost:8000/"
```

**Response:**
```json
{
  "user": {
    "error": "User not logged in"
  }
}
```

### 5. Access Root Endpoint (with token)

```bash
curl -X GET "http://localhost:8000/" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "email": "test@example.com",
    "games": {}
  }
}
```

### 6. Logout

```bash
curl -X POST "http://localhost:8000/auth/logout" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "message": "Logout successful"
}
```

### 7. Refresh Token

```bash
curl -X POST "http://localhost:8000/auth/refresh" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📮 Testing with Postman

### Setup

1. **Import the collection** (create a new collection in Postman)
2. **Set base URL:** `http://localhost:8000`

### Requests

#### 1. Signup
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/signup`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "confirm_password": "password123"
}
```

#### 2. Login
- **Method:** POST
- **URL:** `{{baseUrl}}/auth/login`
- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### 3. Get Current User
- **Method:** GET
- **URL:** `{{baseUrl}}/auth/me`
- **Headers:** `Authorization: Bearer {{token}}`
- **Variables:** Set `token` from login response

#### 4. Root Endpoint
- **Method:** GET
- **URL:** `{{baseUrl}}/`
- **Headers:** `Authorization: Bearer {{token}}` (optional)

### Postman Variables

Create these environment variables:
- `baseUrl`: `http://localhost:8000`
- `token`: (set from login response)

## 🔧 Authentication Flow

1. **Register** user with `/auth/signup`
2. **Login** with `/auth/login` to get access token
3. **Include token** in Authorization header: `Bearer <token>`
4. **Access protected routes** or let middleware auto-check tokens
5. **Logout** to invalidate token
6. **Refresh** token when needed

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Token expiration (30 minutes default)
- Automatic token validation middleware
- Secure password storage
- Token invalidation on logout

## 📝 Error Responses

### Common Error Formats

**Validation Error (400):**
```json
{
  "detail": "Email already registered"
}
```

**Authentication Error (401):**
```json
{
  "detail": "Could not validate credentials"
}
```

**Server Error (500):**
```json
{
  "detail": "An unexpected error occurred: error message"
}
```

## 🗂️ Project Structure

```
backend/
├── api/
│   ├── auth.py          # Authentication routes
│   └── user.py          # User routes
├── core/
│   └── security.py      # Security utilities
├── db/
│   ├── model.py         # Pydantic models
│   └── session.py       # MongoDB connection
├── middleware/
│   └── auth.py          # Authentication middleware
├── services/
│   └── auth_service.py  # Authentication business logic
├── app.py               # FastAPI application
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
└── .env.example         # Environment variables template
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
