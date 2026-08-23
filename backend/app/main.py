"""BatteryX AI – FastAPI application entry point (v3.0)"""
import asyncio
import json
import sys
import os

# Ensure the backend directory is in sys.path so that 'from app.*' imports work correctly on Vercel
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
# Existing routers
from app.api.v1 import auth, batteries, analysis, certificates, dashboard, admin
# New v3.0 routers
from app.api.v1 import hardware, telemetry, diagnostics, alerts, lifecycle, fleet, bms
# WebSocket manager
from app.websocket.manager import ws_manager

app = FastAPI(
    title=settings.APP_NAME,
    version="3.0.0",
    description=(
        "BatteryX AI — Intelligent EV Battery Management, Health Assessment, "
        "Diagnostics, Lifecycle and Second-Life Certification Platform"
    ),
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handler ──────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "type": type(exc).__name__},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
for prefix in ("/api/v1", "/v1"):
    # Existing
    app.include_router(auth.router,         prefix=prefix)
    app.include_router(batteries.router,    prefix=prefix)
    app.include_router(analysis.router,     prefix=prefix)
    app.include_router(certificates.router, prefix=prefix)
    app.include_router(dashboard.router,    prefix=prefix)
    app.include_router(admin.router,        prefix=prefix)
    # New v3.0
    app.include_router(hardware.router,     prefix=prefix)
    app.include_router(telemetry.router,    prefix=prefix)
    app.include_router(diagnostics.router,  prefix=prefix)
    app.include_router(alerts.router,       prefix=prefix)
    app.include_router(lifecycle.router,    prefix=prefix)
    app.include_router(fleet.router,        prefix=prefix)
    app.include_router(bms.router,          prefix=prefix)


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws/{battery_id}")
async def websocket_endpoint(websocket: WebSocket, battery_id: str):
    """
    Real-time telemetry WebSocket channel for a specific battery.
    Clients connect to ws://host/ws/{battery_id} and receive telemetry_update events.
    """
    await ws_manager.connect(websocket, battery_id)
    try:
        # Send a connection confirmation
        await websocket.send_text(json.dumps({
            "event": "battery_connected",
            "battery_id": battery_id,
            "message": "Connected to BatteryX live telemetry",
        }))
        # Keep connection alive, handle incoming heartbeat pings
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                msg = json.loads(data) if data else {}
                if msg.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                await websocket.send_text(json.dumps({"type": "heartbeat"}))
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, battery_id)
    except Exception:
        ws_manager.disconnect(websocket, battery_id)


# ── Demo telemetry endpoint ───────────────────────────────────────────────────
@app.get("/api/v1/demo/scenarios")
@app.get("/v1/demo/scenarios")
def get_demo_scenarios():
    """List available demo scenarios."""
    from app.services.demo.generator import get_scenario_list
    return get_scenario_list()


@app.get("/api/v1/demo/telemetry/{battery_id}")
@app.get("/v1/demo/telemetry/{battery_id}")
def get_demo_telemetry(
    battery_id: str,
    scenario: str = "healthy",
    tick: int = 0,
):
    """
    Generate a single demo telemetry packet.
    DEMO DATA — not real battery measurements.
    """
    from app.services.demo.generator import generate_demo_telemetry
    return generate_demo_telemetry(battery_id, scenario=scenario, tick=tick)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    """Initialise database on first run."""
    import os
    import shutil
    import tempfile
    
    if os.environ.get("VERCEL"):
        temp_dir = tempfile.gettempdir()
        target_db = os.path.join(temp_dir, "batteryx.db")
        if not os.path.exists(target_db):
            current_dir = os.path.dirname(os.path.abspath(__file__))
            root_dir = os.path.abspath(os.path.join(current_dir, "../.."))
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
                        print(f"Database copy notice: {e}")

    try:
        from app.db.session import init_db
        init_db()
    except Exception as e:
        print(f"Startup notice: {e}")


# ── Health & Root ─────────────────────────────────────────────────────────────
@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": "3.0.0"}


@app.get("/api")
@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API v3.0",
        "docs": "/api/docs",
        "version": "3.0.0",
        "websocket": "ws://host/ws/{battery_id}",
    }
