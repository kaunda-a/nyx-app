from typing import Dict, Optional
from cryptography.fernet import Fernet
import jwt
import time
from datetime import datetime

class SecurityManager:
    def __init__(self):
        self.encryption_key = Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)
        self.rate_limits: Dict[str, list] = {}
        
    async def verify_token(self, token: str) -> Optional[Dict]:
        try:
            return jwt.decode(token, self.encryption_key, algorithms=["HS256"])
        except Exception:
            return None

    async def encrypt_profile(self, profile_data: Dict) -> bytes:
        """Encrypt sensitive profile data"""
        return self.fernet.encrypt(str(profile_data).encode())

    async def decrypt_profile(self, encrypted_data: bytes) -> Dict:
        """Decrypt profile data"""
        decrypted = self.fernet.decrypt(encrypted_data)
        return eval(decrypted.decode())  # Safe since we encrypted it ourselves

    async def rate_limit(self, user_id: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """
        Implement rate limiting for user requests
        Returns True if request is allowed, False if rate limit exceeded
        """
        current_time = time.time()
        if user_id not in self.rate_limits:
            self.rate_limits[user_id] = []
            
        # Clean old requests
        self.rate_limits[user_id] = [t for t in self.rate_limits[user_id] 
                                   if current_time - t < window_seconds]
        
        # Check rate limit
        if len(self.rate_limits[user_id]) >= max_requests:
            return False
            
        # Add new request
        self.rate_limits[user_id].append(current_time)
        return True

    def generate_token(self, user_data: Dict, expires_in: int = 3600) -> str:
        """Generate JWT token for user"""
        payload = {
            **user_data,
            'exp': datetime.utcnow().timestamp() + expires_in
        }
        return jwt.encode(payload, self.encryption_key, algorithm="HS256")
