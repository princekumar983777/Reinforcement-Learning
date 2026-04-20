from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Simple API", description="Basic FastAPI for Vercel testing")

# Add CORS middleware for Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://gameversefrontend.vercel.app",  # Your frontend
        "*"  # Allow all origins for testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello from Vercel FastAPI!", "status": "running"}

@app.get("/hello/{name}")
def hello(name: str):
    return {"message": f"Hello {name}!", "platform": "Vercel"}

@app.get("/test")
def test():
    return {
        "api": "FastAPI",
        "deployment": "Vercel",
        "status": "working",
        "cors": "enabled"
    }

# Vercel serverless handler
handler = app

# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)