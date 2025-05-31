import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Button, 
         FormControl, InputLabel, Select, MenuItem, Divider, Paper, 
         List, ListItem, ListItemText, ListItemIcon, Chip, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import axios from 'axios';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import BuildIcon from '@mui/icons-material/Build';
import SecurityIcon from '@mui/icons-material/Security';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import LoopIcon from '@mui/icons-material/Loop';
import TimerIcon from '@mui/icons-material/Timer';

// Types
interface TrainingResults {
  status: string;
  classifier_results: {
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    feature_importance: Record<string, number>;
  };
  regressor_results: {
    mse: number;
    rmse: number;
    feature_importance: Record<string, number>;
  };
  samples: number;
  feature_importance: {
    classifier: Record<string, number>;
    regressor: Record<string, number>;
  };
  timestamp: string;
}

interface PredictionResults {
  device_id: string;
  app: string;
  detection_test: {
    detected: boolean;
    detection_score: number;
    detection_points: any[];
    recommendations: string[];
  };
  prediction: {
    probability: number;
    score: number;
    recommendations: {
      type: string;
      name: string;
      importance: number;
      action: string;
      description: string;
    }[];
  };
  timestamp: string;
}

const MLDashboard: React.FC = () => {
  const theme = useTheme();
  const [trainingResults, setTrainingResults] = useState<TrainingResults | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResults | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [trainingLoading, setTrainingLoading] = useState<boolean>(false);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<number>(168);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<string>('tiktok');
  const [devices, setDevices] = useState<{id: string, name: string}[]>([]);

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
  ];

  useEffect(() => {
    // Fetch devices
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      // In a real implementation, this would fetch devices from the API
      // For now, we'll use sample devices
      setDevices([
        { id: 'device-1', name: 'Pixel 6' },
        { id: 'device-2', name: 'Galaxy S21' },
        { id: 'device-3', name: 'iPhone 13' }
      ]);
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to fetch devices. Please try again later.');
    }
  };

  const trainModels = async () => {
    setTrainingLoading(true);
    setError(null);
    
    try {
      const response = await axios.post<TrainingResults>(`/api/console/ml/train?time_period_hours=${timePeriod}`);
      setTrainingResults(response.data);
    } catch (err) {
      console.error('Error training models:', err);
      setError('Failed to train models. Please try again later.');
    } finally {
      setTrainingLoading(false);
    }
  };

  const predictDetection = async () => {
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }
    
    setPredictionLoading(true);
    setError(null);
    
    try {
      const response = await axios.post<PredictionResults>(
        `/api/console/ml/predict?device_id=${selectedDevice}&app=${selectedApp}`
      );
      setPredictionResults(response.data);
    } catch (err) {
      console.error('Error predicting detection:', err);
      setError('Failed to predict detection. Please try again later.');
    } finally {
      setPredictionLoading(false);
    }
  };

  const formatFeatureImportance = (importance: Record<string, number>) => {
    return Object.entries(importance)
      .map(([name, value]) => ({
        name: formatFeatureName(name),
        value: value
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const formatFeatureName = (name: string) => {
    if (name.startsWith('app_')) {
      return `App: ${name.split('_')[1]}`;
    } else if (name.startsWith('has_')) {
      return `Has ${name.split('_')[1].replace(/_/g, ' ')}`;
    } else {
      return name.replace(/_/g, ' ');
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'detection_point':
        return <ErrorIcon />;
      case 'hardening':
        return <SecurityIcon />;
      case 'general':
        if (type === 'ai_touch_simulation') {
          return <TouchAppIcon />;
        } else if (type === 'fingerprint_rotation') {
          return <LoopIcon />;
        } else if (type === 'session_duration') {
          return <TimerIcon />;
        } else {
          return <BuildIcon />;
        }
      default:
        return <BuildIcon />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box p={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          ML Detection Prediction
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Train Detection Models
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Train machine learning models on detection data to predict detection rates and recommend improvements.
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Training Data Period</InputLabel>
                    <Select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(Number(e.target.value))}
                      label="Training Data Period"
                    >
                      <MenuItem value={24}>Last 24 hours</MenuItem>
                      <MenuItem value={48}>Last 2 days</MenuItem>
                      <MenuItem value={168}>Last week</MenuItem>
                      <MenuItem value={720}>Last month</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="contained" 
                    onClick={trainModels}
                    disabled={trainingLoading}
                    startIcon={trainingLoading ? <CircularProgress size={20} /> : undefined}
                  >
                    {trainingLoading ? 'Training...' : 'Train Models'}
                  </Button>
                </Box>
                
                {trainingResults && (
                  <Box mt={2}>
                    <Alert severity="success">
                      Models trained successfully with {trainingResults.samples} samples!
                    </Alert>
                    
                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Classification Metrics
                          </Typography>
                          <Typography variant="body2">
                            Accuracy: {(trainingResults.classifier_results.accuracy * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2">
                            Precision: {(trainingResults.classifier_results.precision * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2">
                            Recall: {(trainingResults.classifier_results.recall * 100).toFixed(1)}%
                          </Typography>
                          <Typography variant="body2">
                            F1 Score: {(trainingResults.classifier_results.f1 * 100).toFixed(1)}%
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Regression Metrics
                          </Typography>
                          <Typography variant="body2">
                            MSE: {trainingResults.regressor_results.mse.toFixed(4)}
                          </Typography>
                          <Typography variant="body2">
                            RMSE: {trainingResults.regressor_results.rmse.toFixed(4)}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" mt={3} mb={1}>
                      Feature Importance
                    </Typography>
                    
                    <Box height={300}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={formatFeatureImportance(trainingResults.feature_importance.classifier)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <PolarRadiusAxis />
                          <Bar dataKey="value" fill={theme.palette.primary.main} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Predict Detection
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Predict whether a device will be detected by a specific app and get recommendations to reduce detection risk.
                </Typography>
                
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Device</InputLabel>
                    <Select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value as string)}
                      label="Device"
                    >
                      <MenuItem value="">Select a device</MenuItem>
                      {devices.map(device => (
                        <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>App</InputLabel>
                    <Select
                      value={selectedApp}
                      onChange={(e) => setSelectedApp(e.target.value as string)}
                      label="App"
                    >
                      <MenuItem value="tiktok">TikTok</MenuItem>
                      <MenuItem value="google">Google</MenuItem>
                      <MenuItem value="spotify">Spotify</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="contained" 
                    onClick={predictDetection}
                    disabled={predictionLoading || !selectedDevice}
                    startIcon={predictionLoading ? <CircularProgress size={20} /> : undefined}
                  >
                    {predictionLoading ? 'Predicting...' : 'Predict'}
                  </Button>
                </Box>
                
                {predictionResults && (
                  <Box mt={2}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            bgcolor: predictionResults.prediction.probability > 0.5 
                              ? theme.palette.error.light 
                              : theme.palette.success.light
                          }}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            Detection Probability
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <Typography variant="h4">
                              {(predictionResults.prediction.probability * 100).toFixed(1)}%
                            </Typography>
                            {predictionResults.prediction.probability > 0.5 ? (
                              <TrendingUpIcon color="error" sx={{ ml: 1 }} />
                            ) : (
                              <TrendingDownIcon color="success" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            bgcolor: predictionResults.prediction.score > 0.5 
                              ? theme.palette.error.light 
                              : theme.palette.success.light
                          }}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            Detection Score
                          </Typography>
                          <Box display="flex" alignItems="center">
                            <Typography variant="h4">
                              {predictionResults.prediction.score.toFixed(2)}
                            </Typography>
                            {predictionResults.prediction.score > 0.5 ? (
                              <TrendingUpIcon color="error" sx={{ ml: 1 }} />
                            ) : (
                              <TrendingDownIcon color="success" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" mt={3} mb={1}>
                      Recommendations
                    </Typography>
                    
                    <List>
                      {predictionResults.prediction.recommendations.map((rec, index) => (
                        <ListItem key={index} divider={index < predictionResults.prediction.recommendations.length - 1}>
                          <ListItemIcon>
                            {getRecommendationIcon(rec.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={rec.action}
                            secondary={
                              <>
                                {rec.description}
                                <Box mt={0.5}>
                                  <Chip 
                                    label={`Importance: ${(rec.importance * 100).toFixed(0)}%`} 
                                    size="small" 
                                    color={rec.importance > 0.7 ? "error" : rec.importance > 0.4 ? "warning" : "info"}
                                  />
                                </Box>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    {predictionResults.detection_test.detection_points.length > 0 && (
                      <>
                        <Typography variant="subtitle1" mt={3} mb={1}>
                          Detection Points
                        </Typography>
                        
                        <List>
                          {predictionResults.detection_test.detection_points.map((point, index) => (
                            <ListItem key={index} divider={index < predictionResults.detection_test.detection_points.length - 1}>
                              <ListItemIcon>
                                {point.severity === 'critical' ? (
                                  <ErrorIcon color="error" />
                                ) : point.severity === 'high' ? (
                                  <ErrorIcon color="warning" />
                                ) : (
                                  <WarningIcon color="info" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={point.description}
                                secondary={point.details}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </motion.div>
  );
};

export default MLDashboard;
