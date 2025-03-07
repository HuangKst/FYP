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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    Checkbox, FormControlLabel
} from '@mui/material';
import { fetchInventory, addInventoryItem, importInventoryFromExcel, fetchMaterials, exportInventoryToExcel } from '../api/inventoryApi';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [materials, setMaterials] = useState([]); // 用于存储所有材质
    const [newItem, setNewItem] = useState({ material: '', specification: '', quantity: '', density: '' });
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(''); // 查询的材质
    const [searchKeyword, setSearchKeyword] = useState(''); // 查询关键字
    const [lowStockOnly, setLowStockOnly] = useState(false); // 仅显示库存低的物料
    const [exportLoading, setExportLoading] = useState(false);


    useEffect(() => {
        loadInventory();
        loadMaterials(); // 加载材质列表
    }, []);

    const handleSearch = useCallback(async () => {
        const data = await fetchInventory(selectedMaterial, searchKeyword, lowStockOnly);
        if (data.success) {
            setInventory(data.inventory);
        }
    }, [selectedMaterial, searchKeyword, lowStockOnly]); // 只有这三个值变化时，handleSearch 才会更新

    useEffect(() => {
        handleSearch();
    }, [handleSearch]); // 这样不会导致无限循环

    const loadInventory = async () => {
        const data = await fetchInventory();
        if (data.success) setInventory(data.inventory);
    };

    const loadMaterials = async () => {
        const data = await fetchMaterials();
        if (data.success) setMaterials(data.materials);
    };


    const handleAddItem = async () => {
        if (!newItem.material || !newItem.specification || !newItem.quantity || !newItem.created_at) return;
        const result = await addInventoryItem(newItem.material, newItem.specification, newItem.quantity, newItem.density,newItem.created_at);
        if (result.success) {
            setNewItem({ material: '', specification: '', quantity: '', density: '' ,created_at:''});
            setOpenDialog(false);
            loadInventory();
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const result = await importInventoryFromExcel(file);
        if (result.success) {
            loadInventory();
        }
    };
    // 修改导出处理逻辑
    const handleExport = async () => {
        setExportLoading(true);
        const result = await exportInventoryToExcel();
        setExportLoading(false);
        if (!result.success) {
            alert(result.msg || 'Export failed');
        }
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Inventory Management</Typography>

            {/* 查询区域 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                {/* 材质下拉框 */}
                <Select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    displayEmpty
                    style={{ marginRight: '10px', minWidth: '150px' }}
                >
                    <MenuItem value="">All Materials</MenuItem>
                    {materials.map((material) => (
                        <MenuItem key={material} value={material}>
                            {material}
                        </MenuItem>
                    ))}
                </Select>


                {/* 查询关键字输入框 */}
                <TextField
                    label="Search Specification"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    style={{ marginRight: '10px' }}
                />

                {/* 查询按钮 */}
                <Button variant="contained" color="primary" onClick={handleSearch}>
                    Search
                </Button>
                {/*低库存展示*/}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={lowStockOnly}
                            onChange={(e) => setLowStockOnly(e.target.checked)}
                        />
                    }
                    label="Low Stock Only"
                />

                <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleExport}
                    disabled={exportLoading}
                >
                    {exportLoading ? 'Exporting...' : 'Export to Excel'}
                </Button>

            </div>

            {/* 添加库存项按钮 */}
            <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
                Add Item
            </Button>
            <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ marginLeft: '10px' }} />

            {/* 库存表格 */}
            <TableContainer component={Paper} style={{ marginTop: '20px' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Material</TableCell>
                            <TableCell>Specification</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Density</TableCell>
                            <TableCell>Create Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow key={item.id} style={{ backgroundColor: item.quantity < 50 ? '#ffcccc' : 'transparent' }}>
                                <TableCell>{item.material}</TableCell>
                                <TableCell>{item.specification}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.density}</TableCell>
                                <TableCell>{new Date(item.created_at).toISOString().split('T')[0]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </TableContainer>

            {/* 添加库存对话框 */}
            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                disableEnforceFocus
                disableEscapeKeyDown
                aria-labelledby="add-item-dialog-title"
                aria-describedby="add-item-dialog-description"
            >
                <DialogTitle id="add-item-dialog-title">Add New Item</DialogTitle>
                <DialogContent id="add-item-dialog-description">
                    <TextField
                        label="Material (Required)"
                        fullWidth
                        margin="normal"
                        value={newItem.material}
                        onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                    />
                    <TextField
                        label="Specification (Required)"
                        fullWidth
                        margin="normal"
                        value={newItem.specification}
                        onChange={(e) => setNewItem({ ...newItem, specification: e.target.value })}
                    />
                    <TextField
                        label="Quantity (Required)"
                        fullWidth
                        margin="normal"
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                    <TextField
                        label="Density (Optional)"
                        fullWidth
                        margin="normal"
                        type="number"
                        value={newItem.density}
                        onChange={(e) => setNewItem({ ...newItem, density: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleAddItem} color="primary" variant="contained">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default InventoryPage;
