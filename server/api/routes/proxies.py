from typing import Dict, List, Optional, Union, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator, root_validator
import asyncio
import uuid
import logging
import re
from datetime import datetime

from core.proxy_manager import proxy_manager
from security.auth import get_current_user, User

router = APIRouter(
    prefix="/proxies",
    tags=["proxies"],
    responses={404: {"description": "Not found"}},
)

# Utility functions for proxy URL parsing
def parse_proxy_url(url: str) -> Optional[Dict[str, Any]]:
    """
    Parse a proxy URL into its components

    Handles various formats:
    - protocol://host:port
    - protocol://username:password@host:port
    - host:port
    - username:password@host:port

    Returns:
        Dictionary with protocol, host, port, username, password (if available)
        or None if parsing fails
    """
    if not url or not isinstance(url, str):
        return None

    url = url.strip()

    # Default values
    result = {
        'protocol': 'http',
        'host': '',
        'port': 8080
    }

    try:
        # Check if URL has protocol
        if '://' in url:
            # Extract protocol
            protocol_part, rest = url.split('://', 1)
            result['protocol'] = protocol_part.lower()

            # Check for authentication
            if '@' in rest:
                auth_part, host_part = rest.split('@', 1)
                if ':' in auth_part:
                    username, password = auth_part.split(':', 1)
                    result['username'] = username
                    result['password'] = password
            else:
                host_part = rest

            # Extract host and port
            if ':' in host_part:
                host, port_str = host_part.split(':', 1)
                result['host'] = host
                try:
                    result['port'] = int(port_str)
                except ValueError:
                    # Invalid port
                    return None
            else:
                result['host'] = host_part

        # No protocol, check if it's host:port or username:password@host:port
        elif '@' in url:
            # Format: username:password@host:port
            auth_part, host_part = url.split('@', 1)
            if ':' in auth_part:
                username, password = auth_part.split(':', 1)
                result['username'] = username
                result['password'] = password

            # Extract host and port
            if ':' in host_part:
                host, port_str = host_part.split(':', 1)
                result['host'] = host
                try:
                    result['port'] = int(port_str)
                except ValueError:
                    # Invalid port
                    return None
            else:
                result['host'] = host_part

        # Simple host:port format
        elif ':' in url:
            host, port_str = url.split(':', 1)
            result['host'] = host
            try:
                result['port'] = int(port_str)
            except ValueError:
                # Invalid port
                return None
        else:
            # Just a host
            result['host'] = url

        # Validate host is not empty
        if not result['host']:
            return None

        return result
    except Exception as e:
        logging.error(f"Error parsing proxy URL: {e}")
        return None

# Pydantic models for request/response validation
class ProxyCreate(BaseModel):
    host: str = Field(..., description="Proxy server host (e.g., '123.45.67.89')")
    port: int = Field(..., description="Proxy server port (e.g., 8080)")
    protocol: str = Field("http", description="Proxy protocol (http, https, socks4, socks5)")
    username: Optional[str] = Field(None, description="Proxy username if authentication is required")
    password: Optional[str] = Field(None, description="Proxy password if authentication is required")
    verify: bool = Field(True, description="Whether to verify the proxy works before adding")
    proxy_url: Optional[str] = Field(None, description="Full proxy URL (alternative to individual fields)")

    @root_validator(pre=True)
    def parse_proxy_url(cls, values):
        """Parse proxy_url if provided and populate individual fields"""
        proxy_url = values.get('proxy_url')

        # If proxy_url is provided and host is not, try to parse the URL
        if proxy_url and not values.get('host'):
            parsed = parse_proxy_url(proxy_url)
            if parsed:
                # Update values with parsed components
                values['host'] = parsed['host']
                values['port'] = parsed['port']
                values['protocol'] = parsed.get('protocol', 'http')

                if 'username' in parsed:
                    values['username'] = parsed['username']
                if 'password' in parsed:
                    values['password'] = parsed['password']
            else:
                raise ValueError(f"Could not parse proxy URL: {proxy_url}")

        return values

    @validator('protocol')
    def validate_protocol(cls, v):
        """Validate that protocol is one of the supported types"""
        if v.lower() not in ['http', 'https', 'socks4', 'socks5']:
            raise ValueError('Protocol must be one of: http, https, socks4, socks5')
        return v.lower()

    @validator('port')
    def validate_port(cls, v):
        """Validate that port is in valid range"""
        if v < 1 or v > 65535:
            raise ValueError('Port must be between 1 and 65535')
        return v

    @validator('host')
    def validate_host(cls, v):
        """Validate that host is not empty and is a valid hostname or IP"""
        if not v:
            raise ValueError('Host cannot be empty')

        # Check if it's an IP address or a hostname
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        hostname_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9\-\.]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$'

        if not (re.match(ip_pattern, v) or re.match(hostname_pattern, v)):
            # Not strictly enforcing this, just warning
            logging.warning(f"Host '{v}' does not appear to be a valid IP or hostname")

        return v

