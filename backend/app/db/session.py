"""BatteryX AI – Database session factory."""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_db_initialized = False


def init_db():
    global _db_initialized
    if _db_initialized:
        return

    from app.db.seed import seed_database

    try:
        seed_database()
    except Exception as exc:
        # Startup must remain diagnosable instead of failing silently.
        print(f"[DB] initialization warning: {exc}")
    finally:
        _db_initialized = True


def get_db():
    """FastAPI dependency: yield a database session."""
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
