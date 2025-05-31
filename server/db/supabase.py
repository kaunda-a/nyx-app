"""
Simplified Supabase client for database operations.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Singleton instance for easy access
_instance = None

def get_supabase_client() -> Client:
    """
    Get a Supabase client instance (singleton pattern).

    Returns:
        A configured Supabase client
    """
    global _instance
    if _instance is None:
        supabase = SupabaseClient()
        _instance = supabase.client
    return _instance

class SupabaseClient:
    """
    access to the Supabase client instance.
    """
    def __init__(self):
        """Initialize the Supabase client with credentials from environment variables."""
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Missing Supabase credentials")
        self.client = create_client(url, key)

# Singleton instance for easy access
_instance = None

def get_supabase_client() -> Client:
    """
    Get a Supabase client instance (singleton pattern).

    Returns:
        A configured Supabase client
    """
    global _instance
    if _instance is None:
        _instance = SupabaseClient().client
    return _instance
