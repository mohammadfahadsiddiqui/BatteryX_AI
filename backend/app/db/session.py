"""BatteryX AI – Database session factory"""
import os
import shutil
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# If running in Vercel serverless, ensure sqlite db exists in temp dir
if os.environ.get("VERCEL"):
    temp_dir = tempfile.gettempdir()
    target_db = os.path.join(temp_dir, "batteryx.db")
    if not os.path.exists(target_db):
        for candidate in [
            os.path.join(os.path.dirname(__file__), "..", "..", "batteryx.db"),
            "./backend/batteryx.db",
            "../backend/batteryx.db",
            "/var/task/backend/batteryx.db",
            "./batteryx.db",
        ]:
            if os.path.exists(candidate):
                try:
                    shutil.copy2(candidate, target_db)
                    break
                except Exception:
                    pass

# SQLite needs connect_args; PostgreSQL does not
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_db_initialized = False


def init_db():
    global _db_initialized
    if not _db_initialized:
        try:
            from app.db.seed import seed_database
            seed_database()
            _db_initialized = True
        except Exception as e:
            print(f"DB auto-initialization: {e}")
            _db_initialized = True


def get_db():
    """FastAPI dependency: yield a database session."""
    init_db()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
