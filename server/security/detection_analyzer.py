"""
Detection Risk Analyzer
Analyzes browser sessions for bot detection risk factors and recommends mitigations.
"""
from typing import Dict, List, Any, Optional, Tuple
import json
import re
from datetime import datetime, timezone


class DetectionRiskAnalyzer:
    def __init__(self, supabase_client):
        """Initialize the detection risk analyzer with database client"""
        self.db = supabase_client
        self.risk_thresholds = {
            'low': 30,
            'medium': 60,
            'high': 80
        }
        
    async def analyze_session_risk(self, session_data: Dict) -> Dict:
        """
        Analyze browser session for detection risk factors
        
        Args:
            session_data: Browser session data to analyze
            
        Returns:
            Dict containing risk analysis results
        """
        risk_factors = []
        total_risk_score = 0
        
        # Extract key components from session data
        browser_errors = session_data.get('browser_errors', [])
        detection_score = session_data.get('detection_score', 0)
        proxy_performance = session_data.get('proxy_performance', {})
        
        # Analyze browser errors
        error_risk = await self._analyze_browser_errors(browser_errors)
        risk_factors.extend(error_risk['factors'])
        total_risk_score += error_risk['score']
        
        # Analyze detection score
        detection_risk = await self._analyze_detection_score(detection_score)
        risk_factors.extend(detection_risk['factors'])
        total_risk_score += detection_risk['score']
        
        # Analyze proxy performance
        proxy_risk = await self._analyze_proxy_performance(proxy_performance)
        risk_factors.extend(proxy_risk['factors'])
        total_risk_score += proxy_risk['score']
        
        # Analyze browser behavior patterns
        behavior_risk = await self._analyze_behavior_patterns(session_data)
        risk_factors.extend(behavior_risk['factors'])
        total_risk_score += behavior_risk['score']
        
        # Analyze fingerprint consistency
        fingerprint_risk = await self._analyze_fingerprint_consistency(session_data)
        risk_factors.extend(fingerprint_risk['factors'])
        total_risk_score += fingerprint_risk['score']
        
        # Calculate final risk score (0-100)
        final_risk_score = min(100, total_risk_score)
        
        # Determine risk level
        risk_level = 'low'
        if final_risk_score >= self.risk_thresholds['high']:
            risk_level = 'high'
        elif final_risk_score >= self.risk_thresholds['medium']:
            risk_level = 'medium'
        
        # Prepare analysis result
        analysis_result = {
            'session_id': session_data.get('id'),
            'risk_score': final_risk_score,
            'risk_level': risk_level,
            'risk_factors': risk_factors,
            'analyzed_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Store the analysis result
        await self._store_risk_analysis(analysis_result)
        
        return analysis_result
    
    async def _analyze_browser_errors(self, browser_errors: List[Dict]) -> Dict:
        """Analyze browser errors for detection risk"""
        risk_score = 0
        risk_factors = []
        
        # Common error patterns that indicate detection
        detection_error_patterns = [
            r'captcha',
            r'security check',
            r'unusual activity',
            r'automated',
            r'bot',
            r'challenge',
            r'blocked',
            r'suspicious',
            r'denied',
            r'forbidden'
        ]
        
        for error in browser_errors:
            error_message = error.get('message', '').lower()
            error_name = error.get('name', '').lower()
            error_stack = error.get('stack', '').lower()
            
            # Check for detection-related error patterns
            for pattern in detection_error_patterns:
                if re.search(pattern, error_message) or re.search(pattern, error_name) or re.search(pattern, error_stack):
                    risk_factors.append({
                        'type': 'browser_error',
                        'severity': 'high',
                        'description': f"Detection-related error: {error_name}",
                        'details': error_message
                    })
                    risk_score += 20  # High impact
                    break
            
            # Check for WebDriver-related errors
            if 'webdriver' in error_message or 'webdriver' in error_stack:
                risk_factors.append({
                    'type': 'browser_error',
                    'severity': 'critical',
                    'description': "WebDriver detection error",
                    'details': error_message
                })
                risk_score += 30  # Critical impact
            
            # Check for fingerprinting-related errors
            if 'canvas' in error_message or 'webgl' in error_message or 'audio' in error_message:
                risk_factors.append({
                    'type': 'browser_error',
                    'severity': 'high',
                    'description': "Fingerprinting-related error",
                    'details': error_message
                })
                risk_score += 20  # High impact
        
        return {
            'score': min(50, risk_score),  # Cap at 50
            'factors': risk_factors
        }
    
    async def _analyze_detection_score(self, detection_score: float) -> Dict:
        """Analyze detection score for risk assessment"""
        risk_score = 0
        risk_factors = []
        
        # Detection score is already on a scale of 0-100
        if detection_score > 80:
            risk_factors.append({
                'type': 'detection_score',
                'severity': 'critical',
                'description': "Very high detection score",
                'details': f"Detection score: {detection_score}"
            })
            risk_score = 40  # Critical impact
        elif detection_score > 60:
            risk_factors.append({
                'type': 'detection_score',
                'severity': 'high',
                'description': "High detection score",
                'details': f"Detection score: {detection_score}"
            })
            risk_score = 30  # High impact
        elif detection_score > 40:
            risk_factors.append({
                'type': 'detection_score',
                'severity': 'medium',
                'description': "Moderate detection score",
                'details': f"Detection score: {detection_score}"
            })
            risk_score = 20  # Medium impact
        elif detection_score > 20:
            risk_factors.append({
                'type': 'detection_score',
                'severity': 'low',
                'description': "Low detection score",
                'details': f"Detection score: {detection_score}"
            })
            risk_score = 10  # Low impact
        
        return {
            'score': risk_score,
            'factors': risk_factors
        }
    
    async def _analyze_proxy_performance(self, proxy_performance: Dict) -> Dict:
        """Analyze proxy performance for detection risk"""
        risk_score = 0
        risk_factors = []
        
        # Check for high latency
        latency = proxy_performance.get('latency', 0)
        if latency > 1000:  # More than 1 second
            risk_factors.append({
                'type': 'proxy_performance',
                'severity': 'high',
                'description': "Very high proxy latency",
                'details': f"Latency: {latency}ms"
            })
            risk_score += 20  # High impact
        elif latency > 500:  # More than 500ms
            risk_factors.append({
                'type': 'proxy_performance',
                'severity': 'medium',
                'description': "High proxy latency",
                'details': f"Latency: {latency}ms"
            })
            risk_score += 10  # Medium impact
        
        # Check for connection issues
        connection_errors = proxy_performance.get('connection_errors', 0)
        if connection_errors > 5:
            risk_factors.append({
                'type': 'proxy_performance',
                'severity': 'high',
                'description': "Multiple proxy connection errors",
                'details': f"Connection errors: {connection_errors}"
            })
            risk_score += 20  # High impact
        elif connection_errors > 0:
            risk_factors.append({
                'type': 'proxy_performance',
                'severity': 'medium',
                'description': "Proxy connection errors",
                'details': f"Connection errors: {connection_errors}"
            })
            risk_score += 10  # Medium impact
        
        # Check for IP reputation issues
        ip_blocked = proxy_performance.get('ip_blocked', False)
        if ip_blocked:
            risk_factors.append({
                'type': 'proxy_performance',
                'severity': 'critical',
                'description': "Proxy IP is blocked",
                'details': "The proxy IP address appears to be blocked"
            })
            risk_score += 30  # Critical impact
        
        return {
            'score': min(40, risk_score),  # Cap at 40
            'factors': risk_factors
        }
    
    async def _analyze_behavior_patterns(self, session_data: Dict) -> Dict:
        """Analyze browser behavior patterns for detection risk"""
        risk_score = 0
        risk_factors = []
        
        # Check for navigation timing anomalies
        navigation = session_data.get('navigation', {})
        if navigation:
            # Check for unrealistic navigation timing
            load_time = navigation.get('load_time', 0)
            dom_complete = navigation.get('dom_complete', 0)
            
            if load_time < 100:  # Unrealistically fast
                risk_factors.append({
                    'type': 'behavior_pattern',
                    'severity': 'high',
                    'description': "Unrealistically fast page load time",
                    'details': f"Load time: {load_time}ms"
                })
                risk_score += 20  # High impact
            
            if dom_complete < 50:  # Unrealistically fast
                risk_factors.append({
                    'type': 'behavior_pattern',
                    'severity': 'high',
                    'description': "Unrealistically fast DOM completion",
                    'details': f"DOM complete: {dom_complete}ms"
                })
                risk_score += 20  # High impact
        
        # Check for interaction patterns
        interactions = session_data.get('interactions', [])
        if interactions:
            # Check for inhuman interaction speeds
            for i in range(1, len(interactions)):
                time_diff = interactions[i].get('timestamp', 0) - interactions[i-1].get('timestamp', 0)
                if time_diff < 50 and interactions[i].get('type') != interactions[i-1].get('type'):
                    risk_factors.append({
                        'type': 'behavior_pattern',
                        'severity': 'medium',
                        'description': "Unusually fast interaction sequence",
                        'details': f"Time between interactions: {time_diff}ms"
                    })
                    risk_score += 15  # Medium impact
                    break
        
        return {
            'score': min(30, risk_score),  # Cap at 30
            'factors': risk_factors
        }
    
    async def _analyze_fingerprint_consistency(self, session_data: Dict) -> Dict:
        """Analyze fingerprint consistency for detection risk"""
        risk_score = 0
        risk_factors = []
        
        # Get profile ID from session data
        profile_id = session_data.get('profile_id')
        if not profile_id:
            return {
                'score': 0,
                'factors': []
            }
        
        # Get fingerprint data
        fingerprint_data = await self.db.get_browser_fingerprint(profile_id)
        if not fingerprint_data:
            return {
                'score': 0,
                'factors': []
            }
        
        # Check for inconsistencies between session and fingerprint
        session_user_agent = session_data.get('user_agent', '')
        fingerprint_user_agent = fingerprint_data.get('fingerprint', {}).get('navigator', {}).get('userAgent', '')
        
        if session_user_agent and fingerprint_user_agent and session_user_agent != fingerprint_user_agent:
            risk_factors.append({
                'type': 'fingerprint_consistency',
                'severity': 'critical',
                'description': "User agent mismatch between session and fingerprint",
                'details': f"Session: {session_user_agent}, Fingerprint: {fingerprint_user_agent}"
            })
            risk_score += 30  # Critical impact
        
        # Check for timezone inconsistency
        session_timezone = session_data.get('timezone', {})
        fingerprint_timezone = fingerprint_data.get('fingerprint', {}).get('timezone', {})
        
        if session_timezone and fingerprint_timezone:
            session_offset = session_timezone.get('offset')
            fingerprint_offset = fingerprint_timezone.get('timezone_offset')
            
            if session_offset is not None and fingerprint_offset is not None and session_offset != fingerprint_offset:
                risk_factors.append({
                    'type': 'fingerprint_consistency',
                    'severity': 'high',
                    'description': "Timezone offset mismatch between session and fingerprint",
                    'details': f"Session: {session_offset}, Fingerprint: {fingerprint_offset}"
                })
                risk_score += 20  # High impact
        
        return {
            'score': min(40, risk_score),  # Cap at 40
            'factors': risk_factors
        }
    
    async def _store_risk_analysis(self, analysis_result: Dict) -> None:
        """Store risk analysis result in the database"""
        await self.db.client.table('detection_risk_analyses').insert(analysis_result).execute()
    
    async def recommend_mitigations(self, risk_profile: Dict) -> Dict:
        """
        Recommend fingerprint or proxy changes based on risk analysis
        
        Args:
            risk_profile: Risk analysis result
            
        Returns:
            Dict containing recommended mitigations
        """
        recommendations = []
        
        # Extract risk factors by type
        risk_factors_by_type = {}
        for factor in risk_profile.get('risk_factors', []):
            factor_type = factor.get('type')
            if factor_type not in risk_factors_by_type:
                risk_factors_by_type[factor_type] = []
            risk_factors_by_type[factor_type].append(factor)
        
        # Recommend fingerprint rotation if needed
        if 'fingerprint_consistency' in risk_factors_by_type or 'detection_score' in risk_factors_by_type:
            severity = 'medium'
            for factor in risk_factors_by_type.get('fingerprint_consistency', []):
                if factor.get('severity') in ['high', 'critical']:
                    severity = 'high'
                    break
            
            recommendations.append({
                'type': 'fingerprint_rotation',
                'priority': 'high' if severity == 'high' else 'medium',
                'description': "Rotate browser fingerprint",
                'details': "The current fingerprint shows inconsistencies or has been potentially detected"
            })
        
        # Recommend proxy change if needed
        if 'proxy_performance' in risk_factors_by_type:
            severity = 'medium'
            for factor in risk_factors_by_type.get('proxy_performance', []):
                if factor.get('severity') in ['high', 'critical']:
                    severity = 'high'
                    break
            
            recommendations.append({
                'type': 'proxy_change',
                'priority': 'high' if severity == 'high' else 'medium',
                'description': "Change proxy server",
                'details': "The current proxy shows performance issues or may be blocked"
            })
        
        # Recommend behavior adjustments if needed
        if 'behavior_pattern' in risk_factors_by_type:
            behavior_recommendations = []
            
            for factor in risk_factors_by_type.get('behavior_pattern', []):
                if 'fast' in factor.get('description', '').lower():
                    behavior_recommendations.append("Add random delays between interactions")
                if 'navigation' in factor.get('description', '').lower():
                    behavior_recommendations.append("Simulate more realistic page navigation patterns")
            
            if behavior_recommendations:
                recommendations.append({
                    'type': 'behavior_adjustment',
                    'priority': 'medium',
                    'description': "Adjust browser behavior patterns",
                    'details': "; ".join(behavior_recommendations)
                })
        
        # Recommend session cooling period if high risk
        if risk_profile.get('risk_level') == 'high':
            recommendations.append({
                'type': 'cooling_period',
                'priority': 'high',
                'description': "Implement cooling period",
                'details': "Pause activity for this profile for at least 24 hours"
            })
        
        # Store recommendations
        recommendation_data = {
            'session_id': risk_profile.get('session_id'),
            'risk_level': risk_profile.get('risk_level'),
            'risk_score': risk_profile.get('risk_score'),
            'recommendations': recommendations,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.client.table('detection_mitigations').insert(recommendation_data).execute()
        
        return {
            'risk_profile': risk_profile,
            'recommendations': recommendations
        }
    
    async def get_historical_risk_trends(self, profile_id: str, days: int = 30) -> Dict:
        """
        Get historical risk trends for a profile
        
        Args:
            profile_id: Profile ID to get trends for
            days: Number of days of history to analyze
            
        Returns:
            Dict containing risk trend analysis
        """
        # Get session history for the profile
        from_date = (datetime.now(timezone.utc) - timezone.timedelta(days=days)).isoformat()
        
        sessions_result = await self.db.client.table('browser_sessions')\
            .select('*')\
            .eq('profile_id', profile_id)\
            .gte('created_at', from_date)\
            .order('created_at', desc=False)\
            .execute()
            
        sessions = sessions_result.data if sessions_result.data else []
        
        # Get risk analyses for these sessions
        session_ids = [session.get('id') for session in sessions]
        if not session_ids:
            return {
                'profile_id': profile_id,
                'days_analyzed': days,
                'sessions_count': 0,
                'risk_trend': 'no_data',
                'average_risk_score': 0,
                'risk_scores_by_day': []
            }
        
        analyses_result = await self.db.client.table('detection_risk_analyses')\
            .select('*')\
            .in_('session_id', session_ids)\
            .execute()
            
        analyses = analyses_result.data if analyses_result.data else []
        
        # Group risk scores by day
        risk_scores_by_day = {}
        for analysis in analyses:
            analyzed_at = datetime.fromisoformat(analysis.get('analyzed_at'))
            day_key = analyzed_at.date().isoformat()
            
            if day_key not in risk_scores_by_day:
                risk_scores_by_day[day_key] = []
                
            risk_scores_by_day[day_key].append(analysis.get('risk_score', 0))
        
        # Calculate average risk score per day
        average_scores = []
        for day, scores in sorted(risk_scores_by_day.items()):
            average_scores.append({
                'date': day,
                'average_score': sum(scores) / len(scores) if scores else 0,
                'sessions_count': len(scores)
            })
        
        # Calculate overall average and determine trend
        if not average_scores:
            return {
                'profile_id': profile_id,
                'days_analyzed': days,
                'sessions_count': len(sessions),
                'risk_trend': 'no_data',
                'average_risk_score': 0,
                'risk_scores_by_day': []
            }
        
        overall_average = sum(day['average_score'] for day in average_scores) / len(average_scores)
        
        # Determine trend (increasing, decreasing, stable)
        if len(average_scores) >= 3:
            # Compare first third to last third
            first_third = average_scores[:len(average_scores)//3]
            last_third = average_scores[-len(average_scores)//3:]
            
            first_avg = sum(day['average_score'] for day in first_third) / len(first_third)
            last_avg = sum(day['average_score'] for day in last_third) / len(last_third)
            
            if last_avg > first_avg * 1.2:  # 20% increase
                trend = 'increasing'
            elif last_avg < first_avg * 0.8:  # 20% decrease
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        return {
            'profile_id': profile_id,
            'days_analyzed': days,
            'sessions_count': len(sessions),
            'risk_trend': trend,
            'average_risk_score': overall_average,
            'risk_scores_by_day': average_scores
        }
