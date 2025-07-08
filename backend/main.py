from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from pathlib import Path
import httpx
import os

# ✅ Load API key from .env file
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# ✅ Confirm the API key is loaded
api_key = os.getenv("VITE_OPENROUTER_API_KEY")
print("🔐 Loaded API Key:", api_key[:8] + "..." if api_key else "None")

# ✅ Initialize FastAPI app
app = FastAPI()

# ✅ Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Pydantic model for POST input
class HabitRequest(BaseModel):
    habit: str

# ✅ Route: Suggest atomic habit replacement
@app.post("/api/suggest")
async def suggest_habit(request: HabitRequest):
    api_key = os.getenv("VITE_OPENROUTER_API_KEY")
    if not api_key:
        return {"error": "❌ Missing OpenRouter API key"}

    prompt = (
        f"I'm trying to change this habit: '{request.habit}'. "
        "Based on the principles of Atomic Habits by James Clear, suggest a better habit I can replace it with. "
        "Keep it short, actionable, and motivational."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",  # Replace if needed
        "X-Title": "MoodMate HabitFlow"
    }

    payload = {
        "model": "mistral:instruct",
        "messages": [
            {"role": "system", "content": "You are a helpful and motivational habit coach."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload
            )

        if response.status_code != 200:
            print("❌ OpenRouter Error:", response.text)
            return {"error": "OpenRouter request failed", "status": response.status_code}

        data = response.json()
        suggestion = data["choices"][0]["message"]["content"]
        return {"suggestion": suggestion.strip()}

    except Exception as e:
        print("🔥 Exception:", str(e))
        return {"error": "Internal server error", "detail": str(e)}
