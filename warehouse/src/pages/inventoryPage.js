import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Snackbar,
    Alert,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    Avatar,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip,
    InputAdornment,
    CircularProgress,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Tooltip
} from '@mui/material';
import {
    fetchInventory,
    addInventoryItem,
    importInventoryFromExcel,
    fetchMaterials,
    exportInventoryToExcel,
    deleteInventoryItem,
    updateInventoryItem
} from '../api/inventoryApi';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InventoryIcon from '@mui/icons-material/Inventory';
import LockIcon from '@mui/icons-material/Lock';
import Pagination from '../component/Pagination';
import MaterialCard from '../component/materialcard';
import EditIcon from '@mui/icons-material/Edit';
import { AuthContext } from '../contexts/authContext';

const InventoryPage = () => {
    const { role, hasPermission } = useContext(AuthContext);
    const isEmployee = role === 'employee';
    // 检查是否有权限添加、导入和导出库存
    const canManageInventory = !isEmployee;

    const [inventory, setInventory] = useState([]);
    const [materials, setMaterials] = useState([]); // 用于存储所有材质
    const [newItem, setNewItem] = useState({
        material: '',
        specification: '',
        quantity: '',
        density: '',
        created_at: new Date().toISOString().split('T')[0]
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(''); // 查询的材质
    const [searchKeyword, setSearchKeyword] = useState(''); // 查询关键字
    const [lowStockOnly, setLowStockOnly] = useState(false); // 仅显示库存低的物料
    const [exportLoading, setExportLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [viewMode, setViewMode] = useState('list'); // 'list' 或 'card'

    // 分页状态
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0
    });

    const [selectedItem, setSelectedItem] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editQuantity, setEditQuantity] = useState('');
    const [editDensity, setEditDensity] = useState('');

    useEffect(() => {
        loadInventory();
        loadMaterials(); // 加载材质列表
    }, []);

    const handleSearch = useCallback(async () => {
        try {
            console.log('Fetching inventory with params:', { selectedMaterial, searchKeyword, lowStockOnly, page, pageSize });
            const data = await fetchInventory(selectedMaterial, searchKeyword, lowStockOnly, page, pageSize);
            console.log('API response data:', data);
            if (data.success) {
                setInventory(data.inventory);
                setPagination(data.pagination || { total: 0, totalPages: 0 });
                console.log('Updated pagination state:', data.pagination);
            } else {
                showSnackbar(data.msg || 'Failed to get inventory data', 'error');
            }
        } catch (error) {
            showSnackbar('Failed to get inventory data', 'error');
        }
    }, [selectedMaterial, searchKeyword, lowStockOnly, page, pageSize]); // 添加分页参数到依赖项

    useEffect(() => {
        handleSearch();
    }, [page, pageSize, selectedMaterial, searchKeyword, lowStockOnly]);


    const loadInventory = async () => {
        try {
            const data = await fetchInventory('', '', false, page, pageSize);
            if (data.success) {
                setInventory(data.inventory);
                setPagination(data.pagination || { total: 0, totalPages: 0 });
            }
            else showSnackbar(data.msg || 'Failed to get inventory data', 'error');
        } catch (error) {
            showSnackbar('Failed to get inventory data', 'error');
        }
    };

    const loadMaterials = async () => {
        try {
            const data = await fetchMaterials();
            if (data.success) setMaterials(data.materials);
            else showSnackbar(data.msg || 'Failed to get material list', 'error');
        } catch (error) {
            showSnackbar('Failed to get material list', 'error');
        }
    };

    const handleAddItem = async () => {
        if (!newItem.material || !newItem.specification || !newItem.quantity) {
            showSnackbar('Please fill in all required fields', 'error');
            return;
        }

        try {
            const result = await addInventoryItem(
                newItem.material,
                newItem.specification,
                newItem.quantity,
                newItem.density,
                newItem.created_at
            );

            if (result.success) {
                setNewItem({
                    material: '',
                    specification: '',
                    quantity: '',
                    density: '',
                    created_at: new Date().toISOString().split('T')[0]
                });
                setOpenDialog(false);
                setPage(1); // 重置到第一页
                loadInventory();
                showSnackbar('Item added to inventory successfully', 'success');
            } else {
                showSnackbar(result.msg || 'Addition failed', 'error');
            }
        } catch (error) {
            showSnackbar('Addition failed', 'error');
        }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            const result = await deleteInventoryItem(itemId);
            if (result.success) {
                // 如果当前页只有一条数据且不是第一页，则返回上一页
                if (inventory.length === 1 && page > 1) {
                    setPage(page - 1);
                } else {
                    // 否则刷新当前页
                    handleSearch();
                }
                showSnackbar('Delete successful', 'success');
            } else {
                showSnackbar(result.msg || 'Delete failed', 'error');
            }
        } catch (error) {
            showSnackbar('Delete failed', 'error');
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImportLoading(true);
        try {
            const result = await importInventoryFromExcel(file);
            if (result.success) {
                loadInventory();
                showSnackbar('Import successful', 'success');
            } else {
                if (result.isSecurityWarning) {
                    showSnackbar(
                        `Security Warning: ${result.msg}`,
                        'warning',
                        10000  // Show for 10 seconds for security warnings
                    );
                } else {
                    showSnackbar(result.msg || 'Import failed', 'error');
                }
            }
        } catch (error) {
            showSnackbar('Import failed', 'error');
        } finally {
            setImportLoading(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const result = await exportInventoryToExcel(selectedMaterial, searchKeyword, lowStockOnly);
            if (result.success) {
                showSnackbar('Export successful', 'success');
            } else {
                showSnackbar(result.msg || 'Export failed', 'error');
            }
        } catch (error) {
            showSnackbar('Export failed', 'error');
        } finally {
            setExportLoading(false);
        }
    };

    // 显示提示消息
    const showSnackbar = (message, severity = 'success', duration = 6000) => {
        setSnackbar({
            open: true,
            message,
            severity,
            autoHideDuration: duration
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // 获取材质首字母
    const getInitials = (material) => {
        return material ? material.charAt(0).toUpperCase() : '?';
    };

    // 获取随机颜色
    const getRandomColor = (str) => {
        const colors = [
            '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2',
            '#c2185b', '#0288d1', '#00796b', '#f57c00'
        ];
        const index = str ? str.length % colors.length : 0;
        return colors[index];
    };

    // 获取库存状态
    const getStockStatus = (quantity) => {
        if (quantity < 20) return { label: 'Low Stock', color: 'error' };
        return { label: 'In Stock', color: 'success' };
    };

    // 处理页码变化
    const handlePageChange = (newPage) => {
        console.log('Page changed to:', newPage, 'Current page:', page);
        setPage(newPage);
    };

    // 处理每页数量变化
    const handlePageSizeChange = (newSize) => {
        console.log('Page size changed to:', newSize, 'Current size:', pageSize);
        setPageSize(newSize);
        setPage(1);
    };


    const handleEditClick = (item, e) => {
        if (e) e.stopPropagation();
        setSelectedItem(item);
        setEditQuantity(item.quantity);
        setEditDensity(item.density || '');
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedItem(null);
    };

    const handleUpdateItem = async () => {
        try {
            const result = await updateInventoryItem(
                selectedItem.id,
                editQuantity,
                editDensity
            );

            if (result.success) {
                handleCloseEditDialog();
                handleSearch(); // 更新数据
                showSnackbar('Item updated successfully', 'success');
            }
        } catch (error) {
            showSnackbar('Update failed', 'error');
        }
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
                        Inventory Management
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                        Manage company inventory, track stock levels and material specifications
                    </Typography>
                </Paper>

                <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5' }}>
                    <Paper sx={{ height: '100%', borderRadius: 2 }}>
                        <Box sx={{ p: 3 }}>
                            {/* Search and Filter Area */}
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={3}>
                                    <Select
                                        value={selectedMaterial}
                                        onChange={(e) => setSelectedMaterial(e.target.value)}
                                        displayEmpty
                                        fullWidth
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value="">All Materials</MenuItem>
                                        {materials.map((material) => (
                                            <MenuItem key={material} value={material}>
                                                {material}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        label="Search Specification"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        fullWidth
                                        sx={{ borderRadius: 2 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleSearch}
                                        fullWidth
                                        sx={{
                                            height: '56px',
                                            borderRadius: 2,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Search
                                    </Button>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={lowStockOnly}
                                                onChange={(e) => setLowStockOnly(e.target.checked)}
                                            />
                                        }
                                        label="Low Stock Only"
                                    />
                                </Grid>
                            </Grid>

                            {/* Action Buttons Area */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                <Box>
                                    <Tooltip title={isEmployee ? "Insufficient permissions" : "Add Item"}>
                                        <span>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => setOpenDialog(true)}
                                                startIcon={canManageInventory ? <AddIcon /> : <LockIcon />}
                                                sx={{
                                                    mr: 2,
                                                    boxShadow: 2,
                                                    textTransform: 'none',
                                                    borderRadius: 2
                                                }}
                                                disabled={!canManageInventory}
                                            >
                                                Add Item
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={isEmployee ? "Insufficient permissions" : "Import Excel"}>
                                        <span>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                component="label"
                                                startIcon={canManageInventory ? <FileUploadIcon /> : <LockIcon />}
                                                disabled={importLoading || !canManageInventory}
                                                sx={{
                                                    mr: 2,
                                                    textTransform: 'none',
                                                    borderRadius: 2
                                                }}
                                            >
                                                {importLoading ? 'Importing...' : 'Import Excel'}
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept=".xlsx"
                                                    onChange={handleFileUpload}
                                                    disabled={!canManageInventory}
                                                />
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title={isEmployee ? "Insufficient permissions" : "Export Excel"}>
                                        <span>
                                            <Button
                                                variant="outlined"
                                                color="primary"
                                                onClick={handleExport}
                                                disabled={exportLoading || !canManageInventory}
                                                startIcon={exportLoading ? <CircularProgress size={20} /> : (canManageInventory ? <FileDownloadIcon /> : <LockIcon />)}
                                                sx={{
                                                    textTransform: 'none',
                                                    borderRadius: 2
                                                }}
                                            >
                                                {exportLoading ? 'Exporting...' : 'Export Excel'}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </Box>
                                <Box>
                                    <Button
                                        variant={viewMode === 'list' ? 'contained' : 'outlined'}
                                        color="primary"
                                        onClick={() => setViewMode('list')}
                                        sx={{
                                            mr: 1,
                                            textTransform: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        List View
                                    </Button>
                                    <Button
                                        variant={viewMode === 'card' ? 'contained' : 'outlined'}
                                        color="primary"
                                        onClick={() => setViewMode('card')}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 2
                                        }}
                                    >
                                        Card View
                                    </Button>
                                </Box>
                            </Box>

                            {/* Inventory List - List View */}
                            {viewMode === 'list' && (
                                <>
                                    <List sx={{
                                        bgcolor: 'background.paper',
                                        maxHeight: 'calc(100vh - 350px)', // 减少高度以适应分页控件
                                        overflowY: 'auto',
                                        '&::-webkit-scrollbar': {
                                            width: '8px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: '#f1f1f1',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#888',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            background: '#555',
                                        }
                                    }}>
                                        {inventory.map((item) => (
                                            <React.Fragment key={item.id}>
                                                <ListItem
                                                    onClick={canManageInventory ? () => handleEditClick(item) : undefined}
                                                    sx={{
                                                        cursor: canManageInventory ? 'pointer' : 'default',
                                                        '&:hover': {
                                                            // 移除悬停效果
                                                        },
                                                        borderRadius: 2,
                                                        mb: 1,
                                                        p: 2,
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        justifyContent: 'space-between'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, mr: 2 }}>
                                                        <Avatar
                                                            sx={{
                                                                mr: 2,
                                                                bgcolor: getRandomColor(item.material),
                                                                width: 40,
                                                                height: 40
                                                            }}
                                                        >
                                                            {getInitials(item.material)}
                                                        </Avatar>
                                                        <ListItemText
                                                            primary={
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mr: 2 }}>
                                                                        {item.material}
                                                                    </Typography>
                                                                    <Chip
                                                                        label={getStockStatus(item.quantity).label}
                                                                        color={getStockStatus(item.quantity).color}
                                                                        size="small"
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={
                                                                <Box sx={{ mt: 0.5 }}>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        component="span"
                                                                        sx={{ mr: 2 }}
                                                                    >
                                                                        Spec: {item.specification || 'Not set'}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        component="span"
                                                                        sx={{ mr: 2 }}
                                                                    >
                                                                        Quantity: {item.quantity}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        component="span"
                                                                        sx={{ mr: 2 }}
                                                                    >
                                                                        Density: {item.density || 'Not set'}
                                                                    </Typography>
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        component="span"
                                                                    >
                                                                        Created: {new Date(item.created_at).toLocaleDateString()}
                                                                    </Typography>
                                                                </Box>
                                                            }
                                                        />
                                                    </Box>
                                                    <Box>
                                                        {canManageInventory && (
                                                            <>
                                                                <IconButton
                                                                    edge="end"
                                                                    aria-label="edit"
                                                                    onClick={(e) => handleEditClick(item, e)}
                                                                    sx={{
                                                                        color: 'primary.main',
                                                                        mr: 1
                                                                    }}
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    edge="end"
                                                                    aria-label="delete"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteItem(item.id);
                                                                    }}
                                                                    sx={{
                                                                        '&:hover': {
                                                                            color: 'error.main',
                                                                        }
                                                                    }}
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </>
                                                        )}
                                                        {!canManageInventory && (
                                                            <Tooltip title="No edit permission">
                                                                <LockIcon color="action" sx={{ opacity: 0.5 }} />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </ListItem>
                                            </React.Fragment>
                                        ))}
                                        {inventory.length === 0 && (
                                            <Box
                                                sx={{
                                                    textAlign: 'center',
                                                    py: 4,
                                                    color: 'text.secondary'
                                                }}
                                            >
                                                <Typography variant="body1">
                                                    No inventory items found
                                                </Typography>
                                            </Box>
                                        )}
                                    </List>

                                    {/* 使用分页组件 */}
                                    <Pagination
                                        pagination={{
                                            ...pagination,
                                            page,
                                            pageSize
                                        }}
                                        onPageChange={handlePageChange}
                                        onPageSizeChange={handlePageSizeChange}
                                    />

                                </>
                            )}

                            {/* Inventory List - Card View */}
                            {viewMode === 'card' && (
                                <>
                                    <Grid container spacing={3} sx={{
                                        maxHeight: 'calc(100vh - 350px)', // 减少高度以适应分页控件
                                        overflowY: 'auto',
                                        '&::-webkit-scrollbar': {
                                            width: '8px',
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            background: '#f1f1f1',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            background: '#888',
                                            borderRadius: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb:hover': {
                                            background: '#555',
                                        }
                                    }}>
                                        {inventory.map((item) => (
                                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                                <MaterialCard
                                                    item={item}
                                                    getStockStatus={getStockStatus}
                                                    getInitials={getInitials}
                                                    getRandomColor={getRandomColor}
                                                    onDelete={handleDeleteItem}
                                                    onUpdate={handleSearch}
                                                    canEdit={canManageInventory}
                                                />
                                            </Grid>
                                        ))}
                                        {inventory.length === 0 && (
                                            <Grid item xs={12}>
                                                <Box
                                                    sx={{
                                                        textAlign: 'center',
                                                        py: 4,
                                                        color: 'text.secondary'
                                                    }}
                                                >
                                                    <Typography variant="body1">
                                                        No inventory items found
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>

                                    {/* 使用分页组件 - Card View */}
                                    <Pagination
                                        pagination={{
                                            ...pagination,
                                            page,
                                            pageSize
                                        }}
                                        onPageChange={handlePageChange}
                                        onPageSizeChange={handlePageSizeChange}
                                    />
                                </>
                            )}
                        </Box>
                    </Paper>
                </Box>

                {/* Add Item Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    PaperProps={{
                        sx: { borderRadius: 2 }
                    }}
                >
                    <DialogTitle sx={{ pb: 1 }}>Add New Item</DialogTitle>
                    <DialogContent sx={{ pb: 2 }}>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Material (Required)"
                            fullWidth
                            value={newItem.material}
                            onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Specification (Required)"
                            fullWidth
                            value={newItem.specification}
                            onChange={(e) => setNewItem({ ...newItem, specification: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Quantity (Required)"
                            type="number"
                            fullWidth
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Density (Optional)"
                            type="number"
                            fullWidth
                            value={newItem.density}
                            onChange={(e) => setNewItem({ ...newItem, density: e.target.value })}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Creation Date"
                            type="date"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={newItem.created_at}
                            onChange={(e) => setNewItem({ ...newItem, created_at: e.target.value })}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={() => setOpenDialog(false)}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddItem}
                            variant="contained"
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Add
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={snackbar.autoHideDuration}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                        elevation={6}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>

                {/* Edit Dialog */}
                <Dialog
                    open={editDialogOpen}
                    onClose={handleCloseEditDialog}
                    PaperProps={{
                        sx: { borderRadius: 2 }
                    }}
                >
                    <DialogTitle>Edit Inventory Item</DialogTitle>
                    <DialogContent>
                        {selectedItem && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    {selectedItem.material} - {selectedItem.specification}
                                </Typography>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    label="Quantity"
                                    type="number"
                                    fullWidth
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    margin="dense"
                                    label="Density (Optional)"
                                    type="number"
                                    fullWidth
                                    value={editDensity}
                                    onChange={(e) => setEditDensity(e.target.value)}
                                />
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button
                            onClick={handleCloseEditDialog}
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateItem}
                            variant="contained"
                            sx={{
                                textTransform: 'none',
                                borderRadius: 2
                            }}
                        >
                            Update
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </Container>
    );
};

export default InventoryPage;
