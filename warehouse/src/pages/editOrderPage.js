import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchInventory } from '../api/inventoryApi';
import { getCustomers } from '../api/customerApi';
import { fetchOrderDetail, createOrder, updateOrderStatus, updateOrder } from '../api/orderApi';

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
    return user.userRole === 'admin' || user.userRole === 'boss';
};

const EditOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderType, setOrderType] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [orderItems, setOrderItems] = useState([{
        material: '',
        specification: '',
        quantity: '',
        unit: 'piece',
        weight: '',
        unit_price: '',
        subtotal: '',
        remark: ''
    }]);
    const [remark, setRemark] = useState('');
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [originalOrder, setOriginalOrder] = useState(null);
    
    // 获取当前用户
    const currentUser = getCurrentUser();
    // 检查是否有编辑权限
    const canEdit = hasEditPermission(currentUser);

    // 加载初始数据
    useEffect(() => {
        const loadInitialData = async () => {
            if (!canEdit) {
                setError('您没有权限编辑订单。只有管理员或老板才能执行此操作。');
                return;
            }
            
            setLoading(true);
            try {
                // 加载订单数据
                const orderResponse = await fetchOrderDetail(orderId);
                if (orderResponse.success && orderResponse.order) {
                    const orderData = orderResponse.order;
                    setOriginalOrder(orderData);
                    setOrderType(orderData.order_type);
                    setCustomerId(orderData.customer_id.toString());
                    setRemark(orderData.remark || '');
                    
                    // 处理订单项
                    const items = orderData.OrderItems || [];
                    if (items.length > 0) {
                        setOrderItems(items.map(item => ({
                            id: item.id,
                            material: item.material,
                            specification: item.specification,
                            quantity: item.quantity,
                            unit: item.unit || 'piece',
                            weight: item.weight || '',
                            unit_price: item.unit_price,
                            subtotal: item.subtotal,
                            remark: item.remark || ''
                        })));
                    }
                } else {
                    setError('无法加载订单数据');
                    return;
                }
                
                // 加载客户列表
                const customerResponse = await getCustomers();
                if (customerResponse.success) {
                    setCustomers(customerResponse.customers || []);
                }
                
                // 加载库存列表
                const inventoryResponse = await fetchInventory();
                if (inventoryResponse.success) {
                    setInventory(inventoryResponse.inventory || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setError('加载数据时发生错误');
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();
    }, [orderId, canEdit]);
    
    // 计算小计
    const calculateSubtotal = (item) => {
        if (!item.unit_price) return '';
        if (item.weight && !isNaN(parseFloat(item.weight))) {
            return (parseFloat(item.weight) * parseFloat(item.unit_price)).toFixed(2);
        } else if (item.quantity && !isNaN(parseFloat(item.quantity))) {
            return (parseFloat(item.quantity) * parseFloat(item.unit_price)).toFixed(2);
        }
        return '';
    };

    // 计算总金额
    const calculateTotal = () => {
        return orderItems.reduce((total, item) => {
            const subtotal = item.subtotal ? parseFloat(item.subtotal) : 
                             calculateSubtotal(item) ? parseFloat(calculateSubtotal(item)) : 0;
            return total + subtotal;
        }, 0).toFixed(2);
    };

    // 更新订单项
    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;
        
        // 如果更新了物料或规格，自动填充库存信息
        if (field === 'material' || field === 'specification') {
            const inventoryItem = inventory.find(item => 
                item.material === newItems[index].material && 
                item.specification === newItems[index].specification
            );
            
            if (inventoryItem) {
                // 可以自动填充其他信息，如单位等
                if (field === 'material' && inventoryItem.specification) {
                    // 当选择物料时，如果库存中有对应的规格，自动填充
                    newItems[index].specification = inventoryItem.specification;
                }
            }
        }
        
        // 自动计算小计
        if (field === 'quantity' || field === 'weight' || field === 'unit_price') {
            newItems[index].subtotal = calculateSubtotal(newItems[index]);
        }
        
        setOrderItems(newItems);
    };

    // 添加订单项
    const handleAddItem = () => {
        setOrderItems([...orderItems, {
            material: '',
            specification: '',
            quantity: '',
            unit: 'piece',
            weight: '',
            unit_price: '',
            subtotal: '',
            remark: ''
        }]);
    };

    // 删除订单项
    const handleDeleteItem = (index) => {
        if (orderItems.length === 1) return; // 至少保留一项
        const newItems = [...orderItems];
        newItems.splice(index, 1);
        setOrderItems(newItems);
    };

    // 提交表单
    const handleSubmit = async () => {
        // 基本验证
        if (!customerId) {
            setError('请选择客户');
            return;
        }
        
        if (orderItems.some(item => !item.material || !item.specification || !item.quantity || !item.unit_price)) {
            setError('请完成所有订单项的必填信息');
            return;
        }
        
        setSubmitting(true);
        setError('');
        
        try {
            // 如果是销售订单，检查库存是否足够
            if (orderType === 'SALES' && originalOrder.order_type === 'SALES') {
                // 对于每个订单项，计算库存变化
                for (const item of orderItems) {
                    const originalItem = originalOrder.OrderItems.find(oi => oi.id === item.id);
                    const inventoryItem = inventory.find(inv => 
                        inv.material === item.material && 
                        inv.specification === item.specification
                    );
                    
                    if (inventoryItem) {
                        const originalQuantity = originalItem ? parseFloat(originalItem.quantity) : 0;
                        const newQuantity = parseFloat(item.quantity);
                        const quantityDiff = newQuantity - originalQuantity;
                        
                        // 如果新数量大于原数量，需要检查库存是否足够
                        if (quantityDiff > 0) {
                            const availableStock = parseFloat(inventoryItem.quantity);
                            if (quantityDiff > availableStock) {
                                setError(`商品 ${item.material} (${item.specification}) 库存不足，当前库存: ${availableStock}`);
                                setSubmitting(false);
                                return;
                            }
                        }
                    }
                }
            }
            
            // 准备提交数据
            const updateData = {
                customerId: parseInt(customerId),
                items: orderItems.map(item => ({
                    id: item.id,
                    material: item.material,
                    specification: item.specification,
                    quantity: item.quantity,
                    unit: item.unit,
                    weight: item.weight || 0,
                    unit_price: item.unit_price,
                    subtotal: item.subtotal || calculateSubtotal(item),
                    remark: item.remark
                })),
                remark
            };
            
            // 提交到API
            const response = await updateOrder(orderId, updateData);
            
            if (response.success) {
                // 更新成功，返回订单详情页
                navigate(`/order/${orderId}`);
            } else {
                setError(response.msg || '更新订单失败');
            }
        } catch (error) {
            console.error('Error updating order:', error);
            setError('更新订单时发生错误');
        } finally {
            setSubmitting(false);
        }
    };

    // 如果没有编辑权限，显示错误信息
    if (!canEdit && !loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Paper sx={{ p: 2 }}>
                    <Alert severity="error">您没有权限编辑订单。只有管理员或老板才能执行此操作。</Alert>
                    <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate(`/order/${orderId}`)}>
                        返回订单详情
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" component="h1">
                        {loading ? 'Loading...' : `Edit Order: ${originalOrder?.order_number || ''}`}
                    </Typography>
                    <Button variant="outlined" onClick={() => navigate(`/order/${orderId}`)}>
                        Cancel
                    </Button>
                </Box>
                
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}
                        
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth disabled>
                                    <InputLabel>Order Type</InputLabel>
                                    <Select
                                        value={orderType}
                                        label="Order Type"
                                    >
                                        <MenuItem value="QUOTE">Quote</MenuItem>
                                        <MenuItem value="SALES">Sales</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Customer</InputLabel>
                                    <Select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        label="Customer"
                                    >
                                        {customers.map((customer) => (
                                            <MenuItem key={customer.id} value={customer.id.toString()}>
                                                {customer.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                        
                        <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
                        
                        <TableContainer sx={{ mb: 3 }}>
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
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orderItems.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <TextField
                                                    select
                                                    size="small"
                                                    fullWidth
                                                    value={item.material}
                                                    onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                                                >
                                                    {Array.from(new Set(inventory.map(inv => inv.material))).map((material) => (
                                                        <MenuItem key={material} value={material}>
                                                            {material}
                                                        </MenuItem>
                                                    ))}
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    select
                                                    size="small"
                                                    fullWidth
                                                    value={item.specification}
                                                    onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                                                >
                                                    {inventory
                                                        .filter(inv => inv.material === item.material)
                                                        .map((inv) => (
                                                            <MenuItem key={inv.specification} value={inv.specification}>
                                                                {inv.specification}
                                                            </MenuItem>
                                                        ))}
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    select
                                                    size="small"
                                                    fullWidth
                                                    value={item.unit}
                                                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                                >
                                                    <MenuItem value="piece">piece</MenuItem>
                                                    <MenuItem value="kg">kg</MenuItem>
                                                    <MenuItem value="m">m</MenuItem>
                                                    <MenuItem value="m²">m²</MenuItem>
                                                </TextField>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={item.weight}
                                                    onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={item.subtotal || calculateSubtotal(item)}
                                                    InputProps={{ readOnly: true }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={item.remark || ''}
                                                    onChange={(e) => handleItemChange(index, 'remark', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton 
                                                    color="error" 
                                                    onClick={() => handleDeleteItem(index)}
                                                    disabled={orderItems.length <= 1}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell colSpan={6} align="right">
                                            <strong>Total</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>{calculateTotal()}</strong>
                                        </TableCell>
                                        <TableCell colSpan={2}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AddIcon />}
                                                onClick={handleAddItem}
                                                fullWidth
                                            >
                                                Add Item
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Typography variant="h6" sx={{ mb: 2 }}>Remarks</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                            sx={{ mb: 3 }}
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" onClick={() => navigate(`/order/${orderId}`)}>
                                Cancel
                            </Button>
                            <Button 
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </Container>
    );
};

export default EditOrderPage; 