import asyncio, sys, os, uuid, traceback
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

LOG = open("debug_full.log", "w")

def pp(*args):
    msg = " ".join(str(a) for a in args)
    print(msg)
    LOG.write(msg + "\n")
    LOG.flush()

async def check():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    try:
        async with Session() as db:
            r = await db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
            pp("PUBLIC TABLES:", [row[0] for row in r.fetchall()])

            r2 = await db.execute(text(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='users'"
            ))
            pp("users COLUMNS:", [(row[0], row[1]) for row in r2.fetchall()])

            test_id = uuid.uuid4()
            try:
                await db.execute(text(
                    "INSERT INTO users (id, name, role) VALUES (:id, :name, :role)"
                ), {"id": test_id, "name": "TestUser", "role": "user"})
                await db.commit()
                pp("INSERT success with uuid.UUID!")
                await db.execute(text("DELETE FROM users WHERE id=:id"), {"id": test_id})
                await db.commit()
            except Exception as e:
                await db.rollback()
                pp("INSERT FAILED:", type(e).__name__)
                pp("DETAIL:", str(e)[:2000])
    except Exception as e:
        pp("Session error:", type(e).__name__, str(e)[:2000])
        traceback.print_exc(file=LOG)
    finally:
        await engine.dispose()
        LOG.close()

asyncio.run(check())
