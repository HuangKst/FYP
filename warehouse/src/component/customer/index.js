import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import OrderNumberSearch from '../button/searchButtonByOrderID';
import SearchIcon from '@mui/icons-material/Search';

// Customer basic information card component
export const CustomerInfoCard = ({ customer }) => {
  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {customer.name}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Phone
            </Typography>
            <Typography variant="body1">
              {customer.phone || 'Not provided'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Address
            </Typography>
            <Typography variant="body1">
              {customer.address || 'Not provided'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Remarks
            </Typography>
            <Typography variant="body1">
              {customer.remark || 'No remarks'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Order status chip component
export const OrderStatusChip = ({ type, status }) => {
  if (type === 'quote') {
    return <Chip label="Quote" color="info" size="small" />;
  }
  
  if (type === 'sale') {
    switch(status) {
      case 'paid':
        return <Chip label="Paid" color="success" size="small" />;
      case 'pending':
        return <Chip label="Unpaid" color="error" size="small" />;
      default:
        return <Chip label="Unknown" color="default" size="small" />;
    }
  }
  
  return null;
};

// Order filter component - updated to match the new UI design
export const OrderFilters = ({ orderType, setOrderType, paymentStatus, setPaymentStatus, customerId, onOrderFound, onNoOrderFound }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="order-type-label">Order Type</InputLabel>
            <Select
              labelId="order-type-label"
              value={orderType}
              label="Order Type"
              onChange={(e) => setOrderType(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="quote">Quote</MenuItem>
              <MenuItem value="sale">Sales Order</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="payment-status-label">Payment Status</InputLabel>
            <Select
              labelId="payment-status-label"
              value={paymentStatus}
              label="Payment Status"
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="pending">Unpaid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <OrderNumberSearch 
            customerId={customerId} 
            onOrderFound={onOrderFound} 
            onNoOrderFound={onNoOrderFound}
            standalone={false} 
          />
        </Grid>
      </Grid>
    </Box>
  );
};

// Customer order list component
export const CustomerOrdersList = ({ orders, onViewOrderDetail }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Order Number</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.orderNumber}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>
                  {order.type === 'quote' ? 'Quote' : 'Sales Order'}
                </TableCell>
                <TableCell>¥{(order.total || 0).toLocaleString()}</TableCell>
                <TableCell>
                  <OrderStatusChip type={order.type} status={order.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onViewOrderDetail(order.id)}
                  >
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No matching orders found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Order history component (includes filters and list)
export const CustomerOrdersHistory = ({ 
  orders, 
  orderType, 
  setOrderType, 
  paymentStatus, 
  setPaymentStatus,
  onViewOrderDetail,
  customerId,
  onOrderFound,
  onNoOrderFound
}) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" component="h3" gutterBottom>
        Order History
      </Typography>
      
      <OrderFilters 
        orderType={orderType} 
        setOrderType={setOrderType}
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        customerId={customerId}
        onOrderFound={onOrderFound}
        onNoOrderFound={onNoOrderFound}
      />

      <CustomerOrdersList orders={orders} onViewOrderDetail={onViewOrderDetail} />
    </Paper>
  );
};
