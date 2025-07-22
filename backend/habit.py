from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import requests
from fastapi.middleware.cors import CORSMiddleware
from ibm_watsonx_ai.credentials import Credentials
from ibm_watsonx_ai import APIClient
from ibm_watsonx_ai.foundation_models import ModelInference
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 👈 match your frontend port!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()



API_KEY = os.getenv("WATSONX_API_KEY")
credentials = Credentials(
    url="https://eu-de.ml.cloud.ibm.com",  # or regional Watsonx URL
    api_key=os.getenv("WATSONX_API_KEY")
)
client = APIClient(credentials)

guardian_model = ModelInference(
    model_id="ibm/granite-3-3-8b-instruct",  # ⚠️ A supported model with long-term viability
    credentials=credentials,
    project_id="1cb8c38f-d650-41fe-9836-86659006c090",
    params={"decoding_method": "greedy", "max_new_tokens": 100}
)

class HabitInput(BaseModel):
    bad_habit: str

@app.post("/suggest_replacements")
def suggest_replacements(data: HabitInput):
    try:
        prompt = (
            f"Suggest 3 healthy replacement habits for the bad habit: \"{data.bad_habit}\".\n"
            "Make each suggestion concise (max 5 words) and list them as bullet points."
        )

        response = guardian_model.generate(prompt)
        raw = response["results"][0]["generated_text"]

        suggestions = [line.strip("-•* ").strip() for line in raw.split("\n") if line.strip()]
        return {"suggestions": suggestions[:3]}
    except Exception as e:
        print("🧨 Granite LLM Error:", str(e))
        return {"suggestions": ["Take a short walk", "Drink water", "Stretch mindfully"]}
