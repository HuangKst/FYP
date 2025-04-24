import React, { useContext, useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, Paper, Grid, Card, CardContent, Divider, Avatar } from '@mui/material';
import { AuthContext } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';
import { updateUserPassword } from '../api/user-api';
import instance from '../api/axios';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import DataUsageIcon from '@mui/icons-material/DataUsage';

export default function ProfilePage() {
  const { user, role } = useContext(AuthContext);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'boss') {
      navigate('/403');
    }
  }, [role, navigate]);

  const handlePasswordChange = async () => {
    setMessage({ type: '', text: '' });
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please enter new password and confirmation' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    try {
      const response = await updateUserPassword(user.userId, newPassword);
      if (response.success) {
        setMessage({ type: 'success', text: 'Password updated successfully' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: response.msg || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'API call failed when updating password' });
    }
  };

  const handleInitPrices = async () => {
    setMessage({ type: '', text: '' });
    try {
      const res = await instance.post('/material-prices/init-database');
      if (res.data.success) {
        const count = res.data.data.totalRecords;
        setMessage({ type: 'success', text: `Initialization successful. ${count} records created.` });
      } else {
        setMessage({ type: 'error', text: res.data.message || 'Initialization failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'API call failed when initializing prices' });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}>
        Profile Management
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mt: 2, mb: 3 }}>
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: '#1976d2' }}>
                  <AccountCircleIcon sx={{ fontSize: 50 }} />
                </Avatar>
                <Typography variant="h5" component="h2" align="center" gutterBottom>
                  {user.username}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Username:</strong> {user.username}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Role:</strong> {user.userRole}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  <strong>Status:</strong> {user.userStatus}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Password Change Card */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LockIcon sx={{ mr: 1, color: '#f50057' }} />
                <Typography variant="h6">Change Password</Typography>
              </Box>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button 
                    fullWidth
                    variant="contained" 
                    color="primary" 
                    onClick={handlePasswordChange}
                    sx={{ height: '56px' }}
                  >
                    Update Password
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Initialize Prices Card */}
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DataUsageIcon sx={{ mr: 1, color: '#4caf50' }} />
                <Typography variant="h6">Material Price Data</Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                Initialize the daily material price database. This will clear existing data and fetch the latest price information.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleInitPrices}
                sx={{ py: 1 }}
              >
                Initialize Daily Prices
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
