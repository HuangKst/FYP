import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../../api/orderApi';

// Reusable order search component for both order page and customer detail page
// customerId is optional, when provided it will only search orders for that customer
// This component only provides the order number search UI, actual search is handled by parent component
const OrderNumberSearch = forwardRef(({ 
  customerId,              // Optional customer ID, when provided it only searches that customer's orders
  onOrderFound,            // Callback when order is found
  onNoOrderFound,          // Callback when no order is found
  handleSearchAction,      // New: external search action callback, if provided use this instead of internal search logic
  disabled = false,        // Whether the search is disabled
  standalone = true        // Whether it's in standalone mode
}, ref) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getOrderNumber: () => orderNumber,
    resetOrderNumber: () => setOrderNumber(''),
    getOrderNumberValue: () => orderNumber
  }));

  // When component mounts, expose methods to window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.orderNumberSearchComponent = {
        getOrderNumber: () => orderNumber,
        resetOrderNumber: () => setOrderNumber('')
      };
    }
    
    // Cleanup when component unmounts
    return () => {
      if (typeof window !== 'undefined' && window.orderNumberSearchComponent) {
        delete window.orderNumberSearchComponent;
      }
    };
  }, [orderNumber]);

  // Handle order number search
  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    
    // If external search handler is provided, use it instead of internal search logic
    if (handleSearchAction) {
      handleSearchAction(orderNumber);
      return;
    }
    
    // Below is the standalone mode search logic
    if (!standalone) return;
    
    setSearching(true);
    
    try {
      // Prepare query params, if customerId is provided only search that customer's orders
      const params = {
        orderNumber: orderNumber.trim(),
        ...(customerId && { customer_id: customerId })
      };
      
      // Call API to search orders
      const response = await fetchOrders(null, null, null, null, params.customer_id, params.orderNumber);
      
      console.log("Search params:", { orderNumber: params.orderNumber, customerId: params.customer_id });
      console.log("API response data:", response);
      
      if (response.success && response.orders && response.orders.length > 0) {
        // Ensure only orders matching the order number are returned
        const rawOrders = response.orders.filter(order => 
          order.order_number && order.order_number.toLowerCase().includes(params.orderNumber.toLowerCase())
        );
        
        console.log("Filtered orders:", rawOrders);
        
        if (rawOrders.length === 0) {
          // If no orders match after filtering
          if (onNoOrderFound) {
            onNoOrderFound();
          } else {
            console.log('No order found with the given order number');
            alert('No matching order found');
          }
          return;
        }
        
        // For customer detail page, need to convert data format
        if (customerId) {
          // Convert API response order format to customer detail page expected format
          const formattedOrders = rawOrders.map(order => ({
            id: order.id,
            orderNumber: order.order_number,
            date: new Date(order.created_at).toLocaleDateString(),
            // Convert backend QUOTE/SALES to frontend quote/sale
            type: order.order_type === 'QUOTE' ? 'quote' : 'sale',
            total: parseFloat(order.total_price || 0),
            // Payment status handling
            status: order.order_type === 'SALES' ? 
                   (order.is_paid === 1 || order.is_paid === true ? 'paid' : 'pending') : 
                   undefined,
            // Ensure customer info is preserved
            Customer: order.Customer
          }));
          
          // If callback is provided, use it (for displaying results on current page)
          if (onOrderFound) {
            onOrderFound(formattedOrders);
          }
        } else {
          // For order list page, pass raw data to callback
          if (onOrderFound) {
            onOrderFound(rawOrders);
          } else {
            // If no callback and only one order, navigate to order detail
            if (rawOrders.length === 1) {
              navigate(`/order/${rawOrders[0].id}`);
            } else {
              // Found multiple orders but no callback to handle it, log to console not display alert
              console.log(`Found ${rawOrders.length} matching orders`);
              alert(`Found ${rawOrders.length} matching orders`);
            }
          }
        }
      } else {
        // No orders found
        if (onNoOrderFound) {
          onNoOrderFound();
        } else {
          // Can add default behavior for when no orders found, log to console
          console.log('No order found with the given order number');
          alert('No matching order found');
        }
      }
    } catch (error) {
      console.error('Error searching order:', error);
      // Remove error prompt, only show in console
      alert('Error occurred while searching for orders');
    } finally {
      setSearching(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <TextField
      fullWidth
      size="small"
      label="Order Number"
      variant="outlined"
      value={orderNumber}
      onChange={(e) => setOrderNumber(e.target.value)}
      onKeyPress={handleKeyPress}
      disabled={disabled}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton 
              onClick={handleSearch} 
              edge="end" 
              disabled={disabled || !orderNumber.trim()}
              color="primary"
              aria-label="search orders"
            >
              <SearchIcon />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
});

export default OrderNumberSearch;
