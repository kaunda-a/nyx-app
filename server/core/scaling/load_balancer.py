from typing import Dict, List, Optional
import asyncio
import logging
from datetime import datetime
from .cluster_manager import ClusterManager
from db.supabase import SupabaseClient

class LoadBalancer:
    def __init__(self, cluster_manager: ClusterManager):
        self.cluster = cluster_manager
        try:
            self.db = SupabaseClient()
        except Exception as e:
            self.logger = logging.getLogger("camoufox.loadbalancer")
            self.logger.warning(f"Failed to initialize Supabase client: {e}. Running in offline mode.")
            self.db = None
        self.logger = logging.getLogger("camoufox.loadbalancer")
        self.health_checks: Dict[str, datetime] = {}
        
    async def allocate_browser(self, user_id: str, requirements: Dict) -> Optional[Dict]:
        """Allocate browser instance to optimal node"""
        try:
            # Check user quota
            quota = await self._check_user_quota(user_id)
            if not quota['allowed']:
                raise ValueError(f"User quota exceeded: {quota['reason']}")

            # Get best node
            node_id = await self.cluster.select_node_for_browser()
            if not node_id:
                raise ValueError("No suitable nodes available")

            # Record allocation
            allocation = {
                'user_id': user_id,
                'node_id': node_id,
                'requirements': requirements,
                'allocated_at': datetime.utcnow().isoformat()
            }
            
            await self.db.client.table('browser_allocations').insert(allocation).execute()
            
            return {
                'node_id': node_id,
                'allocation_id': allocation['id']
            }

        except Exception as e:
            self.logger.error(f"Browser allocation failed: {str(e)}")
            return None

    async def _check_user_quota(self, user_id: str) -> Dict:
        """Check if user has available quota"""
        result = await self.db.client.table('user_quotas').select('*').eq('user_id', user_id).execute()
        if not result.data:
            return {'allowed': True}  # Default quota
            
        quota = result.data[0]
        current_usage = await self._get_current_usage(user_id)
        
        if current_usage >= quota['max_concurrent_browsers']:
            return {
                'allowed': False,
                'reason': 'Maximum concurrent browsers reached'
            }
            
        return {'allowed': True}

    async def _get_current_usage(self, user_id: str) -> int:
        """Get current browser usage for user"""
        if not self.db:
            return 0  # Default value when running without Supabase
        
        try:
            result = await self.db.client.table('browser_sessions')\
                .select('count')\
                .eq('user_id', user_id)\
                .eq('status', 'active')\
                .execute()
            return result.count
        except Exception as e:
            self.logger.error(f"Error getting usage: {e}")
            return 0

    async def start_health_checks(self):
        """Start periodic health checks"""
        while True:
            try:
                nodes = list(self.cluster.nodes.keys())
                for node_id in nodes:
                    health = await self._check_node_health(node_id)
                    if not health['healthy']:
                        await self.handle_unhealthy_node(node_id, health['reason'])
                        
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                self.logger.error(f"Health check error: {str(e)}")
                await asyncio.sleep(5)

    async def _check_node_health(self, node_id: str) -> Dict:
        """Check health of a specific node"""
        node = self.cluster.nodes.get(node_id)
        if not node:
            return {'healthy': False, 'reason': 'Node not found'}
            
        if node.status == 'offline':
            return {'healthy': False, 'reason': 'Node offline'}
            
        # Check resource thresholds
        if node.cpu_usage > 90 or node.memory_usage > 90:
            return {
                'healthy': False,
                'reason': f'Resource threshold exceeded: CPU={node.cpu_usage}%, MEM={node.memory_usage}%'
            }
            
        return {'healthy': True}

    async def handle_unhealthy_node(self, node_id: str, reason: str):
        """Handle unhealthy node"""
        self.logger.warning(f"Node {node_id} unhealthy: {reason}")
        
        # Mark node for draining
        await self.cluster.drain_node(node_id)
        
        # Log incident
        await self.db.client.table('node_incidents').insert({
            'node_id': node_id,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        }).execute()
        
        # Trigger browser migrations if needed
        await self._migrate_browsers(node_id)

    async def _migrate_browsers(self, node_id: str):
        """Migrate browsers from unhealthy node"""
        # Get active browsers on node
        result = await self.db.client.table('browser_sessions')\
            .select('*')\
            .eq('node_id', node_id)\
            .eq('status', 'active')\
            .execute()
            
        for browser in result.data:
            # Find new node
            new_node = await self.cluster.select_node_for_browser()
            if new_node:
                # Migrate browser to new node
                await self._migrate_single_browser(browser, new_node)

    async def _migrate_single_browser(self, browser: Dict, new_node_id: str):
        """Migrate single browser to new node"""
        try:
            # Update browser session
            await self.db.client.table('browser_sessions')\
                .update({'node_id': new_node_id})\
                .eq('id', browser['id'])\
                .execute()
                
            # Log migration
            await self.db.client.table('browser_migrations').insert({
                'browser_id': browser['id'],
                'from_node': browser['node_id'],
                'to_node': new_node_id,
                'timestamp': datetime.utcnow().isoformat()
            }).execute()
            
        except Exception as e:
            self.logger.error(f"Browser migration failed: {str(e)}")
