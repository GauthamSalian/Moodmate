from flask import Blueprint, request, jsonify
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

twitter_analyzer = Blueprint('twitter_analyzer', __name__)
analyzer = SentimentIntensityAnalyzer()

@twitter_analyzer.route('/analyze_twitter', methods=['POST'])
def analyze_twitter():
    data = request.get_json()
    handle = data.get('handle')
    token = data.get('token')  # Bearer token

    if not handle or not token:
        return jsonify({"error": "Handle or token missing"}), 400

    url = f"https://api.twitter.com/2/tweets/search/recent?query=from:{handle}&max_results=10"
    headers = { "Authorization": f"Bearer {token}" }

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "Twitter API fetch failed"}), 500

    tweets = response.json().get("data", [])
    if not tweets:
        return jsonify({"score": 0.1, "message": "No tweets found."})

    stress_scores = []
    for tweet in tweets:
        sentiment = analyzer.polarity_scores(tweet["text"])
        # Score = high when negative sentiment is high and positive is low
        score = max(0, sentiment['neg'] + (1 - sentiment['pos']) / 2)
        stress_scores.append(score)

    avg_stress = sum(stress_scores) / len(stress_scores)
    return jsonify({
        "score": round(avg_stress, 2),
        "tweet_count": len(tweets),
        "tweets": [t["text"] for t in tweets]
    })
