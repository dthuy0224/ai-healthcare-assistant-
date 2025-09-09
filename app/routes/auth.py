"""Authentication routes with Pydantic validation"""

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import hashlib
import secrets

router = APIRouter()

# Pydantic Models for Authentication
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember: Optional[bool] = False
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class LoginResponse(BaseModel):
    success: bool
    message: str
    redirect_url: Optional[str] = None
    user: Optional[Dict[str, Any]] = None
    token: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str
    
    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Passwords do not match')
        return v

class UserProfile(BaseModel):
    id: str
    email: EmailStr
    name: str
    avatar: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

# In-memory storage (replace with database in production)
users_db: Dict[str, Dict[str, Any]] = {
    "demo@healthcare.ai": {
        "id": "demo-user-123",
        "email": "demo@healthcare.ai",
        "name": "Demo User",
        "password_hash": hashlib.sha256("demo123".encode()).hexdigest(),
        "avatar": None,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "is_active": True
    }
}

sessions_db: Dict[str, Dict[str, Any]] = {}
reset_tokens_db: Dict[str, Dict[str, Any]] = {}

def hash_password(password: str) -> str:
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{password_hash.hex()}"

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    try:
        if ":" not in password_hash:
            # Legacy hash (for demo user)
            return hashlib.sha256(password.encode()).hexdigest() == password_hash
        
        salt, hash_hex = password_hash.split(":", 1)
        password_check = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return password_check.hex() == hash_hex
    except Exception:
        return False

