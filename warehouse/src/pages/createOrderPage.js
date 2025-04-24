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
    DialogActions,
    Autocomplete,
    List,
    ListItem,
    ListItemText,
    Divider,
    Box,
    Snackbar,
    Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orderApi';
import { fetchInventory, fetchMaterials, fetchAllInventory } from '../api/inventoryApi';
import { getCustomers } from '../api/customerApi';

// 新增API：获取指定材料的规格
const fetchSpecifications = async (material) => {
    try {
        // 使用新的不分页API，确保获取所有规格
        const response = await fetchAllInventory(material);
        if (response.success) {
            // 从返回的库存数据中提取规格列表
            const specs = [...new Set(response.inventory.map(item => item.specification))];
            console.log(`API获取的材料 ${material} 规格:`, specs);
            return specs;
        }
        return [];
    } catch (error) {
        console.error('获取规格失败:', error);
        return [];
    }
};

// 新增API：获取指定材料和规格的库存数据
const fetchSpecificInventory = async (material, specification) => {
    try {
        // 使用不分页API获取所有该材料的库存数据
        const response = await fetchAllInventory(material);
        console.log(`查询材料 ${material} 的库存返回:`, response);
        
        if (response.success && response.inventory && response.inventory.length > 0) {
            // 在前端进行精确匹配
            const exactMatch = response.inventory.find(item => 
                item.specification.trim().toLowerCase() === specification.trim().toLowerCase()
            );
            
            console.log(`精确匹配 ${material}-${specification} 结果:`, exactMatch);
            
            if (exactMatch) {
                return exactMatch;
            }
            
            // 如果没有精确匹配，尝试更宽松的匹配
            const looseMatch = response.inventory.find(item => 
                item.specification.trim().toLowerCase().includes(specification.trim().toLowerCase()) || 
                specification.trim().toLowerCase().includes(item.specification.trim().toLowerCase())
            );
            
            console.log(`宽松匹配 ${material}-${specification} 结果:`, looseMatch);
            
            return looseMatch || null;
        }
        console.warn(`未找到 ${material} 的任何库存`);
        return null;
    } catch (error) {
        console.error(`获取 ${material}-${specification} 库存失败:`, error);
        return null;
    }
};

const CreateOrderPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [materialSpecs, setMaterialSpecs] = useState({}); // 存储各材料对应的规格
    const [confirmDialog, setConfirmDialog] = useState(false);
    const [inventoryDialog, setInventoryDialog] = useState(false);
    const [insufficientItems, setInsufficientItems] = useState([]);
    
    // 添加 Snackbar 状态
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success',
        orderNumber: ''
    });
    
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
        remark: '',
        searchSpec: ''  // 添加规格搜索字段
    }]);

    // 获取客户列表和库存信息
    useEffect(() => {
        const loadData = async () => {
            try {
                // 并行加载所有数据以提高效率
                const [customerResponse, inventoryResponse, materialsResponse] = await Promise.all([
                    getCustomers(),
                    // 使用不分页API获取所有库存
                    fetchAllInventory(),
                    fetchMaterials()
                ]);
                
                if (customerResponse.success) {
                    setCustomers(customerResponse.customers || customerResponse.data || []);
                }
                
                if (inventoryResponse.success) {
                    const inventoryData = inventoryResponse.inventory || inventoryResponse.data || [];
                    console.log("初始化加载的所有库存数据:", inventoryData);
                    setInventory(inventoryData);
                }
                
                if (materialsResponse.success) {
                    setMaterials(materialsResponse.materials || []);
                    console.log("获取的材料列表:", materialsResponse.materials);
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
            remark: '',
            searchSpec: ''  // 添加规格搜索字段
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
        
        // 如果更新了物料，获取对应规格并自动填充
        if (field === 'material') {
            // 清空当前规格
            newItems[index].specification = '';
            
            // 如果已经缓存了该材料的规格，直接使用
            if (materialSpecs[value] && materialSpecs[value].length > 0) {
                console.log(`使用缓存的 ${value} 规格:`, materialSpecs[value]);
                if (materialSpecs[value].length === 1) {
                    // 如果只有一个规格，自动填充
                    newItems[index].specification = materialSpecs[value][0];
                }
            } else {
                // 否则获取该材料的规格
                fetchSpecifications(value).then(specs => {
                    // 更新规格缓存
                    setMaterialSpecs(prev => ({...prev, [value]: specs}));
                    
                    // 如果只有一个规格，自动填充
                    if (specs.length === 1) {
                        const updatedItems = [...orderItems];
                        updatedItems[index].specification = specs[0];
                        setOrderItems(updatedItems);
                    }
                });
            }
        }
        
        // 如果同时有材料和规格，获取最新的库存信息
        if (field === 'specification' && newItems[index].material && value) {
            fetchSpecificInventory(newItems[index].material, value).then(inventoryItem => {
                if (inventoryItem) {
                    console.log(`获取到 ${newItems[index].material}-${value} 的库存信息:`, inventoryItem);
                    
                    // 更新库存数据中的该项
                    setInventory(prevInventory => {
                        const updatedInventory = [...prevInventory];
                        const existingIndex = updatedInventory.findIndex(
                            item => item.material === newItems[index].material && item.specification === value
                        );
                        
                        if (existingIndex >= 0) {
                            updatedInventory[existingIndex] = inventoryItem;
                        } else {
                            updatedInventory.push(inventoryItem);
                        }
                        
                        return updatedInventory;
                    });
                }
            });
        }
        
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
        console.log("使用API获取的材料列表:", materials);
        return materials;
    };

    // 获取指定物料的规格选项
    const getSpecificationOptions = (material) => {
        if (!material) return [];
        console.log("获取材料规格选项，材料:", material);
        
        // 优先使用缓存的规格数据
        if (materialSpecs[material]) {
            console.log(`使用缓存的 ${material} 规格:`, materialSpecs[material]);
            return materialSpecs[material];
        }
        
        // 兜底方案：从库存数据中提取
        const specs = inventory
            .filter(item => item.material === material)
            .map(item => item.specification);
        
        console.log(`从库存数据中获取材料 ${material} 的规格:`, specs);
        return specs;
    };

    // 模糊搜索规格
    const filterSpecifications = (material, inputValue) => {
        if (!material || !inputValue) return [];
        const options = getSpecificationOptions(material);
        return options.filter(option => 
            option.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 5); // 只返回前5个匹配结果
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
            const insufficient = [];
            
            console.log("订单项:", orderItems);
            console.log("当前加载的库存数据:", inventory);
            
            // 刷新库存数据，确保使用最新数据
            try {
                // 使用不分页API获取所有库存数据
                const freshInventoryResponse = await fetchAllInventory();
                if (freshInventoryResponse.success) {
                    console.log("刷新获取的库存数据:", freshInventoryResponse.inventory);
                    // 更新库存数据
                    setInventory(freshInventoryResponse.inventory || freshInventoryResponse.data || []);
                    
                    // 使用最新库存数据进行检查
                    const freshInventory = freshInventoryResponse.inventory || freshInventoryResponse.data || [];
                    
                    for (const item of orderItems) {
                        console.log(`检查库存: 材料=${item.material}, 规格=${item.specification}, 需求数量=${item.quantity}`);
                        
                        // 标准化查询条件，移除前后空格
                        const material = item.material.trim();
                        const specification = item.specification.trim();
                        
                        // 尝试三种方式找到匹配的库存项
                        // 1. 完全匹配（忽略大小写）
                        let inventoryItem = freshInventory.find(inv => 
                            inv.material.trim().toLowerCase() === material.toLowerCase() && 
                            inv.specification.trim().toLowerCase() === specification.toLowerCase()
                        );
                        
                        // 2. 如果没找到，尝试规格包含关系
                        if (!inventoryItem) {
                            inventoryItem = freshInventory.find(inv => 
                                inv.material.trim().toLowerCase() === material.toLowerCase() && 
                                (inv.specification.trim().toLowerCase().includes(specification.toLowerCase()) ||
                                 specification.toLowerCase().includes(inv.specification.trim().toLowerCase()))
                            );
                        }
                        
                        // 3. 最后尝试原始方式
                        if (!inventoryItem) {
                            inventoryItem = freshInventory.find(inv => 
                                inv.material === item.material && 
                                inv.specification === item.specification
                            );
                        }
                        
                        console.log("匹配到的库存项:", inventoryItem);
                        
                        if (!inventoryItem) {
                            insufficient.push({
                                material: item.material,
                                specification: item.specification,
                                required: parseFloat(item.quantity),
                                available: 0,
                                missing: parseFloat(item.quantity)
                            });
                            console.log(`未找到库存: ${item.material}-${item.specification}`);
                            continue;
                        }
                        
                        const availableQty = parseFloat(inventoryItem.quantity);
                        const requiredQty = parseFloat(item.quantity);
                        
                        console.log(`库存检查: 可用=${availableQty}, 需求=${requiredQty}`);
                        
                        if (availableQty < requiredQty) {
                            insufficient.push({
                                material: item.material,
                                specification: item.specification,
                                required: requiredQty,
                                available: availableQty,
                                missing: requiredQty - availableQty
                            });
                            console.log(`库存不足: 缺少${requiredQty - availableQty}个`);
                        }
                    }
                } else {
                    // 如果刷新失败，使用现有库存数据
                    console.warn("刷新库存失败，使用现有库存数据");
                    
                    for (const item of orderItems) {
                        console.log(`检查库存: 材料=${item.material}, 规格=${item.specification}, 需求数量=${item.quantity}`);
                        
                        // 标准化查询条件，移除前后空格
                        const material = item.material.trim();
                        const specification = item.specification.trim();
                        
                        // 尝试三种方式找到匹配的库存项
                        // 1. 完全匹配（忽略大小写）
                        let inventoryItem = inventory.find(inv => 
                            inv.material.trim().toLowerCase() === material.toLowerCase() && 
                            inv.specification.trim().toLowerCase() === specification.toLowerCase()
                        );
                        
                        // 2. 如果没找到，尝试规格包含关系
                        if (!inventoryItem) {
                            inventoryItem = inventory.find(inv => 
                                inv.material.trim().toLowerCase() === material.toLowerCase() && 
                                (inv.specification.trim().toLowerCase().includes(specification.toLowerCase()) ||
                                 specification.toLowerCase().includes(inv.specification.trim().toLowerCase()))
                            );
                        }
                        
                        // 3. 最后尝试原始方式
                        if (!inventoryItem) {
                            inventoryItem = inventory.find(inv => 
                                inv.material === item.material && 
                                inv.specification === item.specification
                            );
                        }
                        
                        console.log("匹配到的库存项:", inventoryItem);
                        
                        if (!inventoryItem) {
                            insufficient.push({
                                material: item.material,
                                specification: item.specification,
                                required: parseFloat(item.quantity),
                                available: 0,
                                missing: parseFloat(item.quantity)
                            });
                            console.log(`未找到库存: ${item.material}-${item.specification}`);
                            continue;
                        }
                        
                        const availableQty = parseFloat(inventoryItem.quantity);
                        const requiredQty = parseFloat(item.quantity);
                        
                        console.log(`库存检查: 可用=${availableQty}, 需求=${requiredQty}`);
                        
                        if (availableQty < requiredQty) {
                            insufficient.push({
                                material: item.material,
                                specification: item.specification,
                                required: requiredQty,
                                available: availableQty,
                                missing: requiredQty - availableQty
                            });
                            console.log(`库存不足: 缺少${requiredQty - availableQty}个`);
                        }
                    }
                }
            } catch (error) {
                console.error("刷新库存时出错:", error);
                alert("检查库存时发生错误，请重试");
                return;
            }
            
            // 如果有库存不足的项目，显示对话框
            if (insufficient.length > 0) {
                setInsufficientItems(insufficient);
                setInventoryDialog(true);
                return;
            }
        }
        
        // 打开确认对话框
        setConfirmDialog(true);
    };

    // 导航到库存页面增加库存
    const handleAddInventory = () => {
        // 关闭对话框
        setInventoryDialog(false);
        // 导航到库存页面
        navigate('/inventory');
    };

    // 添加关闭 Snackbar 的函数
    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
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
                // 替换 alert 为 Snackbar
                const orderNumber = response.order_number || response.orderId;
                setSnackbar({
                    open: true,
                    message: `Order created successfully!`,
                    severity: 'success',
                    orderNumber: orderNumber
                });
                
                // 短暂延迟后导航到订单列表页面
                setTimeout(() => {
                    navigate('/orders');
                }, 1500);
            } else {
                setSnackbar({
                    open: true,
                    message: 'Failed to create order: ' + (response.msg || 'Unknown error'),
                    severity: 'error',
                    orderNumber: ''
                });
            }
        } catch (error) {
            console.error('Error creating order:', error);
            setSnackbar({
                open: true,
                message: 'Failed to create order: ' + error.message,
                severity: 'error',
                orderNumber: ''
            });
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
                        Create New Order
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                        Create and manage orders for quotes and sales
                    </Typography>
                </Paper>

                <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
                    {/* 订单基本信息 */}
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
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
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
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
                                        <TableCell width="15%">Material *</TableCell>
                                        <TableCell width="15%">Specification *</TableCell>
                                        <TableCell width="10%">Quantity *</TableCell>
                                        <TableCell width="8%">Unit</TableCell>
                                        <TableCell width="10%">Weight</TableCell>
                                        <TableCell width="12%">Unit Price *</TableCell>
                                        <TableCell width="12%">Subtotal</TableCell>
                                        <TableCell width="12%">Remark</TableCell>
                                        <TableCell width="6%">Action</TableCell>
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
                                                <Autocomplete
                                                    disabled={!item.material}
                                                    value={item.specification}
                                                    onChange={(event, newValue) => handleItemChange(index, 'specification', newValue || '')}
                                                    inputValue={item.searchSpec || ''}
                                                    onInputChange={(event, newInputValue) => {
                                                        const newItems = [...orderItems];
                                                        newItems[index].searchSpec = newInputValue;
                                                        setOrderItems(newItems);
                                                    }}
                                                    options={filterSpecifications(item.material, item.searchSpec || '')}
                                                    freeSolo
                                                    size="small"
                                                    renderInput={(params) => (
                                                        <TextField 
                                                            {...params} 
                                                            placeholder="Search specification" 
                                                            variant="outlined"
                                                            fullWidth
                                                        />
                                                    )}
                                                    ListboxProps={{
                                                        style: { maxHeight: '150px', overflow: 'auto' }
                                                    }}
                                                />
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
                                                    sx={{ minWidth: '120px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    disabled
                                                    size="small"
                                                    fullWidth
                                                    value={item.subtotal || ''}
                                                    sx={{ minWidth: '120px' }}
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
                                            <TextField
                                                disabled
                                                size="small"
                                                fullWidth
                                                value={calculateTotal()}
                                                sx={{ minWidth: '120px' }}
                                                inputProps={{ style: { textAlign: 'right', fontWeight: 'bold' } }}
                                            />
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
            
                    {/* 操作按钮 */}
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                        </Box>
                    </Paper>
                </Box>
            </Box>
            
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
            
            {/* 库存不足对话框 */}
            <Dialog
                open={inventoryDialog}
                onClose={() => setInventoryDialog(false)}
                maxWidth="md"
            >
                <DialogTitle>Insufficient Inventory</DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        The following items have insufficient inventory:
                    </Typography>
                    <List>
                        {insufficientItems.map((item, index) => (
                            <React.Fragment key={index}>
                                <ListItem>
                                    <ListItemText
                                        primary={`${item.material} - ${item.specification}`}
                                        secondary={`Required: ${item.required}, Available: ${item.available}, Missing: ${item.missing}`}
                                    />
                                </ListItem>
                                {index < insufficientItems.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </List>
                    <Typography style={{ marginTop: '16px' }}>
                        Would you like to add inventory for these items?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInventoryDialog(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAddInventory} color="primary" variant="contained">
                        Go to Inventory
                    </Button>
                </DialogActions>
            </Dialog>
            
            {/* 添加成功提示 Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    sx={{ 
                        width: '100%',
                        alignItems: 'center',
                        '& .MuiAlert-message': {
                            display: 'flex',
                            alignItems: 'center'
                        }
                    }}
                    iconMapping={{
                        success: <CheckCircleOutlineIcon fontSize="inherit" />
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {snackbar.message}
                        {snackbar.orderNumber && (
                            <Typography component="span" sx={{ ml: 1, fontWeight: 'bold' }}>
                                Order Number: {snackbar.orderNumber}
                            </Typography>
                        )}
                    </Box>
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default CreateOrderPage; 