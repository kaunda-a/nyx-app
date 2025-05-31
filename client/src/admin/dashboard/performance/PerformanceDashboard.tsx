import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Button, 
         FormControl, InputLabel, Select, MenuItem, Tabs, Tab } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import axios from 'axios';

// Types
interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface MetricStatistics {
  min: number;
  max: number;
  avg: number;
  count: number;
  unit: string;
  latest: number;
}

interface PerformanceMetrics {
  metrics: Record<string, MetricData[]>;
  time_period_hours: number;
  timestamp: string;
}

interface PerformanceStatistics {
  statistics: Record<string, MetricStatistics>;
  time_period_hours: number;
  timestamp: string;
}

interface LatestMetrics {
  metrics: Record<string, MetricData>;
  timestamp: string;
}

const PerformanceDashboard: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [statistics, setStatistics] = useState<PerformanceStatistics | null>(null);
  const [latest, setLatest] = useState<LatestMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<number>(24);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cpu_usage', 'memory_usage', 'disk_usage']);
  const [tabValue, setTabValue] = useState<number>(0);

  useEffect(() => {
    fetchData();
    
    // Set up polling for latest metrics
    const interval = setInterval(() => {
      fetchLatestMetrics();
    }, 60000); // Poll every minute
    
    return () => clearInterval(interval);
  }, [timePeriod, selectedMetrics]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch performance metrics
      const metricsUrl = `/api/console/performance/metrics?time_period_hours=${timePeriod}&metric_names=${selectedMetrics.join(',')}`;
      const metricsResponse = await axios.get(metricsUrl);
      setMetrics(metricsResponse.data);
      
      // Fetch performance statistics
      const statsUrl = `/api/console/performance/stats?time_period_hours=${timePeriod}&metric_names=${selectedMetrics.join(',')}`;
      const statsResponse = await axios.get(statsUrl);
      setStatistics(statsResponse.data);
      
      // Fetch latest metrics
      await fetchLatestMetrics();
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('Failed to fetch performance data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLatestMetrics = async () => {
    try {
      const latestUrl = `/api/console/performance/latest`;
      const latestResponse = await axios.get(latestUrl);
      setLatest(latestResponse.data);
    } catch (err) {
      console.error('Error fetching latest metrics:', err);
    }
  };

  const formatMetricData = (metricName: string) => {
    if (!metrics || !metrics.metrics[metricName]) return [];
    
    return metrics.metrics[metricName].map(item => ({
      ...item,
      time: format(parseISO(item.timestamp), 'HH:mm'),
      date: format(parseISO(item.timestamp), 'MM/dd'),
      formattedValue: `${item.value} ${item.unit}`,
    }));
  };

  const getMetricColor = (metricName: string) => {
    const colors = {
      cpu_usage: theme.palette.primary.main,
      memory_usage: theme.palette.secondary.main,
      disk_usage: theme.palette.error.main,
      network_bytes_sent: theme.palette.warning.main,
      network_bytes_recv: theme.palette.info.main,
      load_avg_1min: theme.palette.success.main,
      process_count: theme.palette.grey[500],
    };
    
    return colors[metricName as keyof typeof colors] || theme.palette.primary.main;
  };

  const getMetricDisplayName = (metricName: string) => {
    const names = {
      cpu_usage: 'CPU Usage',
      memory_usage: 'Memory Usage',
      memory_available: 'Available Memory',
      disk_usage: 'Disk Usage',
      disk_free: 'Free Disk Space',
      network_bytes_sent: 'Network Sent',
      network_bytes_recv: 'Network Received',
      process_count: 'Process Count',
      load_avg_1min: 'Load Avg (1m)',
      load_avg_5min: 'Load Avg (5m)',
      load_avg_15min: 'Load Avg (15m)',
    };
    
    return names[metricName as keyof typeof names] || metricName.replace(/_/g, ' ');
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading && !latest) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !latest) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography color="error">{error}</Typography>
        <Button variant="contained" onClick={fetchData} sx={{ ml: 2 }}>
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
            Performance Dashboard
          </Typography>
          
          <Box display="flex" gap={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={timePeriod}
                onChange={(e) => setTimePeriod(Number(e.target.value))}
                label="Time Period"
              >
                <MenuItem value={1}>Last hour</MenuItem>
                <MenuItem value={6}>Last 6 hours</MenuItem>
                <MenuItem value={12}>Last 12 hours</MenuItem>
                <MenuItem value={24}>Last 24 hours</MenuItem>
                <MenuItem value={48}>Last 2 days</MenuItem>
              </Select>
            </FormControl>
            
            <Button variant="contained" onClick={fetchData}>
              Refresh
            </Button>
          </Box>
        </Box>
        
        {latest && (
          <Grid container spacing={3} mb={3}>
            {Object.entries(latest.metrics).map(([metricName, metricData]) => (
              <Grid item xs={12} sm={6} md={3} key={metricName}>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {getMetricDisplayName(metricName)}
                      </Typography>
                      <Typography variant="h4" component="div">
                        {metricData.value.toFixed(1)} {metricData.unit}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Last updated: {format(parseISO(metricData.timestamp), 'HH:mm:ss')}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
        
        <Card sx={{ mb: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="performance tabs">
              <Tab label="System Resources" />
              <Tab label="Network" />
              <Tab label="Load & Processes" />
            </Tabs>
          </Box>
          
          <CardContent>
            {tabValue === 0 && (
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      allowDuplicatedCategory={false}
                      type="category"
                    />
                    <YAxis yAxisId="percentage" domain={[0, 100]} unit="%" />
                    <YAxis yAxisId="memory" orientation="right" domain={['auto', 'auto']} unit="MB" />
                    <Tooltip />
                    <Legend />
                    
                    {metrics && metrics.metrics['cpu_usage'] && (
                      <Line
                        yAxisId="percentage"
                        type="monotone"
                        data={formatMetricData('cpu_usage')}
                        dataKey="value"
                        stroke={getMetricColor('cpu_usage')}
                        name="CPU Usage (%)"
                        dot={false}
                      />
                    )}
                    
                    {metrics && metrics.metrics['memory_usage'] && (
                      <Line
                        yAxisId="percentage"
                        type="monotone"
                        data={formatMetricData('memory_usage')}
                        dataKey="value"
                        stroke={getMetricColor('memory_usage')}
                        name="Memory Usage (%)"
                        dot={false}
                      />
                    )}
                    
                    {metrics && metrics.metrics['disk_usage'] && (
                      <Line
                        yAxisId="percentage"
                        type="monotone"
                        data={formatMetricData('disk_usage')}
                        dataKey="value"
                        stroke={getMetricColor('disk_usage')}
                        name="Disk Usage (%)"
                        dot={false}
                      />
                    )}
                    
                    {metrics && metrics.metrics['memory_available'] && (
                      <Line
                        yAxisId="memory"
                        type="monotone"
                        data={formatMetricData('memory_available')}
                        dataKey="value"
                        stroke={theme.palette.success.main}
                        name="Available Memory (MB)"
                        dot={false}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      allowDuplicatedCategory={false}
                      type="category"
                    />
                    <YAxis domain={['auto', 'auto']} unit="MB" />
                    <Tooltip />
                    <Legend />
                    
                    {metrics && metrics.metrics['network_bytes_sent'] && (
                      <Area
                        type="monotone"
                        data={formatMetricData('network_bytes_sent')}
                        dataKey="value"
                        stroke={getMetricColor('network_bytes_sent')}
                        fill={getMetricColor('network_bytes_sent')}
                        fillOpacity={0.3}
                        name="Network Sent (MB)"
                      />
                    )}
                    
                    {metrics && metrics.metrics['network_bytes_recv'] && (
                      <Area
                        type="monotone"
                        data={formatMetricData('network_bytes_recv')}
                        dataKey="value"
                        stroke={getMetricColor('network_bytes_recv')}
                        fill={getMetricColor('network_bytes_recv')}
                        fillOpacity={0.3}
                        name="Network Received (MB)"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            )}
            
            {tabValue === 2 && (
              <Box height={400}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      allowDuplicatedCategory={false}
                      type="category"
                    />
                    <YAxis yAxisId="load" domain={[0, 'auto']} />
                    <YAxis yAxisId="processes" orientation="right" domain={[0, 'auto']} />
                    <Tooltip />
                    <Legend />
                    
                    {metrics && metrics.metrics['load_avg_1min'] && (
                      <Bar
                        yAxisId="load"
                        data={formatMetricData('load_avg_1min')}
                        dataKey="value"
                        fill={getMetricColor('load_avg_1min')}
                        name="Load Avg (1m)"
                      />
                    )}
                    
                    {metrics && metrics.metrics['process_count'] && (
                      <Bar
                        yAxisId="processes"
                        data={formatMetricData('process_count')}
                        dataKey="value"
                        fill={getMetricColor('process_count')}
                        name="Process Count"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
        
        {statistics && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Statistics
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(statistics.statistics).map(([metricName, stats]) => (
                  <Grid item xs={12} sm={6} md={4} key={metricName}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          {getMetricDisplayName(metricName)}
                        </Typography>
                        <Typography variant="body2">
                          Min: {stats.min.toFixed(1)} {stats.unit}
                        </Typography>
                        <Typography variant="body2">
                          Max: {stats.max.toFixed(1)} {stats.unit}
                        </Typography>
                        <Typography variant="body2">
                          Avg: {stats.avg.toFixed(1)} {stats.unit}
                        </Typography>
                        <Typography variant="body2">
                          Samples: {stats.count}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    </motion.div>
  );
};

export default PerformanceDashboard;
