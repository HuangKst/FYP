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
  DialogContentText,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import logo from "../../picture/logo.png";
import { AuthContext } from "../../contexts/authContext";

const SiteHeader = () => {
  const navigate = useNavigate();
  const { handleLogout, role } = useContext(AuthContext);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // 检查是否有管理员权限
  const hasAdminPermission = role === 'admin' || role === 'boss';

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/home' },
    { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
    { text: 'Create Order', icon: <AddShoppingCartIcon />, path: '/create-order' },
    { text: 'Customer', icon: <PeopleIcon />, path: '/customer' },
  ];

  if (hasAdminPermission) {
    menuItems.push({ text: 'Employee', icon: <BadgeIcon />, path: '/employee' });
  }

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#333" }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: "40px", marginRight: "10px" }} />
          <Typography variant="h6" component="div" noWrap>
            Stainless Steel Inventory 
          </Typography>
        </Box>
        
        {isMobile ? (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="end"
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button color="inherit" component={Link} to="/home" startIcon={<HomeIcon />}>Home</Button>
            <Button color="inherit" component={Link} to="/inventory" startIcon={<InventoryIcon />}>Inventory</Button>
            <Button color="inherit" component={Link} to="/orders" startIcon={<ShoppingCartIcon />}>Orders</Button>
            <Button color="inherit" component={Link} to="/create-order" startIcon={<AddShoppingCartIcon />}>Create Order</Button>
            <Button color="inherit" component={Link} to="/customer" startIcon={<PeopleIcon />}>Customer</Button>
            
            {/* 只有管理员和老板可以看到这些按钮 */}
            {hasAdminPermission && (
              <>
                <Button color="inherit" component={Link} to="/employee" startIcon={<BadgeIcon />}>Employee</Button>
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
        )}
      </Toolbar>

      {/* 移动端抽屉菜单 */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
            <ListItem button onClick={handleLogoutClick}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

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
