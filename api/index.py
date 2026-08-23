"""Vercel Serverless Function entry point for BatteryX AI FastAPI backend."""
import sys
import os
import shutil
import tempfile

# Add project root and backend folder to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

# Ensure sqlite database exists in writable /tmp directory on Vercel
if os.environ.get("VERCEL"):
    temp_dir = tempfile.gettempdir()
    target_db = os.path.join(temp_dir, "batteryx.db")
    if not os.path.exists(target_db):
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
                    print(f"[Vercel Init] Database copy notice: {e}")

# Import FastAPI app instance
try:
    from app.main import app
except ImportError:
    from backend.app.main import app

# Ensure database is initialised on cold-start
try:
    from app.db.session import init_db
    init_db()
except Exception as e:
    print(f"[Vercel Init] DB Init notice: {e}")
