from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db import Repo, ForgeAccount, SyncLog, SyncMapping, User

router = APIRouter(tags=["stats"])


class StatsOut(BaseModel):
    total_repos: int
    connected_forges: int
    sync_errors: int
    synced: int
    pending: int
    total_syncs_today: int


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repos = db.query(Repo).filter(Repo.user_id == current_user.id).all()
    forges = db.query(ForgeAccount).filter(ForgeAccount.user_id == current_user.id).count()

    synced = pending = errors = 0
    for repo in repos:
        all_logs = [l for m in repo.sync_mappings for l in m.sync_logs]
        if not all_logs:
            pending += 1
            continue
        latest = max(all_logs, key=lambda l: l.started_at or __import__('datetime').datetime.min)
        if latest.status == "error":
            errors += 1
        elif latest.status == "synced":
            synced += 1
        else:
            pending += 1

    from datetime import datetime, timezone, timedelta
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_syncs_today = db.query(SyncLog).filter(SyncLog.started_at >= today_start).count()

    return StatsOut(
        total_repos=len(repos),
        connected_forges=forges,
        sync_errors=errors,
        synced=synced,
        pending=pending,
        total_syncs_today=total_syncs_today,
    )
