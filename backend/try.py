import requests

res = requests.post("http://localhost:8000/save-health-data", json={
    "user_id": "demo_user",
    "date": "2025-07-21",
    "sleep": 7.5,
    "hrv": 58.3
})
print(res.json())
