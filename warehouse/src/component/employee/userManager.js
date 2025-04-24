import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import KeyIcon from '@mui/icons-material/Key';
import EditIcon from '@mui/icons-material/Edit';
import { fetchEmployeeUsers, updateUserPassword, updateUserRole } from '../../api/user-api';
import Pagination from '../Pagination';
import { AuthContext } from '../../contexts/authContext';

const UserManager = () => {
  const { role } = useContext(AuthContext);
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination state
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });

  // Check if current user is boss (can edit roles)
  const isBoss = role === 'boss';

  // Debug logs for role permissions
  useEffect(() => {
    console.log('Current user role:', role);
    console.log('Can edit roles (isBoss):', isBoss);
  }, [role, isBoss]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchEmployeeUsers(userPage, userPageSize);
      console.log('Fetched users:', result);
      if (result.success) {
        setEmployeeUsers(result.users || []);
        setUserPagination(result.pagination || {
          total: 0,
          page: userPage,
          pageSize: userPageSize,
          totalPages: 0
        });
      } else {
        showSnackbar(result.msg || 'Failed to get user list', 'error');
        console.warn('User API error:', result.msg);
      }
    } catch (error) {
      showSnackbar('Failed to get user list', 'error');
      console.error('User API access failed:', error);
    } finally {
      setLoading(false);
    }
  }, [userPage, userPageSize]);

  // Load data on component mount or when pagination changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, userPage, userPageSize]);

  // Handle password dialog
  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setOpenPasswordDialog(true);
  };

  // Handle role dialog
  const handleOpenRoleDialog = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role || 'employee');
    setOpenRoleDialog(true);
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    // Validate password
    if (!newPassword) {
      showSnackbar('Please enter a new password', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showSnackbar('Passwords do not match', 'error');
      return;
    }
    
    if (newPassword.length < 6) {
      showSnackbar('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      const result = await updateUserPassword(selectedUser.id, newPassword);
      if (result.success) {
        setOpenPasswordDialog(false);
        showSnackbar('Password updated successfully', 'success');
      } else {
        showSnackbar(result.msg || 'Failed to update password', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to update password', 'error');
    }
  };

  // Handle role update
  const handleUpdateRole = async () => {
    if (!selectedRole) {
      showSnackbar('Please select a role', 'error');
      return;
    }

    try {
      const result = await updateUserRole(selectedUser.id, selectedRole);
      if (result.success) {
        setOpenRoleDialog(false);
        showSnackbar('Role updated successfully', 'success');
        fetchUsers(); // Refresh the list
      } else {
        showSnackbar(result.msg || 'Failed to update role', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to update role', 'error');
    }
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // Get random color for avatar
  const getRandomColor = (str) => {
    const colors = [
      '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', 
      '#c2185b', '#0288d1', '#00796b', '#f57c00'
    ];
    const index = str ? str.length % colors.length : 0;
    return colors[index];
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Pagination handlers
  const handleUserPageChange = (newPage) => {
    setUserPage(newPage);
  };

  const handleUserPageSizeChange = (newPageSize) => {
    setUserPageSize(newPageSize);
    setUserPage(1);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      overflowX: 'hidden',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
            Role: {role} | Can Edit Roles: {isBoss ? 'Yes' : 'No'}
          </Typography>
        </Box>
      )}
    
      <List sx={{ 
        bgcolor: 'background.paper',
        height: 'auto',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : employeeUsers.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>No users found</Typography>
          </Box>
        ) : (
          employeeUsers.map((user) => (
            <React.Fragment key={user.id}>
              <ListItem
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  p: 2,
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  pr: isBoss ? 11 : 6
                }}
                disableGutters
                secondaryAction={
                  <Box>
                    {isBoss && (
                      <IconButton
                        edge="end"
                        aria-label="change role"
                        onClick={() => handleOpenRoleDialog(user)}
                        sx={{
                          color: 'secondary.main',
                          '&:hover': {
                            color: 'secondary.dark',
                          },
                          mr: 1
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      aria-label="change password"
                      onClick={() => handleOpenPasswordDialog(user)}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          color: 'primary.dark',
                        }
                      }}
                    >
                      <KeyIcon />
                    </IconButton>
                  </Box>
                }
              >
                <Avatar 
                  sx={{ 
                    mr: 2, 
                    bgcolor: getRandomColor(user.username),
                    width: 40,
                    height: 40,
                    flexShrink: 0
                  }}
                >
                  {getInitials(user.username)}
                </Avatar>
                <ListItemText
                  sx={{
                    minWidth: 0,
                    maxWidth: 'calc(100% - 60px)',
                    '& .MuiTypography-root': {
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }
                  }}
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {user.username}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        component="span"
                        sx={{ mr: 2 }}
                      >
                        Role: {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee'} (ID: {user.id})
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              <Divider component="li" sx={{ opacity: 0.5 }} />
            </React.Fragment>
          ))
        )}
      </List>
      
      {/* Pagination component for users */}
      <Box sx={{ 
        width: '100%', 
        boxSizing: 'border-box',
        mt: 2,
        mb: 2,
        position: 'relative',
        zIndex: 1,
        minHeight: 56
      }}>
        <Pagination 
          pagination={userPagination}
          onPageChange={handleUserPageChange}
          onPageSizeChange={handleUserPageSizeChange}
        />
      </Box>

      {/* Password Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => setOpenPasswordDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                User: {selectedUser.username}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="New Password"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Confirm Password"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenPasswordDialog(false)} 
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdatePassword} 
            variant="contained"
            color="primary"
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Dialog */}
      <Dialog 
        open={openRoleDialog} 
        onClose={() => setOpenRoleDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>Change User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                User: {selectedUser.username}
              </Typography>
              <FormControl fullWidth margin="dense">
                <InputLabel id="role-select-label">Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  value={selectedRole}
                  label="Role"
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="boss">Boss</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenRoleDialog(false)} 
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateRole} 
            variant="contained"
            color="primary"
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManager;
