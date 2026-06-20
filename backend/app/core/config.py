from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    backend_url: str = "http://localhost:8000"  # To be overridden by ngrok/domain in production for webhooks
    database_url: str = "sqlite:///./gitspan.db"
    secret_key: str = "change-me-in-production"
    frontend_url: str = "http://localhost:3000"
    
    # OAuth Credentials
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    gitlab_client_id: Optional[str] = None
    gitlab_client_secret: Optional[str] = None

    class Config:
        env_file = ".env"
        extra = "ignore" # Allow extra env variables in .env without crashing

settings = Settings()
