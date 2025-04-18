import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs,
  Tab,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
  Avatar,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import KeyIcon from '@mui/icons-material/Key';
import { AuthContext } from '../contexts/authContext';
import { 
  getAllEmployees, 
  addEmployee, 
  deleteEmployee
} from '../api/employeeApi';
import { fetchPendingUsers, approveUser } from '../api/pendingUserApi';
import { fetchEmployeeUsers, updateUserPassword } from '../api/user-api';
import Pagination from '../component/Pagination';

const EmployeePage = () => {
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    join_date: '',
  });
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });

  // 用户管理分页状态
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1
  });

  // Check permission
  const hasPermission = role === 'admin' || role === 'boss';
  
  // Data fetching functions
  const fetchEmployees = useCallback(async () => {
    if (!hasPermission) return;
    
    setLoading(true);
    try {
      const result = await getAllEmployees(searchName, page, pageSize);
      if (result.success) {
        setEmployees(result.employees || []);
        setPagination(result.pagination || {
          total: 0,
          page,
          pageSize,
          totalPages: 0
        });
      } else {
        showSnackbar(result.msg || 'Failed to get employee list', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to get employee list', 'error');
    } finally {
      setLoading(false);
    }
  }, [hasPermission, searchName, page, pageSize]);

  const fetchPending = useCallback(async () => {
    if (!hasPermission) return;
    
    try {
      // Try to get pending users
      setPendingUsers([]); // Set to empty array first to avoid undefined errors
      const result = await fetchPendingUsers();
      if (result.success) {
        setPendingUsers(result.users || []);
      } else {
        // API might not exist or returned an error
        showSnackbar('Failed to get pending users: ' + (result.msg || 'Backend API does not exist'), 'warning');
        console.log('Pending users API does not exist or returned an error');
      }
    } catch (error) {
      console.error('Pending users API access failed:', error);
      showSnackbar('Failed to get pending users, backend API might not exist', 'warning');
    }
  }, [hasPermission]);

  // 获取普通用户（employee角色）
  const fetchUsers = useCallback(async () => {
    if (!hasPermission) return;
    
    setLoading(true);
    try {
      const result = await fetchEmployeeUsers(userPage, userPageSize);
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
  }, [hasPermission, userPage, userPageSize]);
  
  // Load data
  useEffect(() => {
    if (tabValue === 0) {
      fetchEmployees();
    } else if (tabValue === 1) {
      fetchPending();
    } else if (tabValue === 2) {
      fetchUsers();
    }
  }, [fetchEmployees, fetchPending, fetchUsers, tabValue, page, pageSize, userPage, userPageSize]);

  // Handle employee operations
  const handleAddEmployee = async () => {
    try {
      const result = await addEmployee(newEmployee);
      if (result.success) {
        setPage(1); // Reset to first page
        fetchEmployees();
        setOpenDialog(false);
        showSnackbar('Employee added successfully', 'success');
        resetNewEmployee();
      } else {
        showSnackbar(result.msg || 'Addition failed', 'error');
      }
    } catch (error) {
      showSnackbar('Addition failed', 'error');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    try {
      const result = await deleteEmployee(employeeId);
      if (result.success) {
        // If current page has only one employee and not the first page, go to previous page
        if (employees.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          // Otherwise refresh current page
          fetchEmployees();
        }
        showSnackbar('Delete successful', 'success');
      } else {
        showSnackbar(result.msg || 'Delete failed', 'error');
      }
    } catch (error) {
      showSnackbar('Delete failed', 'error');
    }
  };

  // Handle user approval
  const handleApproveUser = async (userId, isApproved) => {
    try {
      const result = await approveUser(userId, isApproved);
      if (result.success) {
        await fetchPending();
        showSnackbar(isApproved ? 'User approved' : 'User rejected', 'success');
      } else {
        showSnackbar(result.msg || 'Operation failed', 'error');
      }
    } catch (error) {
      showSnackbar('Operation failed', 'error');
    }
  };

  // 处理打开修改密码对话框
  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setOpenPasswordDialog(true);
  };

  // 处理密码更新
  const handleUpdatePassword = async () => {
    // 验证密码
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

  // Reset form
  const resetNewEmployee = () => {
    setNewEmployee({
      name: '',
      email: '',
      position: '',
      department: '',
      join_date: '',
    });
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 获取员工姓名首字母
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  // 获取随机颜色
  const getRandomColor = (str) => {
    const colors = [
      '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', 
      '#c2185b', '#0288d1', '#00796b', '#f57c00'
    ];
    const index = str ? str.length % colors.length : 0;
    return colors[index];
  };

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchEmployees();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page
  };

  // 用户管理分页处理
  const handleUserPageChange = (newPage) => {
    setUserPage(newPage);
  };

  const handleUserPageSizeChange = (newPageSize) => {
    setUserPageSize(newPageSize);
    setUserPage(1);
  };

  // If no permission, show access denied message
  if (!hasPermission) {
    return (
      <Container maxWidth={false} sx={{ height: 'calc(100vh - 64px)', p: 0, mt: '64px' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Only admins and bosses can access the employee management page
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ height: 'calc(100vh - 64px)', p: 0, mt: '64px' }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: 0,
            position: 'relative',
            zIndex: 1
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Employee Management
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            Manage company employees and approve new user registrations
          </Typography>
        </Paper>

        <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
          <Paper sx={{ height: '100%', borderRadius: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                px: 2
              }}
            >
              <Tab 
                label="Employee List" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: '1rem',
                  textTransform: 'none'
                }}
              />
              <Tab 
                label="Pending Approvals" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: '1rem',
                  textTransform: 'none'
                }}
              />
              <Tab 
                label="User Management" 
                sx={{ 
                  fontWeight: 'medium',
                  fontSize: '1rem',
                  textTransform: 'none'
                }}
              />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* Employee List */}
              {tabValue === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <TextField
                      placeholder="Search by name..."
                      size="small"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      sx={{ width: '300px' }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleSearch} edge="end" size="small">
                              <SearchIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setOpenDialog(true)}
                      startIcon={<PersonAddIcon />}
                      sx={{ 
                        boxShadow: 2,
                        textTransform: 'none',
                        borderRadius: 2
                      }}
                    >
                      Add Employee
                    </Button>
                  </Box>

                  <List sx={{ 
                    bgcolor: 'background.paper',
                    maxHeight: 'calc(100vh - 320px)', // Adjusted to accommodate pagination
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    }
                  }}>
                    {loading ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography>Loading...</Typography>
                      </Box>
                    ) : employees.length === 0 ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography>No employees found</Typography>
                      </Box>
                    ) : (
                      employees.map((employee) => (
                        <React.Fragment key={employee.id}>
                          <ListItem
                            onClick={() => navigate(`/employee/${employee.id}`)}
                            sx={{
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: 'action.hover',
                                transform: 'translateX(6px)',
                                transition: 'all 0.2s'
                              },
                              borderRadius: 2,
                              mb: 1,
                              p: 2
                            }}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEmployee(employee.id);
                                }}
                                sx={{
                                  '&:hover': {
                                    color: 'error.main',
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            }
                          >
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: getRandomColor(employee.name),
                                width: 40,
                                height: 40
                              }}
                            >
                              {getInitials(employee.name)}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                  {employee.name}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    component="span"
                                    sx={{ mr: 2 }}
                                  >
                                    {employee.position || 'Position not set'}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    component="span"
                                    sx={{ mr: 2 }}
                                  >
                                    {employee.department || 'Department not set'}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    component="span"
                                  >
                                    Join Date: {employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'Not set'}
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
                  
                  {/* Pagination component */}
                  <Pagination 
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </Box>
              )}

              {/* Pending Approvals */}
              {tabValue === 1 && (
                <List sx={{ 
                  maxHeight: 'calc(100vh - 300px)',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  }
                }}>
                  {pendingUsers.map((user) => (
                    <Paper
                      key={user.id}
                      sx={{ 
                        mb: 2, 
                        p: 2,
                        borderRadius: 2,
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              mr: 2, 
                              bgcolor: getRandomColor(user.username),
                              width: 40,
                              height: 40
                            }}
                          >
                            {getInitials(user.username)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {user.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                        <Box>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleApproveUser(user.id, true)}
                            sx={{ 
                              mr: 1,
                              textTransform: 'none',
                              borderRadius: 2
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleApproveUser(user.id, false)}
                            sx={{ 
                              textTransform: 'none',
                              borderRadius: 2
                            }}
                          >
                            Reject
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                  {pendingUsers.length === 0 && (
                    <Box 
                      sx={{ 
                        textAlign: 'center', 
                        py: 4,
                        color: 'text.secondary'
                      }}
                    >
                      <Typography variant="body1">
                        No pending approvals
                      </Typography>
                    </Box>
                  )}
                </List>
              )}

              {/* User Management */}
              {tabValue === 2 && (
                <Box>
                  <List sx={{ 
                    bgcolor: 'background.paper',
                    maxHeight: 'calc(100vh - 320px)',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: '#555',
                    }
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
                              p: 2
                            }}
                            secondaryAction={
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
                            }
                          >
                            <Avatar 
                              sx={{ 
                                mr: 2, 
                                bgcolor: getRandomColor(user.username),
                                width: 40,
                                height: 40
                              }}
                            >
                              {getInitials(user.username)}
                            </Avatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                  {user.username}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    component="span"
                                    sx={{ mr: 2 }}
                                  >
                                    Role: Employee
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
                  <Pagination 
                    pagination={userPagination}
                    onPageChange={handleUserPageChange}
                    onPageSizeChange={handleUserPageSizeChange}
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Add Employee Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>Add New Employee</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Position"
            fullWidth
            value={newEmployee.position}
            onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            value={newEmployee.department}
            onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Join Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newEmployee.join_date}
            onChange={(e) => setNewEmployee({ ...newEmployee, join_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddEmployee}
            variant="contained"
            sx={{ 
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
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
    </Container>
  );
};

export default EmployeePage;