class ProxyResponse(BaseModel):
    id: str
    host: str
    port: int
    protocol: str
    username: Optional[str] = None
    status: str
    failure_count: int
    success_count: int
    average_response_time: float
    assigned_profiles: List[str]
    geolocation: Optional[Dict[str, Any]] = None
    ip: Optional[str] = None

class ProxyAssignmentResponse(BaseModel):
    profile_id: str
    proxy_id: str
    success: bool
    message: str

@router.get("/", response_model=List[ProxyResponse])
async def list_proxies(current_user: User = Depends(get_current_user)):
    """
    List all proxies with their status and assignments
    """
    try:
        proxies_data = await proxy_manager.list_proxies()
        return proxies_data
    except Exception as e:
        logging.error(f"Error listing proxies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list proxies: {str(e)}")

@router.post("/", response_model=ProxyResponse, status_code=status.HTTP_201_CREATED)
async def create_proxy(proxy: ProxyCreate, current_user: User = Depends(get_current_user)):
    """
    Add a new proxy to the pool

    This endpoint adds a new proxy to the pool with verification and geolocation detection.

    You can provide either individual fields (host, port, etc.) or a full proxy URL.
    """
    try:
        # Generate a unique ID for the proxy
        proxy_id = str(uuid.uuid4())

        # Log the proxy configuration for debugging
        logging.info(f"Adding proxy: host={proxy.host}, port={proxy.port}, protocol={proxy.protocol}")

        # Prepare proxy config
        proxy_config = {
            'host': proxy.host,
            'port': proxy.port,
            'protocol': proxy.protocol,
        }

        # Add authentication if provided
        if proxy.username:
            proxy_config['username'] = proxy.username
        if proxy.password:
            proxy_config['password'] = proxy.password

        # Add the proxy to the pool
        await proxy_manager.add_proxy(
            proxy_id=proxy_id,
            proxy_config=proxy_config,
            verify_geolocation=proxy.verify
        )

        # Get the proxy data for response
        all_proxies = await proxy_manager.list_proxies()
        for p in all_proxies:
            if p['id'] == proxy_id:
                return p

        raise HTTPException(status_code=500, detail="Proxy was added but could not be retrieved")
    except ValueError as ve:
        # Handle validation errors
        logging.error(f"Validation error adding proxy: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error adding proxy: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add proxy: {str(e)}")

@router.get("/{proxy_id}", response_model=ProxyResponse)
async def get_proxy(proxy_id: str, current_user: User = Depends(get_current_user)):
    """
    Get a specific proxy by ID
    """
    try:
        all_proxies = await proxy_manager.list_proxies()
        for proxy in all_proxies:
            if proxy['id'] == proxy_id:
                return proxy

        raise HTTPException(status_code=404, detail=f"Proxy with ID {proxy_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error retrieving proxy {proxy_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve proxy: {str(e)}")

