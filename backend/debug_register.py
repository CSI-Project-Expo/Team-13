import asyncio, sys, os, uuid
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.core.config import settings
import httpx

TEST_EMAIL = f"regtest_{uuid.uuid4().hex[:6]}@example.com"

LOG = open("verify_fix.log", "w")
def pp(*args):
    msg = " ".join(str(a) for a in args)
    print(msg); LOG.write(msg + "\n"); LOG.flush()

async def main():
    pp("Testing public signup endpoint with email:", TEST_EMAIL)
    signup_url = f"{settings.SUPABASE_URL}/auth/v1/signup"
    headers = {"apikey": settings.SUPABASE_ANON_KEY, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as c:
        r = await c.post(signup_url, headers=headers, json={"email": TEST_EMAIL, "password": "test123"})
    sb_data = r.json()
    pp("Status:", r.status_code)
    sb_user = sb_data.get("user") or sb_data
    supabase_id = sb_user.get("id")
    pp("supabase_id:", supabase_id)
    identities = sb_user.get("identities")
    pp("identities:", identities)
    LOG.close()

asyncio.run(main())
