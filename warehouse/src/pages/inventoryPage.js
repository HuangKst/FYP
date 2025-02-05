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
    DialogActions
} from '@mui/material';
import { fetchInventory, addInventoryItem, importInventoryFromExcel } from '../api/inventoryApi';

const InventoryPage = () => {
    const [inventory, setInventory] = useState([]);
    const [newItem, setNewItem] = useState({ material: '', specification: '', quantity: '', density: '' });
    const [openDialog, setOpenDialog] = useState(false);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        const data = await fetchInventory();
        if (data.success) setInventory(data.inventory);
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

            <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)}>
                Add Item
            </Button>
            <input type="file" accept=".xlsx" onChange={handleFileUpload} style={{ marginLeft: '10px' }} />

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
