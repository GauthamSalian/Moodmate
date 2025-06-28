import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = "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"  # 🔑 Put your actual OpenRouter key here

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    stress = data.get('stress_context', {})

    # 🧠 Create a hint based on stress
    stress_hint = ""
    if stress.get("voice", 0) > 0.7:
        stress_hint = "The user sounds very stressed."
    elif stress.get("voice", 0) > 0.4:
        stress_hint = "The user seems slightly stressed."
    else:
        stress_hint = "The user sounds calm."

    # 💬 Construct prompt for your AI model
    prompt = f"""
    {stress_hint}
    Respond empathetically to this message:
    {user_message}
    """

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "ibm/granite-13b-chat",
                "messages": [
                    {"role": "system", "content": "You are a mental health support chatbot."},
                    {"role": "user", "content": prompt}
                ]
            }
        )
        reply = res.json()["choices"][0]["message"]["content"]

        # Optional: Log chat
        with open("chat_log.json", "a") as f:
            f.write(json.dumps({
                "timestamp": datetime.utcnow().isoformat(),
                "message": user_message,
                "stress_score": stress.get("voice", 0),
                "input_scores": {},
                "reply": reply
            }) + "\n")

        return jsonify({"reply": reply})

    except Exception as e:
        print("Chat error:", e)
        return jsonify({"reply": "Sorry, I'm having trouble right now."}), 500

if __name__ == "__main__":
    app.run(debug=True)
