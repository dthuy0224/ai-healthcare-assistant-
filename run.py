#!/usr/bin/env python3
"""
AI Health Care Assistant - Development Runner
Convenient script to run the application with different configurations
"""

import os
import sys
import subprocess
from pathlib import Path

def main():
    """Main runner function"""

    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Virtual environment not activated!")
        print("Please activate the virtual environment first:")
        print("Windows: healthcare_env\\Scripts\\activate")
        print("Linux/Mac: source healthcare_env/bin/activate")
        return

    # Check if requirements are installed
    try:
        import fastapi
        import uvicorn
        print("✅ Dependencies are installed")
    except ImportError:
        print("❌ Dependencies not installed!")
        print("Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed")

    # Create necessary directories
    os.makedirs("logs", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)

    # Run the application
    print("🚀 Starting AI Health Care Assistant...")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔄 ReDoc: http://localhost:8000/redoc")
    print("💊 API Status: http://localhost:8000/api/v1/status")
    print("\nPress Ctrl+C to stop the server\n")

    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()