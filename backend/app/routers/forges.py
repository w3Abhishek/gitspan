from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.core.encryption import encrypt
from app.models.db import ForgeAccount, User, Repo
import httpx

router = APIRouter(tags=["forges"])


class ForgeAccountIn(BaseModel):
    type: str
    display_name: str
    username: str
    access_token: str
    base_url: Optional[str] = None
    auth_method: str = "pat"


class OAuthExchangeIn(BaseModel):
    code: str


class ForgeAccountOut(BaseModel):
    id: str
    type: str
    display_name: str
    username: str
    base_url: Optional[str] = None
    auth_method: str
    repo_count: int
    connected_at: str


def _serialize(account: ForgeAccount) -> ForgeAccountOut:
    return ForgeAccountOut(
        id=account.id,
        type=account.type,
        display_name=account.display_name,
        username=account.username,
        base_url=account.base_url,
        auth_method=account.auth_method,
        repo_count=len(account.repos),
        connected_at=account.created_at.isoformat() if account.created_at else "",
    )


async def _sync_repos_for_account(account: ForgeAccount, db: Session, target_token: str):
    """Helper functional to centrally fetch repos for a forge."""
    try:
        def_base = account.base_url.rstrip("/") if account.base_url else ("https://gitlab.com" if account.type == "gitlab" else "https://github.com")
        
        # Load existing repos to avoid duplicates
        existing_repo_names = {r.full_name for r in account.repos}
        added_count = 0
        
        if account.type == "github":
            base_api = def_base if account.base_url else "https://api.github.com"
            async with httpx.AsyncClient() as client:
                repos_res = await client.get(
                    f"{base_api}/user/repos?per_page=100&affiliation=owner",
                    headers={"Authorization": f"Bearer {target_token}", "Accept": "application/vnd.github.v3+json"}
                )
                if repos_res.status_code == 200:
                    for r in repos_res.json():
                        full_name = r.get("full_name")
                        if full_name not in existing_repo_names:
                            new_repo = Repo(
                                user_id=account.user_id,
                                name=r.get("name"),
                                full_name=full_name,
                                source_forge_id=account.id
                            )
                            db.add(new_repo)
                            added_count += 1
                    db.commit()
                    
        elif account.type == "gitlab":
            async with httpx.AsyncClient() as client:
                repos_res = await client.get(
                    f"{def_base}/api/v4/projects?membership=true&per_page=100",
                    headers={"Authorization": f"Bearer {target_token}"}
                )
                if repos_res.status_code == 200:
                    for r in repos_res.json():
                        full_name = r.get("path_with_namespace")
                        if full_name not in existing_repo_names:
                            new_repo = Repo(
                                user_id=account.user_id,
                                name=r.get("name"),
                                full_name=full_name,
                                source_forge_id=account.id
                            )
                            db.add(new_repo)
                            added_count += 1
                    db.commit()
        return added_count
    except Exception as e:
        print(f"Failed to sync repos for {account.id}:", str(e))
        db.rollback()
        raise e


@router.post("/forges/{forge_id}/sync-repos")
async def sync_forge_repos(forge_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.core.encryption import decrypt
    account = db.query(ForgeAccount).filter(ForgeAccount.id == forge_id, ForgeAccount.user_id == current_user.id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Forge account not found")
        
    target_token = decrypt(account.access_token)
    try:
        added_count = await _sync_repos_for_account(account, db, target_token)
        return {"status": "success", "added": added_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to sync repositories from forge")


@router.get("/forges", response_model=list[ForgeAccountOut])
def list_forges(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = db.query(ForgeAccount).filter(ForgeAccount.user_id == current_user.id).all()
    return [_serialize(a) for a in accounts]


@router.post("/forges", response_model=ForgeAccountOut, status_code=201)
async def add_forge(body: ForgeAccountIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_token = body.access_token # unencrypted version for API calls
    
    account = ForgeAccount(
        user_id=current_user.id,
        type=body.type,
        display_name=body.display_name,
        username=body.username,
        access_token=encrypt(target_token),
        base_url=body.base_url,
        auth_method=body.auth_method,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    
    # Auto-import repos from PAT setup
    try:
        await _sync_repos_for_account(account, db, target_token)
    except Exception:
        pass

    return _serialize(account)


@router.post("/forges/oauth/{provider}", response_model=ForgeAccountOut, status_code=201)
async def add_forge_oauth(provider: str, body: OAuthExchangeIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    if provider == "github":
        if not settings.github_client_id or not settings.github_client_secret:
            raise HTTPException(status_code=500, detail="GitHub OAuth credentials not configured on the server")
            
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": body.code,
                }
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange OAuth code")
            
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="Invalid OAuth exchange response")

            user_res = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch GitHub user data")
                
            username = user_res.json().get("login")
            display_name = "GitHub"

    elif provider == "gitlab":
        if not settings.gitlab_client_id or not settings.gitlab_client_secret:
            raise HTTPException(status_code=500, detail="GitLab OAuth credentials not configured on the server")
            
        async with httpx.AsyncClient() as client:
            token_res = await client.post(
                "https://gitlab.com/oauth/token",
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.gitlab_client_id,
                    "client_secret": settings.gitlab_client_secret,
                    "code": body.code,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{settings.frontend_url}/api/auth/callback/gitlab" # Required by GitLab
                }
            )
            if token_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange GitLab OAuth code")
            
            token_data = token_res.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise HTTPException(status_code=400, detail="Invalid GitLab OAuth exchange response")

            user_res = await client.get(
                "https://gitlab.com/api/v4/user",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if user_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch GitLab user data")
                
            username = user_res.json().get("username")
            display_name = "GitLab"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported OAuth provider: {provider}")

    # Add account mapped to user
    account = ForgeAccount(
        user_id=current_user.id,
        type=provider,
        display_name=display_name,
        username=username,
        access_token=encrypt(access_token),
        auth_method="oauth",
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    
    # Auto-import repos from the newly connected forge
    try:
        await _sync_repos_for_account(account, db, access_token)
    except Exception:
        pass

    return _serialize(account)


@router.delete("/forges/{forge_id}", status_code=204)
def delete_forge(forge_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = db.query(ForgeAccount).filter(
        ForgeAccount.id == forge_id,
        ForgeAccount.user_id == current_user.id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Forge account not found")
    db.delete(account)
    db.commit()
