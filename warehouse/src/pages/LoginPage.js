import React, { useState, useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import { useNavigate, Link } from "react-router-dom";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import logo from "../picture/logo.webp"; // Import your logo image

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
    if (result.success) {
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
        backgroundColor: "#f5f5f5",
        padding: 2,
      }}
    >
      {/* System Name */}
      <Typography
        variant="h3"
        sx={{
          fontFamily: "'Roboto Slab', serif", // Example of a special font
          marginBottom: 4,
          textAlign: "center",
          color: "#333",
        }}
      >
        Stainless Steel Pipe Sales System
      </Typography>

      {/* Logo */}
      <Box
        component="img"
        src={logo}
        alt="logo"
        sx={{
          width: "150px",
          height: "150px",
          marginBottom: 3,
        }}
      />

      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Login
      </Typography>

      {/* Login Form */}
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "white",
          padding: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          sx={{ marginBottom: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{ marginBottom: 2 }}
        />

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Login
        </Button>

        {/* Link to Signup Page */}
        <Typography variant="body2" sx={{ textAlign: "center", marginTop: 2 }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#1976d2", textDecoration: "none" }}>
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}
