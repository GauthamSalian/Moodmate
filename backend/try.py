import os
from dotenv import load_dotenv

# Load .env file
load_dotenv(dotenv_path=r"C:\Users\ASUS\Desktop\MoodMate\Moodmate\backend\.env")  # Adjust if needed

# Debug prints
print("🔍 Checking Environment Variable")
token = os.getenv("TWITTER_BEARER_TOKEN")

if token:
    print("✅ TWITTER_BEARER_TOKEN loaded successfully!")
    print("Token preview (first 10 chars):", token[:10] + "...")
else:
    print("❌ TWITTER_BEARER_TOKEN is missing or empty.")
