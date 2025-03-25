import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link } from "react-router-dom";
import logo from "../../picture/logo.webp";

const SiteHeader = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: "#333" }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <img src={logo} alt="Logo" style={{ height: "40px", marginRight: "10px" }} />
          <Typography variant="h6" component="div">
            Stainless Steel Inventory 
          </Typography>
        </Box>
        <Box>
          <Button color="inherit" component={Link} to="/home">Home</Button>
          <Button color="inherit" component={Link} to="/inventory">Inventory</Button>
          <Button color="inherit" component={Link} to="/orders">Orders</Button>
          <Button color="inherit" component={Link} to="/create-order">Create Order</Button>
          <Button color="inherit" component={Link} to="/pending">Pending</Button>
          <Button color="inherit" component={Link} to="/customer">Customer</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default SiteHeader;
