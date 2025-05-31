import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Button, 
         FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
         Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DoneIcon from '@mui/icons-material/Done';

// Types
interface Alert {
  alert_id: string;
  alert_type: string;
  severity: string;
  message: string;
  details: Record<string, any>;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

interface AlertRule {
  rule_id: string;
  name: string;
  alert_type: string;
  message_template: string;
  severity: string;
  enabled: boolean;
}

interface AlertsResponse {
  alerts: Alert[];
  count: number;
  time_period_hours: number;
  timestamp: string;
}

interface RulesResponse {
  rules: AlertRule[];
  count: number;
  timestamp: string;
}

const AlertsDashboard: React.FC = () => {
  const theme = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<number>(24);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('all');
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<string>('alerts');

  useEffect(() => {
    fetchData();
    
    // Set up polling for alerts
    const interval = setInterval(() => {
      fetchData(false);
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [timePeriod, selectedTypes, selectedSeverities, acknowledgedFilter, refreshInterval]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('time_period_hours', timePeriod.toString());
      
      if (selectedTypes.length > 0) {
        params.append('alert_types', selectedTypes.join(','));
      }
      
      if (selectedSeverities.length > 0) {
        params.append('severities', selectedSeverities.join(','));
      }
      
      if (acknowledgedFilter !== 'all') {
        params.append('acknowledged', acknowledgedFilter === 'acknowledged' ? 'true' : 'false');
      }
      
      // Fetch alerts
      const alertsResponse = await axios.get<AlertsResponse>(`/api/console/alerts?${params.toString()}`);
      setAlerts(alertsResponse.data.alerts);
      
      // Fetch rules
      const rulesResponse = await axios.get<RulesResponse>('/api/console/alerts/rules');
      setRules(rulesResponse.data.rules);
    } catch (err) {
      console.error('Error fetching alerts data:', err);
      setError('Failed to fetch alerts data. Please try again later.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await axios.post(`/api/console/alerts/${alertId}/acknowledge`);
      
      // Update the alert in the local state
      setAlerts(alerts.map(alert => 
        alert.alert_id === alertId 
          ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() } 
          : alert
      ));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      setError('Failed to acknowledge alert. Please try again later.');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'detection_rate':
        return 'Detection Rate';
      case 'performance':
        return 'Performance';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && alerts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={() => fetchData()} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Alerts Dashboard
          </Typography>
          
          <Box display="flex" gap={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={timePeriod}
                onChange={(e) => setTimePeriod(Number(e.target.value))}
                label="Time Period"
              >
                <MenuItem value={6}>Last 6 hours</MenuItem>
                <MenuItem value={12}>Last 12 hours</MenuItem>
                <MenuItem value={24}>Last 24 hours</MenuItem>
                <MenuItem value={48}>Last 2 days</MenuItem>
                <MenuItem value={168}>Last week</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Alert Type</InputLabel>
              <Select
                multiple
                value={selectedTypes}
                onChange={(e) => setSelectedTypes(e.target.value as string[])}
                label="Alert Type"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={getAlertTypeLabel(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="detection_rate">Detection Rate</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                multiple
                value={selectedSeverities}
                onChange={(e) => setSelectedSeverities(e.target.value as string[])}
                label="Severity"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small" 
                        sx={{ backgroundColor: getSeverityColor(value), color: 'white' }}
                      />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="info">Info</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={acknowledgedFilter}
                onChange={(e) => setAcknowledgedFilter(e.target.value as string)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="unacknowledged">Unacknowledged</MenuItem>
                <MenuItem value="acknowledged">Acknowledged</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Refresh</InputLabel>
              <Select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                label="Refresh"
              >
                <MenuItem value={30}>30 seconds</MenuItem>
                <MenuItem value={60}>1 minute</MenuItem>
                <MenuItem value={300}>5 minutes</MenuItem>
                <MenuItem value={600}>10 minutes</MenuItem>
              </Select>
            </FormControl>
            
            <Button variant="contained" onClick={() => fetchData()}>
              Refresh
            </Button>
          </Box>
        </Box>
        
        <Box mb={3}>
          <Button
            variant={activeTab === 'alerts' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('alerts')}
            sx={{ mr: 2 }}
          >
            Alerts
          </Button>
          <Button
            variant={activeTab === 'rules' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('rules')}
          >
            Alert Rules
          </Button>
        </Box>
        
        {activeTab === 'alerts' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.tr
                      key={alert.alert_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      component="tr"
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getSeverityIcon(alert.severity)}
                          <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                            {alert.severity}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getAlertTypeLabel(alert.alert_type)} 
                          size="small" 
                          color={alert.alert_type === 'detection_rate' ? 'primary' : 'secondary'}
                        />
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>{format(parseISO(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}</TableCell>
                      <TableCell>
                        {alert.acknowledged ? (
                          <Chip 
                            label="Acknowledged" 
                            size="small" 
                            color="success" 
                            icon={<CheckCircleIcon />}
                          />
                        ) : (
                          <Chip 
                            label="New" 
                            size="small" 
                            color="warning"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {!alert.acknowledged && (
                          <IconButton 
                            color="primary" 
                            onClick={() => acknowledgeAlert(alert.alert_id)}
                            title="Acknowledge"
                          >
                            <DoneIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {alerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" py={3}>
                        No alerts found matching the current filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {activeTab === 'rules' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Message Template</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.rule_id}>
                    <TableCell>{rule.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getAlertTypeLabel(rule.alert_type)} 
                        size="small" 
                        color={rule.alert_type === 'detection_rate' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {getSeverityIcon(rule.severity)}
                        <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                          {rule.severity}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{rule.message_template}</TableCell>
                    <TableCell>
                      <Chip 
                        label={rule.enabled ? 'Enabled' : 'Disabled'} 
                        size="small" 
                        color={rule.enabled ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body1" py={3}>
                        No alert rules found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </motion.div>
  );
};

export default AlertsDashboard;
