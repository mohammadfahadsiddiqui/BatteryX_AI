"""Vercel Serverless Function entry point for BatteryX AI FastAPI backend."""
import os
import shutil
import sys
import tempfile

# Vercel executes this file from /var/task. Add both the repository root and
# backend package directory so the existing `app.*` imports resolve correctly.
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# SQLite is only a deployment fallback. Production deployments should set
# DATABASE_URL to a persistent PostgreSQL-compatible database.
if os.environ.get("VERCEL"):
    temp_dir = tempfile.gettempdir()
    target_db = os.path.join(temp_dir, "batteryx.db")
    if not os.path.exists(target_db):
        for candidate in (
            os.path.join(BACKEND_DIR, "batteryx.db"),
            os.path.join(ROOT_DIR, "batteryx.db"),
            "/var/task/backend/batteryx.db",
            "/var/task/batteryx.db",
        ):
            if os.path.exists(candidate):
                try:
                    shutil.copy2(candidate, target_db)
                    break
                except OSError as exc:
                    print(f"[Vercel Init] Database copy notice: {exc}")

# Import exactly one canonical FastAPI application. Do not catch ImportError
# here: masking an application import failure as a second import attempt makes
# the real Vercel startup error much harder to diagnose.
from app.main import app

# The FastAPI startup lifecycle in app.main performs database initialization.
# Keeping initialization out of module import makes the serverless entrypoint
# safe to import and lets FastAPI/Vercel manage the application lifecycle.
