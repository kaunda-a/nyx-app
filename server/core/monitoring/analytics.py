from typing import Dict, List
import pandas as pd
from datetime import datetime, timedelta

class Analytics:
    def __init__(self):
        self.metrics_store: Dict[str, List[dict]] = {}
        self.reports_cache: Dict[str, dict] = {}
        self.alert_history: List[dict] = []

    async def process_metrics(self, metrics: dict):
        """Process and store metrics"""
        timestamp = datetime.utcnow()
        for metric_name, value in metrics.items():
            if metric_name not in self.metrics_store:
                self.metrics_store[metric_name] = []
            self.metrics_store[metric_name].append({
                'timestamp': timestamp,
                'value': value
            })

    async def generate_report(self, report_type: str, time_range: str) -> dict:
        """Generate analytics report"""
        cache_key = f"{report_type}_{time_range}"
        if cache_key in self.reports_cache:
            return self.reports_cache[cache_key]

        report = await self._calculate_metrics(report_type, time_range)
        self.reports_cache[cache_key] = report
        return report

    async def _calculate_metrics(self, report_type: str, time_range: str) -> dict:
        """Calculate metrics for report"""
        metrics_df = pd.DataFrame(self.metrics_store[report_type])
        
        return {
            'summary': metrics_df['value'].describe().to_dict(),
            'trend': metrics_df.resample('1H', on='timestamp')['value'].mean().to_dict(),
            'alerts': [alert for alert in self.alert_history 
                      if alert['metric'] == report_type]
        }