"""BatteryX AI – Application Configuration"""
import os
import tempfile
from pydantic_settings import BaseSettings


def _default_db_url() -> str:
    if os.getenv("VERCEL"):
        temp_dir = tempfile.gettempdir()
        db_path = os.path.join(temp_dir, "batteryx.db")
        return "sqlite:///" + db_path.replace("\\", "/")
    return "sqlite:///./batteryx.db"


class Settings(BaseSettings):
    APP_NAME: str = "BatteryX AI"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db_url())

    # Serverless-safe JWT key: Vercel may execute requests on different
    # instances, so this must not be regenerated for every invocation.
    # Set SECRET_KEY in Vercel for production; this fallback keeps the demo
    # deployment functional when the environment variable is absent.
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY",
        "BatteryX-AI-demo-stable-secret-change-in-production-2026",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,*"
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:5173")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
