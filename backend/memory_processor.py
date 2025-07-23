import boto3
from datetime import datetime, timedelta
from collections import Counter

dynamodb = boto3.resource('dynamodb')
memory_table = dynamodb.Table('UserMemory')

def fetch_recent_journals(user_id, days=14):
    """Fetch journal entries of type 'journal' from the past `days`."""
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=days)

    response = memory_table.scan()
    items = response.get("Items", [])
    
    return sorted([
        i for i in items
        if i.get("user_id") == user_id
        and i.get("type") == "journal"
        and datetime.strptime(i['date'], "%Y-%m-%d").date() >= start_date
    ], key=lambda x: x['date'])

def detect_emotion_streaks(entries):
    streaks = []
    if not entries:
        return streaks

    prev = None
    count = 0
    for entry in entries:
        emotion = entry.get("dominant_emotion")
        if emotion == prev:
            count += 1
        else:
            if count >= 3:
                streaks.append((prev, count))
            count = 1
        prev = emotion
    if count >= 3:
        streaks.append((prev, count))
    return streaks

def summarize_emotions(entries):
    emotions = [e['dominant_emotion'] for e in entries if 'dominant_emotion' in e]
    return dict(Counter(emotions))

def store_memory_summary(user_id, streaks, summary):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    memory_table.put_item(Item={
        "user_id": user_id,
        "date": today,
        "type": "memory",
        "summary": {
            "emotion_streaks": streaks,
            "emotion_summary": summary
        }
    })

def process_user_memory(user_id):
    entries = fetch_recent_journals(user_id)
    streaks = detect_emotion_streaks(entries)
    summary = summarize_emotions(entries)
    store_memory_summary(user_id, streaks, summary)

if __name__ == "__main__":
    process_user_memory("demo_user")
