"""BatteryX AI – Application Configuration"""
import os
import secrets
import tempfile
from pydantic_settings import BaseSettings


def _default_db_url() -> str:
    if os.getenv("VERCEL"):
        temp_dir = tempfile.gettempdir()
        db_path = os.path.join(temp_dir, "batteryx.db")
        return "sqlite:///" + db_path.replace("\\", "/")
    return "sqlite:///./batteryx.db"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "BatteryX AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database – defaults to SQLite; override with DATABASE_URL env var for PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db_url())

    # JWT
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS – comma-separated allowed origins
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,*"

    # Certificate base URL (used to build QR code URLs)
    BASE_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
