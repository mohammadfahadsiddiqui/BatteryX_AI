"""Vercel Serverless Function Entry Point for BatteryX AI"""
import os
import sys
import tempfile
import shutil

# Ensure backend package is on Python sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(current_dir, ".."))
backend_dir = os.path.join(root_dir, "backend")

for path in [backend_dir, root_dir, current_dir, "/var/task/backend", "/var/task"]:
    if path not in sys.path and os.path.exists(path):
        sys.path.insert(0, path)

# On Vercel, copy pre-seeded SQLite database to temp dir if using SQLite
if os.environ.get("VERCEL"):
    temp_dir = tempfile.gettempdir()
    target_db = os.path.join(temp_dir, "batteryx.db")
    if not os.path.exists(target_db):
        for candidate in [
            os.path.join(backend_dir, "batteryx.db"),
            os.path.join(root_dir, "batteryx.db"),
            os.path.join(current_dir, "batteryx.db"),
            "/var/task/backend/batteryx.db",
            "/var/task/batteryx.db",
        ]:
            if os.path.exists(candidate):
                try:
                    shutil.copy2(candidate, target_db)
                    break
                except Exception as e:
                    print(f"Database copy notice: {e}")

try:
    from app.main import app
except Exception as startup_error:
    import traceback
    error_trace = traceback.format_exc()
    print("Startup Error:", error_trace)
    
    # Fallback ASGI application to display the startup error
    async def app(scope, receive, send):
        assert scope['type'] == 'http'
        response_body = f"Internal Server Error during startup:\n\n{error_trace}".encode("utf-8")
        await send({
            'type': 'http.response.start',
            'status': 500,
            'headers': [
                (b'content-type', b'text/plain'),
                (b'content-length', str(len(response_body)).encode("utf-8"))
            ]
        })
        await send({
            'type': 'http.response.body',
            'body': response_body
        })
