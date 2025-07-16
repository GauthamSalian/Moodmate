from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, os, difflib
from dotenv import load_dotenv
from datetime import datetime
from .chatmemory_utils import fetch_recent_chat
from .util.goal_manager import (
    create_goal,
    get_active_goals,
    get_goal_response,
    complete_goal,
    increment_goal_progress
)

load_dotenv()
app = FastAPI()

# ✅ CORS settings for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🧠 Prompt foundation
BASE_PROMPT = """
You are Lumi, a compassionate mental health support assistant. You help users who are feeling stressed, anxious, or overwhelmed.
You are not a medical professional and never offer clinical advice or diagnosis.
Always encourage users to reach out to licensed therapists or mental health hotlines if they are in crisis.
Keep your responses warm, empathetic, and supportive. Keep the responses concise and to the point preferrably not more than 2 sentences.
"""

# 🗂️ Allowed goal categories
allowed_goal_types = ["reduce_stress", "improve_sleep", "boost_social", "improve_focus"]
recent_suggestions = {}  # {user_id: {"goal_type": ..., "intent": ...}}

# 💾 DynamoDB Tables
import boto3
dynamodb = boto3.resource('dynamodb')
goal_table = dynamodb.Table('UserGoals')
chat_table = dynamodb.Table("ChatMemory")

# 📬 Request model
class Message(BaseModel):
    user_input: str
    user_id: str = "demo_user"

# 🧠 Save conversation memory
def save_to_memory(user_id: str, role: str, content: str):
    timestamp = datetime.utcnow().isoformat()
    chat_table.put_item(Item={
        "user_id": user_id,
        "timestamp": timestamp,
        "message_role": role,
        "content": content
    })

# 🧠 Check if user input is an affirmation
def is_affirmation(text: str) -> bool:
    affirmations = ["yes", "sure", "okay", "ok", "let's do it", "sounds good", "why not"]
    return bool(difflib.get_close_matches(text.lower(), affirmations, n=1, cutoff=0.8))

# 🤖 Detect goal from user input
async def detect_goal_from_text(user_input: str) -> list[str]:
    prompt = f"""
You're an intent classifier. The user said: "{user_input}"
Which of these goals best matches their intent?
Return one or more from this list (comma-separated), or 'None':
- reduce_stress
- improve_sleep
- boost_social
- improve_focus
"""
    async with httpx.AsyncClient() as client:
        res = await client.post("http://3.7.55.74:8000/query", json={"query": prompt}, timeout=30.0)
        detected = res.json().get("answer", "").lower().strip()
        if detected == "none":
            return []
        return [g.strip() for g in detected.split(",") if g.strip() in allowed_goal_types]

# 🌟 Chat endpoint
@app.post("/chat")
async def chat(message: Message, request: Request):
    user_input = message.user_input.strip()
    user_id = message.user_id or "demo_user"
    print(f"🗣️ User Input: {user_input}")
    save_to_memory(user_id, "user", user_input)

    # ✅ Handle affirmations (e.g., "yes" after a suggestion)
    if is_affirmation(user_input):
        suggested = recent_suggestions.get(user_id)
        if suggested:
            goal_type = suggested["goal_type"]
            intent = suggested.get("intent", "suggest")

            try:
                if intent == "create":
                    create_goal(user_id, goal_type)
                    response = f"🎯 Goal for *{goal_type.replace('_', ' ')}* created and saved! I’ll help you stay on track."
                else:
                    response = f"Okay! Let me know if you want to start working on *{goal_type.replace('_', ' ')}*, and I’ll create the goal."
            except Exception as e:
                print("💥 Goal creation error:", str(e))
                response = "⚠️ Something went wrong while creating your goal. Let’s try again."

            save_to_memory(user_id, "assistant", response)
            del recent_suggestions[user_id]
            return {"response": response, "proactive": True}

    # 🎯 Goal detection
    detected_goals = await detect_goal_from_text(user_input)
    if detected_goals:
        active_goals = get_active_goals(user_id)
        active_types = [goal['goal_type'] for goal in active_goals]

        for g in detected_goals:
            if g not in active_types:
                intent = "create" if any(kw in user_input.lower() for kw in ["set", "create", "start", "begin", "track"]) else "suggest"
                recent_suggestions[user_id] = {"goal_type": g, "intent": intent}
                response = (
                    f"Got it! You want to start a goal on {g.replace('_', ' ')}. Should I go ahead and set that up?"
                    if intent == "create"
                    else f"It sounds like you might want to work on {g.replace('_', ' ')}. Would you like me to set a goal for that?"
                )
                save_to_memory(user_id, "assistant", response)
                return {"response": response, "suggested_goal": g, "proactive": True}

    # 💡 Proactive goal support
    active_goals = get_active_goals(user_id)
    for goal in active_goals:
        goal_response, is_proactive = get_goal_response(user_input, goal)
        if is_proactive and goal_response:
            save_to_memory(user_id, "assistant", goal_response)
            return {"response": goal_response, "proactive": True}

    # 🔍 RAG fallback with history
    recent_history = fetch_recent_chat(user_id)
    full_prompt = f"{BASE_PROMPT.strip()}\n\nRecent conversation:\n{recent_history}\n\nUser: {user_input}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post("http://3.7.55.74:8000/query", json={"query": full_prompt}, timeout=30.0)
            reply = response.json().get("answer") or response.json().get("response") or "🤖 No valid response."
            save_to_memory(user_id, "assistant", reply)
            return {"response": reply.strip()}
    except Exception as e:
        import traceback
        print("🔥 Exception in /chat:", str(e))
        traceback.print_exc()
        return {"response": "🚨 Internal server error. Please try again later."}
