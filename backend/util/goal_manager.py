# goal_manager.py

import boto3
from datetime import datetime
from uuid import uuid4

dynamodb = boto3.resource('dynamodb')
goal_table = dynamodb.Table('UserGoals')

# --- Goal Schema ---
# {
#   "user_id": "demo_user",
#   "goal_id": "uuid-123",
#   "goal_type": "reduce_stress",
#   "status": "active",
#   "progress": 0,
#   "created_at": "2025-07-15T12:00:00",
#   "last_triggered": null
# }

# 📌 Create goal (optional helper)
def create_goal(user_id: str, goal_type: str):
    goal = {
        "user_id": user_id,
        "goal_id": str(uuid4()),
        "goal_type": goal_type,
        "status": "active",
        "progress": 0,
        "created_at": datetime.utcnow().isoformat(),
        "last_triggered": None
    }
    goal_table.put_item(Item=goal)
    print(f"🎯 Created goal: {goal_type} for {user_id}")
    return goal


# 🔍 Get all active goals
def get_active_goals(user_id: str):
    response = goal_table.scan()
    return [
        item for item in response.get("Items", [])
        if item.get("user_id") == user_id and item.get("status") == "active"
    ]


# ✅ Mark goal complete
def complete_goal(user_id: str, goal_type: str):
    response = goal_table.scan()
    for item in response.get("Items", []):
        if item["user_id"] == user_id and item["goal_type"] == goal_type and item["status"] == "active":
            goal_table.update_item(
                Key={"user_id": item["user_id"], "goal_id": item["goal_id"]},
                UpdateExpression="SET #s = :val",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":val": "completed"}
            )
            print(f"🏁 Completed goal: {goal_type}")
            return True
    return False


# 📈 Increment progress and auto-complete at threshold
def increment_goal_progress(user_id: str, goal_id: str, increment: int = 1, complete_at: int = 3):
    # Increment progress
    goal_table.update_item(
        Key={"user_id": user_id, "goal_id": goal_id},
        UpdateExpression="SET progress = if_not_exists(progress, :zero) + :inc",
        ExpressionAttributeValues={":inc": increment, ":zero": 0}
    )
    print(f"📊 Incremented progress for goal {goal_id}")

    # Check if completed
    goal = goal_table.get_item(Key={"user_id": user_id, "goal_id": goal_id}).get("Item")
    if goal and goal.get("progress", 0) >= complete_at:
        complete_goal(user_id, goal.get("goal_type"))
        return "🎉 Goal completed!"
    return "👍 Progress updated."


# 🧠 Match goal types to logic handlers
def get_goal_response(user_input: str, goal):
    goal_type = goal.get("goal_type")
    goal_id = goal.get("goal_id")
    user_id = goal.get("user_id")
    user_input_lower = user_input.lower()

    if goal_type == "reduce_stress":
        if any(phrase in user_input_lower for phrase in ["calm", "relaxed", "less stressed", "not anxious", "better now"]):
            result = increment_goal_progress(user_id, goal_id)
            if result == "🎉 Goal completed!":
                complete_goal(user_id, goal_type)
            return f"Glad to hear you're feeling better! 🌈 {result}", True
        return "Feeling stressed lately? Let’s try a short breathing exercise 🌬️", True

    elif goal_type == "improve_sleep":
        if any(phrase in user_input_lower for phrase in ["slept well", "good sleep", "went to bed early", "consistent sleep", "slept early", "deep sleep"]):
            result = increment_goal_progress(user_id, goal_id)
            if result == "🎉 Goal completed!":
                complete_goal(user_id, goal_type)
            return f"Tracking your sleep! 💤 {result}", True
        return "Sleep is crucial for your well-being. Did you sleep well recently?", True

    elif goal_type == "boost_social":
        if any(word in user_input_lower for word in ["talked", "call", "met", "friend", "hangout", "socialized", "messaged"]):
            result = increment_goal_progress(user_id, goal_id)
            if result == "🎉 Goal completed!":
                complete_goal(user_id, goal_type)
            return f"That's awesome! Social connections matter 💬 {result}", True
        return "Have you had any meaningful conversations or social time lately?", True

    elif goal_type == "improve_focus":
        if any(word in user_input_lower for word in ["focused", "concentrated", "productive", "avoided distractions"]):
            result = increment_goal_progress(user_id, goal_id)
            if result == "🎉 Goal completed!":
                complete_goal(user_id, goal_type)
            return f"Nice work! Staying focused really pays off. 🔍 {result}", True
        return "How has your focus been lately? Managed to stay on task?", True

    return None, False