def create_session_token() -> str:
    """Create a secure session token"""
    return secrets.token_urlsafe(32)

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response) -> LoginResponse:
    """Authenticate user and create session"""
    
    try:
        # Find user by email
        user_data = users_db.get(request.email.lower())
        
        if not user_data:
            raise HTTPException(
                status_code=401, 
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(request.password, user_data["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user_data.get("is_active", True):
            raise HTTPException(
                status_code=401,
                detail="Account is deactivated. Please contact support."
            )
        
        # Create session token
        session_token = create_session_token()
        
        # Store session
        session_expiry = datetime.utcnow() + timedelta(
            days=30 if request.remember else 1
        )
        
        sessions_db[session_token] = {
            "user_id": user_data["id"],
            "email": user_data["email"],
            "created_at": datetime.utcnow(),
            "expires_at": session_expiry,
            "remember": request.remember
        }
        
        # Update last login
        user_data["last_login"] = datetime.utcnow()
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            max_age=2592000 if request.remember else 86400,  # 30 days or 1 day
            httponly=True,
            secure=True,  # Set to False for development
            samesite="lax"
        )
        
        # Prepare user profile for response
        user_profile = {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "avatar": user_data.get("avatar"),
            "last_login": user_data["last_login"].isoformat()
        }
        
        return LoginResponse(
            success=True,
            message="Login successful",
            redirect_url="/dashboard",
            user=user_profile,
            token=session_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )

@router.post("/logout")
async def logout(request: Request, response: Response):
    """Logout user and clear session"""
    
    session_token = request.cookies.get("session_token")
    
    if session_token and session_token in sessions_db:
        del sessions_db[session_token]
    
    response.delete_cookie(key="session_token")
    
    return {"success": True, "message": "Logged out successfully"}

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email"""
    
    user_data = users_db.get(request.email.lower())
    
    if not user_data:
        # Don't reveal if email exists or not for security
        return {
            "success": True,
            "message": "If the email exists, a reset link has been sent."
        }
    
    # Create reset token
    reset_token = secrets.token_urlsafe(32)
    reset_tokens_db[reset_token] = {
        "email": request.email.lower(),
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=1)
    }
    
    # TODO: Send email with reset link
    # send_password_reset_email(request.email, reset_token)
    
    return {
        "success": True,
        "message": "If the email exists, a reset link has been sent.",
        "reset_token": reset_token  # Remove this in production
    }

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset user password with token"""
    
    token_data = reset_tokens_db.get(request.token)
    
    if not token_data:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
    
    if datetime.utcnow() > token_data["expires_at"]:
        del reset_tokens_db[request.token]
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired"
        )
    
    # Update user password
    user_data = users_db.get(token_data["email"])
    if user_data:
        user_data["password_hash"] = hash_password(request.new_password)
    
    # Clean up reset token
    del reset_tokens_db[request.token]
    
    return {
        "success": True,
        "message": "Password has been reset successfully"
    }

@router.get("/me")
async def get_current_user(request: Request) -> UserProfile:
    """Get current authenticated user"""
    
    session_token = request.cookies.get("session_token")
    
    if not session_token or session_token not in sessions_db:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_data = sessions_db[session_token]
    
    # Check if session is expired
    if datetime.utcnow() > session_data["expires_at"]:
        del sessions_db[session_token]
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user data
    user_data = users_db.get(session_data["email"])
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfile(
        id=user_data["id"],
        email=user_data["email"],
        name=user_data["name"],
        avatar=user_data.get("avatar"),
        created_at=user_data["created_at"],
        last_login=user_data.get("last_login")
    )

@router.get("/status")
async def auth_status(request: Request):
    """Check authentication status"""
    
    session_token = request.cookies.get("session_token")
    
    if not session_token or session_token not in sessions_db:
        return {"authenticated": False}
    
    session_data = sessions_db[session_token]
    
    # Check if session is expired
    if datetime.utcnow() > session_data["expires_at"]:
        del sessions_db[session_token]
        return {"authenticated": False}
    
    return {
        "authenticated": True,
        "user_id": session_data["user_id"],
        "email": session_data["email"]
    }

# Registration Models
class BasicInfoRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    date_of_birth: str
    gender: str
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        if not v.replace(' ', '').replace('-', '').replace("'", '').replace('.', '').isalpha():
            raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
        return v.strip()
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*(),.?":{}|<>' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and v.strip():
            # Remove common phone formatting
            cleaned = ''.join(c for c in v if c.isdigit() or c == '+')
            if len(cleaned) < 10 or len(cleaned) > 16:
                raise ValueError('Please enter a valid phone number')
        return v
    
    @validator('date_of_birth')
    def validate_age(cls, v):
        try:
            birth_date = datetime.strptime(v, '%Y-%m-%d')
            today = datetime.now()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            if age < 13:
                raise ValueError('You must be at least 13 years old to register')
            if age > 120:
                raise ValueError('Please enter a valid date of birth')
            
            return v
        except ValueError as e:
            if "You must be at least" in str(e) or "Please enter a valid" in str(e):
                raise e
            raise ValueError('Please enter a valid date in YYYY-MM-DD format')
    
    @validator('gender')
    def validate_gender(cls, v):
        valid_genders = ['male', 'female', 'other', 'prefer_not_to_say']
        if v not in valid_genders:
            raise ValueError('Please select a valid gender option')
        return v

class MedicalProfileRequest(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[List[str]] = []
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_relationship: Optional[str] = None
    
    @validator('height')
    def validate_height(cls, v):
        if v is not None and (v < 100 or v > 250):
            raise ValueError('Height must be between 100 and 250 cm')
        return v
    
    @validator('weight')
    def validate_weight(cls, v):
        if v is not None and (v < 30 or v > 300):
            raise ValueError('Weight must be between 30 and 300 kg')
        return v
    
    @validator('blood_type')
    def validate_blood_type(cls, v):
        if v and v != 'unknown':
            valid_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
            if v not in valid_types:
                raise ValueError('Please select a valid blood type')
        return v
    
    @validator('chronic_conditions')
    def validate_chronic_conditions(cls, v):
        valid_conditions = ['diabetes', 'hypertension', 'heart_disease', 'asthma', 'arthritis', 'other']
        if v:
            for condition in v:
                if condition not in valid_conditions:
                    raise ValueError(f'Invalid chronic condition: {condition}')
        return v
    
    @validator('emergency_relationship')
    def validate_emergency_relationship(cls, v):
        if v:
            valid_relationships = ['spouse', 'parent', 'child', 'sibling', 'friend', 'other']
            if v not in valid_relationships:
                raise ValueError('Please select a valid relationship')
        return v

class PreferencesRequest(BaseModel):
    notifications: Optional[List[str]] = []
    language: str = 'en'
    ai_explanation_level: str = 'basic'
    data_sharing: Optional[List[str]] = []
    accept_terms: bool
    marketing_emails: Optional[bool] = False
    
    @validator('notifications')
    def validate_notifications(cls, v):
        valid_notifications = [
            'medication_reminders', 'appointment_reminders', 'health_tips',
            'emergency_alerts', 'weekly_reports'
        ]
        if v:
            for notification in v:
                if notification not in valid_notifications:
                    raise ValueError(f'Invalid notification preference: {notification}')
        return v
    
    @validator('language')
    def validate_language(cls, v):
        valid_languages = ['en', 'vi', 'zh', 'ja', 'ko']
        if v not in valid_languages:
            raise ValueError('Please select a supported language')
        return v
    
    @validator('ai_explanation_level')
    def validate_ai_level(cls, v):
        if v not in ['basic', 'advanced']:
            raise ValueError('Please select a valid AI explanation level')
        return v
    
    @validator('data_sharing')
    def validate_data_sharing(cls, v):
        valid_sharing = ['anonymous_research', 'healthcare_providers', 'emergency_services']
        if v:
            for sharing in v:
                if sharing not in valid_sharing:
                    raise ValueError(f'Invalid data sharing preference: {sharing}')
        return v
    
    @validator('accept_terms')
    def validate_terms(cls, v):
        if not v:
            raise ValueError('You must accept the Terms of Service and Privacy Policy')
        return v

class RegistrationRequest(BaseModel):
    # Basic Information
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    date_of_birth: str
    gender: str
    
    # Medical Profile
    height: Optional[float] = None
    weight: Optional[float] = None
    blood_type: Optional[str] = None
    medications: Optional[str] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[List[str]] = []
    emergency_name: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_relationship: Optional[str] = None
    
    # Preferences
    notifications: Optional[List[str]] = []
    language: str = 'en'
    ai_explanation_level: str = 'basic'
    data_sharing: Optional[List[str]] = []
    accept_terms: bool
    marketing_emails: Optional[bool] = False
    
    # Validators
    @validator('full_name')
    def validate_full_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        if not v.replace(' ', '').replace('-', '').replace("'", '').replace('.', '').isalpha():
            raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
        return v.strip()
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        if not any(c in '!@#$%^&*(),.?":{}|<>' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and v.strip():
            cleaned = ''.join(c for c in v if c.isdigit() or c == '+')
            if len(cleaned) < 10 or len(cleaned) > 16:
                raise ValueError('Please enter a valid phone number')
        return v
    
    @validator('date_of_birth')
    def validate_age(cls, v):
        try:
            birth_date = datetime.strptime(v, '%Y-%m-%d')
            today = datetime.now()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            if age < 13:
                raise ValueError('You must be at least 13 years old to register')
            if age > 120:
                raise ValueError('Please enter a valid date of birth')
            
            return v
        except ValueError as e:
            if "You must be at least" in str(e) or "Please enter a valid" in str(e):
                raise e
            raise ValueError('Please enter a valid date in YYYY-MM-DD format')
    
    @validator('gender')
    def validate_gender(cls, v):
        valid_genders = ['male', 'female', 'other', 'prefer_not_to_say']
        if v not in valid_genders:
            raise ValueError('Please select a valid gender option')
        return v
    
    @validator('height')
    def validate_height(cls, v):
        if v is not None and (v < 100 or v > 250):
            raise ValueError('Height must be between 100 and 250 cm')
        return v
    
    @validator('weight')
    def validate_weight(cls, v):
        if v is not None and (v < 30 or v > 300):
            raise ValueError('Weight must be between 30 and 300 kg')
        return v
    
    @validator('blood_type')
    def validate_blood_type(cls, v):
        if v and v != 'unknown':
            valid_types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
            if v not in valid_types:
                raise ValueError('Please select a valid blood type')
        return v
    
    @validator('chronic_conditions')
    def validate_chronic_conditions(cls, v):
        valid_conditions = ['diabetes', 'hypertension', 'heart_disease', 'asthma', 'arthritis', 'other']
        if v:
            for condition in v:
                if condition not in valid_conditions:
                    raise ValueError(f'Invalid chronic condition: {condition}')
        return v
    
    @validator('emergency_relationship')
    def validate_emergency_relationship(cls, v):
        if v:
            valid_relationships = ['spouse', 'parent', 'child', 'sibling', 'friend', 'other']
            if v not in valid_relationships:
                raise ValueError('Please select a valid relationship')
        return v
    
    @validator('notifications')
    def validate_notifications(cls, v):
        valid_notifications = [
            'medication_reminders', 'appointment_reminders', 'health_tips',
            'emergency_alerts', 'weekly_reports'
        ]
        if v:
            for notification in v:
                if notification not in valid_notifications:
                    raise ValueError(f'Invalid notification preference: {notification}')
        return v
    
    @validator('language')
    def validate_language(cls, v):
        valid_languages = ['en', 'vi', 'zh', 'ja', 'ko']
        if v not in valid_languages:
            raise ValueError('Please select a supported language')
        return v
    
    @validator('ai_explanation_level')
    def validate_ai_level(cls, v):
        if v not in ['basic', 'advanced']:
            raise ValueError('Please select a valid AI explanation level')
        return v
    
    @validator('data_sharing')
    def validate_data_sharing(cls, v):
        valid_sharing = ['anonymous_research', 'healthcare_providers', 'emergency_services']
        if v:
            for sharing in v:
                if sharing not in valid_sharing:
                    raise ValueError(f'Invalid data sharing preference: {sharing}')
        return v
    
    @validator('accept_terms')
    def validate_terms(cls, v):
        if not v:
            raise ValueError('You must accept the Terms of Service and Privacy Policy')
        return v

class RegistrationResponse(BaseModel):
    success: bool
    message: str
    redirect_url: Optional[str] = None
    user_id: Optional[str] = None

# Session storage for multi-step registration
registration_sessions: Dict[str, Dict[str, Any]] = {}

@router.post("/register", response_model=RegistrationResponse)
async def register_user(request: RegistrationRequest, response: Response) -> RegistrationResponse:
    """Complete user registration"""
    
    try:
        # Check if email already exists
        if request.email.lower() in users_db:
            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists"
            )
        
        # Create user ID
        user_id = f"user-{secrets.token_hex(8)}"
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Calculate BMI if height and weight provided
        bmi = None
        if request.height and request.weight:
            height_m = request.height / 100
            bmi = round(request.weight / (height_m ** 2), 1)
        
        # Create user record
        user_data = {
            "id": user_id,
            "email": request.email.lower(),
            "name": request.full_name,
            "password_hash": password_hash,
            "phone": request.phone,
            "date_of_birth": request.date_of_birth,
            "gender": request.gender,
            "avatar": None,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "is_active": True,
            
            # Medical Profile
            "medical_profile": {
                "height": request.height,
                "weight": request.weight,
                "bmi": bmi,
                "blood_type": request.blood_type,
                "medications": request.medications.split('\n') if request.medications else [],
                "allergies": request.allergies.split('\n') if request.allergies else [],
                "chronic_conditions": request.chronic_conditions or [],
                "emergency_contact": {
                    "name": request.emergency_name,
                    "phone": request.emergency_phone,
                    "relationship": request.emergency_relationship
                } if request.emergency_name else None
            },
            
            # Preferences
            "preferences": {
                "notifications": request.notifications or [],
                "language": request.language,
                "ai_explanation_level": request.ai_explanation_level,
                "data_sharing": request.data_sharing or [],
                "marketing_emails": request.marketing_emails
            }
        }
        
        # Save user to database
        users_db[request.email.lower()] = user_data
        
        # Create session token and auto-login
        session_token = create_session_token()
        session_expiry = datetime.utcnow() + timedelta(days=1)
        
        sessions_db[session_token] = {
            "user_id": user_id,
            "email": request.email.lower(),
            "created_at": datetime.utcnow(),
            "expires_at": session_expiry,
            "remember": False
        }
        
        # Set session cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            max_age=86400,  # 1 day
            httponly=True,
            secure=True,
            samesite="lax"
        )
        
        return RegistrationResponse(
            success=True,
            message="Registration successful! Welcome to AI Health Care Assistant.",
            redirect_url="/dashboard",
            user_id=user_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Registration error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration"
        )

# Multi-step registration endpoints for session storage
@router.post("/register/step1")
async def save_step1(request: BasicInfoRequest, http_request: Request):
    """Save step 1 data to session"""
    
    # Check if email already exists
    if request.email.lower() in users_db:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists"
        )
    
    # Create or get session ID
    session_id = http_request.cookies.get("registration_session") or secrets.token_urlsafe(32)
    
    # Save step data
    if session_id not in registration_sessions:
        registration_sessions[session_id] = {"created_at": datetime.utcnow()}
    
    registration_sessions[session_id].update({
        "step1": request.dict(),
        "updated_at": datetime.utcnow()
    })
    
    response = JSONResponse({"success": True, "message": "Step 1 saved successfully"})
    response.set_cookie(
        key="registration_session",
        value=session_id,
        max_age=3600,  # 1 hour
        httponly=True,
        secure=True,
        samesite="lax"
    )
    
    return response

