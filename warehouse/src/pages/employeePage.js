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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { AuthContext } from '../contexts/authContext';
import { 
  getAllEmployees, 
  addEmployee, 
  deleteEmployee,
  fetchPendingUsers,
  approveUser
} from '../api/employeeApi';

const EmployeePage = () => {
  const navigate = useNavigate();
  const { role } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    join_date: '',
  });

  // Check permission
  const hasPermission = role === 'admin' || role === 'boss';
  
  // Data fetching functions
  const fetchEmployees = useCallback(async () => {
    try {
      const result = await getAllEmployees();
      if (result.success) {
        setEmployees(result.employees);
      } else {
        showSnackbar(result.msg || 'Failed to get employee list', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to get employee list', 'error');
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const result = await fetchPendingUsers();
      if (result.success) {
        setPendingUsers(result.users || []);
      } else {
        showSnackbar(result.msg || 'Failed to get pending approvals', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to get pending approvals', 'error');
    }
  }, []);
  
  // Load data
  useEffect(() => {
    if (hasPermission) {
      fetchEmployees();
      fetchPending();
    }
  }, [hasPermission, fetchEmployees, fetchPending]);

  // Handle employee operations
  const handleAddEmployee = async () => {
    try {
      const result = await addEmployee(newEmployee);
      if (result.success) {
        setEmployees([...employees, result.employee]);
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
        setEmployees(employees.filter(emp => emp.id !== employeeId));
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

  // If no permission, show access denied message
  if (!hasPermission) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
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
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: 'primary.main',
            color: 'white',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Employee Management
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            Manage company employees and approve new user registrations
          </Typography>
        </Paper>

        <Paper sx={{ mb: 3, borderRadius: 2 }}>
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
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Employee List */}
            {tabValue === 0 && (
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenDialog(true)}
                  startIcon={<PersonAddIcon />}
                  sx={{ 
                    mb: 3,
                    boxShadow: 2,
                    textTransform: 'none',
                    borderRadius: 2
                  }}
                >
                  Add Employee
                </Button>

                <List sx={{ bgcolor: 'background.paper' }}>
                  {employees.map((employee) => (
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
                  ))}
                </List>
              </Box>
            )}

            {/* Pending Approvals */}
            {tabValue === 1 && (
              <List>
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
          </Box>
        </Paper>

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
    </Container>
  );
};

export default EmployeePage;
