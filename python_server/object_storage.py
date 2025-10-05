import os
from google.cloud import storage
from google.oauth2 import service_account
from typing import Optional, List
import httpx

REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106"

class ObjectStorageService:
    def __init__(self):
        credentials_config = {
            "type": "external_account",
            "audience": "replit",
            "subject_token_type": "access_token",
            "token_url": f"{REPLIT_SIDECAR_ENDPOINT}/token",
            "credential_source": {
                "url": f"{REPLIT_SIDECAR_ENDPOINT}/credential",
                "format": {
                    "type": "json",
                    "subject_token_field_name": "access_token"
                }
            },
            "universe_domain": "googleapis.com"
        }
        
        self.client = storage.Client(
            project="",
            credentials=credentials_config
        )
    
    def get_public_object_search_paths(self) -> List[str]:
        paths_str = os.getenv("PUBLIC_OBJECT_SEARCH_PATHS", "")
        paths = list(set([
            path.strip() for path in paths_str.split(",") if path.strip()
        ]))
        
        if not paths:
            raise ValueError(
                "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' "
                "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
            )
        return paths
    
    def get_private_object_dir(self) -> str:
        dir_path = os.getenv("PRIVATE_OBJECT_DIR", "")
        if not dir_path:
            raise ValueError(
                "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' "
                "tool and set PRIVATE_OBJECT_DIR env var."
            )
        return dir_path
    
    async def search_public_object(self, file_path: str) -> Optional[storage.Blob]:
        for search_path in self.get_public_object_search_paths():
            full_path = f"{search_path}/{file_path}"
            
            parts = full_path.split("/", 1)
            if len(parts) != 2:
                continue
            
            bucket_name = parts[0].lstrip("/")
            object_name = parts[1]
            
            try:
                bucket = self.client.bucket(bucket_name)
                blob = bucket.blob(object_name)
                
                if blob.exists():
                    return blob
            except Exception:
                continue
        
        return None
    
    async def get_object(self, full_path: str) -> Optional[storage.Blob]:
        parts = full_path.split("/", 1)
        if len(parts) != 2:
            return None
        
        bucket_name = parts[0].lstrip("/")
        object_name = parts[1]
        
        try:
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(object_name)
            
            if blob.exists():
                return blob
        except Exception:
            return None
        
        return None
    
    async def get_signed_upload_url(self, file_path: str, content_type: str, owner: str) -> str:
        private_dir = self.get_private_object_dir()
        full_path = f"{private_dir}/{file_path}"
        
        parts = full_path.split("/", 1)
        if len(parts) != 2:
            raise ValueError("Invalid file path")
        
        bucket_name = parts[0].lstrip("/")
        object_name = parts[1]
        
        acl_policy = {
            "owner": owner,
            "visibility": "private"
        }
        
        request_data = {
            "bucket": bucket_name,
            "object": object_name,
            "method": "PUT",
            "metadata": {
                "custom:aclPolicy": str(acl_policy)
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{REPLIT_SIDECAR_ENDPOINT}/sign",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                raise Exception(
                    f"Failed to sign object URL, errorcode: {response.status_code}, "
                    "make sure you're running on Replit"
                )
            
            result = response.json()
            return result.get("signed_url", "")
