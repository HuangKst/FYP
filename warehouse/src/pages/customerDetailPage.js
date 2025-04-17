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
      } else {
        setError(response.msg || '获取客户详情失败');
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      setError('获取客户详情时发生错误');
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

  // 单独获取客户的总欠款金额（不受筛选条件影响）
  const fetchTotalCustomerDebt = async (customerId) => {
    try {
      console.log(`开始获取客户ID=${customerId}的总欠款金额...`);
      
      // 方式1：使用标准API获取所有未付款的销售订单
      const response = await instance.get('/orders', {
        params: { 
          customerId: customerId,  // 确保参数名称正确
          type: 'SALES',           // 只考虑销售订单
          paid: 'false',           // 只考虑未付款订单
          pageSize: 1000           // 足够大的数量获取所有订单
        }
      });
      
      console.log('获取欠款订单响应:', response.data);
      
      if (response.data.success && response.data.orders) {
        // 计算总欠款
        const totalDebt = response.data.orders.reduce((sum, order) => 
          sum + parseFloat(order.total_price || 0), 0);
        
        console.log(`客户总欠款: ¥${totalDebt}, 欠款订单数: ${response.data.orders.length}`);
        
        if (response.data.orders.length > 0) {
          console.log('欠款订单详情:', response.data.orders.map(o => ({
            id: o.id,
            orderNumber: o.order_number,
            amount: parseFloat(o.total_price || 0)
          })));
        }
        
        return totalDebt;
      }
      
      // 方式2：如果上面的方法失败，尝试另一种方式获取
      console.log('尝试备用方式获取欠款信息...');
      const backupResponse = await fetchOrders(
        'SALES',   // 订单类型：销售订单
        false,     // 是否已支付：未支付
        null,      // 是否已完成：不限
        null,      // 客户名称：不限
        customerId,// 客户ID：当前客户
        '',        // 订单号：不限
        1,         // 页码：第1页
        1000       // 每页大小：1000条
      );
      
      if (backupResponse.success && backupResponse.orders) {
        const totalDebtBackup = backupResponse.orders.reduce((sum, order) => 
          sum + parseFloat(order.total_price || 0), 0);
        
        console.log(`备用方式获取的客户总欠款: ¥${totalDebtBackup}, 订单数: ${backupResponse.orders.length}`);
        return totalDebtBackup;
      }
      
      return 0;
    } catch (error) {
      console.error('获取客户总欠款失败:', error);
      return 0;
    }
  };

  // 加载订单数据
  const loadOrdersData = async () => {
    try {
      setLoading(true);
      // 获取当前订单号
      const currentOrderNumber = window.orderNumberSearchComponent?.getOrderNumber() || '';
      
      const data = await fetchOrders(
        orderType, 
        isPaid, 
        isCompleted, 
        '', 
        customerId, 
        currentOrderNumber,
        page,
        pageSize
      );
      
      if (data && data.success) {
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
        setError(data?.msg || '获取订单失败');
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('加载订单时发生错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customerId) return;
    
    // 获取客户详情
    fetchCustomerDetails(customerId);
    
    // 获取客户未付款总额（不受筛选条件影响）
    fetchTotalCustomerDebt(customerId).then(amount => {
      console.log(`设置客户总欠款为: ¥${amount}`);
      setTotalCustomerDebt(amount);
    });

    // 加载订单数据
    loadOrdersData();
  }, [customerId]);

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
        setError(response.msg || '搜索订单失败');
      }
    } catch (error) {
      console.error('Error searching orders:', error);
      setError('搜索订单时发生错误');
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

  // 导出PDF处理函数
  const handleExportPdf = (exportAllOrders = false) => {
    if (!customerId || exportingPdf) return;
    
    setExportingPdf(true);
    
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
    
    // 获取当前订单号搜索值
    const currentOrderNumber = window.orderNumberSearchComponent?.getOrderNumber() || '';
    
    // 判断是否有筛选条件
    const hasFilter = orderType || currentOrderNumber || isCompleted !== null || isPaid !== null;
    
    // 检查筛选后的订单数量，如果有筛选条件且没有匹配订单，则设置exportAllOrders为true
    const hasFilteredOrders = filteredOrders && filteredOrders.length > 0;
    
    // 记录当前状态
    console.log('导出PDF前状态:', {
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
    
    // 修改：始终将includeAllOrders设置为true，无论是否有筛选条件
    // 这样可以确保所有订单都包含在PDF中
    const shouldIncludeAllOrders = true;
    
    // 构建导出选项 - 确保传递所有筛选条件
    const exportOptions = {
      // 基本信息
      customerName: customer.name,
      // 始终设置includeAllOrders为true
      includeAllOrders: shouldIncludeAllOrders,
      
      // 传递筛选参数，用于PDF中显示筛选条件
      orderType: orderType || undefined,
      orderNumber: currentOrderNumber || undefined,
      status: isCompleted === true ? 'completed' : 
              isCompleted === false ? 'pending' : undefined,
      paymentStatus: isPaid === true ? 'paid' : 
                    isPaid === false ? 'unpaid' : undefined,
      
      // 使用客户总欠款金额，不管当前筛选条件如何
      unpaidAmount: totalCustomerDebt,
      // 显示设置 - 始终显示欠款金额，因为这是客户的总欠款
      showUnpaid: true
    };
    
    // 记录导出信息
    console.log('导出PDF - 详细参数:', { 
      customerId,
      exportOptions,
      shouldIncludeAllOrders,
      hasFilter,
      filteredOrdersCount: filteredOrders.length,
      allOrdersCount: orders.length,
      totalCustomerDebt
    });
    
    // 调用API导出PDF
    generateCustomerOrdersPDF(customerId, exportOptions)
      .then(result => {
        if (result.success) {
          // 更新为成功消息
          messageElement.style.backgroundColor = '#4caf50';
          messageElement.textContent = 'PDF下载已完成，请检查浏览器下载';
        } else if (result.suggestExportAll) {
          // 如果建议导出所有订单
          messageElement.style.backgroundColor = '#ff9800';
          messageElement.textContent = `当前筛选条件下没有订单。客户共有 ${result.allOrdersCount} 个订单，是否导出全部？`;
          
          // 添加确认和取消按钮
          const buttonContainer = document.createElement('div');
          buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
            gap: 10px;
          `;
          
          const confirmButton = document.createElement('button');
          confirmButton.textContent = '导出所有订单';
          confirmButton.style.cssText = `
            background-color: #4caf50;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
          `;
          
          const cancelButton = document.createElement('button');
          cancelButton.textContent = '取消';
          cancelButton.style.cssText = `
            background-color: #f44336;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
          `;
          
          // 添加点击事件
          confirmButton.onclick = () => {
            document.body.removeChild(messageElement);
            setExportingPdf(false);
            // 导出所有订单
            handleExportPdf(true);
          };
          
          cancelButton.onclick = () => {
            document.body.removeChild(messageElement);
            setExportingPdf(false);
          };
          
          buttonContainer.appendChild(confirmButton);
          buttonContainer.appendChild(cancelButton);
          messageElement.appendChild(buttonContainer);
          
          // 不自动关闭消息
          return;
        } else {
          throw new Error(result.message || '导出失败');
        }
      })
      .catch(error => {
        console.error('导出PDF失败:', error);
        messageElement.style.backgroundColor = '#f44336';
        messageElement.textContent = `导出PDF失败: ${error.message || '未知错误'}`;
      })
      .finally(() => {
        // 如果不是建议导出所有订单的情况，才自动关闭消息
        if (!messageElement.contains(document.querySelector('button'))) {
          setExportingPdf(false);
          
          // 几秒后移除消息
          setTimeout(() => {
            if (document.body.contains(messageElement)) {
              document.body.removeChild(messageElement);
            }
          }, 5000);
        }
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
                  label={`未付款总额: ¥${totalCustomerDebt.toLocaleString()}`}
                  color="error"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => handleExportPdf()}
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
