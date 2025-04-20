import React, { useState, useEffect } from 'react';
import {
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
    Alert,
    Button,
    Box,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar
} from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchOrderDetail, updateOrderStatus, deleteOrder } from '../../api/orderApi';
import PrintIcon from '@mui/icons-material/Print';
import OrderPrintPreview from '../OrderPrintPreview';
import PdfExportButton from '../PdfExportButton';
import { BASE_URL } from '../../config';

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

// 检查用户是否有权限编辑订单
const hasEditPermission = (user) => {
    if (!user) return false;
    // 检查userRole属性（localStorage中存储的键名）
    return user.userRole === 'admin' || user.userRole === 'boss';
};

// 检查用户是否有权限删除订单
const hasDeletePermission = (user) => {
    if (!user) return false;
    // 检查userRole属性（localStorage中存储的键名）
    return user.userRole === 'admin';
};

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [remark, setRemark] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [error, setError] = useState('');
    const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
    const [convertToSalesDialogOpen, setConvertToSalesDialogOpen] = useState(false);
    const [convertingToSales, setConvertingToSales] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    // 检查是否有编辑权限
    const canEdit = hasEditPermission(currentUser);
    // 检查是否有删除权限
    const canDelete = hasDeletePermission(currentUser);

    // 添加调试日志
    console.log('当前用户信息:', currentUser);
    console.log('是否有编辑权限:', canEdit);
    console.log('是否有删除权限:', canDelete);

    // 解析URL查询参数，确定返回目标
    const getNavigationTarget = () => {
        const queryParams = new URLSearchParams(location.search);
        const fromPage = queryParams.get('from');
        const customerId = queryParams.get('customerId');
        
        // 如果来自客户详情页且提供了customerId，则返回客户详情页
        if (fromPage === 'customer' && customerId) {
            return `/customers/${customerId}?from=order`;
        }
        
        // 默认返回订单列表页
        return '/orders';
    };
    
    // 处理返回按钮点击
    const handleBackClick = () => {
        navigate(getNavigationTarget());
    };

    // 显示提示消息
    const showSnackbar = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // 关闭提示消息
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    // 加载订单详情
    useEffect(() => {
        const loadOrderDetail = async () => {
            if (!orderId) return;
            
            setLoading(true);
            try {
                const response = await fetchOrderDetail(orderId);
                console.log('完整的订单详情数据:', response);
                console.log('用户信息:', response.order?.user);
                console.log('客户信息:', response.order?.customer);
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
                    
                    console.log('Processed order data:', orderData);
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
        
        // 检查权限
        if (!canEdit) {
            setError('You do not have permission to edit this order. Only administrators or managers can perform this action.');
            return;
        }
        
        setUpdating(true);
        try {
            const response = await updateOrderStatus(orderId, {
                is_paid: isPaid ? 1 : 0,
                is_completed: isCompleted ? 1 : 0,
                remark
            });
            
            if (response.success) {
                // 刷新订单数据
                const updatedResponse = await fetchOrderDetail(orderId);
                if (updatedResponse.success) {
                    setOrder(updatedResponse.order);
                }
                setError('');
                showSnackbar('Order status updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            setError('An error occurred while updating the order status');
            showSnackbar('Failed to update order status', 'error');
        } finally {
            setUpdating(false);
        }
    };

    // 报价单转换为销售单
    const handleConvertToSalesOrder = async () => {
        if (!order || order.order_type !== 'QUOTE') return;
        
        // 检查权限
        if (!canEdit) {
            setError('You do not have permission to convert this order. Only administrators or managers can perform this action.');
            return;
        }
        
        setConvertingToSales(true);
        try {
            // 将报价单转换为销售单，保持其他字段不变
            const response = await updateOrderStatus(orderId, {
                order_type: 'SALES',
                is_paid: 0,  // 默认为未付款
                is_completed: 0,  // 默认为未完成
                remark: remark || order.remark
            });
            
            if (response.success) {
                showSnackbar('Quote successfully converted to sales order', 'success');
                
                // 刷新订单数据
                const updatedResponse = await fetchOrderDetail(orderId);
                if (updatedResponse.success) {
                    setOrder(updatedResponse.order);
                    // 更新本地状态
                    setIsPaid(false);
                    setIsCompleted(false);
                }
                setError('');
            }
        } catch (error) {
            console.error('Error converting to sales order:', error);
            setError('An error occurred while converting to sales order');
            showSnackbar('Failed to convert to sales order', 'error');
        } finally {
            setConvertingToSales(false);
            setConvertToSalesDialogOpen(false);
        }
    };

    // 删除订单
    const handleDeleteOrder = async () => {
        if (!order) return;
        
        // 再次检查权限
        if (!canDelete) {
            setError('You do not have permission to delete this order. Only administrators can perform this action.');
            setDeleteConfirm(false);
            return;
        }
        
        setUpdating(true);
        setError('');
        try {
            const response = await deleteOrder(orderId);
            if (response.success) {
                // 返回到订单列表页
                showSnackbar('Order deleted successfully', 'success');
                navigate(getNavigationTarget());
            } else {
                setError(response.msg || 'Failed to delete order');
                showSnackbar('Failed to delete order', 'error');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            setError('An error occurred while deleting the order');
            showSnackbar('Failed to delete order', 'error');
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

    // 打开打印预览
    const handleOpenPrintPreview = () => {
        setPrintPreviewOpen(true);
    };
    
    // 关闭打印预览
    const handleClosePrintPreview = () => {
        setPrintPreviewOpen(false);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" component="h1">
                        {loading ? 'Loading order details...' : `Order Details: ${order?.order_number || ''}`}
                    </Typography>
                    <Box>
                        <Button 
                            variant="outlined" 
                            startIcon={<PrintIcon />} 
                            onClick={handleOpenPrintPreview}
                            sx={{ mr: 2 }}
                        >
                            Print
                        </Button>
                        <PdfExportButton
                            url={`${BASE_URL}/orders/${orderId}/pdf`}
                            filename={`order-${order?.order_number || orderId}.pdf`}
                            disabled={loading || !order}
                            buttonProps={{ variant: "outlined" }}
                        >
                            Export PDF
                        </PdfExportButton>
                        <Button variant="outlined" onClick={handleBackClick}>
                            Back
                        </Button>
                    </Box>
                </Box>
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : !order ? (
                    <Typography component="div">Order not found</Typography>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        {/* 订单基本信息 */}
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" component="div">Order Type</Typography>
                                    <Typography component="div">
                                        {order.order_type === 'QUOTE' ? 'Quote' : 'Sales'}
                                        <Chip 
                                            size="small" 
                                            label={order.order_type === 'QUOTE' ? 'Quote' : 'Sales'} 
                                            color={order.order_type === 'QUOTE' ? 'info' : 'primary'}
                                            sx={{ ml: 1 }}
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
                                                {order.Customer.address && <Box sx={{ fontSize: '0.9em', color: 'text.secondary' }}>{order.Customer.address}</Box>}
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
                        <TableContainer component={Paper} sx={{ mb: 3 }}>
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
                                        <TableCell>Remark</TableCell>
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
                                                <TableCell>{item.remark || '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">No order items</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell colSpan={6}></TableCell>
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
                            disabled={updating || !canEdit}
                            sx={{ mb: 3 }}
                            placeholder={order.remark ? "" : "No remarks available"}
                            helperText={!canEdit && "Only administrators or managers can edit remarks"}
                        />

                        {/* 状态更新区域（仅销售单可用） */}
                        {order.order_type === 'SALES' && (
                            <>
                                <Divider sx={{ my: 3 }} />
                                <Typography variant="h6" component="div" gutterBottom>Update Status</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={isPaid}
                                                    onChange={(e) => setIsPaid(e.target.checked)}
                                                    disabled={updating || !canEdit}
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
                                                    disabled={updating || !canEdit}
                                                />
                                            }
                                            label="Completed"
                                        />
                                    </Grid>
                                </Grid>
                            </>
                        )}

                        {/* 操作按钮 */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            {deleteConfirm ? (
                                <>
                                    <Typography color="error" sx={{ mr: 2, alignSelf: 'center' }}>
                                        Confirm delete this order?
                                    </Typography>
                                    <Button onClick={() => setDeleteConfirm(false)} disabled={updating} sx={{ mr: 1 }}>
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleDeleteOrder} 
                                        color="error" 
                                        variant="contained"
                                        disabled={updating}
                                    >
                                        {updating ? 'Deleting...' : 'Confirm Delete'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {canDelete && (
                                        <Button onClick={() => setDeleteConfirm(true)} color="error" disabled={updating || loading || !order} sx={{ mr: 1 }}>
                                            Delete Order
                                        </Button>
                                    )}
                                    {canEdit && (
                                        <Button 
                                            onClick={() => navigate(`/edit-order/${orderId}`)} 
                                            color="secondary"
                                            variant="contained"
                                            disabled={updating || loading || !order}
                                            sx={{ mr: 1 }}
                                        >
                                            Edit Order
                                        </Button>
                                    )}
                                    {/* 报价单转销售单按钮 */}
                                    {order && order.order_type === 'QUOTE' && canEdit && (
                                        <Button 
                                            onClick={() => setConvertToSalesDialogOpen(true)} 
                                            color="warning" 
                                            variant="contained"
                                            disabled={updating || loading}
                                            sx={{ mr: 1 }}
                                        >
                                            Convert to Sales Order
                                        </Button>
                                    )}
                                    {order && order.order_type === 'SALES' && canEdit && (
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
                        </Box>
                    </>
                )}
            </Paper>
            
            {/* 打印预览对话框 */}
            {order && (
                <OrderPrintPreview 
                    order={order} 
                    open={printPreviewOpen} 
                    onClose={handleClosePrintPreview} 
                />
            )}

            {/* 报价单转销售单确认对话框 */}
            <Dialog
                open={convertToSalesDialogOpen}
                onClose={() => setConvertToSalesDialogOpen(false)}
                aria-labelledby="convert-dialog-title"
                aria-describedby="convert-dialog-description"
            >
                <DialogTitle id="convert-dialog-title">
                    Convert to Sales Order
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="convert-dialog-description">
                        Are you sure you want to convert this quote to a sales order? This operation will affect inventory and customer debt, and cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConvertToSalesDialogOpen(false)} disabled={convertingToSales}>
                        Cancel
                    </Button>
                    <Button onClick={handleConvertToSalesOrder} color="warning" disabled={convertingToSales}>
                        {convertingToSales ? 'Converting...' : 'Confirm Conversion'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 全局提示消息 */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbarSeverity} 
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default OrderDetail;
