import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { 
  CustomerInfoCard, 
  OrderStatusChip 
} from '../component/customer';
import { getCustomerById, getCustomerOrders, generateCustomerOrdersPDF } from '../api/customerApi';
import { fetchOrders } from '../api/orderApi';
import OrderNumberSearch from '../component/button/searchButtonByOrderID';
import Pagination from '../component/Pagination';
import axiosInstance from '../api/axios';
import { BASE_URL } from '../config';

const CustomerDetailPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState('');  // '', 'QUOTE', 'SALES'
  const [isPaid, setIsPaid] = useState(null);      // null, true, false
  const [isCompleted, setIsCompleted] = useState(null); // null, true, false
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });
  
  // 引用searchButton组件
  const orderNumberSearchRef = useRef(null);

  // 计算未付款总额
  const calculateTotalUnpaid = (ordersData) => {
    return ordersData
      .filter(order => order.type === 'SALES' && !order.is_paid)
      .reduce((sum, order) => sum + (order.total || 0), 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get customer information
        const customerResponse = await getCustomerById(customerId);
        
        if (customerResponse.success) {
          setCustomer(customerResponse.customer);
          
          // Method 1: Fetch orders through customer-specific API
          try {
            const ordersResponse = await getCustomerOrders(customerId, page, pageSize);
            if (ordersResponse.success) {
              // Format order data
              const formattedOrders = ordersResponse.orders.map(order => ({
                id: order.id,
                orderNumber: order.order_number,
                date: new Date(order.created_at).toLocaleDateString(),
                type: order.order_type === 'QUOTE' ? 'QUOTE' : 'SALES',
                total: parseFloat(order.total_price || 0),
                status: order.order_type === 'SALES' ? 
                       (order.is_paid === 1 || order.is_paid === true ? 'paid' : 'pending') : 
                       undefined,
                is_paid: order.is_paid === 1 || order.is_paid === true,
                is_completed: order.is_completed === 1 || order.is_completed === true,
                items: order.order_items || [],
                order_number: order.order_number,
                order_type: order.order_type,
                created_at: order.created_at,
                Customer: order.Customer
              }));
              setOrders(formattedOrders);
              
              // 计算并设置未付款总额
              setTotalUnpaidAmount(calculateTotalUnpaid(formattedOrders));
              
              // 更新分页信息
              updatePagination(formattedOrders);
              
              // 只显示第一页数据
              const startIndex = (page - 1) * pageSize;
              const paginatedOrders = formattedOrders.slice(startIndex, startIndex + pageSize);
              setFilteredOrders(paginatedOrders);
            }
          } catch (orderError) {
            console.error('Failed to fetch orders, trying backup method', orderError);
            
            // Method 2: Backup method using customer_id parameter directly
            try {
              // Use fetchOrders with customer_id
              const ordersResponse = await fetchOrders(null, null, null, null, customerId);
              if (ordersResponse.success) {
                // Same data transformation logic
                const formattedOrders = ordersResponse.orders.map(order => ({
                  id: order.id,
                  orderNumber: order.order_number,
                  date: new Date(order.created_at).toLocaleDateString(),
                  type: order.order_type === 'QUOTE' ? 'QUOTE' : 'SALES',
                  total: parseFloat(order.total_price || 0),
                  status: order.order_type === 'SALES' ? 
                         (order.is_paid === 1 || order.is_paid === true ? 'paid' : 'pending') : 
                         undefined,
                  is_paid: order.is_paid === 1 || order.is_paid === true,
                  is_completed: order.is_completed === 1 || order.is_completed === true,
                  items: order.order_items || [],
                  order_number: order.order_number,
                  order_type: order.order_type,
                  created_at: order.created_at,
                  Customer: order.Customer
                }));
                setOrders(formattedOrders);
                
                // 计算并设置未付款总额
                setTotalUnpaidAmount(calculateTotalUnpaid(formattedOrders));
                
                // 更新分页信息
                updatePagination(formattedOrders);
                
                // 只显示第一页数据
                const startIndex = (page - 1) * pageSize;
                const paginatedOrders = formattedOrders.slice(startIndex, startIndex + pageSize);
                setFilteredOrders(paginatedOrders);
              }
            } catch (backupError) {
              console.error('Backup method also failed, trying last method', backupError);
              
              // Method 3: Final attempt using customer name filter
              const ordersResponse = await fetchOrders(null, null, null, customerResponse.customer.name);
              if (ordersResponse.success) {
                const formattedOrders = ordersResponse.orders.map(order => ({
                  id: order.id,
                  orderNumber: order.order_number,
                  date: new Date(order.created_at).toLocaleDateString(),
                  type: order.order_type === 'QUOTE' ? 'QUOTE' : 'SALES',
                  total: parseFloat(order.total_price || 0),
                  status: order.order_type === 'SALES' ? 
                         (order.is_paid === 1 || order.is_paid === true ? 'paid' : 'pending') : 
                         undefined,
                  is_paid: order.is_paid === 1 || order.is_paid === true,
                  is_completed: order.is_completed === 1 || order.is_completed === true,
                  items: order.order_items || [],
                  order_number: order.order_number,
                  order_type: order.order_type,
                  created_at: order.created_at,
                  Customer: order.Customer
                }));
                setOrders(formattedOrders);
                
                // 计算并设置未付款总额
                setTotalUnpaidAmount(calculateTotalUnpaid(formattedOrders));
                
                // 更新分页信息
                updatePagination(formattedOrders);
                
                // 只显示第一页数据
                const startIndex = (page - 1) * pageSize;
                const paginatedOrders = formattedOrders.slice(startIndex, startIndex + pageSize);
                setFilteredOrders(paginatedOrders);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch customer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId]);

  // 执行搜索，整合所有搜索条件
  const handleSearch = async () => {
    setLoading(true);
    try {
      // 获取订单号
      const orderNumber = window.orderNumberSearchComponent?.getOrderNumber() || '';
      
      console.log("搜索条件:", {
        orderType, 
        isPaid,
        isCompleted,
        orderNumber,
        customerId,
        page,
        pageSize
      });
      
      // 调用API搜索订单
      const response = await fetchOrders(
        orderType,  // 这里直接传递下拉框的值
        isPaid !== null ? isPaid : undefined,
        isCompleted !== null ? isCompleted : undefined,
        null,  // customerName不需要
        customerId,  // 固定为当前客户
        orderNumber,
        page,  // 添加分页参数
        pageSize
      );
      
      if (response.success) {
        let results = response.orders || [];
        
        // 如果搜索了订单号，需要在前端进行额外过滤以确保准确性
        if (orderNumber && orderNumber.trim() !== '') {
          results = results.filter(order => 
            order.order_number && order.order_number.toLowerCase().includes(orderNumber.toLowerCase().trim())
          );
        }
        
        // 订单类型过滤
        if (orderType && orderType.trim() !== '') {
          results = results.filter(order => order.order_type === orderType.toUpperCase());
        }
        
        // 按照UI组件期望的数据格式转换
        const formattedOrders = results.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          date: new Date(order.created_at).toLocaleDateString(),
          type: order.order_type === 'QUOTE' ? 'QUOTE' : 'SALES',
          total: parseFloat(order.total_price || 0),
          status: order.order_type === 'SALES' ? 
                 (order.is_paid === 1 || order.is_paid === true ? 'paid' : 'pending') : 
                 undefined,
          is_paid: order.is_paid === 1 || order.is_paid === true,
          is_completed: order.is_completed === 1 || order.is_completed === true,
          items: order.order_items || [],
          order_number: order.order_number,
          order_type: order.order_type,
          created_at: order.created_at,
          Customer: order.Customer
        }));
        
        // 保存完整结果用于分页
        setOrders(formattedOrders);
        
        // 计算并设置未付款总额
        setTotalUnpaidAmount(calculateTotalUnpaid(formattedOrders));
        
        // 更新分页信息
        setPage(1); // 重置到第一页
        updatePagination(formattedOrders, 1, pageSize);
        
        // 只显示第一页数据
        const paginatedOrders = formattedOrders.slice(0, pageSize);
        setFilteredOrders(paginatedOrders);
      }
    } catch (error) {
      console.error('Error searching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // 重置筛选条件
  const handleReset = () => {
    setOrderType('');
    setIsPaid(null);
    setIsCompleted(null);
    setPage(1); // 重置到第一页
    // 重置订单号搜索框
    window.orderNumberSearchComponent?.resetOrderNumber();
    // 恢复所有订单
    setFilteredOrders(orders);
    // 重置分页
    updatePagination(orders);
  };

  // 确保分页数据完整性
  const ensurePaginationData = (paginationData) => {
    return {
      total: paginationData?.total || 0,
      page: paginationData?.page || page,
      pageSize: paginationData?.pageSize || pageSize,
      totalPages: paginationData?.totalPages || 1
    };
  };

  // 处理页码变化
  const handlePageChange = (newPage) => {
    setPage(newPage);
    // 客户端分页 - 切片订单数据
    const startIndex = (newPage - 1) * pageSize;
    const paginatedOrders = orders.slice(startIndex, startIndex + pageSize);
    setFilteredOrders(paginatedOrders);
  };

  // 处理每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
    // 客户端分页 - 切片订单数据
    const paginatedOrders = orders.slice(0, newPageSize);
    setFilteredOrders(paginatedOrders);
    // 更新分页信息
    updatePagination(orders, 1, newPageSize);
  };

  // 更新分页信息
  const updatePagination = (data, currentPage = page, currentPageSize = pageSize) => {
    const total = data.length;
    const totalPages = Math.ceil(total / currentPageSize) || 1;
    setPagination({
      total,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages
    });
  };

  // 导出PDF处理函数
  const handleExportPdf = () => {
    if (!customerId || exportingPdf) return;
    
    setExportingPdf(true);
    
    try {
      // 显示消息
      const messageElement = document.createElement('div');
      messageElement.className = 'pdf-export-message';
      messageElement.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background-color: #2196f3;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;
      messageElement.textContent = '正在准备PDF下载...';
      document.body.appendChild(messageElement);
      
      // 构建过滤参数
      const filters = {
        customerName: customer.name,
        status: orderType ? orderType.toLowerCase() : undefined,
        paymentStatus: isPaid === true ? 'paid' : isPaid === false ? 'unpaid' : undefined
      };
      
      // 使用API函数生成并下载PDF
      generateCustomerOrdersPDF(customerId, filters)
        .then(result => {
          if (result.success) {
            // 更新为成功消息
            messageElement.style.backgroundColor = '#4caf50';
            messageElement.textContent = 'PDF下载已完成，请检查浏览器下载';
          } else {
            throw new Error(result.message || '下载失败');
          }
        })
        .catch(error => {
          console.error('导出PDF失败:', error);
          messageElement.style.backgroundColor = '#f44336';
          messageElement.textContent = `导出PDF失败: ${error.message || '未知错误'}`;
        })
        .finally(() => {
          setExportingPdf(false);
          
          // 几秒后移除消息
          setTimeout(() => {
            if (document.body.contains(messageElement)) {
              document.body.removeChild(messageElement);
            }
          }, 5000);
        });
    } catch (error) {
      console.error('启动PDF导出失败:', error);
      setExportingPdf(false);
      alert(`导出PDF失败: ${error.message || '未知错误'}`);
    }
  };

  const handleBack = () => {
    navigate('/customer');
  };

  const handleViewOrderDetail = (orderId) => {
    // Navigate to order details page, add source parameters
    navigate(`/order/${orderId}?from=customer&customerId=${customerId}`);
  };

  if (loading && !customer) {
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

        <Box sx={{ 
          flex: 1, 
          p: 3, 
          backgroundColor: '#f5f5f5', 
          overflow: 'hidden'
        }}>
          {/* Customer info card component */}
          <CustomerInfoCard customer={customer} />

          {/* 订单搜索区域 - 使用与orderPage相同的组件和布局 */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Order History</Typography>
              
              {/* 显示总欠款 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`未付款总额: ¥${totalUnpaidAmount.toLocaleString()}`}
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleExportPdf}
                  disabled={exportingPdf || orders.length === 0}
                >
                  {exportingPdf ? '导出中...' : '导出PDF'}
                </Button>
              </Box>
            </Box>
            
            {/* 搜索表单 */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                {/* 第一行：搜索字段 */}
                <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <OrderNumberSearch 
                    standalone={false}
                    ref={orderNumberSearchRef}
                    customerId={customerId}
                    handleSearchAction={handleSearch}
                  />
                </Grid>
                
                <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Order Type</InputLabel>
                    <Select
                      value={orderType}
                      onChange={(e) => setOrderType(e.target.value)}
                      label="Order Type"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="QUOTE">Quote</MenuItem>
                      <MenuItem value="SALES">Sales</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
            
            {/* 第二行：状态筛选和按钮 */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: {xs: 'column', sm: 'row'}, 
              justifyContent: 'space-between',
              alignItems: {xs: 'flex-start', sm: 'center'},
              mt: 2
            }}>
              {/* 状态筛选 */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'row', 
                flexWrap: 'wrap',
                gap: 2,
                mb: {xs: 2, sm: 0}
              }}>
                {(orderType === 'SALES' || orderType === '') && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isPaid === true}
                        indeterminate={isPaid === null}
                        onChange={(e) => {
                          if (isPaid === null) setIsPaid(true);
                          else if (isPaid === true) setIsPaid(false);
                          else setIsPaid(null);
                        }}
                      />
                    }
                    label="Paid"
                  />
                )}

                {(orderType === 'SALES' || orderType === '') && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isCompleted === true}
                        indeterminate={isCompleted === null}
                        onChange={(e) => {
                          if (isCompleted === null) setIsCompleted(true);
                          else if (isCompleted === true) setIsCompleted(false);
                          else setIsCompleted(null);
                        }}
                      />
                    }
                    label="Completed"
                  />
                )}
              </Box>

              {/* 操作按钮 */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1.5,
                alignItems: 'center',
                justifyContent: {xs: 'flex-start', sm: 'flex-end'},
                width: {xs: '100%', sm: 'auto'}
              }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSearch}
                  disabled={loading}
                  sx={{ minWidth: '100px' }}
                  startIcon={<SearchIcon />}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleReset} 
                  disabled={loading}
                  sx={{ minWidth: '100px' }}
                  startIcon={<ClearIcon />}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {/* 订单列表 */}
          <Paper sx={{ borderRadius: 2, maxHeight: 'calc(100vh - 480px)', overflow: 'auto' }}>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 530px)' }}>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                        hover
                        onClick={() => handleViewOrderDetail(order.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>
                          {order.type === 'QUOTE' ? 'Quote' : 'Sales Order'}
                        </TableCell>
                        <TableCell>¥{(order.total || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <OrderStatusChip 
                            type={order.type === 'QUOTE' ? 'quote' : 'sale'} 
                            status={order.status} 
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewOrderDetail(order.id);
                            }}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* 分页组件 */}
            <Pagination 
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default CustomerDetailPage;
