import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { 
  CustomerInfoCard, 
  CustomerOrdersHistory 
} from '../component/customer';
import { getCustomerById, getCustomerOrders } from '../api/customerApi';
import { fetchOrders } from '../api/orderApi';

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState('all'); // 'all', 'quote', 'sale'
  const [paymentStatus, setPaymentStatus] = useState('all'); // 'all', 'pending', 'paid', 'partial'
  const [orderNumberFilter, setOrderNumberFilter] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 获取客户信息
        const customerResponse = await getCustomerById(customerId);
        
        if (customerResponse.success) {
          setCustomer(customerResponse.customer);
          
          // 方案1: 通过客户ID专用API获取订单
          try {
            const ordersResponse = await getCustomerOrders(customerId);
            if (ordersResponse.success) {
              // 转换订单数据格式
              const formattedOrders = ordersResponse.orders.map(order => ({
                id: order.id,
                orderNumber: order.order_number,
                date: new Date(order.created_at).toLocaleDateString(),
                // 将后端的 QUOTE/SALES 转换为前端的 quote/sale
                type: order.order_type === 'QUOTE' ? 'quote' : 'sale',
                total: parseFloat(order.total_price || 0),
                // 更复杂的付款状态处理逻辑
                status: determineOrderStatus(order),
                items: order.order_items || []
              }));
              setOrders(formattedOrders);
              setFilteredOrders(formattedOrders);
            }
          } catch (orderError) {
            console.error('获取订单失败，尝试备用方案', orderError);
            
            // 方案2: 备用方案，使用customer_id参数直接查询
            try {
              // 直接使用fetchOrders，通过customer_id查询
              const ordersResponse = await fetchOrders(null, null, null, null, customerId);
              if (ordersResponse.success) {
                // 相同的数据转换逻辑
                const formattedOrders = ordersResponse.orders.map(order => ({
                  id: order.id,
                  orderNumber: order.order_number,
                  date: new Date(order.created_at).toLocaleDateString(),
                  type: order.order_type === 'QUOTE' ? 'quote' : 'sale',
                  total: parseFloat(order.total_price || 0),
                  // 使用同样的付款状态处理函数
                  status: determineOrderStatus(order),
                  items: order.order_items || []
                }));
                setOrders(formattedOrders);
                setFilteredOrders(formattedOrders);
              }
            } catch (backupError) {
              console.error('备用方案也失败，尝试最后方法', backupError);
              
              // 方案3: 最后尝试使用客户名称过滤
              const ordersResponse = await fetchOrders(null, null, null, customerResponse.customer.name);
              if (ordersResponse.success) {
                const formattedOrders = ordersResponse.orders.map(order => ({
                  id: order.id,
                  orderNumber: order.order_number,
                  date: new Date(order.created_at).toLocaleDateString(),
                  type: order.order_type === 'QUOTE' ? 'quote' : 'sale',
                  total: parseFloat(order.total_price || 0),
                  status: determineOrderStatus(order),
                  items: order.order_items || []
                }));
                setOrders(formattedOrders);
                setFilteredOrders(formattedOrders);
              }
            }
          }
        }
      } catch (error) {
        console.error('获取客户数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  // 根据订单详情确定付款状态的辅助函数
  const determineOrderStatus = (order) => {
    // 报价单没有付款状态
    if (order.order_type === 'QUOTE') return undefined;
    
    // 销售订单的付款状态处理
    if (order.order_type === 'SALES') {
      // 简化为只有已付款和未付款两种状态
      if (order.is_paid) return 'paid';
      return 'pending';
    }
    
    return undefined;
  };

  // 当搜索到订单时的处理函数
  const handleOrderFound = (order) => {
    // 不跳转页面，只是将找到的订单设置为筛选后的唯一结果
    setFilteredOrders(Array.isArray(order) ? order : [order]);
    // 设置订单号筛选器为空，让UI显示所有找到的结果
    setOrderNumberFilter('');
  };

  // 当搜索不到订单时的处理函数
  const handleNoOrderFound = () => {
    // 显示空的订单列表
    setFilteredOrders([]);
    // 重置筛选条件
    setOrderNumberFilter('');
  };

  // 当筛选条件变化时更新过滤后的订单
  useEffect(() => {
    const filtered = orders.filter(order => {
      // 如果设置了订单号筛选，优先使用订单号筛选
      if (orderNumberFilter && order.orderNumber !== orderNumberFilter) {
        return false;
      }
      
      // 筛选订单类型
      if (orderType !== 'all' && order.type !== orderType) {
        return false;
      }
      
      // 筛选付款状态（仅适用于销售订单）
      if (order.type === 'sale' && paymentStatus !== 'all' && order.status !== paymentStatus) {
        return false;
      }
      
      return true;
    });
    
    setFilteredOrders(filtered);
  }, [orders, orderType, paymentStatus, orderNumberFilter]);

  const handleBack = () => {
    navigate('/customer');
  };

  const handleViewOrderDetail = (orderId) => {
    // 导航到订单详情页，添加来源参数
    navigate(`/order/${orderId}?from=customer&customerId=${customerId}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 10, p: 3 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!customer) {
    return (
      <Container sx={{ mt: 10, p: 3 }}>
        <Typography color="error">Customer not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back to Customer List
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ height: 'calc(100vh - 64px)', p: 0, mt: '64px' }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: 0,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
            <Link
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' },
                cursor: 'pointer'
              }}
              onClick={handleBack}
            >
              <ArrowBackIcon sx={{ mr: 0.5 }} fontSize="small" />
              Customers
            </Link>
            <Typography color="white">Customer Details</Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" component="h1" gutterBottom>
            Customer Details
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            View customer information and order history
          </Typography>
        </Paper>

        <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
          {/* 使用客户信息卡片组件 */}
          <CustomerInfoCard customer={customer} />

          {/* 使用订单历史组件 */}
          <CustomerOrdersHistory 
            orders={filteredOrders}
            orderType={orderType}
            setOrderType={setOrderType}
            paymentStatus={paymentStatus}
            setPaymentStatus={setPaymentStatus}
            onViewOrderDetail={handleViewOrderDetail}
            customerId={customerId}
            onOrderFound={handleOrderFound}
            onNoOrderFound={handleNoOrderFound}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default CustomerDetailPage;
