"""Reminder system routes"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import uuid4
import asyncio

router = APIRouter()

# Pydantic models
class Reminder(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    reminder_type: str  # medication, appointment, measurement, exercise
    frequency: str  # once, daily, weekly, monthly
    scheduled_time: datetime
    is_active: bool = True
    completed_at: Optional[datetime] = None
    created_at: datetime

class CreateReminderRequest(BaseModel):
    user_id: str
    title: str
    description: str
    reminder_type: str
    frequency: str
    scheduled_time: datetime

class HealthMetricReminder(BaseModel):
    id: str
    user_id: str
    metric_type: str  # blood_pressure, weight, blood_sugar, temperature
    target_value: Optional[Dict[str, Any]] = None
    frequency: str = "daily"
    reminder_time: str  # HH:MM format
    is_active: bool = True
    last_reminded: Optional[datetime] = None

# In-memory storage (replace with database in production)
reminders_db: Dict[str, Reminder] = {}
health_metrics_db: Dict[str, HealthMetricReminder] = {}

@router.post("/", response_model=Reminder)
async def create_reminder(request: CreateReminderRequest) -> Reminder:
    """Create a new reminder"""

    reminder_id = str(uuid4())

    reminder = Reminder(
        id=reminder_id,
        user_id=request.user_id,
        title=request.title,
        description=request.description,
        reminder_type=request.reminder_type,
        frequency=request.frequency,
        scheduled_time=request.scheduled_time,
        created_at=datetime.utcnow()
    )

    reminders_db[reminder_id] = reminder

    # Schedule the reminder (mock implementation)
    await schedule_reminder(reminder)

    return reminder

@router.get("/user/{user_id}")
async def get_user_reminders(user_id: str) -> List[Reminder]:
    """Get all reminders for a user"""
    user_reminders = [r for r in reminders_db.values() if r.user_id == user_id]
    return user_reminders

@router.put("/{reminder_id}")
async def update_reminder(reminder_id: str, updates: Dict[str, Any]) -> Reminder:
    """Update a reminder"""
    if reminder_id not in reminders_db:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder = reminders_db[reminder_id]

    # Update fields
    for key, value in updates.items():
        if hasattr(reminder, key):
            setattr(reminder, key, value)

    return reminder

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: str) -> Dict[str, str]:
    """Delete a reminder"""
    if reminder_id not in reminders_db:
        raise HTTPException(status_code=404, detail="Reminder not found")

    del reminders_db[reminder_id]
    return {"message": "Reminder deleted successfully"}

@router.post("/health-metrics")
async def setup_health_metric_reminder(
    user_id: str,
    metric_type: str,
    reminder_time: str,
    frequency: str = "daily"
) -> HealthMetricReminder:
    """Setup reminder for health metric measurements"""

    reminder_id = str(uuid4())

    metric_reminder = HealthMetricReminder(
        id=reminder_id,
        user_id=user_id,
        metric_type=metric_type,
        frequency=frequency,
        reminder_time=reminder_time
    )

    health_metrics_db[reminder_id] = metric_reminder

    return metric_reminder

@router.get("/health-metrics/{user_id}")
async def get_health_metric_reminders(user_id: str) -> List[HealthMetricReminder]:
    """Get health metric reminders for a user"""
    user_metrics = [m for m in health_metrics_db.values() if m.user_id == user_id]
    return user_metrics

@router.post("/complete/{reminder_id}")
async def complete_reminder(reminder_id: str) -> Dict[str, str]:
    """Mark a reminder as completed"""
    if reminder_id not in reminders_db:
        raise HTTPException(status_code=404, detail="Reminder not found")

    reminder = reminders_db[reminder_id]
    reminder.completed_at = datetime.utcnow()

    # If it's a recurring reminder, schedule next occurrence
    if reminder.frequency != "once":
        await schedule_next_reminder(reminder)

    return {"message": "Reminder marked as completed"}

@router.get("/due/{user_id}")
async def get_due_reminders(user_id: str) -> List[Reminder]:
    """Get reminders that are due for a user"""
    now = datetime.utcnow()
    due_reminders = []

    for reminder in reminders_db.values():
        if (reminder.user_id == user_id and
            reminder.is_active and
            reminder.scheduled_time <= now and
            reminder.completed_at is None):
            due_reminders.append(reminder)

    return due_reminders

async def schedule_reminder(reminder: Reminder):
    """Mock reminder scheduling - replace with actual scheduling system"""
    # In production, use celery, apscheduler, or similar
    print(f"Scheduled reminder: {reminder.title} for {reminder.scheduled_time}")

async def schedule_next_reminder(reminder: Reminder):
    """Schedule the next occurrence of a recurring reminder"""
    if reminder.frequency == "daily":
        reminder.scheduled_time = reminder.scheduled_time + timedelta(days=1)
    elif reminder.frequency == "weekly":
        reminder.scheduled_time = reminder.scheduled_time + timedelta(weeks=1)
    elif reminder.frequency == "monthly":
        reminder.scheduled_time = reminder.scheduled_time + timedelta(days=30)

    reminder.completed_at = None
    await schedule_reminder(reminder)

# Background task for checking due reminders (mock implementation)
async def check_due_reminders():
    """Background task to check and send reminders"""
    while True:
        now = datetime.utcnow()

        # Check regular reminders
        for reminder in reminders_db.values():
            if (reminder.is_active and
                reminder.scheduled_time <= now and
                reminder.completed_at is None):
                # Send notification (mock)
                print(f"Sending reminder notification: {reminder.title}")

        # Check health metric reminders
        for metric in health_metrics_db.values():
            if metric.is_active:
                # Check if it's time to remind
                reminder_hour = int(metric.reminder_time.split(":")[0])
                reminder_minute = int(metric.reminder_time.split(":")[1])

                if (now.hour == reminder_hour and
                    now.minute == reminder_minute and
                    (metric.last_reminded is None or
                     (now - metric.last_reminded).days >= 1)):
                    # Send health metric reminder
                    print(f"Sending health metric reminder: {metric.metric_type}")
                    metric.last_reminded = now

        await asyncio.sleep(60)  # Check every minute