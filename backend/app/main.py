import asyncio
from contextlib import asynccontextmanager
from anyio import to_thread
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import repos, forges, sync, auth, stats
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.models.db import Base, SyncMapping

# Create tables on startup (idempotent - use Alembic for migrations in prod)
Base.metadata.create_all(bind=engine)

async def auto_sync_poller():
    """Background loop that automatically Pings/Syncs every 60 minutes for non-webhook repos"""
    while True:
        await asyncio.sleep(3600)  # Wait 60 minutes between global sync sweeps
        print("Starting scheduled background sync sweep...")
        db = SessionLocal()
        try:
            # Find all active mappings
            mappings = db.query(SyncMapping).filter(SyncMapping.enabled == True).all()
            for mapping in mappings:
                try:
                    # Execute synchronous git commands in a worker thread to prevent blocking the FastAPI ASGI loop
                    await to_thread.run_sync(sync._run_sync, mapping.id, settings.database_url)
                except Exception as ex:
                    print(f"Auto-sync failed for mapping {mapping.id}: {ex}")
        except Exception as e:
            print(f"Global sync poller error: {e}")
        finally:
            db.close()
            print("Scheduled background sync sweep finished.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the continuous polling loop when the server boots
    poller_task = asyncio.create_task(auto_sync_poller())
    yield
    # Cancel the loop when the server is deliberately stopped
    poller_task.cancel()

app = FastAPI(title="GitSpan API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(repos.router, prefix="/api")
app.include_router(forges.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
app.include_router(stats.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}

