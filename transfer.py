# transfer.py
import sqlite3
import boto3
import json
from decimal import Decimal
from datetime import datetime

def convert_floats_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    else:
        return obj

# ---------- CONFIG ----------
SQLITE_DB_PATH     = "Moodmate\\journal.db"       # <‑‑ double backslashes or use raw string (r"...")
SQLITE_TABLE       = "journal_entries"
DYNAMO_TABLE       = "UserMemory"
AWS_REGION         = "ap-south-1"
FIXED_USER_ID      = "demo_user"                  # constant for now
# -----------------------------

# 1️⃣ Open SQLite
conn = sqlite3.connect(SQLITE_DB_PATH)
cursor = conn.cursor()

# 2️⃣ Connect to DynamoDB
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(DYNAMO_TABLE)

# 3️⃣ Fetch all rows
cursor.execute(f"SELECT * FROM {SQLITE_TABLE}")
columns = [col[0] for col in cursor.description]
rows = cursor.fetchall()

print(f"📦 Found {len(rows)} rows in '{SQLITE_TABLE}'. Migrating…\n")

for row in rows:
    item = dict(zip(columns, row))

    # ➊ Insert fixed partition key and confirm 'id' is present as sort key
    item["user_id"] = FIXED_USER_ID
    if "id" not in item:
        print("❌ Skipping row without 'id':", item)
        continue

    # ➋ Convert 'all_emotions' from JSON string if needed
    if isinstance(item.get("all_emotions"), str):
        try:
            item["all_emotions"] = json.loads(item["all_emotions"])
        except json.JSONDecodeError:
            pass

    # ➌ Convert floats/ints to Decimal
    item = convert_floats_to_decimal(item)

    # ➍ Fix ISO format for 'date' if needed
    if "date" in item:
        try:
            item["date"] = datetime.fromisoformat(str(item["date"])).date().isoformat()
        except Exception:
            pass

    # ➎ Insert into DynamoDB
    try:
        table.put_item(Item=item)
        print(f"✅ Inserted: {item['id']}")
    except Exception as e:
        print(f"❌ Error inserting {item.get('id', 'unknown')}: {e}")

conn.close()
print("\n🎉 Migration complete!")
