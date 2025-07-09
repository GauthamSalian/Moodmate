import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx, os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow CORS from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # update in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base prompt for Lumi, the assistant
BASE_PROMPT = """
You are Lumi, a compassionate mental health support assistant. You help users who are feeling stressed, anxious, or overwhelmed.
You are not a medical professional and never offer clinical advice or diagnosis.
Always encourage users to reach out to licensed therapists or mental health hotlines if they are in crisis.
Keep your responses warm, empathetic, and supportive. Keep the responses concise and to the point.
"""

# Define request schema
class Message(BaseModel):
    user_input: str

# Route: POST /chat — Handles frontend chat input and calls AWS Agentic RAG
@app.post("/chat")
async def chat(message: Message, request: Request):
    user_input = message.user_input.strip()
    print(f"🧠 User Input: {user_input}")

    full_prompt = f"{BASE_PROMPT.strip()}\n\nUser: {user_input}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://3.110.177.155:8000/query",
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
