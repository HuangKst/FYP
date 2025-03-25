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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orderApi';
import { fetchInventory } from '../api/inventoryApi';
import { getCustomers } from '../api/customerApi';

const CreateOrderPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [confirmDialog, setConfirmDialog] = useState(false);
    
    // 订单基本信息
    const [orderType, setOrderType] = useState('QUOTE'); // 默认为报价单
    const [customerId, setCustomerId] = useState('');
    const [remark, setRemark] = useState('');
    
    // 订单项目列表
    const [orderItems, setOrderItems] = useState([{
        material: '',
        specification: '',
        quantity: '',
        unit: 'piece',
        weight: '',
        unit_price: '',
        remark: ''
    }]);

    // 获取客户列表和库存信息
    useEffect(() => {
        const loadData = async () => {
            try {
                const customerResponse = await getCustomers();
                if (customerResponse.success) {
                    setCustomers(customerResponse.customers || customerResponse.data || []);
                }
                
                const inventoryResponse = await fetchInventory();
                if (inventoryResponse.success) {
                    setInventory(inventoryResponse.inventory || inventoryResponse.data || []);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        
        loadData();
    }, []);

    // 添加订单项
    const handleAddItem = () => {
        setOrderItems([...orderItems, {
            material: '',
            specification: '',
            quantity: '',
            unit: 'piece',
            weight: '',
            unit_price: '',
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
        
        // 计算小计金额
        if ((field === 'quantity' || field === 'weight' || field === 'unit_price') && 
            (newItems[index].weight || newItems[index].quantity) && 
            newItems[index].unit_price) {
            // 根据重量或数量计算
            if (newItems[index].weight && parseFloat(newItems[index].weight) > 0) {
                newItems[index].subtotal = (parseFloat(newItems[index].weight) * parseFloat(newItems[index].unit_price)).toFixed(2);
            } else if (newItems[index].quantity && parseFloat(newItems[index].quantity) > 0) {
                newItems[index].subtotal = (parseFloat(newItems[index].quantity) * parseFloat(newItems[index].unit_price)).toFixed(2);
            }
        }
        
        setOrderItems(newItems);
    };

    // 获取可用物料列表
    const getMaterialOptions = () => {
        const materials = [...new Set(inventory.map(item => item.material))];
        return materials;
    };

    // 获取指定物料的规格选项
    const getSpecificationOptions = (material) => {
        if (!material) return [];
        return inventory
            .filter(item => item.material === material)
            .map(item => item.specification);
    };

    // 表单验证
    const validateForm = () => {
        if (!customerId) return false;
        
        for (const item of orderItems) {
            if (!item.material || !item.specification || !item.quantity || !item.unit_price) {
                return false;
            }
        }
        
        return true;
    };

    // 提交订单
    const handleSubmit = async () => {
        if (!validateForm()) {
            alert('Please fill in all required fields');
            return;
        }
        
        // 检查如果是销售订单，库存是否足够
        if (orderType === 'SALES') {
            for (const item of orderItems) {
                const inventoryItem = inventory.find(inv => 
                    inv.material === item.material && 
                    inv.specification === item.specification
                );
                
                if (!inventoryItem) {
                    alert(`Material ${item.material} ${item.specification} does not exist in inventory`);
                    return;
                }
                
                if (parseFloat(inventoryItem.quantity) < parseFloat(item.quantity)) {
                    alert(`Insufficient inventory for ${item.material} ${item.specification}, current stock: ${inventoryItem.quantity}`);
                    return;
                }
            }
        }
        
        // 打开确认对话框
        setConfirmDialog(true);
    };

    // 确认并提交订单
    const confirmSubmit = async () => {
        setLoading(true);
        try {
            // 获取当前用户ID
            const userId = localStorage.getItem('userId') || '1'; // 假设有存储用户ID
            
            // 修改数据结构以匹配后端API要求
            const orderData = {
                order_type: orderType,
                customer_id: customerId,
                user_id: userId,
                items: orderItems.map(item => ({
                    material: item.material,
                    specification: item.specification,
                    quantity: item.quantity,
                    unit: item.unit || 'piece',
                    weight: item.weight || 0,
                    unit_price: item.unit_price,
                    remark: item.remark || '',
                })),
                remark
            };
            
            const response = await createOrder(orderData);
            
            if (response.success) {
                alert(`Order created successfully! Order Number: ${response.order_number || response.orderId}`);
                navigate('/orders');
            } else {
                alert('Failed to create order: ' + (response.msg || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to create order: ' + error.message);
        } finally {
            setLoading(false);
            setConfirmDialog(false);
        }
    };

    // 计算订单总金额
    const calculateTotal = () => {
        return orderItems.reduce((total, item) => {
            const subtotal = item.subtotal || 0;
            return total + parseFloat(subtotal);
        }, 0).toFixed(2);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Create New Order</Typography>
            
            {/* 订单基本信息 */}
            <Paper style={{ padding: '20px', marginBottom: '20px' }}>
                <Typography variant="h6" gutterBottom>Order Information</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Order Type *</InputLabel>
                            <Select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                label="Order Type *"
                            >
                                <MenuItem value="QUOTE">Quote</MenuItem>
                                <MenuItem value="SALES">Sales</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Customer *</InputLabel>
                            <Select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                label="Customer *"
                            >
                                {customers.map(customer => (
                                    <MenuItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Remark"
                            multiline
                            rows={2}
                            fullWidth
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>
            
            {/* 订单项目列表 */}
            <Paper style={{ padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <Typography variant="h6">Order Items</Typography>
                    <Button 
                        startIcon={<AddIcon />}
                        onClick={handleAddItem}
                        variant="outlined"
                    >
                        Add Item
                    </Button>
                </div>
                
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Material *</TableCell>
                                <TableCell>Specification *</TableCell>
                                <TableCell>Quantity *</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell>Weight</TableCell>
                                <TableCell>Unit Price *</TableCell>
                                <TableCell>Subtotal</TableCell>
                                <TableCell>Remark</TableCell>
                                <TableCell>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orderItems.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={item.material}
                                                onChange={(e) => handleItemChange(index, 'material', e.target.value)}
                                                displayEmpty
                                            >
                                                <MenuItem value="" disabled>Select Material</MenuItem>
                                                {getMaterialOptions().map(material => (
                                                    <MenuItem key={material} value={material}>{material}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={item.specification}
                                                onChange={(e) => handleItemChange(index, 'specification', e.target.value)}
                                                displayEmpty
                                                disabled={!item.material}
                                            >
                                                <MenuItem value="" disabled>Select Specification</MenuItem>
                                                {getSpecificationOptions(item.material).map(spec => (
                                                    <MenuItem key={spec} value={spec}>{spec}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            inputProps={{ min: 0 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormControl fullWidth size="small">
                                            <Select
                                                value={item.unit}
                                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                            >
                                                <MenuItem value="piece">Piece</MenuItem>
                                                <MenuItem value="kg">Kilogram</MenuItem>
                                                <MenuItem value="m">Meter</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={item.weight}
                                            onChange={(e) => handleItemChange(index, 'weight', e.target.value)}
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                            inputProps={{ min: 0, step: 0.01 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            disabled
                                            size="small"
                                            fullWidth
                                            value={item.subtotal || ''}
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
                                    <Typography variant="subtitle1"><strong>Total:</strong></Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="subtitle1"><strong>{calculateTotal()}</strong></Typography>
                                </TableCell>
                                <TableCell colSpan={2}></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
            
            {/* 操作按钮 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <Button variant="outlined" onClick={() => navigate('/orders')}>
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Create Order'}
                </Button>
            </div>
            
            {/* 确认对话框 */}
            <Dialog
                open={confirmDialog}
                onClose={() => setConfirmDialog(false)}
            >
                <DialogTitle>Confirm Order Creation</DialogTitle>
                <DialogContent>
                    <div>
                        Are you sure you want to create this {orderType === 'QUOTE' ? 'quote' : 'sales'} order?
                        {orderType === 'SALES' && ' Creating this order will reduce the corresponding inventory.'}
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialog(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={confirmSubmit} color="primary" disabled={loading}>
                        {loading ? 'Submitting...' : 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default CreateOrderPage; 