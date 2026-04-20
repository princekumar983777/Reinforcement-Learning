# Vercel Environment Variables Setup

## Required Environment Variables

In your Vercel dashboard, go to:
`Project Settings > Environment Variables`

Add these variables:

```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/game_verse
DATABASE_NAME=game_verse
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
```

## Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push
   ```

2. **Import to Vercel**
   - Go to vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Select the `backend` folder as root directory

3. **Configure Environment Variables**
   - Add the variables above in Vercel dashboard
   - Make sure to select the correct environment (Production)

4. **Deploy**
   - Vercel will automatically deploy
   - You'll get a URL like: `https://your-backend-name.vercel.app`

5. **Update Frontend**
   - Update `frontend/src/config/api.production.js` with your actual Vercel URL
   - Redeploy frontend

## Important Notes

- Vercel uses serverless functions, not a continuously running server
- Each API call creates a new function instance
- MongoDB connection is established per request
- Session storage works but may be limited in serverless environment

## Testing

After deployment, test:
- `https://your-backend.vercel.app/docs` - Should show API documentation
- `https://your-backend.vercel.app/tictactoe/start` - Should work from frontend
