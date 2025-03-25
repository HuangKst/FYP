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
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchOrders } from '../api/orderApi';
import OrderDetail from '../component/orderDetail';

const OrderPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    
    // 筛选条件
    const [orderType, setOrderType] = useState('');
    const [isPaid, setIsPaid] = useState(null);
    const [isCompleted, setIsCompleted] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    // 打开订单详情的处理函数
    const handleOpenDetail = (orderId) => {
        setSelectedOrderId(orderId);
    };

    // 关闭订单详情的处理函数
    const handleCloseDetail = () => {
        setSelectedOrderId(null);
    };

    // 加载订单数据
    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            // 如果有订单号，则使用订单号进行精确搜索
            if (orderNumber) {
                // 向后端API传递订单号
                const data = await fetchOrders();
                if (data.success) {
                    // 前端过滤订单号（如果后端API不支持订单号查询）
                    setOrders(data.orders.filter(order => 
                        order.order_number && order.order_number.includes(orderNumber)
                    ));
                }
            } else {
                // 否则使用其他条件进行搜索
                const data = await fetchOrders(
                    orderType,
                    isPaid !== null ? isPaid : undefined,
                    isCompleted !== null ? isCompleted : undefined,
                    customerName
                );
                if (data.success) {
                    setOrders(data.orders || []);
                }
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    }, [orderType, isPaid, isCompleted, customerName, orderNumber]);

    // 初始加载和筛选条件变化时重新加载数据
    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

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
        setOrderNumber('');
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
        <Container>
            <Typography variant="h4" gutterBottom>Order Management</Typography>

            {/* 筛选区域 */}
            <Paper style={{ padding: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                    {/* 订单号搜索 */}
                    <TextField
                        label="Order Number"
                        value={orderNumber}
                        onChange={(e) => setOrderNumber(e.target.value)}
                        style={{ minWidth: '150px' }}
                    />
                    
                    {/* 订单类型选择 */}
                    <FormControl style={{ minWidth: '150px' }}>
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
                        style={{ minWidth: '150px' }}
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
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button variant="contained" color="primary" onClick={handleSearch}>
                        Search
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
                </div>
            </Paper>

            {/* 订单列表 */}
            <TableContainer component={Paper}>
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
                            <TableCell>User ID</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
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
                                        {order.customer ? 
                                            (typeof order.customer === 'object' ? 
                                                order.customer.name : order.customer) 
                                            : (order.customer_id || '未知')
                                        }
                                    </TableCell>
                                    <TableCell>{getTotalAmount(order)}</TableCell>
                                    <TableCell>
                                        {order.order_type === 'QUOTE' ? 'Quote' : 'Sales'}
                                    </TableCell>
                                    <TableCell>
                                        {order.order_type === 'SALES' ? 
                                            (order.is_paid ? 'Paid' : 'Unpaid') : 
                                            '-'}
                                    </TableCell>
                                    <TableCell>
                                        {order.order_type === 'SALES' ? 
                                            (order.is_completed ? 'Completed' : 'Pending') : 
                                            '-'}
                                    </TableCell>
                                    <TableCell>
                                        {order.user ? (
                                            typeof order.user === 'object' ? order.user.id : order.user
                                        ) : (
                                            order.user_id || '未知'
                                        )}
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

            {/* 订单详情对话框 */}
            {selectedOrderId && (
                <OrderDetail 
                    orderId={selectedOrderId} 
                    open={!!selectedOrderId} 
                    onClose={handleCloseDetail}
                    onStatusChange={loadOrders}
                />
            )}
        </Container>
    );
};

export default OrderPage;
