from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import json

from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# CORS (Allow React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load LLM key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# ==== Models ====
class SuggestRequest(BaseModel):
    badHabit: str

class QuoteRequest(BaseModel):
    topic: str

# ==== Granite LLM for Habit Suggestion ====
@app.post("/api/suggest")
async def suggest_habit(data: SuggestRequest):
    prompt = f"""Suggest 3 practical, positive replacement habits for the following bad habit:
Bad Habit: "{data.badHabit}"
List them as short bullet points."""

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "openrouter/ibm/granite-13b-chat",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            reply = res.json()["choices"][0]["message"]["content"]
            suggestions = [s.strip("-•* ") for s in reply.splitlines() if s.strip()]
            return {"suggestions": suggestions}
    except Exception as e:
        print("LLM Error:", e)
        return {"suggestions": ["Try a healthier alternative."]}

# ==== RAG Quote Retrieval ====

# Load quotes
with open("quotes.json", "r", encoding="utf-8") as f:
    quotes = json.load(f)

texts = [q["quote"] for q in quotes]
model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(texts)
dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(np.array(embeddings))

@app.post("/api/rag/quote")
def get_quote(data: QuoteRequest):
    try:
        query_vec = model.encode([data.topic])
        D, I = index.search(np.array(query_vec), k=1)
        best_quote = texts[I[0][0]]
        return {"quote": best_quote}
    except Exception as e:
        print("Quote RAG Error:", e)
        return {"quote": "Small habits lead to big change — Atomic Habits"}
