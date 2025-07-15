import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timedelta

dynamodb = boto3.resource("dynamodb")
chat_table = dynamodb.Table("ChatMemory")

def fetch_recent_chat(user_id: str, limit: int = 6) -> str:
    # Fetch latest chat turns from ChatMemory for user
    response = chat_table.query(
        KeyConditionExpression=Key("user_id").eq(user_id),
        ScanIndexForward=False,  # descending order
        Limit=limit
    )
    items = sorted(response.get("Items", []), key=lambda x: x["timestamp"])  # order chronologically

    chat_history = ""
    for item in items:
        role = item["role"].capitalize()
        msg = item["message"].strip()
        chat_history += f"{role}: {msg}\n"

    return chat_history.strip()
