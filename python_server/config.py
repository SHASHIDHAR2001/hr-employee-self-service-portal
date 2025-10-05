import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    issuer_url: str = os.getenv("ISSUER_URL", "https://replit.com/oidc")
    repl_id: str = os.getenv("REPL_ID", "")
    replit_domains: str = os.getenv("REPLIT_DOMAINS", "")
    session_secret: str = os.getenv("SESSION_SECRET", "")
    public_object_search_paths: str = os.getenv("PUBLIC_OBJECT_SEARCH_PATHS", "")
    private_object_dir: str = os.getenv("PRIVATE_OBJECT_DIR", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
