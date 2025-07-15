import boto3
from datetime import datetime, timedelta
from collections import Counter
import re

dynamodb = boto3.resource('dynamodb')
chat_table = dynamodb.Table('ChatMemory')
user_memory_table = dynamodb.Table('UserMemory')

STRESS_KEYWORDS = [
    "tired", "burnout", "exhausted", "anxious", "panic",
    "overwhelmed", "stressed", "hopeless", "can’t cope", "help"
]

def fetch_recent_chats(user_id, days=7):
    start = datetime.utcnow() - timedelta(days=days)
    response = chat_table.scan()
    return [
        item for item in response.get("Items", [])
        if item.get("user_id") == user_id
        and item.get("role") == "user"
        and datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00")) >= start
    ]

def detect_stress_mentions(messages):
    word_counts = Counter()
    matched_messages = []

    for m in messages:
        text = m.get("message", "").lower()
        for keyword in STRESS_KEYWORDS:
            if re.search(rf"\b{keyword}\b", text):
                word_counts[keyword] += 1
                matched_messages.append(text)
    return dict(word_counts), matched_messages

def store_chat_summary(user_id, keyword_summary, matched_messages):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    user_memory_table.put_item(Item={
        "user_id": user_id,
        "date": today,
        "type": "chat_summary",
        "summary": {
            "stress_keywords": keyword_summary,
            "sample_messages": matched_messages[:3]  # limit to a few
        }
    })

def process_chat_memory(user_id):
    chats = fetch_recent_chats(user_id)
    keyword_summary, matched = detect_stress_mentions(chats)
    if keyword_summary:
        store_chat_summary(user_id, keyword_summary, matched)

if __name__ == "__main__":
    process_chat_memory("demo_user")
