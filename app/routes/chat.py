"""
Chat API routes for AI Health Assistant
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import json
import uuid
import base64

router = APIRouter(prefix="/api/chat", tags=["chat"])

# In-memory storage (replace with database in production)
chat_sessions = {}
chat_messages = {}
user_preferences = {}

# Pydantic models
class ChatMessage(BaseModel):
    id: Optional[str] = None
    session_id: str
    type: str = Field(..., pattern="^(user|ai)$")
    content: Union[str, Dict[str, Any]]
    message_type: str = Field(default="text", pattern="^(text|insight_card|quick_reply|attachment)$")
    attachments: Optional[List[Dict[str, Any]]] = []
    timestamp: Optional[datetime] = None
    status: str = Field(default="sent", pattern="^(sending|sent|delivered|read|error)$")

class SendMessageRequest(BaseModel):
    session_id: str
    content: str
    attachments: Optional[List[Dict[str, Any]]] = []

class MessageResponse(BaseModel):
    message_id: str
    response_message: ChatMessage
    quick_replies: Optional[List[str]] = []
    typing_delay: int = 2000

# Mock AI Response Generator
class HealthAIEngine:
    @staticmethod
    def generate_response(user_message: str, session_context=None) -> Dict[str, Any]:
        """Generate AI response based on user message"""
        user_message_lower = user_message.lower()
        
        if any(keyword in user_message_lower for keyword in ['headache', 'head pain']):
            return {
                'type': 'insight_card',
                'content': {
                    'title': 'Headache Analysis',
                    'severity': 'medium',
                    'confidence': 85,
                    'conditions': [
                        {'name': 'Tension Headache', 'probability': 75},
                        {'name': 'Stress-related Headache', 'probability': 60}
                    ],
                    'recommendations': [
                        {'icon': '💧', 'text': 'Stay well hydrated'},
                        {'icon': '😴', 'text': 'Get adequate sleep'}
                    ]
                },
                'quick_replies': ['Tell me more', 'Should I see a doctor?']
            }
        
        return {
            'type': 'text',
            'content': 'Thank you for your message. How can I help you today?',
            'quick_replies': ['I have symptoms', 'Need medication help', 'Schedule appointment']
        }

@router.post("/messages", response_model=MessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a message and get AI response"""
    session_id = request.session_id
    
    # Create user message
    user_message = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        type="user",
        content=request.content,
        attachments=request.attachments or [],
        timestamp=datetime.now(),
        status="delivered"
    )
    
    # Store user message
    if session_id not in chat_messages:
        chat_messages[session_id] = []
    chat_messages[session_id].append(user_message.dict())
    
    # Generate AI response
    ai_response_data = HealthAIEngine.generate_response(request.content)
    
    # Create AI response message
    ai_message = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        type="ai",
        content=ai_response_data.get('content'),
        message_type=ai_response_data.get('type', 'text'),
        timestamp=datetime.now(),
        status="delivered"
    )
    
    # Store AI message
    chat_messages[session_id].append(ai_message.dict())
    
    return MessageResponse(
        message_id=user_message.id,
        response_message=ai_message,
        quick_replies=ai_response_data.get('quick_replies', []),
        typing_delay=2000
    )

@router.get("/sessions/{session_id}/messages")
async def get_chat_messages(session_id: str, limit: int = 50):
    """Get messages from a chat session"""
    if session_id not in chat_messages:
        return {"messages": [], "total": 0}
    
    messages = chat_messages[session_id]
    return {"messages": messages[-limit:], "total": len(messages)}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), session_id: str = None):
    """Upload file attachment for chat"""
    # Validate file
    max_size = 10 * 1024 * 1024  # 10MB
    if file.size and file.size > max_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Read file content
    file_content = await file.read()
    file_data = base64.b64encode(file_content).decode('utf-8')
    
    attachment = {
        'id': str(uuid.uuid4()),
        'filename': file.filename,
        'content_type': file.content_type,
        'size': len(file_content),
        'data': file_data,
        'uploaded_at': datetime.now().isoformat()
    }
    
    return {
        "attachment_id": attachment['id'],
        "filename": attachment['filename'],
        "size": attachment['size'],
        "message": "File uploaded successfully"
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_sessions": len(chat_sessions),
        "total_messages": sum(len(messages) for messages in chat_messages.values()),
        "timestamp": datetime.now().isoformat()
    }