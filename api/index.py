"""Vercel Serverless Function Entry Point for BatteryX AI"""
import os
import sys
import shutil

# Ensure backend package is on Python sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "..", "backend")
if os.path.exists(backend_dir):
    sys.path.insert(0, os.path.abspath(backend_dir))

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
