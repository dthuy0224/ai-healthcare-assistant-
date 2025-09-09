"""Routes package for AI Health Care Assistant"""

from .health import router as health_router
from .users import router as users_router
from .chat import router as chat_router
from .medical_analysis import router as medical_analysis_router
from .reminders import router as reminders_router

__all__ = [
    "health_router",
    "users_router",
    "chat_router",
    "medical_analysis_router",
    "reminders_router"
]