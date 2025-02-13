import React from "react";

import { Box, Typography } from "@mui/material";


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
        
      </Box>
    </Box>
  );
}
