from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


def new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id           = Column(String, primary_key=True, default=new_id)
    name         = Column(String, nullable=False)
    email        = Column(String, nullable=False, unique=True, index=True)
    hashed_pw    = Column(String, nullable=False)
    role         = Column(String, nullable=False, default="user")  # admin | user
    plan         = Column(String, nullable=False, default="free")  # free | pro | self-hosted
    created_at   = Column(DateTime, server_default=func.now())

    forge_accounts = relationship("ForgeAccount", back_populates="user", cascade="all, delete-orphan")


class ForgeAccount(Base):
    __tablename__ = "forge_accounts"

    id           = Column(String, primary_key=True, default=new_id)
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    type         = Column(String, nullable=False)
    display_name = Column(String, nullable=False)
    username     = Column(String, nullable=False)
    access_token = Column(String, nullable=False)  # encrypted
    base_url     = Column(String, nullable=True)
    auth_method  = Column(String, nullable=False, default="pat")  # oauth | pat
    created_at   = Column(DateTime, server_default=func.now())

    user         = relationship("User", back_populates="forge_accounts")
    repos        = relationship("Repo", back_populates="source_forge_account", cascade="all, delete-orphan")


class Repo(Base):
    __tablename__ = "repos"

    id              = Column(String, primary_key=True, default=new_id)
    user_id         = Column(String, ForeignKey("users.id"), nullable=False)
    name            = Column(String, nullable=False)
    full_name       = Column(String, nullable=False)
    source_forge_id = Column(String, ForeignKey("forge_accounts.id"), nullable=False)
    created_at      = Column(DateTime, server_default=func.now())

    source_forge_account = relationship("ForgeAccount", back_populates="repos")
    sync_mappings        = relationship("SyncMapping", back_populates="repo", cascade="all, delete-orphan")


class SyncMapping(Base):
    __tablename__ = "sync_mappings"

    id              = Column(String, primary_key=True, default=new_id)
    repo_id         = Column(String, ForeignKey("repos.id"), nullable=False)
    target_forge_id = Column(String, ForeignKey("forge_accounts.id"), nullable=False)
    enabled         = Column(Boolean, default=True)
    created_at      = Column(DateTime, server_default=func.now())

    repo         = relationship("Repo", back_populates="sync_mappings")
    target_forge = relationship("ForgeAccount", foreign_keys=[target_forge_id])
    sync_logs    = relationship("SyncLog", back_populates="mapping", cascade="all, delete-orphan")


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id            = Column(String, primary_key=True, default=new_id)
    mapping_id    = Column(String, ForeignKey("sync_mappings.id"), nullable=False)
    started_at    = Column(DateTime, server_default=func.now())
    finished_at   = Column(DateTime, nullable=True)
    status        = Column(String, nullable=False)  # synced | error
    error_message = Column(Text, nullable=True)

    mapping = relationship("SyncMapping", back_populates="sync_logs")
