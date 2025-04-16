import React, { useState } from 'react';
import { 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton, 
  Box 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../../api/orderApi';

// 通用订单搜索组件，可以在订单页面和客户详情页中复用
// customerId参数是可选的，当提供时只搜索该客户的订单
const OrderNumberSearch = ({ customerId, onOrderFound, onNoOrderFound }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // 处理订单号搜索
  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    
    setSearching(true);
    
    try {
      // 准备查询参数，如果有customerId则只查该客户的订单
      const params = {
        orderNumber: orderNumber.trim(),
        ...(customerId && { customer_id: customerId })
      };
      
      // 调用API搜索订单
      const response = await fetchOrders(null, null, null, null, params.customer_id, params.orderNumber);
      
      console.log("搜索参数:", { orderNumber: params.orderNumber, customerId: params.customer_id });
      console.log("API返回原始数据:", response);
      
      if (response.success && response.orders && response.orders.length > 0) {
        // 确保只返回订单号匹配的订单
        const rawOrders = response.orders.filter(order => 
          order.order_number && order.order_number.includes(params.orderNumber)
        );
        
        console.log("过滤后的订单数据:", rawOrders);
        
        if (rawOrders.length === 0) {
          // 如果过滤后没有匹配的订单
          if (onNoOrderFound) {
            onNoOrderFound();
            alert("没有找到匹配的订单");
          } else {
            alert("没有找到匹配的订单");
          }
          return;
        }
        
        // 对于客户详情页，需要转换数据格式
        if (customerId) {
          // 将API返回的订单格式转换为客户详情页组件期望的格式
          const formattedOrders = rawOrders.map(order => ({
            id: order.id,
            orderNumber: order.order_number,
            date: new Date(order.created_at).toLocaleDateString(),
            // 将后端的 QUOTE/SALES 转换为前端的 quote/sale
            type: order.order_type === 'QUOTE' ? 'quote' : 'sale',
            total: parseFloat(order.total_price || 0),
            // 付款状态处理
            status: order.order_type === 'SALES' ? 
                   (order.is_paid === 1 || order.is_paid === true ? 'paid' : 'pending') : 
                   undefined,
            // 确保保留客户信息
            Customer: order.Customer
          }));
          
          // 如果提供了回调函数，则调用它（用于在当前页面显示结果）
          if (onOrderFound) {
            onOrderFound(formattedOrders);
          }
        } else {
          // 对于订单列表页面，直接将原始数据传递给回调
          if (onOrderFound) {
            onOrderFound(rawOrders);
          } else {
            // 如果没有回调且只有一个订单，直接导航到订单详情
            if (rawOrders.length === 1) {
              navigate(`/order/${rawOrders[0].id}`);
            } else {
              // 找到多个订单但没有回调处理方式，显示提示
              alert(`找到${rawOrders.length}个匹配订单。请精确搜索。`);
            }
          }
        }
      } else {
        // 没有找到订单
        if (onNoOrderFound) {
          onNoOrderFound();
          // 显示未找到的提示
          alert("没有找到匹配的订单");
        } else {
          // 可以在这里添加默认的未找到订单的行为，如显示提示信息
          alert("没有找到匹配的订单");
          console.log('No order found with the given order number');
        }
      }
    } catch (error) {
      console.error('Error searching order:', error);
      alert("搜索订单时发生错误");
    } finally {
      setSearching(false);
    }
  };

  // 处理回车键按下事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        size="small"
        label="Order Number"
        variant="outlined"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        onKeyPress={handleKeyPress}
        sx={{ minWidth: '200px' }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleSearch} edge="end" size="small">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button 
        variant="contained" 
        color="primary"
        onClick={handleSearch}
        disabled={searching || !orderNumber.trim()}
      >
        {searching ? 'Searching...' : 'Search'}
      </Button>
    </Box>
  );
};

export default OrderNumberSearch;
