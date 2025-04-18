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
  Chip,
  Alert,
  Snackbar
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
import PdfExportButton from '../component/PdfExportButton';
import instance from '../api/axios';  // 导入正确的axios实例
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
  const [totalCustomerDebt, setTotalCustomerDebt] = useState(0);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState(null);
  
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

  // 获取客户详情
  const fetchCustomerDetails = async (id) => {
    try {
      setLoading(true);
      const response = await getCustomerById(id);
      if (response.success) {
        setCustomer(response.customer);
        // 在这里直接设置总欠款，避免依赖customer状态
        const totalDebt = parseFloat(response.customer.total_debt || 0);
        console.log(`Customer ${response.customer.name} total debt: ¥${totalDebt}`);
        setTotalCustomerDebt(totalDebt);
      } else {
        setError(response.msg || 'Failed to fetch customer details');
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('An error occurred while fetching customer details');
    } finally {
      setLoading(false);
    }
  };

  // 计算未付款总额
  const calculateTotalUnpaid = (ordersData) => {
    return ordersData
      .filter(order => order.type === 'SALES' && !order.is_paid)
      .reduce((sum, order) => sum + (order.total || 0), 0);
  };

  // 获取客户的总欠款金额
  const fetchTotalCustomerDebt = async (customerId) => {
    try {
      // 客户信息中已经包含了 total_debt 字段，不需要再计算
      // 此函数仅作为备用，当客户数据中的 total_debt 为空时使用
      return 0; // 返回0，实际会使用客户数据中的 total_debt
    } catch (error) {
      console.error('获取客户总欠款失败:', error);
      return 0;
    }
  };

  // 加载订单数据
  const loadOrdersData = async () => {
    try {
      setLoading(true);
      console.log('开始加载客户订单数据...');
      
      // 直接使用getCustomerOrders API获取客户所有订单，不应用筛选条件
      const data = await getCustomerOrders(customerId, page, pageSize);
      
      console.log('获取到客户订单响应:', data);
      
      if (data && data.success) {
        console.log(`加载成功: 获取到${data.orders?.length || 0}个订单`);
        
        // 格式化订单数据
        const formattedOrders = (data.orders || []).map(order => ({
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
        
        console.log('格式化后的订单数据:', formattedOrders);
        
        setOrders(formattedOrders);
        setFilteredOrders(formattedOrders);
        updatePagination({
          total: data.pagination?.total || formattedOrders.length,
          page: data.pagination?.page || page,
          pageSize: data.pagination?.pageSize || pageSize,
          totalPages: data.pagination?.totalPages || Math.ceil(formattedOrders.length / pageSize)
        });
        
        // 计算当前筛选结果的未付款金额
        setTotalUnpaidAmount(calculateTotalUnpaid(formattedOrders));
      } else {
        console.error('加载订单失败:', data?.msg);
        setError(data?.msg || 'Failed to load orders');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('An error occurred while loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customerId) return;
    
    // 确保不管是否从订单详情页返回，都重置筛选条件，以显示所有订单
    setOrderType('');
    setIsPaid(null);
    setIsCompleted(null);
    if (window.orderNumberSearchComponent) {
      window.orderNumberSearchComponent.resetOrderNumber();
    }
    
    // 获取客户详情，包括欠款信息
    fetchCustomerDetails(customerId);

    // 加载订单数据
    loadOrdersData();
  }, [customerId]); // 移除customer依赖项，避免循环重新获取

  // 执行搜索，整合所有搜索条件
  const handleSearch = async () => {
    setLoading(true);
    try {
      // 获取订单号
      const currentOrderNumber = window.orderNumberSearchComponent?.getOrderNumber() || '';
      
      console.log("搜索条件:", {
        orderType, 
        isPaid,
        isCompleted,
        orderNumber: currentOrderNumber,
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
        currentOrderNumber,
        page,  // 添加分页参数
        pageSize
      );
      
      if (response.success) {
        let results = response.orders || [];
        
        // 如果搜索了订单号，需要在前端进行额外过滤以确保准确性
        if (currentOrderNumber && currentOrderNumber.trim() !== '') {
          results = results.filter(order => 
            order.order_number && order.order_number.toLowerCase().includes(currentOrderNumber.toLowerCase().trim())
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
        
        // 计算当前筛选结果的未付款金额（注意：不更新总欠款，总欠款保持不变）
        setTotalUnpaidAmount(calculateTotalUnpaid(formattedOrders));
        
        // 更新分页信息
        setPage(1); // 重置到第一页
        updatePagination({
          total: response.pagination?.total || formattedOrders.length,
          page: 1,
          pageSize: pageSize,
          totalPages: response.pagination?.totalPages || Math.ceil(formattedOrders.length / pageSize)
        });
        
        // 只显示第一页数据
        const paginatedOrders = formattedOrders.slice(0, pageSize);
        setFilteredOrders(paginatedOrders);
      } else {
        setError(response.msg || 'Failed to search orders');
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setError('An error occurred while searching orders');
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
    updatePagination({
      total: orders.length,
      page: 1,
      pageSize: pageSize,
      totalPages: Math.ceil(orders.length / pageSize)
    });
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
    updatePagination({
      total: orders.length,
      page: 1,
      pageSize: newPageSize,
      totalPages: Math.ceil(orders.length / newPageSize)
    });
  };

  // 更新分页信息
  const updatePagination = (paginationData) => {
    const safeData = ensurePaginationData(paginationData);
    setPagination(safeData);
  };

  // PDF Export handler function
  const handleExportPdf = (exportAllOrders = false) => {
    if (!customerId || exportingPdf) return;
    
    setExportingPdf(true);
    
    // Use Snackbar to display loading status
    setError('Generating PDF, please wait...');
    
    // Get current order number search value
    const currentOrderNumber = window.orderNumberSearchComponent?.getOrderNumber() || '';
    
    // Check if there are any filter conditions
    const hasFilter = orderType || currentOrderNumber || isCompleted !== null || isPaid !== null;
    
    // Check filtered orders count, if there are filter conditions but no matching orders, set exportAllOrders to true
    const hasFilteredOrders = filteredOrders && filteredOrders.length > 0;
    
    // Log current state
    console.log('Export PDF status:', {
      orderType,
      currentOrderNumber,
      isCompleted,
      isPaid,
      hasFilter,
      hasFilteredOrders,
      filteredOrdersCount: filteredOrders.length,
      totalOrdersCount: orders.length,
      totalCustomerDebt,
      exportAllOrders
    });
    
    // Modification: Always set includeAllOrders to true, regardless of filter conditions
    // This ensures all orders are included in the PDF
    const shouldIncludeAllOrders = true;
    
    // Build export options - ensure all filter conditions are passed
    const exportOptions = {
      // Basic information
      customerName: customer.name,
      // Always set includeAllOrders to true
      includeAllOrders: shouldIncludeAllOrders,
      
      // Pass filter parameters for display in the PDF
      orderType: orderType || undefined,
      orderNumber: currentOrderNumber || undefined,
      status: isCompleted === true ? 'completed' : 
              isCompleted === false ? 'pending' : undefined,
      paymentStatus: isPaid === true ? 'paid' : 
                    isPaid === false ? 'unpaid' : undefined,
      
      // Use the customer's total debt amount, regardless of current filter conditions
      unpaidAmount: totalCustomerDebt,
      // Display settings - always show debt amount as this is the customer's total debt
      showUnpaid: true
    };
    
    // Log export information
    console.log('Export PDF details:', { 
      customerId,
      exportOptions,
      shouldIncludeAllOrders,
      hasFilter,
      filteredOrdersCount: filteredOrders.length,
      allOrdersCount: orders.length,
      totalCustomerDebt
    });
    
    // Call API to export PDF
    generateCustomerOrdersPDF(customerId, exportOptions)
      .then(result => {
        if (result.success) {
          // Update with success message
          setError('PDF has been generated and download started');
        } else if (result.suggestExportAll) {
          // If suggesting to export all orders
          setError(`No orders found with current filters. Customer has ${result.allOrdersCount} orders in total. Exporting all orders.`);
          
          // TODO: Change this to use a dialog to confirm whether to export all
          // For now, keep it simple and directly export all
          setExportingPdf(false);
          handleExportPdf(true);
        } else {
          throw new Error(result.message || 'Export failed');
        }
      })
      .catch(error => {
        console.error('Failed to export PDF:', error);
        setError(`PDF export failed: ${error.message || 'Unknown error'}`);
      })
      .finally(() => {
        setExportingPdf(false);
      });
  };

  const handleBack = () => {
    navigate('/customer');
  };

  const handleViewOrderDetail = (orderId) => {
    // Navigate to order details page, add source parameters
    navigate(`/order/${orderId}?from=customer&customerId=${customerId}`);
  };
  
  // 处理错误消息关闭
  const handleCloseError = () => {
    setError(null);
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
        {/* 错误消息提示 */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
        
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
          overflow: 'auto'
        }}>
          {/* Customer info card component */}
          <CustomerInfoCard customer={customer} />

          {/* Order search area - using the same components and layout as orderPage */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography variant="h6">Order History</Typography>
              
              {/* Display total debt */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip 
                  label={`Total Debt: ¥${parseFloat(customer?.total_debt || 0).toFixed(2)}`}
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <PdfExportButton
                  url={`${BASE_URL}/customers/${customerId}/orders/pdf`}
                  queryParams={{
                    customerName: customer.name,
                    includeAllOrders: true,
                    orderType: orderType || undefined,
                    orderNumber: window.orderNumberSearchComponent?.getOrderNumber() || undefined,
                    status: isCompleted === true ? 'completed' : 
                          isCompleted === false ? 'pending' : undefined,
                    paymentStatus: isPaid === true ? 'paid' : 
                                  isPaid === false ? 'unpaid' : undefined,
                    unpaidAmount: totalCustomerDebt,
                    showUnpaid: true
                  }}
                  filename={`customer-${customer.name.replace(/\s+/g, '_')}-orders.pdf`}
                  disabled={orders.length === 0}
                />
              </Box>
            </Box>
            
            {/* Search form */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                {/* First row: search fields */}
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
            
            {/* Second row: status filter and buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: {xs: 'column', sm: 'row'}, 
              justifyContent: 'space-between',
              alignItems: {xs: 'flex-start', sm: 'center'},
              mt: 2
            }}>
              {/* Status filter */}
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

              {/* Operation buttons */}
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
          
          {/* Order list */}
          <Paper sx={{ borderRadius: 2 }}>
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
                        <TableCell>¥{parseFloat(order.total || 0).toFixed(2)}</TableCell>
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
            
            {/* Pagination component */}
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
