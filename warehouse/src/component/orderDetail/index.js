import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Chip,
    FormControlLabel,
    Switch,
    TextField,
    Alert
} from '@mui/material';
import { fetchOrderById, updateOrderStatus, deleteOrder } from '../../api/orderApi';

// 从localStorage获取当前用户信息
const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// 检查用户是否有权限删除订单
const hasDeletePermission = (user) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'boss';
};

const OrderDetail = ({ orderId, open, onClose, onStatusChange }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [remark, setRemark] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [error, setError] = useState('');
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    // 检查是否有删除权限
    const canDelete = hasDeletePermission(currentUser);

    // 加载订单详情
    useEffect(() => {
        const loadOrderDetail = async () => {
            if (!orderId) return;
            
            setLoading(true);
            try {
                const response = await fetchOrderById(orderId);
                console.log('完整的订单详情数据:', response); // 添加详细的日志
                console.log('用户信息:', response.order?.user); // 查看用户信息
                console.log('客户信息:', response.order?.customer); // 查看客户信息
                if (response.success && response.order) {
                    // 确保订单项数据正确格式化
                    let orderData = response.order;
                    
                    // 检查OrderItems的字段名（可能是OrderItems而不是order_items）
                    if (!orderData.order_items && orderData.OrderItems) {
                        orderData = {
                            ...orderData,
                            order_items: orderData.OrderItems
                        };
                    }
                    
                    console.log('Processed order data:', orderData); // 添加调试日志
                    setOrder(orderData);
                    // 确保状态值与数据库中的tinyint类型保持一致（1表示true，0表示false）
                    setIsPaid(orderData.is_paid === 1 || orderData.is_paid === true);
                    setIsCompleted(orderData.is_completed === 1 || orderData.is_completed === true);
                    setRemark(orderData.remark || '');
                }
            } catch (error) {
                console.error('Error loading order detail:', error);
            } finally {
                setLoading(false);
            }
        };

        loadOrderDetail();
    }, [orderId]);

    // 更新订单状态
    const handleUpdateStatus = async () => {
        if (!order) return;
        
        setUpdating(true);
        try {
            const response = await updateOrderStatus(orderId, {
                is_paid: isPaid ? 1 : 0, // 确保发送到后端的值是1或0，而不是true/false
                is_completed: isCompleted ? 1 : 0,
                remark
            });
            
            if (response.success) {
                // 通知父组件状态已更新，刷新订单列表
                if (onStatusChange) onStatusChange();
                // 关闭对话框
                onClose();
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        } finally {
            setUpdating(false);
        }
    };

    // 删除订单
    const handleDeleteOrder = async () => {
        if (!order) return;
        
        // 再次检查权限
        if (!canDelete) {
            setError('您没有权限删除订单。只有管理员才能执行此操作。');
            setDeleteConfirm(false);
            return;
        }
        
        setUpdating(true);
        setError('');
        try {
            const response = await deleteOrder(orderId);
            if (response.success) {
                // 通知父组件状态已更新，刷新订单列表
                if (onStatusChange) onStatusChange();
                // 关闭对话框
                onClose();
            } else {
                setError(response.msg || '删除订单失败');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            setError('删除订单时发生错误');
        } finally {
            setUpdating(false);
            setDeleteConfirm(false);
        }
    };

    // 计算总金额
    const calculateTotal = () => {
        if (!order || !order.order_items) return 0;
        return order.order_items.reduce((total, item) => {
            return total + parseFloat(item.subtotal || 0);
        }, 0).toFixed(2);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                {loading ? 'Loading order details...' : `Order Details: ${order?.order_number || ''}`}
            </DialogTitle>
            
            <DialogContent>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                        <CircularProgress />
                    </div>
                ) : !order ? (
                    <Typography component="div">Order not found</Typography>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" style={{ marginBottom: '15px' }}>
                                {error}
                            </Alert>
                        )}
                        {/* 订单基本信息 */}
                        <Paper style={{ padding: '15px', marginBottom: '20px' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" component="div">Order Type</Typography>
                                    <Typography component="div">
                                        {order.order_type === 'QUOTE' ? 'Quote' : 'Sales'}
                                        <Chip 
                                            size="small" 
                                            label={order.order_type === 'QUOTE' ? 'Quote' : 'Sales'} 
                                            color={order.order_type === 'QUOTE' ? 'info' : 'primary'}
                                            style={{ marginLeft: '8px' }}
                                        />
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" component="div">Customer</Typography>
                                    <Typography component="div">
                                        {order.Customer ? (
                                            <>
                                                {order.Customer.name}
                                                {order.Customer.phone && ` (${order.Customer.phone})`}
                                                {order.Customer.address && <div style={{ fontSize: '0.9em', color: '#666' }}>{order.Customer.address}</div>}
                                            </>
                                        ) : (
                                            <span style={{ color: '#999' }}>Unknown Customer</span>
                                        )}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" component="div">Created Date</Typography>
                                    <Typography component="div">{new Date(order.created_at).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" component="div">Created By</Typography>
                                    <Typography component="div">
                                        {order.User ? (
                                            <>
                                                {order.User.username}
                                                {order.User.role && ` (${order.User.role})`}
                                            </>
                                        ) : (
                                            <span style={{ color: '#999' }}>Unknown User</span>
                                        )}
                                    </Typography>
                                </Grid>
                                {order.order_type === 'SALES' && (
                                    <>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" component="div">Payment Status</Typography>
                                            <Chip 
                                                label={order.is_paid ? 'Paid' : 'Unpaid'} 
                                                color={order.is_paid ? 'success' : 'error'} 
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" component="div">Completion Status</Typography>
                                            <Chip 
                                                label={order.is_completed ? 'Completed' : 'Pending'} 
                                                color={order.is_completed ? 'success' : 'warning'} 
                                            />
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Paper>

                        {/* 订单项目列表 */}
                        <Typography variant="h6" component="div" gutterBottom>Order Items</Typography>
                        <TableContainer component={Paper} style={{ marginBottom: '20px' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Material</TableCell>
                                        <TableCell>Specification</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Unit</TableCell>
                                        <TableCell>Weight</TableCell>
                                        <TableCell>Unit Price</TableCell>
                                        <TableCell>Subtotal</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {order.order_items && order.order_items.length > 0 ? (
                                        order.order_items.map((item) => (
                                            <TableRow key={item.id || Math.random()}>
                                                <TableCell>{item.material}</TableCell>
                                                <TableCell>{item.specification}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>{item.unit}</TableCell>
                                                <TableCell>{item.weight || '-'}</TableCell>
                                                <TableCell>{item.unit_price}</TableCell>
                                                <TableCell>{item.subtotal}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">No order items</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell colSpan={5}></TableCell>
                                        <TableCell><strong>Total</strong></TableCell>
                                        <TableCell><strong>{calculateTotal()}</strong></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* 备注信息 */}
                        <Typography variant="h6" component="div" gutterBottom>Remarks</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            disabled={updating}
                        />

                        {/* 状态更新区域（仅销售单可用） */}
                        {order.order_type === 'SALES' && (
                            <>
                                <Divider style={{ margin: '20px 0' }} />
                                <Typography variant="h6" component="div" gutterBottom>Update Status</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={isPaid}
                                                    onChange={(e) => setIsPaid(e.target.checked)}
                                                    disabled={updating}
                                                />
                                            }
                                            label="Paid"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={isCompleted}
                                                    onChange={(e) => setIsCompleted(e.target.checked)}
                                                    disabled={updating}
                                                />
                                            }
                                            label="Completed"
                                        />
                                    </Grid>
                                </Grid>
                            </>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions>
                {deleteConfirm ? (
                    <>
                        <div style={{ color: '#f44336', marginRight: '10px' }}>Confirm delete this order?</div>
                        <Button onClick={() => setDeleteConfirm(false)} disabled={updating}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDeleteOrder} 
                            color="error" 
                            disabled={updating}
                        >
                            {updating ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                    </>
                ) : (
                    <>
                        {canDelete && (
                            <Button onClick={() => setDeleteConfirm(true)} color="error" disabled={updating || loading || !order}>
                                Delete Order
                            </Button>
                        )}
                        <Button onClick={onClose} disabled={updating}>
                            Close
                        </Button>
                        {order && order.order_type === 'SALES' && (
                            <Button 
                                onClick={handleUpdateStatus} 
                                color="primary" 
                                variant="contained"
                                disabled={updating || loading}
                            >
                                {updating ? 'Updating...' : 'Update Status'}
                            </Button>
                        )}
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default OrderDetail;
