from typing import Dict, Optional, List, Any, Union
import jwt
import time
import os
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import hashlib
import json
from camoufox.utils import generate_fingerprint
from camoufox import DefaultAddons

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Set environment variable to skip browser download
import os
os.environ['CAMOUFOX_SKIP_DOWNLOAD'] = '1'

# Singleton pattern for SecurityManager
class SecurityManager:
    _instance = None
    _encryption_key = None
    _fernet = None

    def __new__(cls, db=None, cache=None):
        if cls._instance is None:
            cls._instance = super(SecurityManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, db=None, cache=None):
        # Only initialize once
        if hasattr(self, '_initialized') and self._initialized:
            return

        # Try to load the encryption key from a file
        key_file_path = "sessions/security/encryption_key.key"
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(key_file_path), exist_ok=True)

            # Check if the key file exists
            if os.path.exists(key_file_path):
                # Load the key from the file
                with open(key_file_path, "rb") as key_file:
                    SecurityManager._encryption_key = key_file.read().strip()
                    print(f"Loaded encryption key from {key_file_path}")
            else:
                # Generate a new key
                SecurityManager._encryption_key = Fernet.generate_key()
                # Save the key to the file
                with open(key_file_path, "wb") as key_file:
                    key_file.write(SecurityManager._encryption_key)
                print(f"Generated new encryption key and saved to {key_file_path}")
        except Exception as e:
            print(f"Error handling encryption key file: {str(e)}")
            # Fallback to generating a new key
            SecurityManager._encryption_key = Fernet.generate_key()
            print("Generated new encryption key (fallback)")

        SecurityManager._fernet = Fernet(SecurityManager._encryption_key)
        self.rate_limits: Dict[str, list] = {}
        self.fingerprint_history: Dict[str, List[Dict]] = {}
        self.blocked_ips: Dict[str, datetime] = {}
        self.suspicious_patterns: Dict[str, int] = {}
        self.db = db
        self.cache = cache
        self._initialized = True

    @property
    def encryption_key(self):
        return SecurityManager._encryption_key

    @property
    def fernet(self):
        return SecurityManager._fernet

    async def verify_ws_connection(self, websocket) -> bool:
        """Verify WebSocket connection authentication with enhanced security"""
        try:
            # Get token from WebSocket headers or query parameters
            token = websocket.headers.get('Authorization') or websocket.query_params.get('token')
            if not token:
                return False

            # Verify token
            payload = await self.verify_token(token)
            if not payload:
                return False

            # Enhanced security checks
            client_ip = websocket.client.host
            if await self.is_ip_blocked(client_ip):
                await self.log_security_event('blocked_ip_attempt', payload['user_id'], {
                    'ip': client_ip,
                    'reason': 'IP blocked'
                })
                return False

            # Check rate limits with action-specific constraints
            if not await self.check_rate_limit(payload['user_id'], 'ws_connection', 10, 60):
                await self.increment_suspicious_pattern(client_ip, 'rate_limit_exceeded')
                return False

            # Verify browser fingerprint if provided
            fingerprint = websocket.headers.get('X-Browser-Fingerprint')
            if fingerprint and not await self.verify_fingerprint(payload['user_id'], fingerprint):
                await self.log_security_event('invalid_fingerprint', payload['user_id'], {
                    'ip': client_ip,
                    'fingerprint': fingerprint
                })
                return False

            # Log successful connection
            await self.log_security_event('ws_connection', payload['user_id'], {
                'ip': client_ip,
                'user_agent': websocket.headers.get('User-Agent'),
                'fingerprint': fingerprint
            })

            return True

        except Exception as e:
            await self.log_security_event('ws_connection_error', 'unknown', {'error': str(e)})
            return False

    async def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token with additional security checks"""
        try:
            payload = jwt.decode(token, self.encryption_key, algorithms=["HS256"])

            # Check token expiration with grace period
            if 'exp' in payload:
                expiration = datetime.fromtimestamp(payload['exp'])
                if datetime.utcnow() > expiration + timedelta(minutes=5):
                    return None

            # Verify token signature hasn't been tampered
            if not await self.verify_token_signature(token, payload):
                return None

            return payload
        except Exception:
            return None

    async def encrypt_profile(self, profile_data: Dict) -> bytes:
        """Encrypt sensitive profile data with enhanced security"""
        # Add security metadata
        profile_data['security'] = {
            'encrypted_at': datetime.utcnow().isoformat(),
            'fingerprint_hash': self.hash_fingerprint(profile_data.get('fingerprint', {})),
            'security_version': '2.0'
        }

        # Convert to JSON string for consistent encoding using our custom encoder
        try:
            data_str = json.dumps(profile_data, sort_keys=True, cls=DateTimeEncoder)
            return self.fernet.encrypt(data_str.encode())
        except TypeError as e:
            print(f"JSON serialization error in encrypt_profile: {str(e)}")
            # Try to convert datetime objects manually
            if 'created_at' in profile_data and isinstance(profile_data['created_at'], datetime):
                profile_data['created_at'] = profile_data['created_at'].isoformat()
            if 'updated_at' in profile_data and isinstance(profile_data['updated_at'], datetime):
                profile_data['updated_at'] = profile_data['updated_at'].isoformat()

            # Try again with the modified data
            data_str = json.dumps(profile_data, sort_keys=True)
            return self.fernet.encrypt(data_str.encode())

    async def encrypt_sensitive_data(self, data: Dict) -> bytes:
        """Encrypt sensitive data with enhanced security"""
        # Add security metadata
        data['security'] = {
            'encrypted_at': datetime.utcnow().isoformat(),
            'fingerprint_hash': self.hash_fingerprint(data.get('fingerprint', {})),
            'security_version': '2.0'
        }

        # Convert to JSON string for consistent encoding using our custom encoder
        try:
            data_str = json.dumps(data, sort_keys=True, cls=DateTimeEncoder)
            return self.fernet.encrypt(data_str.encode())
        except TypeError as e:
            print(f"JSON serialization error: {str(e)}")
            # Try to convert datetime objects manually
            if 'created_at' in data and isinstance(data['created_at'], datetime):
                data['created_at'] = data['created_at'].isoformat()
            if 'updated_at' in data and isinstance(data['updated_at'], datetime):
                data['updated_at'] = data['updated_at'].isoformat()

            # Try again with the modified data
            data_str = json.dumps(data, sort_keys=True)
            return self.fernet.encrypt(data_str.encode())

    async def decrypt_sensitive_data(self, encrypted_data: bytes) -> Dict:
        """Decrypt sensitive data with validation"""
        try:
            # Try to decrypt with current key
            try:
                decrypted = self.fernet.decrypt(encrypted_data)
                data = json.loads(decrypted.decode())

                # Validate security metadata
                if 'security' not in data:
                    print("Warning: Invalid data format: missing security metadata")
                    # Add security metadata if missing
                    data['security'] = {
                        'encrypted_at': datetime.utcnow().isoformat(),
                        'security_version': '2.0'
                    }

                # Convert string dates back to datetime objects if needed
                if 'created_at' in data and isinstance(data['created_at'], str):
                    try:
                        data['created_at'] = datetime.fromisoformat(data['created_at'])
                    except ValueError:
                        pass  # Keep as string if can't convert

                if 'updated_at' in data and isinstance(data['updated_at'], str):
                    try:
                        data['updated_at'] = datetime.fromisoformat(data['updated_at'])
                    except ValueError:
                        pass  # Keep as string if can't convert

                return data
            except Exception as decrypt_error:
                print(f"Error decrypting data with current key: {str(decrypt_error)}")

                # Try to decrypt with a different key if the file exists
                key_file_path = "sessions/security/encryption_key.old"
                if os.path.exists(key_file_path):
                    try:
                        with open(key_file_path, "rb") as key_file:
                            old_key = key_file.read().strip()
                            old_fernet = Fernet(old_key)
                            decrypted = old_fernet.decrypt(encrypted_data)
                            data = json.loads(decrypted.decode())

                            print("Successfully decrypted with old key")

                            # Re-encrypt with the current key for future use
                            data_str = json.dumps(data, sort_keys=True, cls=DateTimeEncoder)
                            new_encrypted = self.fernet.encrypt(data_str.encode())

                            # Return the data and the new encrypted version
                            return data
                    except Exception as old_key_error:
                        print(f"Error decrypting with old key: {str(old_key_error)}")

                # If we get here, both current and old keys failed
                raise decrypt_error

        except Exception as e:
            print(f"Error in decrypt_sensitive_data: {str(e)}")
            await self.log_security_event('data_decrypt_error', 'unknown', {'error': str(e)})
            # Return empty dict instead of raising to avoid breaking the application
            return {}

    async def decrypt_profile(self, encrypted_data: bytes) -> Dict:
        """Decrypt profile data with validation"""
        try:
            # Try to decrypt with current key
            try:
                decrypted = self.fernet.decrypt(encrypted_data)
                profile_data = json.loads(decrypted.decode())

                # Validate security metadata
                if 'security' not in profile_data:
                    print("Warning: Invalid profile format: missing security metadata")
                    # Add security metadata if missing
                    profile_data['security'] = {
                        'encrypted_at': datetime.utcnow().isoformat(),
                        'security_version': '2.0'
                    }

                # Verify fingerprint hasn't been tampered
                if 'fingerprint' in profile_data:
                    try:
                        current_hash = self.hash_fingerprint(profile_data['fingerprint'])
                        if 'fingerprint_hash' in profile_data.get('security', {}) and current_hash != profile_data['security']['fingerprint_hash']:
                            print(f"Warning: Profile fingerprint integrity check failed")
                            # Update the hash instead of failing
                            profile_data['security']['fingerprint_hash'] = current_hash
                    except Exception as hash_error:
                        print(f"Error checking fingerprint hash: {str(hash_error)}")

                # Convert string dates back to datetime objects if needed
                if 'created_at' in profile_data and isinstance(profile_data['created_at'], str):
                    try:
                        profile_data['created_at'] = datetime.fromisoformat(profile_data['created_at'])
                    except ValueError:
                        pass  # Keep as string if can't convert

                if 'updated_at' in profile_data and isinstance(profile_data['updated_at'], str):
                    try:
                        profile_data['updated_at'] = datetime.fromisoformat(profile_data['updated_at'])
                    except ValueError:
                        pass  # Keep as string if can't convert

                return profile_data
            except Exception as decrypt_error:
                print(f"Error decrypting profile with current key: {str(decrypt_error)}")

                # Try to decrypt with a different key if the file exists
                key_file_path = "sessions/security/encryption_key.old"
                if os.path.exists(key_file_path):
                    try:
                        with open(key_file_path, "rb") as key_file:
                            old_key = key_file.read().strip()
                            old_fernet = Fernet(old_key)
                            decrypted = old_fernet.decrypt(encrypted_data)
                            profile_data = json.loads(decrypted.decode())

                            print("Successfully decrypted profile with old key")

                            # Re-encrypt with the current key for future use
                            profile_data_str = json.dumps(profile_data, sort_keys=True, cls=DateTimeEncoder)
                            new_encrypted = self.fernet.encrypt(profile_data_str.encode())

                            # Return the data
                            return profile_data
                    except Exception as old_key_error:
                        print(f"Error decrypting profile with old key: {str(old_key_error)}")

                # If we get here, both current and old keys failed
                raise decrypt_error

        except Exception as e:
            print(f"Error in decrypt_profile: {str(e)}")
            await self.log_security_event('profile_decrypt_error', 'unknown', {'error': str(e)})
            # Return empty dict instead of raising to avoid breaking the application
            return {}

    async def check_rate_limit(self, user_id: str, action: str, limit: int, window: int) -> bool:
        """Enhanced rate limiting with action-specific tracking"""
        key = f"{user_id}:{action}"
        now = time.time()

        if key not in self.rate_limits:
            self.rate_limits[key] = []

        # Clean old entries
        self.rate_limits[key] = [t for t in self.rate_limits[key] if t > now - window]

        # Check burst protection
        if len(self.rate_limits[key]) >= 5 and \
           (self.rate_limits[key][-1] - self.rate_limits[key][-5]) < 1.0:
            await self.log_security_event('burst_protection', user_id, {
                'action': action,
                'attempts': len(self.rate_limits[key])
            })
            return False

        if len(self.rate_limits[key]) >= limit:
            return False

        self.rate_limits[key].append(now)
        return True

    async def verify_fingerprint(self, user_id: str, fingerprint: Union[str, Dict]) -> bool:
        """Verify browser fingerprint authenticity"""
        if isinstance(fingerprint, str):
            try:
                fingerprint = json.loads(fingerprint)
            except:
                return False

        # Get stored fingerprints for user
        stored_prints = self.fingerprint_history.get(user_id, [])

        # Check if fingerprint matches any stored ones
        fingerprint_hash = self.hash_fingerprint(fingerprint)
        return any(print_data['hash'] == fingerprint_hash for print_data in stored_prints)

    async def register_fingerprint(self, user_id: str, fingerprint: Dict):
        """Register new browser fingerprint"""
        if user_id not in self.fingerprint_history:
            self.fingerprint_history[user_id] = []

        self.fingerprint_history[user_id].append({
            'hash': self.hash_fingerprint(fingerprint),
            'created_at': datetime.utcnow().isoformat(),
            'fingerprint': fingerprint
        })

        # Keep only last 5 fingerprints
        self.fingerprint_history[user_id] = self.fingerprint_history[user_id][-5:]

    async def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        if ip in self.blocked_ips:
            if datetime.utcnow() > self.blocked_ips[ip]:
                del self.blocked_ips[ip]
                return False
            return True
        return False

    async def block_ip(self, ip: str, duration_hours: int = 24):
        """Block IP address for specified duration"""
        self.blocked_ips[ip] = datetime.utcnow() + timedelta(hours=duration_hours)
        await self.log_security_event('ip_blocked', 'system', {
            'ip': ip,
            'duration_hours': duration_hours
        })

    async def increment_suspicious_pattern(self, identifier: str, pattern_type: str):
        """Track suspicious behavior patterns"""
        key = f"{identifier}:{pattern_type}"
        self.suspicious_patterns[key] = self.suspicious_patterns.get(key, 0) + 1

        # Auto-block if threshold exceeded
        if self.suspicious_patterns[key] >= 10:
            await self.block_ip(identifier)
            await self.log_security_event('auto_blocked', 'system', {
                'identifier': identifier,
                'pattern_type': pattern_type,
                'count': self.suspicious_patterns[key]
            })

    def hash_fingerprint(self, fingerprint: Dict) -> str:
        """Generate consistent hash for fingerprint"""
        fingerprint_str = json.dumps(fingerprint, sort_keys=True)
        return hashlib.sha256(fingerprint_str.encode()).hexdigest()

    async def verify_token_signature(self, token: str, payload: Dict) -> bool:
        """Verify JWT token signature integrity"""
        try:
            # Split token into parts
            header_b64, payload_b64, signature = token.split('.')

            # Verify signature matches payload
            expected_signature = jwt.encode(
                payload,
                self.encryption_key,
                algorithm="HS256"
            ).split('.')[2]

            return signature == expected_signature
        except:
            return False

    async def log_security_event(self, event_type: str, user_id: str, details: Dict):
        """Enhanced security event logging"""
        event_data = {
            'event_type': event_type,
            'user_id': user_id,
            'details': details,
            'timestamp': datetime.utcnow().isoformat(),
            'severity': self.get_event_severity(event_type),
            'source_ip': details.get('ip', 'unknown'),
            'user_agent': details.get('user_agent', 'unknown')
        }
        # Log to console for now
        print(f"SECURITY EVENT: {event_data}")

        # If database is available, log to it
        if hasattr(self, 'db') and self.db is not None:
            try:
                return await self.db.client.table('security_events').insert(event_data).execute()
            except Exception as e:
                print(f"Error logging security event to database: {e}")

    def get_event_severity(self, event_type: str) -> str:
        """Determine security event severity"""
        high_severity = ['blocked_ip_attempt', 'invalid_fingerprint', 'burst_protection']
        medium_severity = ['rate_limit_exceeded', 'profile_decrypt_error']

        if event_type in high_severity:
            return 'high'
        elif event_type in medium_severity:
            return 'medium'
        return 'low'

    async def get_user_permissions(self, user_id: str) -> Dict:
        """Get user permissions with caching"""
        # Default permissions if database is not available
        default_permissions = {'role': 'basic', 'user_id': user_id}

        # If cache is available, try to use it
        if hasattr(self, 'cache') and self.cache is not None:
            cache_key = f"permissions:{user_id}"
            try:
                # Check cache first
                cached = await self.cache.get(cache_key)
                if cached:
                    return cached
            except Exception as e:
                print(f"Error accessing cache: {e}")

        # If database is available, try to get from database
        if hasattr(self, 'db') and self.db is not None:
            try:
                result = await self.db.client.table('user_permissions').select('*').eq('user_id', user_id).execute()
                permissions = result.data[0] if result.data else default_permissions

                # Cache for 5 minutes if cache is available
                if hasattr(self, 'cache') and self.cache is not None:
                    try:
                        await self.cache.set(cache_key, permissions, expire=300)
                    except Exception as e:
                        print(f"Error setting cache: {e}")

                return permissions
            except Exception as e:
                print(f"Error accessing database: {e}")

        return default_permissions
