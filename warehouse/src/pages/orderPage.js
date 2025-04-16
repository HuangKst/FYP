import React, { useState, useEffect, useCallback } from 'react';
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
    Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../api/orderApi';
import OrderNumberSearch from '../component/button/searchButtonByOrderID';

const OrderPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // 筛选条件
    const [orderType, setOrderType] = useState('');
    const [isPaid, setIsPaid] = useState(null);
    const [isCompleted, setIsCompleted] = useState(null);
    const [customerName, setCustomerName] = useState('');

    // 导航到订单详情页面
    const handleOpenDetail = (orderId) => {
        navigate(`/order/${orderId}`);
    };

    // 加载订单数据
    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            // 修改为仅使用其他筛选条件，订单号搜索将由OrderNumberSearch组件处理
            const data = await fetchOrders(
                orderType,
                isPaid !== null ? isPaid : undefined,
                isCompleted !== null ? isCompleted : undefined,
                customerName
            );
            if (data.success) {
                setOrders(data.orders || []);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    }, [orderType, isPaid, isCompleted, customerName]);

    // 初始加载和筛选条件变化时重新加载数据
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    // 处理订单搜索结果
    const handleOrderFound = (order) => {
        // 将组件返回的格式化订单数据转换为页面表格期望的格式
        const convertToTableFormat = (orders) => {
            return orders.map(order => {
                // 如果已经是原始API格式，直接返回
                if (order.order_number && order.created_at) {
                    return order;
                }
                
                // 否则进行格式转换
                return {
                    id: order.id,
                    order_number: order.orderNumber,
                    // 修复日期格式问题：确保使用原始日期字符串或尝试转换日期对象为ISO格式
                    created_at: typeof order.date === 'string' ? new Date(order.date).toISOString() : new Date().toISOString(),
                    // 保持客户信息
                    Customer: order.Customer || { name: "客户" },
                    customer_id: order.customer_id,
                    total_price: order.total || 0,
                    order_type: order.type === 'quote' ? 'QUOTE' : 'SALES',
                    is_paid: order.status === 'paid' ? 1 : 0,
                    is_completed: order.is_completed || false
                };
            });
        };

        if (Array.isArray(order)) {
            // 无论找到几个订单，都只在当前页面更新订单列表
            console.log("原始订单数据:", order);
            const convertedOrders = convertToTableFormat(order);
            console.log("转换后订单数据:", convertedOrders);
            setOrders(convertedOrders);
        } else if (order) {
            // 如果是单个订单对象，也需要转换格式
            setOrders(convertToTableFormat([order]));
        }
    };

    // 处理未找到订单的情况
    const handleNoOrderFound = () => {
        // 可以选择显示提示或其他操作
        alert("没有找到匹配的订单");
    };

    // 搜索按钮点击处理
    const handleSearch = () => {
        loadOrders();
    };

    // 重置筛选条件
    const handleReset = () => {
        setOrderType('');
        setIsPaid(null);
        setIsCompleted(null);
        setCustomerName('');
        // 重置后重新加载所有订单
        loadOrders();
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                {/* 替换订单号输入框为OrderNumberSearch组件 */}
                                <OrderNumberSearch 
                                    onOrderFound={handleOrderFound}
                                    onNoOrderFound={handleNoOrderFound}
                                />
                                
                                {/* 订单类型选择 */}
                                <FormControl sx={{ minWidth: '150px' }}>
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
                                
                                {/* 客户名搜索 */}
                                <TextField
                                    label="Customer Name"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    sx={{ minWidth: '150px' }}
                                />

                                {/* 付款状态筛选 - 仅销售单可见 */}
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

                                {/* 完成状态筛选 - 仅销售单可见 */}
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
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="contained" color="primary" onClick={handleSearch}>
                                    Apply Filters
                                </Button>
                                <Button variant="outlined" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="secondary" 
                                    onClick={() => navigate('/create-order')}
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
                                                        : (order.customer_id || '未知')
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
                                                        : (order.user_id || '未知')
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
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
};

export default OrderPage;
