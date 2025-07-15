from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, os
from dotenv import load_dotenv
import boto3
from datetime import datetime
from Moodmate.backend.chatmemory_utils import fetch_recent_chat
from Moodmate.backend.util.goal_manager import get_active_goals, get_goal_response, complete_goal, increment_goal_progress


load_dotenv()
app = FastAPI()

# Allow CORS from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PROMPT = """
You are Lumi, a compassionate mental health support assistant. You help users who are feeling stressed, anxious, or overwhelmed.
You are not a medical professional and never offer clinical advice or diagnosis.
Always encourage users to reach out to licensed therapists or mental health hotlines if they are in crisis.
Keep your responses warm, empathetic, and supportive. Keep the responses concise and to the point.
"""

class Message(BaseModel):
    user_input: str
    user_id: str = "demo_user"  # Default for now

# === Goal functions ===
dynamodb = boto3.resource('dynamodb')
goal_table = dynamodb.Table('UserGoals')
chat_table = dynamodb.Table("ChatMemory")


def save_to_memory(user_id: str, role: str, content: str):
    timestamp = datetime.utcnow().isoformat()
    chat_table.put_item(Item={
        "user_id": user_id,
        "timestamp": timestamp,
        "message_role": role,  # "user" or "assistant"
        "content": content
    })

def get_chat_history(user_id: str, limit: int = 10):
    response = chat_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('user_id').eq(user_id),
        ScanIndexForward=False,  # newest first
        Limit=limit
    )
    return response.get("Items", [])


# === Chat Route ===
@app.post("/chat")
async def chat(message: Message, request: Request):
    user_input = message.user_input.strip()
    user_id = message.user_id
    print(f"🧠 User Input: {user_input}")
    save_to_memory(user_id, "user", user_input)

    # 🧠 Check for active goals and respond if needed
    active_goals = get_active_goals(user_id)
    for goal in active_goals:
        goal_response, is_proactive = get_goal_response(user_input, goal)
        if is_proactive and goal_response:
            save_to_memory(user_id, "assistant", goal_response)
            return {"response": goal_response, "proactive": True}

    # 🧠 Fetch recent memory to build RAG context
    recent_history = fetch_recent_chat(user_id)
    full_prompt = f"{BASE_PROMPT.strip()}\n\nRecent conversation:\n{recent_history}\n\nUser: {user_input}"

    # 🧠 Query AWS RAG
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://13.233.159.152:8000/query",
                json={"query": full_prompt},
                timeout=30.0
            )

            if response.status_code != 200:
                print("❌ AWS RAG Error:", response.text)
                return {"response": "⚠️ AWS returned an error."}

            data = response.json()
            reply = data.get("answer") or data.get("response") or "🤖 No valid response."
            save_to_memory(user_id, "assistant", reply)
            return {"response": reply.strip()}

    except Exception as e:
        import traceback
        print("🔥 Exception in /chat:", str(e))
        traceback.print_exc()
        return {"response": "🚨 Internal server error. Please try again later."}
