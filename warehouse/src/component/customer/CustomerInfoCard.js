import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Divider } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NoteIcon from '@mui/icons-material/Note';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const CustomerInfoCard = ({ customer }) => {
  if (!customer) return null;

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {customer.name}
        </Typography>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhoneIcon sx={{ mr: 2, color: 'text.secondary' }} />
              <Typography variant="body1">
                {customer.phone || 'No phone number'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <LocationOnIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
              <Typography variant="body1">
                {customer.address || 'No address'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <NoteIcon sx={{ mr: 2, color: 'text.secondary', mt: 0.5 }} />
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {customer.remark || 'No remarks'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceIcon sx={{ mr: 2, color: 'error.main' }} />
              <Typography variant="body1" color="error.main" sx={{ fontWeight: 'bold' }}>
                Total Debt: ¥{parseFloat(customer.total_debt || 0).toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard; 