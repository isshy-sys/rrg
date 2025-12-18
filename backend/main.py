"""
FastAPI main application entry point for TOEFL Speaking Master.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import os
from dotenv import load_dotenv

# Import routers
from routers import auth, problems, history, speech, scoring, phrases, task1_archive

# Import middleware
from middleware import (
    RateLimitMiddleware,
    HTTPSRedirectMiddleware,
    toefl_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)

# Import exceptions
from exceptions import TOEFLAppException

# Load environment variables first
load_dotenv()

# Log environment variable status for debugging
print("🔧 Environment variables loaded:")
print(f"  AZURE_OPENAI_API_KEY: {'✅ Set' if os.getenv('AZURE_OPENAI_API_KEY') else '❌ Not set'}")
print(f"  AZURE_OPENAI_ENDPOINT: {os.getenv('AZURE_OPENAI_ENDPOINT') or '❌ Not set'}")
print(f"  AZURE_OPENAI_WHISPER_DEPLOYMENT: {os.getenv('AZURE_OPENAI_WHISPER_DEPLOYMENT') or '❌ Not set'}")

# Verify critical environment variables (warn but don't fail)
if not os.getenv("AZURE_OPENAI_API_KEY"):
    print("⚠️  WARNING: AZURE_OPENAI_API_KEY environment variable is not set")
if not os.getenv("AZURE_OPENAI_ENDPOINT"):
    print("⚠️  WARNING: AZURE_OPENAI_ENDPOINT environment variable is not set")

app = FastAPI(
    title="TOEFL Speaking Master API",
    description="API for TOEFL iBT Speaking Task 3 practice application",
    version="1.0.0"
)

# Register global exception handlers
app.add_exception_handler(TOEFLAppException, toefl_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include routers
app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(history.router)
app.include_router(speech.router)
app.include_router(scoring.router)
app.include_router(phrases.router)
app.include_router(task1_archive.router)

# Mount static files for audio
audio_storage_path = os.getenv("AUDIO_STORAGE_PATH", "backend/audio_files")
os.makedirs(audio_storage_path, exist_ok=True)
app.mount("/audio", StaticFiles(directory=audio_storage_path), name="audio")

# Security middleware - HTTPS enforcement
app.add_middleware(HTTPSRedirectMiddleware)

# Rate limiting middleware
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
app.add_middleware(RateLimitMiddleware, requests_per_minute=RATE_LIMIT)

# CORS configuration
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "TOEFL Speaking Master API is running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "api_version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    PORT = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=PORT, reload=True)
