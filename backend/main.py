from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
import time
import uvicorn
from loguru import logger
import sys

from .services.nmap_service import NmapService

from .core.config import settings
from .database.database import init_database, close_database, check_database_health
from .auth.middleware import AuthMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware
from .middleware.security_middleware import SecurityMiddleware, InputValidationMiddleware, CORS_CONFIG
from .utils.security import RateLimiter
from .routers import auth, devices, threats, network
from .services.ml_service import MLService

# settings is already imported from core.config

# Configure logging
logger.remove()  # Remove default handler
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="30 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level=settings.LOG_LEVEL
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting ICS Cybersecurity Platform...")
    
    try:
        # Initialize database
        await init_database()
        logger.info("Database initialized successfully")
        
        # Initialize services
        ml_service = MLService()
        nmap_service = NmapService()
        
        # Store services in app state
        app.state.ml_service = ml_service
        app.state.nmap_service = nmap_service
        
        logger.info("Services initialized successfully")
        logger.info("ICS Cybersecurity Platform started successfully")
        
    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down ICS Cybersecurity Platform...")
    
    try:
        # Cleanup database connections
        await close_database()
        logger.info("Database connections closed")
        
        # Cleanup services
        if hasattr(app.state, 'ml_service'):
            await app.state.ml_service.cleanup()
        if hasattr(app.state, 'nmap_service'):
            await app.state.nmap_service.cleanup()
        
        logger.info("Services cleaned up successfully")
        logger.info("ICS Cybersecurity Platform shut down successfully")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


# Create FastAPI application
app = FastAPI(
    title="ICS Cybersecurity Platform",
    description="AI-Powered Cybersecurity Framework for Industrial Control Systems",
    version="1.0.0",
    docs_url=None,  # Disable default docs
    redoc_url=None,  # Disable default redoc
    openapi_url="/api/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Add middleware (order matters - first added is outermost)

# Input validation middleware (first layer)
app.add_middleware(InputValidationMiddleware)

# Enhanced security middleware with rate limiting
rate_limiter = RateLimiter(max_requests=1000, window_seconds=3600)
app.add_middleware(SecurityMiddleware, rate_limiter=rate_limiter)

# Legacy security headers middleware (for compatibility)
app.add_middleware(SecurityHeadersMiddleware)

# Authentication middleware
app.add_middleware(AuthMiddleware)

# CORS middleware with secure configuration
app.add_middleware(
    CORSMiddleware,
    **CORS_CONFIG
)

# Trusted host middleware
if settings.ALLOWED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Gzip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Custom middleware for request logging and timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing information"""
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    
    # Log response
    logger.info(
        f"Response: {response.status_code} for {request.method} {request.url.path} "
        f"in {process_time:.4f}s"
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    logger.warning(
        f"HTTP {exc.status_code} error for {request.method} {request.url.path}: {exc.detail}"
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error"
            },
            "timestamp": time.time(),
            "path": str(request.url.path)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(
        f"Unhandled exception for {request.method} {request.url.path}: {str(exc)}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error" if settings.ENVIRONMENT == "production" else str(exc),
                "type": "internal_error"
            },
            "timestamp": time.time(),
            "path": str(request.url.path)
        }
    )


# Health check endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health/detailed", tags=["Health"])
async def detailed_health_check():
    """Detailed health check with service status"""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "services": {}
    }
    
    try:
        # Check database connection using shared health utility
        db_health = await check_database_health()
        health_status["services"]["database"] = db_health.get("database", "unhealthy")
        if settings.ENVIRONMENT != "production":
            health_status["services"]["database_details"] = {
                "sync_connection": db_health.get("sync_connection"),
                "async_connection": db_health.get("async_connection"),
                "url": db_health.get("url"),
            }
        
        # Check ML service
        if hasattr(app.state, 'ml_service'):
            ml_healthy = await app.state.ml_service.health_check()
            health_status["services"]["ml_service"] = "healthy" if ml_healthy else "unhealthy"
        else:
            health_status["services"]["ml_service"] = "not_initialized"
        
        # Overall status
        unhealthy_services = [
            service for service, status in health_status["services"].items()
            if status != "healthy"
        ]
        
        if unhealthy_services:
            health_status["status"] = "degraded"
            health_status["issues"] = unhealthy_services
        
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        health_status["status"] = "unhealthy"
        health_status["error"] = str(e)
    
    return health_status


# API documentation endpoints (only in non-production environments)
if settings.ENVIRONMENT != "production":
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        """Custom Swagger UI"""
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=f"{app.title} - API Documentation",
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
        )
    
    @app.get("/openapi.json", include_in_schema=False)
    async def get_openapi_endpoint():
        """Custom OpenAPI schema"""
        return get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )


# API routes
@app.get("/metrics", include_in_schema=False)
async def metrics_endpoint():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

api_prefix = "/api/v1"

# Include routers
app.include_router(auth.router, prefix=api_prefix)
app.include_router(devices.router, prefix=api_prefix)
app.include_router(threats.router, prefix=api_prefix)
app.include_router(network.router, prefix=api_prefix)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ICS Cybersecurity Platform API",
        "version": "1.0.0",
        "description": "AI-Powered Cybersecurity Framework for Industrial Control Systems",
        "docs_url": "/docs" if settings.ENVIRONMENT != "production" else None,
        "health_url": "/health",
        "api_prefix": api_prefix,
        "endpoints": {
            "authentication": f"{api_prefix}/auth",
            "devices": f"{api_prefix}/devices",
            "threats": f"{api_prefix}/threats",
            "network": f"{api_prefix}/network"
        }
    }


# Dependency injection for services

def get_ml_service() -> MLService:
    """Get ML service instance"""
    if not hasattr(app.state, 'ml_service'):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML service not available"
        )
    return app.state.ml_service


def get_nmap_service() -> NmapService:
    """Get Nmap service instance"""
    if not hasattr(app.state, 'nmap_service'):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Nmap service not available"
        )
    return app.state.nmap_service


# Add dependency overrides for services
from .routers.network import NmapService as NetworkNmapServiceDep

app.dependency_overrides[NetworkNmapServiceDep] = get_nmap_service
app.dependency_overrides[MLService] = get_ml_service


if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True,
        server_header=False,
        date_header=False
    )