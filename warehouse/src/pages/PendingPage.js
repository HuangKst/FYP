import React, { useEffect, useState } from "react";
import { fetchPendingUsers, approveUser } from "../api/pendingUserApi";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Typography,
  Alert,
} from "@mui/material";

export default function PendingPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPendingUsers();
  }, []);

  async function loadPendingUsers() {
    try {
      const resData = await fetchPendingUsers();
      if (resData.success) {
        setPendingUsers(resData.users || []);
      } else {
        setError("Failed to fetch pending users.");
      }
    } catch (err) {
      console.error("Error loading pending users:", err.response || err.message);
      if (err.response && err.response.status === 500) {
        setError("Internal server error. Please try again later.");
      } else {
        setError("Request error. Unable to fetch users.");
      }
    }
  }

  const handleApprove = async (userId, isApproved) => {
    try {
      await approveUser(userId, isApproved);
      loadPendingUsers();
    } catch (err) {
      console.error("Error approving user:", err.response || err.message);
      setError("Approval operation failed.");
    }
  };

  return (
    <Box
      sx={{
        padding: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h4" sx={{ marginBottom: 2 }}>
        Pending User Approvals
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 3, width: "100%", maxWidth: "800px" }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "white",
          padding: 3,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>User ID</strong></TableCell>
              <TableCell><strong>Username</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleApprove(user.id, true)}
                    sx={{ marginRight: 2 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleApprove(user.id, false)}
                  >
                    Reject
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
