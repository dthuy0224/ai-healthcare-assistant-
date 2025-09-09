"""
AI Health Care Assistant - Main FastAPI Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uvicorn
from datetime import datetime

# Import routers
from app.routes import health, users, medical_analysis, reminders

# Create FastAPI app
app = FastAPI(
    title="AI Health Care Assistant",
    description="AI-powered healthcare assistant for preliminary diagnosis, health monitoring, and treatment suggestions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory="app/templates")

# Include routers
app.include_router(health.router, prefix="/api/v1/health", tags=["Health"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

# Import and include chat router
from app.routes.chat import router as chat_router
app.include_router(chat_router)

# Import and include auth router
from app.routes import auth
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(medical_analysis.router, prefix="/api/v1/medical", tags=["Medical Analysis"])
app.include_router(reminders.router, prefix="/api/v1/reminders", tags=["Reminders"])

# Page Routes
@app.get("/")
async def home(request: Request):
    """Landing page"""
    return templates.TemplateResponse("index.html", {
        "request": request,
        "current_user": None  # Will be replaced with actual user session
    })

@app.get("/dashboard")
async def dashboard(request: Request):
    """User dashboard"""
    return templates.TemplateResponse("dashboard.html", {
        "request": request,
        "current_user": {
            "name": "Nguyễn Văn A",
            "email": "nguyenvana@example.com",
            "avatar": None
        }  # Mock user data
    })

@app.get("/chat")
async def chat_page(request: Request):
    """AI Chat interface"""
    return templates.TemplateResponse("chat.html", {
        "request": request,
        "current_user": {
            "name": "Nguyễn Văn A",
            "email": "nguyenvana@example.com",
            "avatar": None
        }
    })

@app.get("/assessment")
async def assessment(request: Request):
    """Health assessment page"""
    return templates.TemplateResponse("assessment.html", {
        "request": request,
        "current_user": None
    })

@app.get("/assessment/start")
async def assessment_start(request: Request):
    """Start health assessment"""
    return templates.TemplateResponse("assessment.html", {
        "request": request,
        "current_user": None
    })

@app.get("/assessment/results/{assessment_id}")
async def assessment_results_page(request: Request, assessment_id: str):
    """Assessment results page"""
    return templates.TemplateResponse("assessment-results.html", {
        "request": request,
        "assessment_id": assessment_id,
        "current_user": None
    })

@app.get("/assessment/results")
async def assessment_results_page_no_id(request: Request):
    """Assessment results page without specific ID"""
    return templates.TemplateResponse("assessment-results.html", {
        "request": request,
        "current_user": None
    })

@app.get("/demo")
async def demo(request: Request):
    """Demo page"""
    return templates.TemplateResponse("demo.html", {
        "request": request,
        "current_user": None
    })

@app.get("/compliance/hipaa")
async def compliance_hipaa(request: Request):
    """HIPAA compliance information"""
    return templates.TemplateResponse("compliance.html", {
        "request": request,
        "current_user": None,
        "compliance_type": "hipaa"
    })

@app.get("/compliance/fda")
async def compliance_fda(request: Request):
    """FDA guidelines information"""
    return templates.TemplateResponse("compliance.html", {
        "request": request,
        "current_user": None,
        "compliance_type": "fda"
    })

@app.get("/support")
async def support(request: Request):
    """Support page"""
    return templates.TemplateResponse("support.html", {
        "request": request,
        "current_user": None
    })

@app.get("/login")
async def login(request: Request):
    """Login page"""
    return templates.TemplateResponse("login.html", {
        "request": request
    })

@app.get("/register")
async def register(request: Request):
    """Registration page"""
    return templates.TemplateResponse("register.html", {
        "request": request
    })

@app.get("/auth/forgot-password")
async def forgot_password_page(request: Request):
    """Forgot password page"""
    return templates.TemplateResponse("forgot-password.html", {
        "request": request
    })

# Feature Pages
@app.get("/features/diagnosis")
async def feature_diagnosis(request: Request):
    """AI-Powered Diagnosis feature page"""
    return templates.TemplateResponse("features/diagnosis.html", {
        "request": request,
        "current_user": None
    })

@app.get("/features/tracking")
async def feature_tracking(request: Request):
    """Symptom Tracking feature page"""
    return templates.TemplateResponse("features/tracking.html", {
        "request": request,
        "current_user": None
    })

@app.get("/features/analysis")
async def feature_analysis(request: Request):
    """Health Report Analysis feature page"""
    return templates.TemplateResponse("features/analysis.html", {
        "request": request,
        "current_user": None
    })

@app.get("/features/reminders")
async def feature_reminders(request: Request):
    """Smart Reminders feature page"""
    return templates.TemplateResponse("features/reminders.html", {
        "request": request,
        "current_user": None
    })

@app.get("/features/voice")
async def feature_voice(request: Request):
    """Voice Interaction feature page"""
    return templates.TemplateResponse("features/voice.html", {
        "request": request,
        "current_user": None
    })

@app.get("/features/emergency")
async def feature_emergency(request: Request):
    """Emergency Detection feature page"""
    return templates.TemplateResponse("features/emergency.html", {
        "request": request,
        "current_user": None
    })

# API Endpoints
@app.get("/api/v1/status")
async def get_status():
    """API status endpoint"""
    return {
        "status": "healthy",
        "service": "AI Health Care Assistant",
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "Preliminary diagnosis",
            "Health monitoring",
            "Treatment suggestions",
            "Medical report analysis",
            "Voice interaction",
            "Reminder system"
        ]
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )