import os
import torch
import re
import json
import requests
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.credentials import Credentials
from ibm_watsonx_ai import APIClient
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict, Counter
from dotenv import dotenv_values
import boto3

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

# Step 1: Load env values from file
env_vars = dotenv_values(r"C:\Users\ASUS\Desktop\MoodMate\Moodmate\backend\.env")

# Step 2: Inject them into os.environ
for key, value in env_vars.items():
    os.environ[key] = value

# Step 3: Now retrieve using os.getenv()
BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
print("BEARER_TOKEN:", "Loaded" if BEARER_TOKEN else "Missing or Empty")



safe_token = "No"
risky_token = "Yes"

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

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_user_id(username):
    url = f"https://api.twitter.com/2/users/by/username/{username}"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    response = requests.get(url, headers=headers)
    resp_json = response.json()
    if "data" in resp_json:
        return resp_json["data"]["id"]
    else:
        raise Exception(f"User not found or API error: {resp_json}")

def store_analysis(tweet_id, text, harm, confidence, comment):
    table = dynamodb.Table('TweetRiskAnalysis')

    existing_item = table.get_item(Key={'tweet_id': tweet_id})
    if 'Item' in existing_item:
        print(f"⚠️ Tweet {tweet_id} already exists in DB. Skipping.")
        return {"status": "skipped", "reason": "already exists"}
    
    response = table.put_item(Item={
        'tweet_id': tweet_id,
        'text': text,
        'risk_detected': harm,
        'confidence_score': confidence,
        'explanation': comment
    })
    return response


def get_user_tweets(user_id, max_results=5):
    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    params = {
        "max_results": max_results,
        "tweet.fields": "created_at,text",
    }
    response = requests.get(url, headers=headers, params=params)
    resp_json = response.json()
    print("Response JSON:", json.dumps(resp_json, indent=2))  # Debugging line
    if "data" in resp_json:
        return resp_json["data"]
    else:
        return []

def analyze_tweet(tweet_id, text):
    try:
        prompt = f"""
            <risk_evaluation>
            <text>{text}</text>

            Analyze this text for emotional or psychological risk. Respond using structured XML format:

            <harm>[Yes or No]</harm>
            <confidence>[Numeric probability between 0.0 (no risk) and 1.0 (high risk)]</confidence>
            <comment>[Brief reason why the risk was assessed]</comment>

            Your confidence score should directly reflect the probability of risk based on language, tone, and context.
            </risk_evaluation>
            """


        response = guardian_model.generate(prompt)
        result_text = response['results'][0]['generated_text']
        print("Generated Text:", result_text)

        label_match = re.search(r"<harm>(.*?)</harm>", result_text)
        confidence_match = re.search(r"<confidence>(.*?)</confidence>", result_text)
        explanation_match = re.search(r"<comment>(.*?)</comment>", result_text)

        label = label_match.group(1).strip() if label_match else "Unknown"
        confidence_str = confidence_match.group(1).strip() if confidence_match else "Unknown"
        explanation = explanation_match.group(1).strip() if explanation_match else "Not provided"

        try:
            probability_of_risk = float(confidence_str)
        except ValueError:
            probability_of_risk = 0.0
        tweet_id = str(tweet_id) if tweet_id else "unknown_id"
        store_analysis(tweet_id, text, label, confidence_str, explanation)

        return {
            "text": text,
            "risk_detected": label,
            "confidence": confidence_str,
            "probability_of_risk": probability_of_risk,
            "explanation": explanation
        }

    except Exception as e:
        return {
            "text": text,
            "risk_detected": "Unknown",
            "confidence": "Unknown",
            "probability_of_risk": 0.0,
        }

@app.get("/analyze_tweets/{username}")
def analyze_tweets(username: str, max_results: int = 5):
    try:
        user_id = get_user_id(username)
        tweets = get_user_tweets(user_id, max_results=max_results)
        tweet_data = [{"id": tweet["id"], "date": tweet["created_at"], "text": tweet["text"]} for tweet in tweets]
        results = []
        for tweet in tweet_data:
            result = analyze_tweet(tweet["id"], tweet["text"])
            results.append({
                "date": tweet["date"],
                "text": tweet["text"],
                **result
            })
        if not results:
            return {"error": "Try again later"}
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}
    

@app.get("/analyze_all/{username}")
def analyze_all(username: str, max_results: int = 5):
    try:
        user_id = get_user_id(username)
        tweets = get_user_tweets(user_id, max_results=max_results)

        tweet_data = [{"id": tweet["id"], "date": tweet["created_at"], "text": tweet["text"]} for tweet in tweets]

        results = []
        for tweet in tweet_data:
            result = analyze_tweet(tweet["id"], tweet["text"])
            results.append({
                "date": tweet["date"],
                "text": tweet["text"],
                **result
            })


        return {
            "risk_analysis": results,
        }
    except Exception as e:
        return {"error": str(e)}