@router.post("/register/step2")
async def save_step2(request: MedicalProfileRequest, http_request: Request):
    """Save step 2 data to session"""
    
    session_id = http_request.cookies.get("registration_session")
    if not session_id or session_id not in registration_sessions:
        raise HTTPException(status_code=400, detail="Registration session not found")
    
    registration_sessions[session_id].update({
        "step2": request.dict(),
        "updated_at": datetime.utcnow()
    })
    
    return {"success": True, "message": "Step 2 saved successfully"}

@router.post("/register/step3")
async def save_step3(request: PreferencesRequest, http_request: Request):
    """Save step 3 data to session"""
    
    session_id = http_request.cookies.get("registration_session")
    if not session_id or session_id not in registration_sessions:
        raise HTTPException(status_code=400, detail="Registration session not found")
    
    registration_sessions[session_id].update({
        "step3": request.dict(),
        "updated_at": datetime.utcnow()
    })
    
    return {"success": True, "message": "Step 3 saved successfully"}

@router.get("/register/session")
async def get_registration_session(request: Request):
    """Get saved registration data from session"""
    
    session_id = request.cookies.get("registration_session")
    if not session_id or session_id not in registration_sessions:
        return {"data": None}
    
    session_data = registration_sessions[session_id]
    
    # Check if session is expired (1 hour)
    if datetime.utcnow() - session_data["created_at"] > timedelta(hours=1):
        del registration_sessions[session_id]
        return {"data": None}
    
    return {"data": session_data}