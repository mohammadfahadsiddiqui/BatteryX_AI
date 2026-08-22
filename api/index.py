"""Vercel Serverless Function Entry Point for BatteryX AI"""
import os
import sys
import shutil

# Ensure backend package is on Python sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for path in [backend_dir, root_dir, current_dir]:
    if path not in sys.path and os.path.exists(path):
        sys.path.insert(0, path)

# On Vercel, copy pre-seeded SQLite database to /tmp if using SQLite
if os.environ.get("VERCEL"):
    source_db = os.path.join(backend_dir, "batteryx.db")
    target_db = "/tmp/batteryx.db"
    if os.path.exists(source_db) and not os.path.exists(target_db):
        try:
            shutil.copy2(source_db, target_db)
        except Exception as e:
            print(f"Database copy warning: {e}")

from app.main import app
