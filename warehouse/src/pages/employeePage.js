import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs,
  Tab,
  Snackbar,
  Alert
} from '@mui/material';
import { AuthContext } from '../contexts/authContext';
import { 
  getAllEmployees, 
  addEmployee, 
  deleteEmployee,
  getEmployeeOvertimes,
  addEmployeeOvertime,
  deleteEmployeeOvertime,
  getEmployeeLeaves,
  addEmployeeLeave,
  deleteEmployeeLeave,
  fetchPendingUsers,
  approveUser
} from '../api/employeeApi';

import EmployeeList from '../component/employee/employeeList';
import EmployeeOvertime from '../component/employee/employeeOvertime';
import EmployeeLeave from '../component/employee/employeeLeave';
import PendingUsers from '../component/employee/pending';

const EmployeePage = () => {
  const { role } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check permission
  const hasPermission = role === 'admin' || role === 'boss';
  
  // Data fetching functions
  const fetchEmployees = useCallback(async () => {
    try {
      const result = await getAllEmployees();
      if (result.success) {
        setEmployees(result.employees);
      } else {
        showSnackbar(result.msg || 'Failed to fetch employees', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch employees', 'error');
    }
  }, []);

  const fetchOvertimes = useCallback(async () => {
    try {
      const result = await getEmployeeOvertimes();
      if (result.success) {
        setOvertimes(result.overtimes);
      } else {
        showSnackbar(result.msg || 'Failed to fetch overtime records', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch overtime records', 'error');
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    try {
      const result = await getEmployeeLeaves();
      if (result.success) {
        setLeaves(result.leaves);
      } else {
        showSnackbar(result.msg || 'Failed to fetch leave records', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch leave records', 'error');
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const result = await fetchPendingUsers();
      if (result.success) {
        setPendingUsers(result.users || []);
      } else {
        showSnackbar(result.msg || 'Failed to fetch pending users', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to fetch pending users', 'error');
    }
  }, []);
  
  // Load data
  useEffect(() => {
    if (hasPermission) {
      fetchEmployees();
      fetchOvertimes();
      fetchLeaves();
      fetchPending();
    }
  }, [hasPermission, fetchEmployees, fetchOvertimes, fetchLeaves, fetchPending]);

  // Unified data operation handler
  const handleOperation = async (operation, ...args) => {
    try {
      const result = await operation(...args);
      if (result.success) {
        // Update state based on operation type
        if (operation === addEmployee) {
          setEmployees([...employees, result.employee]);
        } else if (operation === deleteEmployee) {
          setEmployees(employees.filter(emp => emp.id !== args[0]));
        } else if (operation === addEmployeeOvertime) {
          setOvertimes([...overtimes, result.overtime]);
        } else if (operation === deleteEmployeeOvertime) {
          setOvertimes(overtimes.filter(ot => ot.id !== args[0]));
        } else if (operation === addEmployeeLeave) {
          setLeaves([...leaves, result.leave]);
        } else if (operation === deleteEmployeeLeave) {
          setLeaves(leaves.filter(leave => leave.id !== args[0]));
        }
        showSnackbar('Operation successful', 'success');
      } else {
        showSnackbar(result.msg || 'Operation failed', 'error');
      }
    } catch (error) {
      showSnackbar('Operation failed', 'error');
    }
  };

  // Handle user approval
  const handleApproveUser = async (userId, isApproved) => {
    try {
      await approveUser(userId, isApproved);
      await fetchPending();
      showSnackbar(isApproved ? 'User approved' : 'User rejected', 'success');
    } catch (error) {
      showSnackbar('Approval operation failed', 'error');
    }
  };

  // Show snackbar message
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Get employee name
  const getEmployeeName = useCallback((employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : 'Unknown Employee';
  }, [employees]);

  // If no permission, show access denied message
  if (!hasPermission) {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error">
            Access Denied
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Only administrators and bosses can access the employee management page
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Employee Management
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Employee List" />
          <Tab label="Overtime Records" />
          <Tab label="Leave Records" />
          <Tab label="Pending Approvals" />
        </Tabs>

        {/* Employee List */}
        {tabValue === 0 && (
          <EmployeeList
            employees={employees}
            onAddEmployee={(data) => handleOperation(addEmployee, data)}
            onDeleteEmployee={(id) => handleOperation(deleteEmployee, id)}
          />
        )}

        {/* Overtime Records */}
        {tabValue === 1 && (
          <EmployeeOvertime
            overtimes={overtimes}
            employees={employees}
            onAddOvertime={(data) => handleOperation(addEmployeeOvertime, data)}
            onDeleteOvertime={(id) => handleOperation(deleteEmployeeOvertime, id)}
            getEmployeeName={getEmployeeName}
          />
        )}

        {/* Leave Records */}
        {tabValue === 2 && (
          <EmployeeLeave
            leaves={leaves}
            employees={employees}
            onAddLeave={(data) => handleOperation(addEmployeeLeave, data)}
            onDeleteLeave={(id) => handleOperation(deleteEmployeeLeave, id)}
            getEmployeeName={getEmployeeName}
          />
        )}

        {/* Pending Approvals */}
        {tabValue === 3 && (
          <PendingUsers
            pendingUsers={pendingUsers}
            onApproveUser={handleApproveUser}
          />
        )}
      </Box>

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
