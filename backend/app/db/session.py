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

    import shutil
    import tempfile

    if os.environ.get("VERCEL"):
        temp_dir = tempfile.gettempdir()
        target_db = os.path.join(temp_dir, "batteryx.db")
        if not os.path.exists(target_db):
            current_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.abspath(os.path.join(current_dir, "../../.."))
            backend_dir = os.path.join(root_dir, "backend")
            for candidate in [
                os.path.join(backend_dir, "batteryx.db"),
                os.path.join(root_dir, "batteryx.db"),
                "/var/task/backend/batteryx.db",
                "/var/task/batteryx.db",
            ]:
                if os.path.exists(candidate):
                    try:
                        shutil.copy2(candidate, target_db)
                        break
                    except Exception as e:
                        print(f"[DB] Database copy notice: {e}")

    from app.db.seed import seed_database

    try:
        seed_database()
    except Exception as exc:
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
