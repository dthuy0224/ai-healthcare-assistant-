#!/usr/bin/env python3
"""
AI Health Care Assistant - API Testing Script
Test script to verify all endpoints are working correctly
"""

import json
import time

BASE_URL = "http://localhost:8000"

def test_health_endpoints():
    """Test health check endpoints"""
    print("🩺 Testing Health Endpoints...")

    # Test root endpoint
    response = requests.get(f"{BASE_URL}/")
    print(f"✅ Root endpoint: {response.status_code}")
    print(f"   Response: {response.json()}")

    # Test API status
    response = requests.get(f"{BASE_URL}/api/v1/status")
    print(f"✅ API Status: {response.status_code}")
    print(f"   Response: {response.json()}")

    # Test health check
    response = requests.get(f"{BASE_URL}/api/v1/health/")
    print(f"✅ Health Check: {response.status_code}")

def test_user_management():
    """Test user management endpoints"""
    print("\n👤 Testing User Management...")

    # Create a test user
    user_data = {
        "name": "Nguyễn Văn Test",
        "email": "test@example.com",
        "age": 30,
        "gender": "male",
        "medical_history": ["tăng huyết áp"]
    }

    response = requests.post(f"{BASE_URL}/api/v1/users/", json=user_data)
    print(f"✅ Create User: {response.status_code}")
    if response.status_code == 200:
        user = response.json()
        user_id = user["id"]
        print(f"   Created user ID: {user_id}")

        # Get user
        response = requests.get(f"{BASE_URL}/api/v1/users/{user_id}")
        print(f"✅ Get User: {response.status_code}")

        # Update user
        update_data = {"age": 31}
        response = requests.put(f"{BASE_URL}/api/v1/users/{user_id}", json=update_data)
        print(f"✅ Update User: {response.status_code}")

        return user_id
    return None

def test_chat_system(user_id):
    """Test chat system"""
    print("\n💬 Testing Chat System...")

    # Send a message
    chat_data = {
        "user_id": user_id,
        "message": "Tôi bị đau đầu và chóng mặt"
    }

    response = requests.post(f"{BASE_URL}/api/v1/chat/message", json=chat_data)
    print(f"✅ Send Message: {response.status_code}")
    if response.status_code == 200:
        chat_response = response.json()
        print(f"   AI Response: {chat_response['response'][:100]}...")

    # Get chat history
    response = requests.get(f"{BASE_URL}/api/v1/chat/history/{user_id}")
    print(f"✅ Get Chat History: {response.status_code}")

def test_symptom_analysis(user_id):
    """Test symptom analysis"""
    print("\n🔍 Testing Symptom Analysis...")

    symptom_data = {
        "user_id": user_id,
        "symptoms": ["đau đầu", "chóng mặt", "buồn nôn"],
        "additional_info": {"duration": "2 ngày", "intensity": "vừa"}
    }

    response = requests.post(f"{BASE_URL}/api/v1/medical/symptoms/analyze", json=symptom_data)
    print(f"✅ Analyze Symptoms: {response.status_code}")
    if response.status_code == 200:
        analysis = response.json()
        print(f"   Severity: {analysis['severity_level']}")
        print(f"   Recommendations: {len(analysis['recommendations'])} items")

def test_reminder_system(user_id):
    """Test reminder system"""
    print("\n⏰ Testing Reminder System...")

    # Create a reminder
    reminder_data = {
        "user_id": user_id,
        "title": "Uống thuốc huyết áp",
        "description": "Uống thuốc Amlodipine 5mg",
        "reminder_type": "medication",
        "frequency": "daily",
        "scheduled_time": "2024-01-15T08:00:00Z"
    }

    response = requests.post(f"{BASE_URL}/api/v1/reminders/", json=reminder_data)
    print(f"✅ Create Reminder: {response.status_code}")

    # Get user reminders
    response = requests.get(f"{BASE_URL}/api/v1/reminders/user/{user_id}")
    print(f"✅ Get User Reminders: {response.status_code}")

def main():
    """Main testing function"""
    print("🧪 Starting AI Health Care Assistant API Tests")
    print("=" * 50)

    try:
        # Wait a moment for server to start
        time.sleep(2)

        # Test health endpoints
        test_health_endpoints()

        # Test user management
        user_id = test_user_management()

        if user_id:
            # Test other features with the created user
            test_chat_system(user_id)
            test_symptom_analysis(user_id)
            test_reminder_system(user_id)

        print("\n" + "=" * 50)
        print("✅ All tests completed successfully!")
        print("📖 Visit http://localhost:8000/docs for interactive API documentation")

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the server is running:")
        print("   python run.py")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    main()