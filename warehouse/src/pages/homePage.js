import React from "react";
import { Link } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import logo from "../picture/logo.webp"; // 引入你的 Logo

export default function Home() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      {/* Logo 在左上角 */}
      <Box
        component="img"
        src={logo}
        alt="logo"
        sx={{
          position: "absolute",
          top: "20px",
          left: "20px",
          width: "80px",
          height: "80px",
        }}
      />

      {/* 主内容 */}
      <Box
        sx={{
          textAlign: "center",
          backgroundColor: "white",
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: "600px",
        }}
      >
        <Typography variant="h4" sx={{ marginBottom: 2 }}>
          Welcome to the Warehouse Management System
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 2 }}>
          This is a demonstration React single-page application!
        </Typography>
        <Button
          component={Link}
          to="/pending"
          variant="contained"
          color="primary"
          sx={{ textDecoration: "none" }}
        >
          Go to Pending Page
        </Button>
        <Button
          component={Link}
          to="/inventory"
          variant="contained"
          color="primary"
          sx={{ textDecoration: "none" }}
        >
          Go to invebtory Page
        </Button>
        
      </Box>
    </Box>
  );
}
