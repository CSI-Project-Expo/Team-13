import os
import requests
from dotenv import load_dotenv


# Load environment variables from .env
load_dotenv()

print("SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("SUPABASE_ANON_KEY:", os.getenv("SUPABASE_ANON_KEY"))
print("TEST_EMAIL:", os.getenv("TEST_EMAIL"))
print("TEST_PASSWORD:", os.getenv("TEST_PASSWORD"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
TEST_EMAIL = "genie1@gmail.com"
TEST_PASSWORD = "genie1"



if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL not found in .env")

if not SUPABASE_ANON_KEY:
    raise ValueError("SUPABASE_ANON_KEY not found in .env")

if not TEST_EMAIL or not TEST_PASSWORD:
    raise ValueError("TEST_EMAIL or TEST_PASSWORD not found in .env")

# Supabase login endpoint
login_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
print("Final login URL:", login_url)

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
}

# Try with SSL verification disabled for testing
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

payload = {
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD
}

print("Attempting login...\n")

# Try with SSL verification disabled
response = requests.post(login_url, headers=headers, json=payload, verify=False)

if response.status_code != 200:
    print("❌ Login failed!")
    print("Status Code:", response.status_code)
    print("Response:", response.json())
else:
    result = response.json()
    access_token = result.get("access_token")

    print("✅ Login successful!\n")
    print("Access Token:\n")
    print(access_token)
    print("\nUse this in Swagger as:")
    print(f"Bearer {access_token}")


import urllib.parse
print("\nURL Encoded Password:")
print(urllib.parse.quote("!-@EiAd7$NLq-"))