import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Box,
    Grid,
    Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../api/orderApi';
import OrderNumberSearch from '../component/button/searchButtonByOrderID';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import Pagination from '../component/Pagination';

const OrderPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 筛选条件
    const [orderType, setOrderType] = useState('');
    const [isPaid, setIsPaid] = useState(null);
    const [isCompleted, setIsCompleted] = useState(null);
    const [customerName, setCustomerName] = useState('');
    // 订单号搜索引用
    const orderNumberSearchRef = useRef(null);
    
    // 分页状态
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 1
    });

    // 导航到订单详情页面
    const handleOpenDetail = (orderId) => {
        navigate(`/order/${orderId}`);
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
                customerName,
                orderNumber,
                page,
                pageSize
            });
            
            // 调用API搜索订单
            const response = await fetchOrders(
                orderType,  // 这里直接传递下拉框的值
                isPaid !== null ? isPaid : undefined,
                isCompleted !== null ? isCompleted : undefined,
                customerName,
                null,  // customerId
                orderNumber,
                page,
                pageSize
            );
            
            if (response.success) {
                setOrders(response.orders || []);
                setPagination(ensurePaginationData(response.pagination));
            }
        } catch (error) {
            console.error('Error searching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // 初始加载时获取订单
    useEffect(() => {
        handleSearch();
    }, [page, pageSize]); // 页码或每页数量变化时重新加载

    // 处理页码变化
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    // 处理每页数量变化
    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setPage(1); // 重置到第一页
    };

    // 重置筛选条件
    const handleReset = () => {
        setOrderType('');
        setIsPaid(null);
        setIsCompleted(null);
        setCustomerName('');
        setPage(1);
        // 重置订单号搜索框
        window.orderNumberSearchComponent?.resetOrderNumber();
        // 重新加载所有订单
        handleSearch();
    };

    // 根据类型获取总金额
    const getTotalAmount = (order) => {
        // 如果有total_price字段直接使用（从模型中看到正确的字段是total_price而不是total_amount）
        if (order.total_price) {
            return parseFloat(order.total_price).toFixed(2);
        }
        
        // 如果有order_items则计算
        if (order.order_items && order.order_items.length > 0) {
            return order.order_items.reduce((sum, item) => {
                const subtotal = parseFloat(item.subtotal || 0);
                return sum + (isNaN(subtotal) ? 0 : subtotal);
            }, 0).toFixed(2);
        }
        
        // 默认返回0
        return '0.00';
    };

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
                    <Typography variant="h4" component="h1" gutterBottom>
                        Order Management
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                        Manage and track all orders, including quotes and sales orders
                    </Typography>
                </Paper>

                <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
                    {/* 筛选区域 */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Search Orders</Typography>
                        
                        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                {/* 第一行：搜索字段，优化间距布局 */}
                                <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <OrderNumberSearch 
                                        standalone={false}
                                        ref={orderNumberSearchRef}
                                        handleSearchAction={handleSearch}
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Customer Name"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </Grid>
                                
                                <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
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
                        
                        {/* 第二行：状态筛选和按钮 - 优化布局 */}
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

                            {/* 操作按钮 - 优化布局和间距 */}
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
                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                                <Button 
                                    variant="contained" 
                                    color="secondary" 
                                    onClick={() => navigate('/create-order')}
                                    disabled={loading}
                                    sx={{ minWidth: '130px' }}
                                    startIcon={<AddIcon />}
                                >
                                    Create Order
                                </Button>
                            </Box>
                        </Box>
                    </Paper>

                    {/* 订单列表 */}
                    <Paper sx={{ borderRadius: 2 }}>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Order Number</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Customer</TableCell>
                                        <TableCell>Amount</TableCell>
                                        <TableCell>Type</TableCell>
                                        {/* 销售单特有字段 */}
                                        <TableCell>Payment Status</TableCell>
                                        <TableCell>Completion Status</TableCell>
                                        <TableCell>Creator</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : orders.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                No Data
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orders.map((order) => (
                                            <TableRow 
                                                key={order.id}
                                                hover
                                                onClick={() => handleOpenDetail(order.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <TableCell>{order.order_number}</TableCell>
                                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    {order.Customer ? 
                                                        (typeof order.Customer === 'object' ? 
                                                            order.Customer.name : order.Customer) 
                                                        : (order.customer_id || 'Unknown')
                                                    }
                                                </TableCell>
                                                <TableCell>{getTotalAmount(order)}</TableCell>
                                                <TableCell>
                                                    {order.order_type === 'QUOTE' ? 'Quote' : 'Sales'}
                                                </TableCell>
                                                <TableCell>
                                                    {order.order_type === 'SALES' ? 
                                                        ((order.is_paid === 1 || order.is_paid === true) ? 'Paid' : 'Unpaid') : 
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {order.order_type === 'SALES' ? 
                                                        ((order.is_completed === 1 || order.is_completed === true) ? 'Completed' : 'Pending') : 
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {order.User ? 
                                                        (typeof order.User === 'object' ? 
                                                            order.User.username : order.User) 
                                                        : (order.user_id || 'Unknown')
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        size="small" 
                                                        variant="contained" 
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenDetail(order.id);
                                                        }}
                                                    >
                                                        View
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

export default OrderPage;
