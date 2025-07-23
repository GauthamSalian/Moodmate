import boto3
from datetime import datetime
from uuid import uuid4

dynamodb = boto3.resource('dynamodb')
user_memory_table = dynamodb.Table('UserMemory')
user_goals_table = dynamodb.Table('UserGoals')  # You need to create this

def fetch_latest_memory(user_id: str, type_filter: str):
    """Fetch the latest memory summary of a given type."""
    response = user_memory_table.scan()
    items = [
        item for item in response.get("Items", [])
        if item.get("user_id") == user_id and item.get("type") == type_filter
    ]
    if not items:
        return None
    return sorted(items, key=lambda x: x["date"], reverse=True)[0]

def check_stress_from_journal(memory):
    """Detect emotion streaks like 3+ 'sad' days in a row."""
    streaks = memory.get("summary", {}).get("emotion_streaks", [])
    for emotion, count in streaks:
        if emotion in ["sad", "anxious", "angry"] and count >= 3:
            return f"{emotion} streak of {count} days"
    return None

def check_stress_from_chat(chat_summary):
    """Detect if repeated stress keywords appeared in chat."""
    keywords = chat_summary.get("summary", {}).get("stress_keywords", {})
    total = sum(keywords.values())
    if total >= 3:
        return f"{total} stress-related chat mentions"
    return None

def goal_exists(user_id: str, goal_type: str) -> bool:
    """Check if a goal is already active."""
    response = user_goals_table.scan()
    for item in response.get("Items", []):
        if (
            item.get("user_id") == user_id
            and item.get("goal_type") == goal_type
            and item.get("status") == "active"
        ):
            return True
    return False

def create_goal(user_id: str, goal_type: str, reason: str):
    """Create a new goal entry."""
    user_goals_table.put_item(Item={
        "user_id": user_id,
        "goal_id": str(uuid4()),
        "goal_type": goal_type,
        "status": "active",
        "created_at": datetime.utcnow().isoformat(),
        "reason": reason
    })
    print(f"✅ Goal '{goal_type}' triggered for {user_id} → Reason: {reason}")

def run_agent_brain(user_id: str):
    journal_summary = fetch_latest_memory(user_id, "memory")
    chat_summary = fetch_latest_memory(user_id, "chat_summary")

    if journal_summary:
        reason = check_stress_from_journal(journal_summary)
        if reason and not goal_exists(user_id, "reduce_stress"):
            create_goal(user_id, "reduce_stress", reason)

    if chat_summary:
        reason = check_stress_from_chat(chat_summary)
        if reason and not goal_exists(user_id, "reduce_stress"):
            create_goal(user_id, "reduce_stress", reason)

if __name__ == "__main__":
    run_agent_brain("demo_user")
