"""BatteryX AI – FastAPI application entry point"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import auth, batteries, analysis, certificates, dashboard, admin
from app.db.seed import seed_database

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent EV Battery Health Assessment & Second-Life Certification Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, use specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers – existing
app.include_router(auth.router, prefix="/api/v1")
app.include_router(batteries.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(certificates.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.on_event("startup")
async def startup():
    """Seed the database with demo data on first run."""
    seed_database()


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/api/docs",
        "version": settings.APP_VERSION,
    }
