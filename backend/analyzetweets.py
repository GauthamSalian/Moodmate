import os
import torch
import re
import json
import requests
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict, Counter
from dotenv import load_dotenv
load_dotenv()
BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
print("BEARER_TOKEN:", "Loaded" if BEARER_TOKEN else "Missing or Empty")

emotion_analyzer = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    #top_k=1
)

model_path_name = "ibm-granite/granite-guardian-3.2-3b-a800m"
safe_token = "No"
risky_token = "Yes"

tokenizer = AutoTokenizer.from_pretrained(model_path_name)
model = AutoModelForCausalLM.from_pretrained(
    model_path_name,
    torch_dtype=torch.float16,
    device_map="auto",
    max_memory={0: "5GB"}
)
model.eval()

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

def get_user_tweets(user_id, max_results=5):
    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    params = {
        "max_results": max_results,
        "tweet.fields": "created_at,text",
    }
    response = requests.get(url, headers=headers, params=params)
    resp_json = response.json()
    if "data" in resp_json:
        return resp_json["data"]
    else:
        return []

def analyze_tweet(text):
    messages = [{"role": "user", "content": text}]
    guardian_config = {"risk_name": "harm"}
    inputs = tokenizer.apply_chat_template(
        messages,
        guardian_config=guardian_config,
        add_generation_prompt=True,
        return_tensors="pt",
        return_dict=True
    )
    input_ids = inputs["input_ids"]

    with torch.no_grad():
        outputs = model(input_ids=input_ids)
        next_token_logits = outputs.logits[0, -1, :]

    yes_token_id = tokenizer.encode(risky_token, add_special_tokens=False)[0]
    no_token_id = tokenizer.encode(safe_token, add_special_tokens=False)[0]
    probs = torch.softmax(next_token_logits[[no_token_id, yes_token_id]], dim=0)
    prob_safe = probs[0].item()
    prob_risk = probs[1].item()

    with torch.no_grad():
        gen_output = model.generate(
            input_ids=input_ids,
            do_sample=False,
            max_new_tokens=20,
            return_dict_in_generate=True,
            output_scores=True,
        )
    output_text = tokenizer.decode(gen_output.sequences[0][input_ids.shape[1]:], skip_special_tokens=True)
    confidence_match = re.search(r'<confidence>(.*?)</confidence>', output_text)
    confidence_str = confidence_match.group(1).strip() if confidence_match else "Unknown"
    label = "Yes" if prob_risk > prob_safe else "No"
    return {
        "risk_detected": label,
        "confidence": confidence_str,
        "probability_of_risk": prob_risk
    }

def extract_emotion_words(tweets):
    emotion_counts = defaultdict(Counter)
    for tweet in tweets:
        text = tweet["text"]
        try:
            result = emotion_analyzer(text)
            if isinstance(result, list) and isinstance(result[0], list):
                result = result[0]
            emotion = result[0]["label"]
            if emotion.lower() == "neutral":
                continue
        except Exception as e:
            print(f"Emotion analysis failed for tweet: {text}\nError: {e}")
            continue

        words = [
            word.strip("#@,.!?").lower()
            for word in text.split()
            if len(word) > 2
        ]
        for word in words:
            emotion_counts[emotion][word] += 1

    return {
        emotion: dict(counter.most_common(30))
        for emotion, counter in emotion_counts.items()
    }


@app.get("/analyze_tweets/{username}")
def analyze_tweets(username: str, max_results: int = 5):
    try:
        user_id = get_user_id(username)
        tweets = get_user_tweets(user_id, max_results=max_results)
        tweet_data = [{"date": tweet["created_at"], "text": tweet["text"]} for tweet in tweets]
        results = []
        for tweet in tweet_data:
            result = analyze_tweet(tweet["text"])
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
    
@app.get("/wordcloud_data/{username}")
def generate_wordcloud_data(username: str, max_results: int = 10):
    try:
        user_id = get_user_id(username)
        tweets = get_user_tweets(user_id, max_results=max_results)
        tweet_data = [{"text": tweet["text"]} for tweet in tweets]
        wordcloud_data = extract_emotion_words(tweet_data)
        return {"wordcloud": wordcloud_data}
    except Exception as e:
        return {"error": str(e)}

@app.get("/analyze_all/{username}")
def analyze_all(username: str, max_results: int = 5):
    try:
        user_id = get_user_id(username)
        tweets = get_user_tweets(user_id, max_results=max_results)

        tweet_data = [{"date": tweet["created_at"], "text": tweet["text"]} for tweet in tweets]

        results = []
        for tweet in tweet_data:
            result = analyze_tweet(tweet["text"])
            results.append({
                "date": tweet["date"],
                "text": tweet["text"],
                **result
            })

        wordcloud_data = extract_emotion_words(tweet_data)

        return {
            "risk_analysis": results,
            "wordcloud": wordcloud_data
        }
    except Exception as e:
        return {"error": str(e)}
