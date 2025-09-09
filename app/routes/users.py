"""User management routes"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4

router = APIRouter()

# Pydantic models
class UserProfile(BaseModel):
    id: str
    name: str
    email: EmailStr
    age: int
    gender: str
    medical_history: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    age: int
    gender: str
    medical_history: Optional[List[str]] = []

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    medical_history: Optional[List[str]] = None

# In-memory storage (replace with database in production)
users_db: Dict[str, UserProfile] = {}

@router.post("/", response_model=UserProfile)
async def create_user(user_data: CreateUserRequest) -> UserProfile:
    """Create a new user profile"""
    user_id = str(uuid4())

    user = UserProfile(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        age=user_data.age,
        gender=user_data.gender,
        medical_history=user_data.medical_history or [],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    users_db[user_id] = user
    return user

@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: str) -> UserProfile:
    """Get user profile by ID"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    return users_db[user_id]

@router.put("/{user_id}", response_model=UserProfile)
async def update_user(user_id: str, user_data: UpdateUserRequest) -> UserProfile:
    """Update user profile"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    user = users_db[user_id]
    update_data = user_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(user, field, value)

    user.updated_at = datetime.utcnow()
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: str) -> Dict[str, str]:
    """Delete user profile"""
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")

    del users_db[user_id]
    return {"message": "User deleted successfully"}

@router.get("/", response_model=List[UserProfile])
async def list_users() -> List[UserProfile]:
    """List all users (for admin purposes)"""
    return list(users_db.values())