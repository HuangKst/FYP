import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Typography, Alert, Paper } from "@mui/material";
import logo from "../picture/logo.png"; // Import your logo image

// 添加 Orbitron 字体
const orbitronStyle = {
  fontFamily: "'Orbitron', sans-serif",
  fontSize: { xs: "2.5rem", sm: "3rem" },
  fontWeight: 700,
  color: "#333",
  letterSpacing: "4px",
  textTransform: "uppercase",
  textAlign: "center",
  marginBottom: 3,
};

export default function LoginPage() {
  const { handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const result = await handleLogin(username, password);
    console.log("Login result:", result);
    if (result.success) {
      console.log("Navigating to home");  // 确保 navigate 代码执行
      navigate("/home");
    } else {
      setError(result.msg || "Login failed");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f8f9fa",
        padding: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "450px",
          padding: 4,
          borderRadius: 3,
          backgroundColor: "white",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* System Name */}
        <Typography
          variant="h3"
          sx={orbitronStyle}
        >
          SMART STEEL
        </Typography>

        {/* Logo */}
        <Box
          component="img"
          src={logo}
          alt="logo"
          sx={{
            width: "120px",
            height: "120px",
            marginBottom: 3,
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
          }}
        />

        <Typography 
          variant="h4" 
          sx={{ 
            marginBottom: 3,
            color: "#1a237e",
            fontWeight: "600",
          }}
        >
          Welcome Back
        </Typography>

        {/* Login Form */}
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: 2,
          }}
        >
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#1a237e",
                },
              },
            }}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "#1a237e",
                },
              },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ marginBottom: 1 }}>
              {error}
            </Alert>
          )}

          <Button 
            type="submit" 
            variant="contained" 
            fullWidth
            sx={{
              backgroundColor: "#1a237e",
              "&:hover": {
                backgroundColor: "#0d47a1",
              },
              padding: "12px",
              fontSize: "1.1rem",
              textTransform: "none",
              borderRadius: "8px",
            }}
          >
            Sign In
          </Button>

          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: "center", 
              marginTop: 2,
              color: "#666",
            }}
          >
            Don't have an account?{" "}
            <Link 
              to="/signup" 
              style={{ 
                color: "#1a237e", 
                textDecoration: "none",
                fontWeight: "600",
                "&:hover": {
                  textDecoration: "underline",
                }
              }}
            >
              Sign up
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
