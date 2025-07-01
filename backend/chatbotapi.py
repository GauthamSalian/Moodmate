from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware  # <-- add this import
from pydantic import BaseModel
import httpx, os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Add CORS middleware here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("OPENROUTER_API_KEY")


BASE_PROMPT = """
You are Lumi, a compassionate mental health support assistant. You help users who are feeling stressed, anxious, or overwhelmed.
You are not a medical professional and never offer clinical advice or diagnosis.
Always encourage users to reach out to licensed therapists or mental health hotlines if they are in crisis.
Keep your responses warm, empathetic, and supportive.
"""

class Message(BaseModel):
    user_input: str

@app.post("/chat")
async def chat(message: Message):
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        }

        data = {
            "model": "mistralai/mistral-small-3.2-24b-instruct:free",
            "messages": [
                {"role": "system", "content": BASE_PROMPT.strip()},
                {"role": "user", "content": message.user_input},
            ],
            "temperature": 0.7
        }

        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=data
        )

        result = response.json()
        reply = result['choices'][0]['message']['content']
        return {"response": reply}
