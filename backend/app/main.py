"""BatteryX AI – FastAPI application entry point"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1 import auth, batteries, analysis, certificates, dashboard, admin

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent EV Battery Health Assessment & Second-Life Certification Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global fallback exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}", "type": type(exc).__name__},
    )

# Routers – mounted with both /api/v1 and /v1 for seamless Vercel / local routing
for prefix in ("/api/v1", "/v1"):
    app.include_router(auth.router, prefix=prefix)
    app.include_router(batteries.router, prefix=prefix)
    app.include_router(analysis.router, prefix=prefix)
    app.include_router(certificates.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    app.include_router(admin.router, prefix=prefix)


@app.on_event("startup")
async def startup():
    """Seed the database with demo data on first run."""
    try:
        from app.db.session import init_db
        init_db()
    except Exception as e:
        print(f"Startup notice: {e}")


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/api")
@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/api/docs",
        "version": settings.APP_VERSION,
    }
