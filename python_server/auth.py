import os
import time
from authlib.integrations.starlette_client import OAuth
from authlib.oidc.core import CodeIDToken
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import RedirectResponse
from fastapi import Depends, HTTPException, status
from typing import Optional
import httpx

ISSUER_URL = os.getenv("ISSUER_URL", "https://replit.com/oidc")
REPL_ID = os.getenv("REPL_ID", "")
REPLIT_DOMAINS = os.getenv("REPLIT_DOMAINS", "").split(",")

oauth = OAuth()

def configure_oauth():
    for domain in REPLIT_DOMAINS:
        if domain:
            # Register with PKCE support (required by Replit OIDC)
            redirect_uri = f"https://{domain}/api/auth/callback"
            oauth.register(
                name='replit',
                client_id=REPL_ID,
                server_metadata_url=f"{ISSUER_URL}/.well-known/openid-configuration",
                client_kwargs={
                    'scope': 'openid profile email',
                    'code_challenge_method': 'S256'  # Enable PKCE with SHA-256
                }
            )
            break

async def get_current_user(request: Request) -> dict:
    user = request.session.get("user")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    if user.get("expires_at") and user["expires_at"] < time.time():
        refresh_token = user.get("refresh_token")
        if refresh_token:
            try:
                token_endpoint = f"{ISSUER_URL}/token"
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        token_endpoint,
                        data={
                            "grant_type": "refresh_token",
                            "refresh_token": refresh_token,
                            "client_id": REPL_ID,
                        }
                    )
                    if response.status_code == 200:
                        token_data = response.json()
                        user["access_token"] = token_data.get("access_token")
                        user["refresh_token"] = token_data.get("refresh_token")
                        user["expires_at"] = time.time() + token_data.get("expires_in", 0)
                        request.session["user"] = user
                    else:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Token refresh failed"
                        )
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unauthorized"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized"
            )
    
    return user

def get_user_id(request: Request) -> str:
    user = request.session.get("user")
    if not user or not user.get("claims"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user["claims"].get("sub")
