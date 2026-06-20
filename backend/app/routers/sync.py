import subprocess
import tempfile
import shutil
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.encryption import decrypt
from app.models.db import Repo, SyncMapping, SyncLog, ForgeAccount, User

router = APIRouter(tags=["sync"])


class SyncLogOut(BaseModel):
    id: str
    repo_id: str
    repo_name: str
    source_forge: str
    target_forge: str
    status: str
    error_message: Optional[str]
    started_at: str
    finished_at: Optional[str]


class SyncResult(BaseModel):
    repo_id: str
    status: str
    message: str


def _forge_clone_url(forge: ForgeAccount, full_name: str) -> str:
    token = decrypt(forge.access_token)
    base = forge.base_url or _default_base(forge.type)
    # HTTPS clone URL with embedded token
    host = base.replace("https://", "").replace("http://", "").rstrip("/")
    return f"https://{forge.username}:{token}@{host}/{full_name}.git"


def _default_base(forge_type: str) -> str:
    bases = {
        "github": "https://github.com",
        "gitlab": "https://gitlab.com",
        "codeberg": "https://codeberg.org",
        "gitgay": "https://git.gay",
        "sourcehut": "https://git.sr.ht",
        "forgejo": "https://forgejo.org",
    }
    return bases.get(forge_type, "https://github.com")


def _create_empty_repo_on_target(target: ForgeAccount, repo_name: str) -> bool:
    import httpx
    token = decrypt(target.access_token)
    def_base = target.base_url.rstrip("/") if target.base_url else ("https://gitlab.com" if target.type == "gitlab" else "https://api.github.com")

    try:
        if target.type == "github":
            with httpx.Client() as client:
                res = client.post(
                    f"{def_base}/user/repos",
                    headers={"Authorization": f"Bearer {token}", "Accept": "application/vnd.github.v3+json"},
                    json={"name": repo_name, "private": True}
                )
                return res.status_code in (201, 422) # 422 usually means it already exists
        elif target.type == "gitlab":
            with httpx.Client() as client:
                res = client.post(
                    f"{def_base}/api/v4/projects",
                    headers={"Authorization": f"Bearer {token}"},
                    json={"name": repo_name, "visibility": "private"}
                )
                return res.status_code in (201, 400) # 400 usually means it already exists
    except Exception as e:
        print(f"Failed to provision empty repo container on {target.type}:", str(e))
        return False
    return False

def _run_sync(mapping_id: str, db_url: str):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    eng = create_engine(db_url, connect_args=connect_args)
    Session_ = sessionmaker(bind=eng)
    db = Session_()

    try:
        mapping = db.query(SyncMapping).filter(SyncMapping.id == mapping_id).first()
        if not mapping or not mapping.enabled:
            return

        log = SyncLog(mapping_id=mapping_id, status="running")
        db.add(log)
        db.commit()
        db.refresh(log)

        tmpdir = tempfile.mkdtemp()
        try:
            source = mapping.repo.source_forge_account
            target = db.query(ForgeAccount).filter(ForgeAccount.id == mapping.target_forge_id).first()
            if not target:
                raise ValueError("Target forge account not found")

            src_url = _forge_clone_url(source, mapping.repo.full_name)
            
            # Extract just the repository name (without the owner/namespace) for creation
            repo_basename = mapping.repo.name
            
            # IMPORTANT: Attempt to pre-create the empty container on the destination API before pushing!
            _create_empty_repo_on_target(target, repo_basename)
            
            # Since gitlab and github might have different namespace structures (e.g user/repo vs org/repo)
            # The destination URL needs to push to the target user's direct explicit namespace using the basename
            target_namespace = target.username
            target_full_name = f"{target_namespace}/{repo_basename}"
            
            dst_url = _forge_clone_url(target, target_full_name)
            mirror_dir = Path(tmpdir) / "mirror.git"

            subprocess.run(["git", "clone", "--mirror", src_url, str(mirror_dir)], check=True, capture_output=True, timeout=120)
            subprocess.run(["git", "push", "--mirror", dst_url], cwd=str(mirror_dir), check=True, capture_output=True, timeout=120)

            log.status = "synced"
            log.error_message = None
        except subprocess.CalledProcessError as e:
            log.status = "error"
            stderr = (e.stderr or b"").decode(errors="replace")
            log.error_message = stderr[:500] or str(e)
        except Exception as e:
            log.status = "error"
            log.error_message = str(e)[:500]
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)
            log.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


@router.post("/sync/{repo_id}", response_model=SyncResult)
def trigger_sync(
    repo_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.core.config import settings
    repo = db.query(Repo).filter(Repo.id == repo_id, Repo.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")

    mappings = [m for m in repo.sync_mappings if m.enabled]
    if not mappings:
        raise HTTPException(status_code=400, detail="No enabled sync mappings for this repo")

    for mapping in mappings:
        background_tasks.add_task(_run_sync, mapping.id, settings.database_url)

    return SyncResult(repo_id=repo_id, status="queued", message=f"Queued {len(mappings)} sync(s) for repo {repo.full_name}")


@router.post("/webhooks/{provider}/{repo_id}")
async def handle_webhook(
    provider: str,
    repo_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    from app.core.config import settings
    # We bypass auth here because this endpoint is hit directly by GitHub/GitLab servers in the background!
    
    repo = db.query(Repo).filter(Repo.id == repo_id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
        
    mappings = [m for m in repo.sync_mappings if m.enabled]
    if not mappings:
        return {"status": "ignored", "message": "No mappings configured for this repository"}

    for mapping in mappings:
        # Pass the task immediately to the execution thread to keep webhook response times fast
        background_tasks.add_task(_run_sync, mapping.id, settings.database_url)

    return {"status": "queued", "message": f"Webhook triggered {len(mappings)} background syncs."}

@router.get("/sync-logs", response_model=list[SyncLogOut])
def list_sync_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repos = db.query(Repo).filter(Repo.user_id == current_user.id).all()
    logs: list[SyncLogOut] = []
    for repo in repos:
        for mapping in repo.sync_mappings:
            target = db.query(ForgeAccount).filter(ForgeAccount.id == mapping.target_forge_id).first()
            for log in mapping.sync_logs:
                logs.append(SyncLogOut(
                    id=log.id,
                    repo_id=repo.id,
                    repo_name=repo.full_name,
                    source_forge=repo.source_forge_account.type,
                    target_forge=target.type if target else "unknown",
                    status=log.status,
                    error_message=log.error_message,
                    started_at=log.started_at.isoformat() if log.started_at else "",
                    finished_at=log.finished_at.isoformat() if log.finished_at else None,
                ))
    logs.sort(key=lambda l: l.started_at, reverse=True)
    return logs[:200]
