# Production Deployment Checklist

## Required Environment Variables for Production

Create a `.env` file with these variables:

```env
# MongoDB Configuration (PRODUCTION)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/game_verse
DATABASE_NAME=game_verse

# JWT Secret Key (CHANGE THIS IN PRODUCTION!)
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars

# Optional: Custom token expiration
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## CORS Configuration - FIXED
- [x] Added `https://gameversefrontend.vercel.app` to allowed origins
- [x] Kept `http://localhost:5173` for development
- [x] Credentials enabled for cookie-based auth

## Frontend Configuration Update Required
- [ ] Update `frontend/src/config/api.js` to use production backend URL
- [ ] Current: `"http://localhost:8000"`
- [ ] Should be: `"https://your-backend-url.onrender.com"` (or your production URL)

## Security Checklist
- [ ] Use strong MongoDB connection string with authentication
- [ ] Change SECRET_KEY to a secure 32+ character string
- [ ] Ensure MongoDB is not exposed to public internet
- [ ] Use HTTPS in production (handled by Vercel/Render)

## Deployment Options

### Option 1: Render.com (Recommended)
1. Connect GitHub repository
2. Set environment variables in Render dashboard
3. Deploy automatically on push to main branch

### Option 2: Railway.app
1. Connect GitHub repository
2. Configure MongoDB addon
3. Set environment variables
4. Deploy

### Option 3: DigitalOcean App Platform
1. Connect GitHub repository
2. Configure app with web service
3. Add MongoDB cluster
4. Set environment variables

## Database Setup
- [ ] Create MongoDB Atlas cluster
- [ ] Configure IP whitelist (allow all for deployment platforms)
- [ ] Create database user with read/write permissions
- [ ] Test connection string

## Testing Checklist
- [ ] Test user registration/login flow
- [ ] Test Tic-Tac-Toe game with user authentication
- [ ] Test session cleanup functionality
- [ ] Verify CORS requests work from production frontend
- [ ] Test error handling and validation

## Monitoring
- [ ] Set up logging for production
- [ ] Monitor database connections
- [ ] Check API response times
- [ ] Monitor error rates
