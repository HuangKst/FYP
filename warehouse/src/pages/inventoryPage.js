import React, { useState, useEffect } from 'react';
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
    MenuItem
} from '@mui/material';
import { fetchInventory, addInventoryItem, importInventoryFromExcel, fetchMaterials } from '../api/inventoryApi';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [materials, setMaterials] = useState([]); // 用于存储所有材质
    const [newItem, setNewItem] = useState({ material: '', specification: '', quantity: '', density: '' });
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(''); // 查询的材质
    const [searchKeyword, setSearchKeyword] = useState(''); // 查询关键字

    useEffect(() => {
        loadInventory();
        loadMaterials(); // 加载材质列表
    }, []);

    const loadInventory = async () => {
        const data = await fetchInventory();
        if (data.success) setInventory(data.inventory);
    };

    const loadMaterials = async () => {
        const data = await fetchMaterials();
        if (data.success) setMaterials(data.materials);
    };

    const handleSearch = async () => {
        const data = await fetchInventory(selectedMaterial, searchKeyword);
        if (data.success) {
            setInventory(data.inventory);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.material || !newItem.specification || !newItem.quantity) return;
        const result = await addInventoryItem(newItem.material, newItem.specification, newItem.quantity, newItem.density);
        if (result.success) {
            setNewItem({ material: '', specification: '', quantity: '', density: '' });
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
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell>{item.material}</TableCell>
                                <TableCell>{item.specification}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.density}</TableCell>
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
