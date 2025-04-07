import React, { useContext, useState } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import LogoutIcon from '@mui/icons-material/Logout';
import logo from "../../picture/logo.png";
import { AuthContext } from "../../contexts/authContext";

const SiteHeader = () => {
  const navigate = useNavigate();
  const { handleLogout, role } = useContext(AuthContext);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenLogoutDialog(false);
  };

  const onLogout = () => {
    handleLogout();
    navigate('/login');
    setOpenLogoutDialog(false);
  };

  // 检查是否有管理员权限
  const hasAdminPermission = role === 'admin' || role === 'boss';

  return (
    <AppBar position="static" sx={{ backgroundColor: "#333" }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: "40px", marginRight: "10px" }} />
          <Typography variant="h6" component="div">
            Stainless Steel Inventory 
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button color="inherit" component={Link} to="/home">Home</Button>
          <Button color="inherit" component={Link} to="/inventory">Inventory</Button>
          <Button color="inherit" component={Link} to="/orders">Orders</Button>
          <Button color="inherit" component={Link} to="/create-order">Create Order</Button>
          <Button color="inherit" component={Link} to="/customer">Customer</Button>
          
          {/* 只有管理员和老板可以看到这些按钮 */}
          {hasAdminPermission && (
            <>
              <Button color="inherit" component={Link} to="/pending">Pending</Button>
              <Button color="inherit" component={Link} to="/employee">Employee</Button>
            </>
          )}
          
          <Tooltip title="Logout">
            <IconButton 
              color="inherit" 
              onClick={handleLogoutClick}
              sx={{ ml: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>

      {/* Logout confirmation dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Confirm Logout</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <DialogContentText>
            Are you sure you want to log out of your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={onLogout} 
            variant="contained" 
            color="primary" 
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default SiteHeader;
