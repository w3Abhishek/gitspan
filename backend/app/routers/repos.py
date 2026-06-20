from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.db import Repo, ForgeAccount, SyncMapping, SyncLog, User

router = APIRouter(tags=["repos"])


class RepoIn(BaseModel):
    name: str
    full_name: str
    source_forge_id: str
    target_forge_ids: list[str]


class SyncMappingOut(BaseModel):
    id: str
    target_forge_id: str
    target_forge_type: str
    enabled: bool


class RepoOut(BaseModel):
    id: str
    name: str
    full_name: str
    source_forge: str
    target_forges: list[str]
    last_synced_at: Optional[str]
    status: str
    error_message: Optional[str] = None
    total_syncs: int


def _repo_status(repo: Repo) -> tuple[str, Optional[str], Optional[str], int]:
    """Returns (status, last_synced_at, error_message, total_syncs)."""
    all_logs: list[SyncLog] = []
    for mapping in repo.sync_mappings:
        all_logs.extend(mapping.sync_logs)

    total = len(all_logs)
    if not all_logs:
        return "pending", None, None, 0

    all_logs.sort(key=lambda l: l.started_at or datetime.min, reverse=True)
    latest = all_logs[0]
    has_error = any(l.status == "error" for m in repo.sync_mappings for l in m.sync_logs
                    if l == (sorted(m.sync_logs, key=lambda x: x.started_at or datetime.min, reverse=True) or [None])[0])
    status = "error" if has_error else "synced"
    last_at = latest.finished_at or latest.started_at
    return status, last_at.isoformat() if last_at else None, latest.error_message, total


def _serialize(repo: Repo) -> RepoOut:
    status, last_at, error_msg, total = _repo_status(repo)
    return RepoOut(
        id=repo.id,
        name=repo.name,
        full_name=repo.full_name,
        source_forge=repo.source_forge_account.type,
        target_forges=[m.target_forge.type for m in repo.sync_mappings if m.enabled],
        last_synced_at=last_at,
        status=status,
        error_message=error_msg,
        total_syncs=total,
    )


@router.get("/repos", response_model=list[RepoOut])
def list_repos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repos = db.query(Repo).filter(Repo.user_id == current_user.id).all()
    return [_serialize(r) for r in repos]


@router.get("/repos/{repo_id}", response_model=RepoOut)
def get_repo(repo_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    return _serialize(repo)


@router.post("/repos", response_model=RepoOut, status_code=201)
def create_repo(body: RepoIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    source = db.query(ForgeAccount).filter(
        ForgeAccount.id == body.source_forge_id,
        ForgeAccount.user_id == current_user.id,
    ).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source forge account not found")

    repo = Repo(user_id=current_user.id, name=body.name, full_name=body.full_name, source_forge_id=body.source_forge_id)
    db.add(repo)
    db.flush()

    for target_id in body.target_forge_ids:
        target = db.query(ForgeAccount).filter(
            ForgeAccount.id == target_id,
            ForgeAccount.user_id == current_user.id,
        ).first()
        if target:
            db.add(SyncMapping(repo_id=repo.id, target_forge_id=target_id))

    db.commit()
    db.refresh(repo)
    return _serialize(repo)


import httpx
from app.core.encryption import decrypt
from app.core.config import settings

def _register_webhook(repo: Repo, backend_url: str):
    source = repo.source_forge_account
    if not source:
        return
        
    token = decrypt(source.access_token)
    webhook_url = f"{backend_url.rstrip('/')}/api/webhooks/{source.type}/{repo.id}"
    
    try:
        if source.type == "github":
            base_api = source.base_url if source.base_url else "https://api.github.com"
            with httpx.Client() as client:
                client.post(
                    f"{base_api}/repos/{repo.full_name}/hooks",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"},
                    json={
                        "name": "web",
                        "active": True,
                        "events": ["push"],
                        "config": {
                            "url": webhook_url,
                            "content_type": "json",
                            "insecure_ssl": "0"
                        }
                    }
                )
    except Exception as e:
        print(f"Failed to auto-register webhook for repo {repo.full_name}: {e}")

class RepoMappingUpdateIn(BaseModel):
    target_forge_ids: list[str]

@router.put("/repos/{repo_id}/mappings", response_model=RepoOut)
def update_repo_mappings(repo_id: str, body: RepoMappingUpdateIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    # Clear existing mapping for this repo 
    db.query(SyncMapping).filter(SyncMapping.repo_id == repo.id).delete()
    
    # Establish new mappings
    was_empty = len(repo.sync_mappings) == 0
    for target_id in body.target_forge_ids:
        target = db.query(ForgeAccount).filter(
            ForgeAccount.id == target_id,
            ForgeAccount.user_id == current_user.id,
        ).first()
        if target:
            db.add(SyncMapping(repo_id=repo.id, target_forge_id=target_id))
            
    db.commit()
    db.refresh(repo)
    
    # If this is the FIRST time we're mapping a destination, automatically install the Webhook!
    if was_empty and body.target_forge_ids:
        _register_webhook(repo, settings.backend_url)
        
    return _serialize(repo)

@router.delete("/repos/{repo_id}", status_code=204)
def delete_repo(repo_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    db.delete(repo)
    db.commit()
