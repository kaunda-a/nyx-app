from pathlib import Path
from typing import Dict, Any
from security.security_manager import SecurityManager
from db.supabase import SupabaseClient
from core.monitoring.monitoring_system import MonitoringSystem
from core.monitoring.analytics import Analytics
from core.scaling.cluster_manager import ClusterManager
from core.scaling.load_balancer import LoadBalancer
from core.profile_manager import ProfileManager
from core.proxy_manager import ProxyManager
from core.cache_manager import CacheManager
import os
from dotenv import load_dotenv

class Container:
    """Dependency Injection Container"""

    def __init__(self, config: dict):
        self._instances = {}
        self.config = config
        load_dotenv()  # Ensure environment variables are loaded

        # Validate required environment variables
        self._validate_env()

    def _validate_env(self):
        """Validate required environment variables"""
        required_vars = ['SUPABASE_URL', 'SUPABASE_KEY']
        missing_vars = [var for var in required_vars if not os.getenv(var)]

        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}\n"
                f"Please create a .env file with these variables in the project root."
            )

    def get_security_manager(self) -> SecurityManager:
        if 'security_manager' not in self._instances:
            # Create security manager without database client to avoid circular dependency
            self._instances['security_manager'] = SecurityManager()

            # After creating the security manager, we can create the database client
            # and update the security manager with it
            if 'db_client' not in self._instances:
                self._instances['db_client'] = SupabaseClient()

            # Update the security manager with the database client
            self._instances['security_manager'].db = self._instances['db_client']
        return self._instances['security_manager']


    def get_db_client(self) -> SupabaseClient:
        if 'db_client' not in self._instances:
            self._instances['db_client'] = SupabaseClient()
        return self._instances['db_client']

    def get_monitoring_system(self) -> MonitoringSystem:
        if 'monitoring_system' not in self._instances:
            self._instances['monitoring_system'] = MonitoringSystem()
        return self._instances['monitoring_system']

    def get_analytics(self) -> Analytics:
        if 'analytics' not in self._instances:
            self._instances['analytics'] = Analytics()
        return self._instances['analytics']


    def get_cluster_manager(self) -> ClusterManager:
        if 'cluster_manager' not in self._instances:
            self._instances['cluster_manager'] = ClusterManager()
        return self._instances['cluster_manager']

    def get_load_balancer(self) -> LoadBalancer:
        if 'load_balancer' not in self._instances:
            self._instances['load_balancer'] = LoadBalancer(
                self.get_cluster_manager()
            )
        return self._instances['load_balancer']

    def get_profile_manager(self) -> ProfileManager:
        if 'profile_manager' not in self._instances:
            # Create profile manager with security manager
            security_manager = self.get_security_manager()
            data_dir = Path(self.config.get('data_dir', './sessions/storage'))
            profiles_dir = data_dir / 'profiles'

            self._instances['profile_manager'] = ProfileManager(
                base_dir=profiles_dir,
                security_manager=security_manager
            )
        return self._instances['profile_manager']
