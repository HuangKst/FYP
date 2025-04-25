import React, { useState } from 'react';
import {
    Card, 
    CardContent, 
    CardActions, 
    Typography, 
    IconButton, 
    Box, 
    Avatar, 
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import { updateInventoryItem } from '../api/inventoryApi';

const MaterialCard = ({ 
    item, 
    getStockStatus, 
    getInitials, 
    getRandomColor, 
    onDelete,
    onUpdate,
    canEdit = true // 默认为true，向后兼容
}) => {
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [quantity, setQuantity] = useState(item.quantity);
    const [density, setDensity] = useState(item.density || '');

    const handleOpenEditDialog = () => {
        if (!canEdit) return;
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
    };

    const handleUpdateItem = async () => {
        try {
            const result = await updateInventoryItem(item.id, quantity, density);
            if (result.success) {
                handleCloseEditDialog();
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const status = getStockStatus(item.quantity);

    return (
        <>
            <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                boxShadow: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                }
            }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                        <Box>
                            <Typography variant="h6" component="div" gutterBottom>
                                {item.material}
                            </Typography>
                            <Chip 
                                label={status.label} 
                                color={status.color}
                                size="small"
                            />
                        </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Specification:</strong> {item.specification || 'Not set'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Quantity:</strong> {item.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Density:</strong> {item.density || 'Not set'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Created:</strong> {new Date(item.created_at).toLocaleDateString()}
                    </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                    {canEdit ? (
                        <>
                            <IconButton 
                                color="primary" 
                                onClick={handleOpenEditDialog}
                                aria-label="edit item"
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton 
                                onClick={() => onDelete && onDelete(item.id)}
                                aria-label="delete item"
                                sx={{
                                    '&:hover': {
                                        color: 'error.main',
                                    }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </>
                    ) : (
                        <Tooltip title="无编辑权限">
                            <LockIcon color="action" sx={{ opacity: 0.5 }} />
                        </Tooltip>
                    )}
                </CardActions>
            </Card>

            <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                <DialogTitle>Edit {item.material}</DialogTitle>
                <DialogContent>
                    <Typography variant="subtitle2" gutterBottom>
                        Specification: {item.specification}
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Quantity"
                        type="number"
                        fullWidth
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Density (Optional)"
                        type="number"
                        fullWidth
                        value={density}
                        onChange={(e) => setDensity(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditDialog}>Cancel</Button>
                    <Button onClick={handleUpdateItem} variant="contained">Update</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MaterialCard; 