"""Application settings and configuration"""

import os
from typing import List, Optional
from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    """Application settings using Pydantic BaseSettings"""

    # App Configuration
    app_name: str = Field(default="AI Health Care Assistant", env="APP_NAME")
    app_version: str = Field(default="1.0.0", env="APP_VERSION")
    debug: bool = Field(default=True, env="DEBUG")

    # Server Configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")

    # Database Configuration
    database_url: str = Field(default="sqlite:///./healthcare.db", env="DATABASE_URL")
    mongodb_url: str = Field(default="mongodb://localhost:27017/healthcare_db", env="MONGODB_URL")

    # AI/ML Configuration
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    google_ai_api_key: Optional[str] = Field(default=None, env="GOOGLE_AI_API_KEY")

    # Vector Database
    chroma_db_path: str = Field(default="./data/chroma_db", env="CHROMA_DB_PATH")
    vector_db_url: str = Field(default="http://localhost:8001", env="VECTOR_DB_URL")

    # Security
    secret_key: str = Field(default="your_super_secret_key_here", env="SECRET_KEY")
    jwt_secret_key: str = Field(default="your_jwt_secret_key_here", env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=30, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")

    # Voice Configuration
    google_speech_api_key: Optional[str] = Field(default=None, env="GOOGLE_SPEECH_API_KEY")
    elevenlabs_api_key: Optional[str] = Field(default=None, env="ELEVENLABS_API_KEY")

    # Email Configuration
    smtp_server: str = Field(default="smtp.gmail.com", env="SMTP_SERVER")
    smtp_port: int = Field(default=587, env="SMTP_PORT")
    smtp_username: Optional[str] = Field(default=None, env="SMTP_USERNAME")
    smtp_password: Optional[str] = Field(default=None, env="SMTP_PASSWORD")

    # File Storage
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    max_upload_size: int = Field(default=10485760, env="MAX_UPLOAD_SIZE")  # 10MB

    # Health Data APIs
    medical_data_api_key: Optional[str] = Field(default=None, env="MEDICAL_DATA_API_KEY")
    who_api_key: Optional[str] = Field(default=None, env="WHO_API_KEY")
    gov_data_api_key: Optional[str] = Field(default=None, env="GOV_DATA_API_KEY")

    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: str = Field(default="./logs/healthcare.log", env="LOG_FILE")

    # CORS
    allowed_origins: List[str] = Field(default=["http://localhost:3000", "http://localhost:5173"], env="ALLOWED_ORIGINS")
    allowed_hosts: List[str] = Field(default=["localhost", "127.0.0.1", "0.0.0.0"], env="ALLOWED_HOSTS")

    # Feature Flags
    enable_voice_features: bool = Field(default=True, env="ENABLE_VOICE_FEATURES")
    enable_ai_analysis: bool = Field(default=True, env="ENABLE_AI_ANALYSIS")
    enable_reminder_system: bool = Field(default=True, env="ENABLE_REMINDER_SYSTEM")
    enable_push_notifications: bool = Field(default=False, env="ENABLE_PUSH_NOTIFICATIONS")

    class Config:
        env_file = ".env"
        case_sensitive = False

# Create global settings instance
settings = Settings()

# Ensure required directories exist
def create_required_directories():
    """Create required directories if they don't exist"""
    directories = [
        settings.upload_dir,
        settings.chroma_db_path,
        os.path.dirname(settings.log_file) if settings.log_file else None,
        "./logs",
        "./data"
    ]

    for directory in directories:
        if directory and not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)

# Create directories on import
create_required_directories()