from typing import Dict, List
import asyncio
import logging
from datetime import datetime, timedelta
import psutil
from db.supabase import SupabaseClient  # Changed from relative to absolute import

class MonitoringSystem:
    def __init__(self):
        self.db = SupabaseClient()
        self.logger = logging.getLogger("camoufox.monitoring")
        self.metrics_buffer: List[Dict] = []
        self.buffer_size = 100
        self.flush_interval = 60  # seconds

    async def start_monitoring(self):
        """Start monitoring loop"""
        while True:
            try:
                await self.collect_metrics()
                if len(self.metrics_buffer) >= self.buffer_size:
                    await self.flush_metrics()
                await asyncio.sleep(5)
            except Exception as e:
                self.logger.error(f"Monitoring error: {str(e)}")
                await asyncio.sleep(5)

    async def collect_metrics(self):
        """Collect system metrics"""
        metrics = {
            'timestamp': datetime.utcnow().isoformat(),
            'cpu_percent': psutil.cpu_percent(),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'network_io': dict(psutil.net_io_counters()._asdict())
        }
        
        # Add browser metrics
        browser_metrics = await self._collect_browser_metrics()
        metrics.update(browser_metrics)
        
        self.metrics_buffer.append(metrics)

    async def _collect_browser_metrics(self) -> Dict:
        """Collect browser-related metrics"""
        result = await self.db.client.table('browser_sessions')\
            .select('status')\
            .execute()
        
        status_counts = {'active': 0, 'terminated': 0, 'error': 0}
        for session in result.data:
            status_counts[session['status']] = status_counts.get(session['status'], 0) + 1
            
        return {
            'browser_metrics': status_counts
        }

    async def flush_metrics(self):
        """Flush metrics to database"""
        if not self.metrics_buffer:
            return
            
        try:
            # Batch insert metrics
            await self.db.client.table('system_metrics')\
                .insert(self.metrics_buffer)\
                .execute()
            
            self.metrics_buffer = []
            
        except Exception as e:
            self.logger.error(f"Failed to flush metrics: {str(e)}")

    async def check_alerts(self):
        """Check for alert conditions"""
        try:
            # Get alert rules
            rules = await self.db.client.table('alert_rules').select('*').execute()
            
            for rule in rules.data:
                if await self._check_alert_condition(rule):
                    await self._trigger_alert(rule)
                    
        except Exception as e:
            self.logger.error(f"Alert check failed: {str(e)}")

    async def _check_alert_condition(self, rule: Dict) -> bool:
        """Check if alert condition is met"""
        # Get recent metrics
        result = await self.db.client.table('system_metrics')\
            .select('*')\
            .order('timestamp', desc=True)\
            .limit(1)\
            .execute()
            
        if not result.data:
            return False
            
        metrics = result.data[0]
        
        # Check condition
        metric_value = metrics.get(rule['metric'])
        if metric_value is None:
            return False
            
        if rule['condition'] == 'greater_than':
            return metric_value > rule['threshold']
        elif rule['condition'] == 'less_than':
            return metric_value < rule['threshold']
            
        return False

    async def _trigger_alert(self, rule: Dict):
        """Trigger alert based on rule"""
        alert = {
            'rule_id': rule['id'],
            'timestamp': datetime.utcnow().isoformat(),
            'message': f"Alert: {rule['metric']} {rule['condition']} {rule['threshold']}"
        }
        
        await self.db.client.table('alerts').insert(alert).execute()
        
        # Log alert
        self.logger.warning(f"Alert triggered: {alert['message']}")
