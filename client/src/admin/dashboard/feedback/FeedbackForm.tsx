import React, { useState } from 'react';
import { 
  Box, Typography, TextField, Button, FormControl, InputLabel, 
  Select, MenuItem, Rating, Snackbar, Alert, Paper, Divider,
  Chip, Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import axios from 'axios';

// Types
interface FeedbackFormData {
  component: string;
  rating: number;
  usability: number;
  performance: number;
  features: number;
  comments: string;
  suggestions: string;
  email: string;
}

const initialFormData: FeedbackFormData = {
  component: '',
  rating: 3,
  usability: 3,
  performance: 3,
  features: 3,
  comments: '',
  suggestions: '',
  email: ''
};

const FeedbackForm: React.FC = () => {
  const theme = useTheme();
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (name: string) => (_: React.SyntheticEvent, value: number | null) => {
    setFormData(prev => ({ ...prev, [name]: value || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      // In a real implementation, this would send the feedback to the server
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setFormData(initialFormData);
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box p={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Feedback Form
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph>
          Your feedback helps us improve the Camoufox Console system. Please take a moment to share your thoughts and suggestions.
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Component</InputLabel>
                  <Select
                    name="component"
                    value={formData.component}
                    onChange={handleSelectChange}
                    label="Component"
                    required
                  >
                    <MenuItem value="">Select a component</MenuItem>
                    <MenuItem value="detection_dashboard">Detection Dashboard</MenuItem>
                    <MenuItem value="performance_dashboard">Performance Dashboard</MenuItem>
                    <MenuItem value="alerts_dashboard">Alerts Dashboard</MenuItem>
                    <MenuItem value="ml_dashboard">ML Dashboard</MenuItem>
                    <MenuItem value="general">General</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Overall Rating
                </Typography>
                <Rating
                  name="rating"
                  value={formData.rating}
                  onChange={handleRatingChange('rating')}
                  size="large"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="subtitle2" gutterBottom>
                    Usability
                  </Typography>
                  <Rating
                    name="usability"
                    value={formData.usability}
                    onChange={handleRatingChange('usability')}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="subtitle2" gutterBottom>
                    Performance
                  </Typography>
                  <Rating
                    name="performance"
                    value={formData.performance}
                    onChange={handleRatingChange('performance')}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box textAlign="center">
                  <Typography variant="subtitle2" gutterBottom>
                    Features
                  </Typography>
                  <Rating
                    name="features"
                    value={formData.features}
                    onChange={handleRatingChange('features')}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="comments"
                  label="Comments"
                  multiline
                  rows={4}
                  value={formData.comments}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Please share your experience with this component..."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="suggestions"
                  label="Suggestions for Improvement"
                  multiline
                  rows={4}
                  value={formData.suggestions}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  placeholder="What features or improvements would you like to see?"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="email"
                  label="Email (optional)"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Your email for follow-up questions"
                  helperText="We'll only use this to follow up on your feedback if needed."
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={submitting || !formData.component}
                    sx={{ mt: 2 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        <Snackbar open={success} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="success">
            Thank you for your feedback! Your input helps us improve the system.
          </Alert>
        </Snackbar>
        
        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error">
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </motion.div>
  );
};

export default FeedbackForm;