@router.post("/{proxy_id}/check", response_model=Dict[str, Any])
async def check_proxy_health(proxy_id: str, current_user: User = Depends(get_current_user)):
    """
    Check if a proxy is working properly
    """
    try:
        # Check if proxy exists
        all_proxies = await proxy_manager.list_proxies()
        proxy_exists = any(p['id'] == proxy_id for p in all_proxies)

        if not proxy_exists:
            raise HTTPException(status_code=404, detail=f"Proxy with ID {proxy_id} not found")

        # Check proxy health
        is_healthy = await proxy_manager.check_proxy_health(proxy_id)

        return {
            "id": proxy_id,
            "is_healthy": is_healthy,
            "checked_at": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error checking proxy health {proxy_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check proxy health: {str(e)}")

class ProxyValidateRequest(BaseModel):
    """Request model for proxy validation"""
    host: Optional[str] = Field(None, description="Proxy server host")
    port: Optional[int] = Field(None, description="Proxy server port")
    protocol: str = Field("http", description="Proxy protocol (http, https, socks4, socks5)")
    username: Optional[str] = Field(None, description="Proxy username if authentication is required")
    password: Optional[str] = Field(None, description="Proxy password if authentication is required")
    proxy_url: Optional[str] = Field(None, description="Full proxy URL (alternative to individual fields)")

    @root_validator(pre=True)
    def parse_proxy_url(cls, values):
        """Parse proxy_url if provided and populate individual fields"""
        proxy_url = values.get('proxy_url')

        # If proxy_url is provided and host is not, try to parse the URL
        if proxy_url and not values.get('host'):
            parsed = parse_proxy_url(proxy_url)
            if parsed:
                # Update values with parsed components
                values['host'] = parsed['host']
                values['port'] = parsed['port']
                values['protocol'] = parsed.get('protocol', 'http')

                if 'username' in parsed:
                    values['username'] = parsed['username']
                if 'password' in parsed:
                    values['password'] = parsed['password']
            else:
                raise ValueError(f"Could not parse proxy URL: {proxy_url}")

        # Ensure we have both host and port
        if not values.get('host') or not values.get('port'):
            raise ValueError("Both host and port are required")

        return values

class ProxyValidateResponse(BaseModel):
    """Response model for proxy validation"""
    valid: bool
    message: str
    details: Optional[Dict[str, Any]] = None

@router.post("/validate", response_model=ProxyValidateResponse)
async def validate_proxy(proxy: ProxyValidateRequest, current_user: User = Depends(get_current_user)):
    """
    Validate a proxy configuration without adding it to the pool

    This endpoint checks if a proxy is working properly without adding it to the pool.
    It's useful for validating proxies before adding them.
    """
    try:
        # Create a temporary proxy ID for validation
        temp_proxy_id = f"temp_{uuid.uuid4()}"

        # Prepare proxy config
        proxy_config = {
            'host': proxy.host,
            'port': proxy.port,
            'protocol': proxy.protocol,
        }

        # Add authentication if provided
        if proxy.username:
            proxy_config['username'] = proxy.username
        if proxy.password:
            proxy_config['password'] = proxy.password

        # Log the proxy configuration for debugging
        logging.info(f"Validating proxy: {proxy_config}")

        # Add the proxy to the pool temporarily
        await proxy_manager.add_proxy(
            proxy_id=temp_proxy_id,
            proxy_config=proxy_config,
            verify_geolocation=True
        )

        # Check proxy health
        is_healthy = await proxy_manager.check_proxy_health(temp_proxy_id)

        # Get proxy details
        all_proxies = await proxy_manager.list_proxies()
        proxy_details = next((p for p in all_proxies if p['id'] == temp_proxy_id), None)

        # Remove the temporary proxy
        if temp_proxy_id in proxy_manager.proxy_pool:
            del proxy_manager.proxy_pool[temp_proxy_id]

        if is_healthy:
            return ProxyValidateResponse(
                valid=True,
                message="Proxy is working properly",
                details={
                    "geolocation": proxy_details.get('geolocation') if proxy_details else None,
                    "ip": proxy_details.get('ip') if proxy_details else None,
                    "response_time": proxy_details.get('average_response_time') if proxy_details else None
                }
            )
        else:
            error_message = "Proxy validation failed"
            if proxy_details and 'last_error' in proxy_details:
                error_message = f"Proxy validation failed: {proxy_details['last_error']}"

            return ProxyValidateResponse(
                valid=False,
                message=error_message,
                details=None
            )
    except ValueError as ve:
        return ProxyValidateResponse(
            valid=False,
            message=str(ve),
            details=None
        )
    except Exception as e:
        logging.error(f"Error validating proxy: {str(e)}")
        return ProxyValidateResponse(
            valid=False,
            message=f"Failed to validate proxy: {str(e)}",
            details=None
        )

@router.post("/assign", response_model=ProxyAssignmentResponse)
async def assign_proxy_to_profile(
    profile_id: str = Query(..., description="Profile ID to assign proxy to"),
    proxy_id: Optional[str] = Query(None, description="Specific proxy ID to assign (optional)"),
    country: Optional[str] = Query(None, description="Country code for geolocation (optional)"),
    current_user: User = Depends(get_current_user)
):
    """
    Assign a proxy to a profile

    This endpoint assigns a specific proxy to a profile or selects the best available proxy.
    """
    try:
        # If proxy_id is provided, check if it exists
        if proxy_id:
            all_proxies = await proxy_manager.list_proxies()
            proxy_exists = any(p['id'] == proxy_id for p in all_proxies)

            if not proxy_exists:
                raise HTTPException(status_code=404, detail=f"Proxy with ID {proxy_id} not found")

            # Check if proxy is already assigned
            for proxy in all_proxies:
                if proxy['id'] == proxy_id and profile_id in proxy['assigned_profiles']:
                    return ProxyAssignmentResponse(
                        profile_id=profile_id,
                        proxy_id=proxy_id,
                        success=True,
                        message="Proxy already assigned to this profile"
                    )

            # Remove any existing assignment for this profile
            if profile_id in proxy_manager.profile_proxies:
                del proxy_manager.profile_proxies[profile_id]

            # Assign the specific proxy
            proxy_manager.profile_proxies[profile_id] = proxy_id

            return ProxyAssignmentResponse(
                profile_id=profile_id,
                proxy_id=proxy_id,
                success=True,
                message="Proxy assigned successfully"
            )
        else:
            # Let the proxy manager select the best proxy
            proxy_config = await proxy_manager.get_proxy(
                profile_id=profile_id,
                required_country=country,
                assign_if_missing=True
            )

            if not proxy_config:
                return ProxyAssignmentResponse(
                    profile_id=profile_id,
                    proxy_id="",
                    success=False,
                    message="No suitable proxy found"
                )

            # Get the assigned proxy ID
            assigned_proxy_id = proxy_manager.profile_proxies.get(profile_id, "")

            return ProxyAssignmentResponse(
                profile_id=profile_id,
                proxy_id=assigned_proxy_id,
                success=bool(assigned_proxy_id),
                message="Proxy assigned successfully" if assigned_proxy_id else "Failed to assign proxy"
            )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error assigning proxy to profile {profile_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to assign proxy: {str(e)}")

@router.delete("/{proxy_id}", response_model=Dict[str, bool])
async def delete_proxy(proxy_id: str, current_user: User = Depends(get_current_user)):
    """
    Remove a proxy from the pool
    """
    try:
        # Check if proxy exists
        all_proxies = await proxy_manager.list_proxies()
        proxy_exists = any(p['id'] == proxy_id for p in all_proxies)

        if not proxy_exists:
            raise HTTPException(status_code=404, detail=f"Proxy with ID {proxy_id} not found")

        # Remove proxy from pool
        if proxy_id in proxy_manager.proxy_pool:
            del proxy_manager.proxy_pool[proxy_id]

        # Remove any profile assignments for this proxy
        for profile_id, assigned_proxy_id in list(proxy_manager.profile_proxies.items()):
            if assigned_proxy_id == proxy_id:
                del proxy_manager.profile_proxies[profile_id]

        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error deleting proxy {proxy_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete proxy: {str(e)}")