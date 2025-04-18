import React, { useState } from "react";
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Divider, 
  Button, 
  Badge,
  Tooltip,
  CircularProgress,
  Icon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import { 
  ShoppingCart as ShoppingCartIcon,
  Done as DoneIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { convertQuoteToSalesOrder, markOrderAsCompleted, markOrderAsPaid } from '../../../api/orderApi';

// Order list component
const OrderList = ({ 
  title, 
  orders = [], 
  totalAmount, 
  totalCount,
  type, 
  isLoading = false,
  onOrderUpdated
}) => {
  const navigate = useNavigate();
  const [processingOrders, setProcessingOrders] = useState({});
  
  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    orderId: null,
    action: null
  });
  
  // 处理点击标题，跳转到订单页并应用筛选
  const handleTitleClick = () => {
    // 根据不同类型的订单卡片，跳转到订单页面并应用不同的筛选条件
    switch(type) {
      case 'quote':
        navigate('/orders?type=QUOTE');
        break;
      case 'incomplete':
        navigate('/orders?type=SALES&completed=false');
        break;
      case 'unpaid':
        navigate('/orders?type=SALES&paid=false');
        break;
      default:
        navigate('/orders');
    }
  };
  
  // 处理点击订单，查看详情
  const handleOrderClick = (orderId) => {
    if (!orderId) return;
    
    try {
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  // 关闭确认对话框
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false
    });
  };
  
  // 显示确认对话框
  const showConfirmDialog = (title, message, orderId, action) => {
    setConfirmDialog({
      open: true,
      title,
      message,
      orderId,
      action
    });
  };
  
  // 确认操作后执行相应动作
  const handleConfirmAction = async () => {
    const { action, orderId } = confirmDialog;
    
    if (!action || !orderId) {
      handleCloseConfirmDialog();
      return;
    }
    
    try {
      setProcessingOrders(prev => ({ ...prev, [orderId]: true }));
      handleCloseConfirmDialog();
      
      let response;
      switch(action) {
        case 'convert':
          response = await convertQuoteToSalesOrder(orderId);
          break;
        case 'complete':
          response = await markOrderAsCompleted(orderId);
          break;
        case 'pay':
          response = await markOrderAsPaid(orderId);
          break;
        default:
          return;
      }
      
      if (response && response.success) {
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (error) {
      console.error(`Failed to execute action ${action}:`, error);
    } finally {
      setProcessingOrders(prev => ({ ...prev, [orderId]: false }));
    }
  };
  
  // 处理报价单转换为销售单按钮点击
  const handleConvertClick = (orderId, event) => {
    if (!orderId || !event) return;
    event.stopPropagation();
    
    showConfirmDialog(
      'Convert Quote to Sales Order',
      'Are you sure you want to convert this quote to a sales order? This action cannot be undone.',
      orderId,
      'convert'
    );
  };
  
  // 处理标记为已完成按钮点击
  const handleCompleteClick = (orderId, event) => {
    if (!orderId || !event) return;
    event.stopPropagation();
    
    showConfirmDialog(
      'Mark Order as Completed',
      'Are you sure you want to mark this order as completed?',
      orderId,
      'complete'
    );
  };
  
  // 处理标记为已付款按钮点击
  const handlePayClick = (orderId, event) => {
    if (!orderId || !event) return;
    event.stopPropagation();
    
    showConfirmDialog(
      'Mark Order as Paid',
      'Are you sure you want to mark this order as paid?',
      orderId,
      'pay'
    );
  };
  
  // 渲染订单操作按钮
  const renderOrderAction = (order) => {
    const isProcessing = processingOrders[order.id];
    
    if (isProcessing) {
      return (
        <CircularProgress size={24} />
      );
    }
    
    switch(type) {
      case 'quote':
        return (
          <Tooltip title="Convert to Sales Order">
            <Button 
              size="small" 
              variant="outlined" 
              color="primary"
              onClick={(e) => handleConvertClick(order.id, e)}
              startIcon={<ShoppingCartIcon />}
              sx={{ minWidth: '140px' }}
            >
              Convert
            </Button>
          </Tooltip>
        );
      case 'incomplete':
        return (
          <Tooltip title="Mark as Completed">
            <Button 
              size="small" 
              variant="outlined" 
              color="success"
              onClick={(e) => handleCompleteClick(order.id, e)}
              startIcon={<DoneIcon />}
              sx={{ minWidth: '140px' }}
            >
              Complete
            </Button>
          </Tooltip>
        );
      case 'unpaid':
        return (
          <Tooltip title="Mark as Paid">
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={(e) => handlePayClick(order.id, e)}
              startIcon={<PaymentIcon />}
              sx={{ minWidth: '140px' }}
            >
              Pay
            </Button>
          </Tooltip>
        );
      default:
        return null;
    }
  };
  
  // 获取标题显示的颜色和文本
  const renderTitleInfo = () => {
    // 获取标题显示的颜色和文本
    let color, text;
    switch(type) {
      case 'quote':
        color = "primary";
        text = "Quotes";
        break;
      case 'incomplete':
        color = "warning.main";
        text = "Pending";
        break;
      case 'unpaid':
        color = "error";
        text = `$${totalAmount || '0.00'}`;
        break;
      default:
        color = "primary";
        text = "";
    }
    
    // 统一的右上角信息框
    return (
      <Box sx={{ 
        border: `1px solid ${color === 'primary' ? '#1976d2' : (color === 'warning.main' ? '#ed6c02' : '#d32f2f')}`, 
        borderRadius: '8px', 
        p: '4px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="subtitle1" color={color} sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
          {text}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {totalCount || 0} orders
        </Typography>
      </Box>
    );
  };
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, flexGrow: 0 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography 
            variant="h6" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={handleTitleClick}
          >
            {title}
          </Typography>
          {renderTitleInfo()}
        </Box>
        <Divider />
      </CardContent>
      
      <CardContent sx={{ p: 2, pt: 0, flexGrow: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : orders.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No orders found
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {orders.map((order) => (
              <Box 
                key={order.id} 
                sx={{ 
                  mb: 2, 
                  p: 1.5,
                  display: 'flex', 
                  alignItems: 'center',
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleOrderClick(order.id)}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: order.color || '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  {order.icon ? (
                    <Icon sx={{ color: 'white', fontSize: 20 }}>{order.icon}</Icon>
                  ) : (
                    <ShoppingCartIcon sx={{ color: 'white', fontSize: 20 }} />
                  )}
                </Box>
                <Box flex={1} mr={2}>
                  <Typography variant="body2" fontWeight="medium">
                    {order.order_number || order.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : order.date}
                  </Typography>
                  {order.Customer && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {typeof order.Customer === 'object' ? order.Customer.name : order.Customer}
                    </Typography>
                  )}
                </Box>
                {order.total_price && (
                  <Typography variant="body2" fontWeight="medium" sx={{ mr: 2 }}>
                    ${parseFloat(order.total_price).toFixed(2)}
                  </Typography>
                )}
                {order.amount && (
                  <Typography variant="body2" fontWeight="medium" sx={{ mr: 2 }}>
                    ${order.amount}
                  </Typography>
                )}
                {renderOrderAction(order)}
              </Box>
            ))}
          </Box>
        )}
        
        {orders.length > 0 && (
          <Button 
            fullWidth 
            onClick={handleTitleClick}
            variant="text"
            sx={{ mt: 2 }}
          >
            View All
          </Button>
        )}
      </CardContent>
      
      {/* 确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmAction} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default OrderList; 