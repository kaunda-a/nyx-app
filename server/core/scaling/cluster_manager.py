from typing import Dict, List, Optional
import asyncio
import logging
from dataclasses import dataclass

@dataclass
class NodeStatus:
    node_id: str
    ip: str
    cpu_usage: float
    memory_usage: float
    active_browsers: int
    max_browsers: int
    status: str  # 'active', 'draining', 'offline'
    last_heartbeat: float

class ClusterManager:
    def __init__(self):
        self.nodes: Dict[str, NodeStatus] = {}
        self.logger = logging.getLogger("camoufox.cluster")
        self._lock = asyncio.Lock()
        
    async def register_node(self, node_id: str, ip: str, max_browsers: int) -> bool:
        """Register a new node in the cluster"""
        async with self._lock:
            if node_id in self.nodes:
                return False
                
            self.nodes[node_id] = NodeStatus(
                node_id=node_id,
                ip=ip,
                cpu_usage=0.0,
                memory_usage=0.0,
                active_browsers=0,
                max_browsers=max_browsers,
                status='active',
                last_heartbeat=asyncio.get_event_loop().time()
            )
            self.logger.info(f"Node {node_id} registered with IP {ip}")
            return True

    async def update_node_status(self, node_id: str, metrics: Dict) -> bool:
        """Update node status with latest metrics"""
        async with self._lock:
            if node_id not in self.nodes:
                return False
                
            node = self.nodes[node_id]
            node.cpu_usage = metrics.get('cpu_usage', node.cpu_usage)
            node.memory_usage = metrics.get('memory_usage', node.memory_usage)
            node.active_browsers = metrics.get('active_browsers', node.active_browsers)
            node.last_heartbeat = asyncio.get_event_loop().time()
            return True

    async def select_node_for_browser(self) -> Optional[str]:
        """Select best node for new browser instance"""
        async with self._lock:
            best_node = None
            min_load = float('inf')
            
            for node_id, status in self.nodes.items():
                if status.status != 'active':
                    continue
                    
                if status.active_browsers >= status.max_browsers:
                    continue
                    
                # Calculate load score (lower is better)
                load_score = (0.7 * status.cpu_usage + 
                            0.3 * status.memory_usage + 
                            status.active_browsers / status.max_browsers)
                            
                if load_score < min_load:
                    min_load = load_score
                    best_node = node_id
                    
            return best_node

    async def drain_node(self, node_id: str) -> bool:
        """Mark node for draining (no new browsers)"""
        async with self._lock:
            if node_id not in self.nodes:
                return False
                
            self.nodes[node_id].status = 'draining'
            self.logger.info(f"Node {node_id} marked for draining")
            return True

    async def remove_node(self, node_id: str) -> bool:
        """Remove node from cluster"""
        async with self._lock:
            if node_id not in self.nodes:
                return False
                
            del self.nodes[node_id]
            self.logger.info(f"Node {node_id} removed from cluster")
            return True

    async def cleanup_stale_nodes(self, timeout: float = 60):
        """Remove nodes that haven't sent heartbeat"""
        current_time = asyncio.get_event_loop().time()
        
        async with self._lock:
            for node_id, status in list(self.nodes.items()):
                if current_time - status.last_heartbeat > timeout:
                    await self.remove_node(node_id)
