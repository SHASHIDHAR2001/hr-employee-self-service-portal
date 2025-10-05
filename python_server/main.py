import os
import subprocess
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from authlib.integrations.starlette_client import OAuth
import uvicorn
from datetime import datetime
import httpx

from routes import router
from database import init_db
from config import settings
from auth import configure_oauth, oauth
from storage import DatabaseStorage
from database import SessionLocal
from models import UpsertUserSchema

app = FastAPI(title="HR Employee Self-Service Portal")

app.add_middleware(SessionMiddleware, secret_key=settings.session_secret or "your-secret-key-here")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

configure_oauth()

# Check if we're in production mode (based on NODE_ENV only)
DIST_DIR = Path(__file__).parent.parent / "dist" / "public"
IS_PRODUCTION = os.getenv("NODE_ENV") == "production"

@app.on_event("startup")
async def startup_event():
    init_db()
    if IS_PRODUCTION:
        print(f"✓ Running in PRODUCTION mode, serving static files from {DIST_DIR}")

@app.get("/api/auth/login")
async def login(request: Request):
    # Use the configured domain to build the correct redirect URI
    domain = os.getenv("REPLIT_DOMAINS", "").split(",")[0]
    redirect_uri = f"https://{domain}/api/auth/callback"
    return await oauth.replit.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.replit.authorize_access_token(request)
        claims = token.get('userinfo') or {}
        
        user_data = {
            "claims": claims,
            "access_token": token.get('access_token'),
            "refresh_token": token.get('refresh_token'),
            "expires_at": token.get('expires_in', 0) + int(datetime.now().timestamp())
        }
        
        request.session['user'] = user_data
        
        db = SessionLocal()
        try:
            storage = DatabaseStorage(db)
            upsert_data = UpsertUserSchema(
                id=claims.get("sub"),
                email=claims.get("email"),
                firstName=claims.get("first_name"),
                lastName=claims.get("last_name"),
                profileImageUrl=claims.get("profile_image_url")
            )
            storage.upsert_user(upsert_data)
        finally:
            db.close()
        
        return RedirectResponse(url="/")
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

@app.get("/api/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/")

app.include_router(router)

# Serve static files in production, proxy to Vite in development
if IS_PRODUCTION:
    # Mount static files
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Skip API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        
        # Try to serve the requested file
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # For all other routes, serve index.html (SPA routing)
        return FileResponse(DIST_DIR / "index.html")
else:
    # Development: Proxy to Vite dev server for frontend
    @app.middleware("http")
    async def proxy_to_vite(request: Request, call_next):
        # Skip websocket requests (for Vite HMR)
        if request.scope.get("type") == "websocket":
            return await call_next(request)
        
        # Only proxy non-API HTTP requests
        if not request.url.path.startswith("/api") and not request.url.path.startswith("/docs") and not request.url.path.startswith("/openapi.json"):
            try:
                async with httpx.AsyncClient() as client:
                    vite_url = f"http://localhost:5173{request.url.path}"
                    if request.url.query:
                        vite_url += f"?{request.url.query}"
                    
                    response = await client.get(
                        vite_url,
                        headers=dict(request.headers),
                        follow_redirects=True,
                        timeout=30.0
                    )
                    
                    return Response(
                        content=response.content,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type=response.headers.get("content-type")
                    )
            except:
                pass
        
        return await call_next(request)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    response = await call_next(request)
    duration = (datetime.now() - start_time).total_seconds() * 1000
    
    if request.url.path.startswith("/api"):
        log_line = f"{request.method} {request.url.path} {response.status_code} in {duration:.0f}ms"
        if len(log_line) > 80:
            log_line = log_line[:79] + "…"
        print(log_line)
    
    return response

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
