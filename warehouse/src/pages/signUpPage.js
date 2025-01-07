import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api/user-api";
import { Box, TextField, Button, Typography, Alert } from "@mui/material";
import logo from "../picture/logo.webp"; // 引入你的 logo

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 用于显示注册过程中的错误或提示
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // 检查两次输入的密码是否一致
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await signup(username, password);
      if (response.success) {
        setSuccess("Sign-up successful. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(response.msg || "Sign-up failed.");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.msg || "Sign-up failed. Please check your input.");
      } else {
        setError("Sign-up failed. Please check your network or server.");
      }
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

      {/* 标题 */}
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Sign Up
      </Typography>

      {/* 注册表单 */}
      <Box
        component="form"
        onSubmit={handleSubmit}
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
          placeholder="Enter your username"
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
          placeholder="Enter your password"
        />
        <TextField
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          sx={{ marginBottom: 2 }}
          placeholder="Confirm your password"
        />

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ marginBottom: 2 }}>
            {success}
          </Alert>
        )}

        <Button type="submit" variant="contained" color="primary" fullWidth>
          Sign Up
        </Button>
      </Box>
    </Box>
  );
}
