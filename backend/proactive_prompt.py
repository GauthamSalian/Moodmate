from fastapi import APIRouter
from datetime import datetime, timedelta
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

router = APIRouter()

# Connect to DynamoDB
dynamodb = boto3.resource("dynamodb", region_name="ap-south-1")  # use your region

# Tables
journal_table = dynamodb.Table("JournalEntries")
prompt_table = dynamodb.Table("ProactivePrompts")
user_table = dynamodb.Table("UserData")  # optional

# Utils
def today_str():
    return datetime.now().strftime("%Y-%m-%d")

def yesterday_str():
    return (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

def get_user_name(user_id: str) -> str:
    try:
        res = user_table.get_item(Key={"user_id": user_id})
        return res.get("Item", {}).get("name", "there")
    except:
        return "there"

def was_prompt_already_shown(user_id: str, date: str, prompt_type: str = "stress_alert") -> bool:
    res = prompt_table.get_item(Key={"user_id": user_id, "date": date})
    item = res.get("Item")
    return item and item.get("prompt_type") == prompt_type and item.get("shown") == True

def mark_prompt_as_shown(user_id: str, date: str, prompt_type: str = "stress_alert"):
    prompt_table.put_item(
        Item={
            "user_id": user_id,
            "date": date,
            "prompt_type": prompt_type,
            "shown": True
        }
    )

# Main route
@router.get("/check_proactive_prompt")
def check_proactive_prompt(user_id: str):
    today = today_str()
    yesterday = yesterday_str()

    # Step 1: Don't repeat prompt
    if was_prompt_already_shown(user_id, today):
        return {"show_prompt": False, "reason": "already_shown"}

    # Step 2: Check if today's journal exists
    today_journal = journal_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id) & Key("date").eq(today)
    )
    if today_journal.get("Items"):
        return {"show_prompt": False, "reason": "journal_exists"}

    # Step 3: Get latest journal entry (to extract most recent risk_score)
    latest_journal = journal_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False,
        Limit=1
    )
    items = latest_journal.get("Items", [])
    if not items:
        return {"show_prompt": False, "reason": "no_journal_found"}

    latest_entry = items[0]
    risk_score = float(latest_entry.get("risk_score", 0.0))

    if risk_score > 0.7:
        name = get_user_name(user_id)
        mark_prompt_as_shown(user_id, today)
        return {
            "show_prompt": True,
            "message": f"Hey {name}, you seemed stressed yesterday. Want to talk or do a quick breathing exercise?",
            "suggestions": ["Chat with me", "Start breathing exercise"]
        }

    return {"show_prompt": False, "reason": "low_stress"}
