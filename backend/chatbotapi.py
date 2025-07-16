import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, os
from dotenv import load_dotenv
from datetime import datetime
import boto3
from uuid import uuid4
load_dotenv()
app = FastAPI()

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # update for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ DynamoDB setup
dynamodb = boto3.resource("dynamodb")
goal_table = dynamodb.Table("UserGoals")

# 🧠 Lumi Assistant Prompt
BASE_PROMPT = """
You are Lumi, a compassionate mental health support assistant. You help users who are feeling stressed, anxious, or overwhelmed.
You are not a medical professional and never offer clinical advice or diagnosis.
Always encourage users to reach out to licensed therapists or mental health hotlines if they are in crisis.
Keep your responses warm, empathetic, and supportive. Keep the responses concise and to the point.
"""

# 📨 Request schema
class Message(BaseModel):
    user_input: str
    user_id: str = "demo_user"

# 🧩 Helper: Detect explicit goal creation request
def is_goal_request(user_input: str) -> bool:
    keywords = ["can you help me", "create a goal", "set a goal", "help me set", "want to start a goal"]
    return any(kw in user_input.lower() for kw in keywords)

# ✅ Create goal if it doesn't exist
def create_goal_if_missing(user_id: str, goal_type: str) -> bool:
    today = datetime.utcnow().strftime("%Y-%m-%d")
    existing = goal_table.scan()
    for item in existing.get("Items", []):
        if item["user_id"] == user_id and item["goal_type"] == goal_type:
            return False  # Already exists
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
    return True


# ✅ Chat route
@app.post("/chat")
async def chat(message: Message, request: Request):
    user_input = message.user_input.strip()
    user_id = message.user_id or "demo_user"
    print(f"🧠 User Input: {user_input}")

    # ✅ Check for goal creation intent
    if is_goal_request(user_input):
        goal_name = "self-care goal"  # You can refine this later with NLP or ask for naming
        created = create_goal_if_missing(user_id, goal_name)
        if created:
            return {"response": f"🌱 I've created your goal: *{goal_name}*. Let’s keep growing together."}
        else:
            return {"response": f"🌿 You already have an active goal: *{goal_name}* today. Keep it up!"}

    # ✅ Goal check-in reminder
    today = datetime.utcnow().strftime("%Y-%m-%d")
    goals = goal_table.scan().get("Items", [])
    for goal in goals:
        if goal["user_id"] == user_id and goal["created_date"] == today and goal["status"] == "active":
            return {"response": f"💭 Just checking in — how’s *{goal['goal_name']}* going today?"}

    # ✅ Fallback to AWS RAG
    full_prompt = f"{BASE_PROMPT.strip()}\n\nUser: {user_input}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://13.203.198.145:8000/query",
                json={"query": full_prompt},
                timeout=10.0
            )
            if response.status_code != 200:
                print("❌ AWS RAG Error:", response.text)
                return {"response": "⚠️ AWS returned an error."}
            data = response.json()
            reply = data.get("answer") or data.get("response") or "🤖 No valid response."
            return {"response": reply.strip()}
    except Exception as e:
        import traceback
        print("🔥 Exception in /chat:", str(e))
        traceback.print_exc()
        return {"response": "🚨 Internal server error. Please try again later."}
