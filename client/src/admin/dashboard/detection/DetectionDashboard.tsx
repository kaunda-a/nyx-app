import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Button, 
         FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import axios from 'axios';

// Types
interface DetectionStats {
  total_attempts: number;
  detected_count: number;
  detection_rate: number;
  average_score: number;
  top_detection_points: [string, number][];
  app_breakdown: Record<string, number>;
  time_period_hours: number;
  timestamp: string;
}

interface DetectionTrend {
  trend: {
    start_time: string;
    end_time: string;
    attempts: number;
    detected: number;
    detection_rate: number;
  }[];
  time_period_hours: number;
  interval_hours: number;
  timestamp: string;
}

const DetectionDashboard: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [trend, setTrend] = useState<DetectionTrend | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<number>(24);
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [intervalHours, setIntervalHours] = useState<number>(1);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  useEffect(() => {
    fetchData();
  }, [timePeriod, selectedApp, intervalHours]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch detection stats
      const statsUrl = `/api/console/detection/stats?time_period_hours=${timePeriod}${selectedApp ? `&app=${selectedApp}` : ''}`;
      const statsResponse = await axios.get(statsUrl);
      setStats(statsResponse.data);
      
      // Fetch detection trend
      const trendUrl = `/api/console/detection/trend?time_period_hours=${timePeriod}&interval_hours=${intervalHours}`;
      const trendResponse = await axios.get(trendUrl);
      setTrend(trendResponse.data);
    } catch (err) {
      console.error('Error fetching detection data:', err);
      setError('Failed to fetch detection data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTrendData = () => {
    if (!trend) return [];
    
    return trend.trend.map(item => ({
      ...item,
      time: format(new Date(item.start_time), 'HH:mm'),
      date: format(new Date(item.start_time), 'MM/dd'),
      detection_rate: Math.round(item.detection_rate * 100),
    }));
  };

  const formatTopDetectionPoints = () => {
    if (!stats) return [];
    
    return stats.top_detection_points.map(([name, count]) => ({
      name: name.replace(/_/g, ' '),
      count,
    }));
  };

  const formatAppBreakdown = () => {
    if (!stats) return [];
    
    return Object.entries(stats.app_breakdown).map(([name, count]) => ({
      name,
      count,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
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
            Detection Dashboard
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
              <InputLabel>App</InputLabel>
              <Select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value as string)}
                label="App"
              >
                <MenuItem value="">All Apps</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
                <MenuItem value="google">Google</MenuItem>
                <MenuItem value="spotify">Spotify</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Interval</InputLabel>
              <Select
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                label="Interval"
              >
                <MenuItem value={1}>1 hour</MenuItem>
                <MenuItem value={2}>2 hours</MenuItem>
                <MenuItem value={4}>4 hours</MenuItem>
                <MenuItem value={6}>6 hours</MenuItem>
                <MenuItem value={12}>12 hours</MenuItem>
              </Select>
            </FormControl>
            
            <Button variant="contained" onClick={fetchData}>
              Refresh
            </Button>
          </Box>
        </Box>
        
        {stats && (
          <>
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Detection Attempts
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stats.total_attempts}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Detection Rate
                      </Typography>
                      <Typography variant="h4" component="div">
                        {(stats.detection_rate * 100).toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Average Detection Score
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stats.average_score.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Detected Count
                      </Typography>
                      <Typography variant="h4" component="div">
                        {stats.detected_count}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </Grid>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detection Rate Trend
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatTrendData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Detection Rate']} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="detection_rate"
                            stroke={theme.palette.primary.main}
                            activeDot={{ r: 8 }}
                            name="Detection Rate (%)"
                          />
                          <Line
                            type="monotone"
                            dataKey="attempts"
                            stroke={theme.palette.secondary.main}
                            name="Attempts"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      App Breakdown
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formatAppBreakdown()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="name"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {formatAppBreakdown().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Attempts']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Top Detection Points
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={formatTopDetectionPoints()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" fill={theme.palette.primary.main} name="Count" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Box>
    </motion.div>
  );
};

export default DetectionDashboard;
