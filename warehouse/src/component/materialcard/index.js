import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
    Avatar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { updateInventoryItem } from '../../api/inventoryApi';

const MaterialCard = ({ 
    item, 
    getStockStatus, 
    getInitials, 
    getRandomColor, 
    onDelete, 
    onUpdate 
}) => {
    const [openDialog, setOpenDialog] = useState(false);
    const [quantity, setQuantity] = useState(item.quantity);
    const [density, setDensity] = useState(item.density || '');

    const handleOpenDialog = () => {
        setQuantity(item.quantity);
        setDensity(item.density || '');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleUpdateItem = async () => {
        try {
            const result = await updateInventoryItem(
                item.id,
                quantity,
                density
            );
            
            if (result.success) {
                handleCloseDialog();
                if (onUpdate) onUpdate(); // 通知父组件更新数据
            }
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    return (
        <>
            <Card 
                sx={{ 
                    borderRadius: 2,
                    mb: 2,
                    position: 'relative',
                    '&:hover .edit-button': {
                        opacity: 1,
                    }
                }}
            >
                <CardContent sx={{ pb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
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
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Spec: {item.specification || 'Not set'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Quantity: {item.quantity}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Density: {item.density || 'Not set'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Created: {new Date(item.created_at).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <IconButton
                                className="edit-button"
                                size="small"
                                onClick={handleOpenDialog}
                                sx={{ 
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    color: 'primary.main',
                                    mr: 1
                                }}
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                edge="end"
                                aria-label="delete"
                                onClick={() => onDelete(item.id)}
                                sx={{
                                    color: 'text.secondary',
                                    '&:hover': {
                                        color: 'error.main',
                                    }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* 编辑数量弹窗 */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog}
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle>Edit Inventory Item</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            {item.material} - {item.specification}
                        </Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Quantity"
                            type="number"
                            fullWidth
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="dense"
                            label="Density (Optional)"
                            type="number"
                            fullWidth
                            value={density}
                            onChange={(e) => setDensity(e.target.value)}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={handleCloseDialog} 
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
        </>
    );
};

export default MaterialCard;
