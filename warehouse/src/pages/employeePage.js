import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
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
  deleteEmployeeLeave
} from '../api/employeeApi';
import { format } from 'date-fns';

// 员工管理页面
const EmployeePage = () => {
  const { role } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [openAddEmployee, setOpenAddEmployee] = useState(false);
  const [openAddOvertime, setOpenAddOvertime] = useState(false);
  const [openAddLeave, setOpenAddLeave] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 表单状态
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    hire_date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [newOvertime, setNewOvertime] = useState({
    employee_id: '',
    overtime_date: format(new Date(), 'yyyy-MM-dd'),
    hours: 1,
    reason: ''
  });
  
  const [newLeave, setNewLeave] = useState({
    employee_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  });

  // 检查权限
  const hasPermission = role === 'admin' || role === 'boss';
  
  const fetchEmployees = useCallback(async () => {
    const result = await getAllEmployees();
    if (result.success) {
      setEmployees(result.employees);
    } else {
      showSnackbar(result.msg || '获取员工列表失败', 'error');
    }
  }, []);

  const fetchOvertimes = useCallback(async () => {
    const result = await getEmployeeOvertimes();
    if (result.success) {
      setOvertimes(result.overtimes);
    } else {
      showSnackbar(result.msg || '获取加班记录失败', 'error');
    }
  }, []);

  const fetchLeaves = useCallback(async () => {
    const result = await getEmployeeLeaves();
    if (result.success) {
      setLeaves(result.leaves);
    } else {
      showSnackbar(result.msg || '获取请假记录失败', 'error');
    }
  }, []);
  
  // 加载数据
  useEffect(() => {
    if (hasPermission) {
      fetchEmployees();
      fetchOvertimes();
      fetchLeaves();
    }
  }, [hasPermission, fetchEmployees, fetchOvertimes, fetchLeaves]);

  // 处理添加员工
  const handleAddEmployee = async () => {
    if (!newEmployee.name) {
      showSnackbar('员工姓名不能为空', 'error');
      return;
    }
    
    const result = await addEmployee(newEmployee);
    if (result.success) {
      setEmployees([...employees, result.employee]);
      showSnackbar('添加员工成功', 'success');
      setOpenAddEmployee(false);
      resetNewEmployee();
    } else {
      showSnackbar(result.msg || '添加员工失败', 'error');
    }
  };

  // 处理删除员工
  const handleDeleteEmployee = async (id) => {
    if (window.confirm('确定要删除该员工吗？')) {
      const result = await deleteEmployee(id);
      if (result.success) {
        setEmployees(employees.filter(emp => emp.id !== id));
        showSnackbar('删除员工成功', 'success');
      } else {
        showSnackbar(result.msg || '删除员工失败', 'error');
      }
    }
  };

  // 处理添加加班记录
  const handleAddOvertime = async () => {
    if (!newOvertime.employee_id || !newOvertime.overtime_date || !newOvertime.hours) {
      showSnackbar('请填写完整的加班信息', 'error');
      return;
    }
    
    const result = await addEmployeeOvertime(newOvertime);
    if (result.success) {
      setOvertimes([...overtimes, result.overtime]);
      showSnackbar('添加加班记录成功', 'success');
      setOpenAddOvertime(false);
      resetNewOvertime();
    } else {
      showSnackbar(result.msg || '添加加班记录失败', 'error');
    }
  };

  // 处理删除加班记录
  const handleDeleteOvertime = async (id) => {
    if (window.confirm('确定要删除该加班记录吗？')) {
      const result = await deleteEmployeeOvertime(id);
      if (result.success) {
        setOvertimes(overtimes.filter(ot => ot.id !== id));
        showSnackbar('删除加班记录成功', 'success');
      } else {
        showSnackbar(result.msg || '删除加班记录失败', 'error');
      }
    }
  };

  // 处理添加请假记录
  const handleAddLeave = async () => {
    if (!newLeave.employee_id || !newLeave.start_date || !newLeave.end_date) {
      showSnackbar('请填写完整的请假信息', 'error');
      return;
    }
    
    const result = await addEmployeeLeave(newLeave);
    if (result.success) {
      setLeaves([...leaves, result.leave]);
      showSnackbar('添加请假记录成功', 'success');
      setOpenAddLeave(false);
      resetNewLeave();
    } else {
      showSnackbar(result.msg || '添加请假记录失败', 'error');
    }
  };

  // 处理删除请假记录
  const handleDeleteLeave = async (id) => {
    if (window.confirm('确定要删除该请假记录吗？')) {
      const result = await deleteEmployeeLeave(id);
      if (result.success) {
        setLeaves(leaves.filter(leave => leave.id !== id));
        showSnackbar('删除请假记录成功', 'success');
      } else {
        showSnackbar(result.msg || '删除请假记录失败', 'error');
      }
    }
  };

  // 重置表单
  const resetNewEmployee = () => {
    setNewEmployee({
      name: '',
      phone: '',
      hire_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const resetNewOvertime = () => {
    setNewOvertime({
      employee_id: '',
      overtime_date: format(new Date(), 'yyyy-MM-dd'),
      hours: 1,
      reason: ''
    });
  };

  const resetNewLeave = () => {
    setNewLeave({
      employee_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      reason: ''
    });
  };

  // 显示提示信息
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 关闭提示信息
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 处理标签页切换
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // 获取员工姓名
  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : '未知员工';
  };

  // 如果没有权限，显示无权限信息
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
        </Tabs>
        
        {/* Employee List */}
        {tabValue === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => setOpenAddEmployee(true)}
              >
                Add Employee
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Hire Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.id}</TableCell>
                      <TableCell>{employee.name}</TableCell>
                      <TableCell>{employee.phone || '-'}</TableCell>
                      <TableCell>
                        {employee.hire_date ? format(new Date(employee.hire_date), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteEmployee(employee.id)}
                          aria-label="Delete employee"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Overtime Records */}
        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => setOpenAddOvertime(true)}
              >
                Add Overtime
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overtimes.map((overtime) => (
                    <TableRow key={overtime.id}>
                      <TableCell>{overtime.id}</TableCell>
                      <TableCell>{getEmployeeName(overtime.employee_id)}</TableCell>
                      <TableCell>
                        {overtime.overtime_date ? format(new Date(overtime.overtime_date), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell>{overtime.hours}</TableCell>
                      <TableCell>{overtime.reason || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteOvertime(overtime.id)}
                          aria-label="Delete overtime record"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Leave Records */}
        {tabValue === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={() => setOpenAddLeave(true)}
              >
                Add Leave
              </Button>
            </Box>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Employee</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>{leave.id}</TableCell>
                      <TableCell>{getEmployeeName(leave.employee_id)}</TableCell>
                      <TableCell>
                        {leave.start_date ? format(new Date(leave.start_date), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell>
                        {leave.end_date ? format(new Date(leave.end_date), 'yyyy-MM-dd') : '-'}
                      </TableCell>
                      <TableCell>{leave.reason || '-'}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteLeave(leave.id)}
                          aria-label="Delete leave record"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>
      
      {/* Add Employee Dialog */}
      <Dialog 
        open={openAddEmployee} 
        onClose={() => setOpenAddEmployee(false)}
        aria-labelledby="add-employee-dialog-title"
        disableScrollLock
      >
        <DialogTitle id="add-employee-dialog-title">Add Employee</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            required
            inputProps={{
              'aria-label': 'Employee name'
            }}
          />
          <TextField
            margin="dense"
            label="Phone"
            type="text"
            fullWidth
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            inputProps={{
              'aria-label': 'Employee phone'
            }}
          />
          <TextField
            margin="dense"
            label="Hire Date"
            type="date"
            fullWidth
            value={newEmployee.hire_date}
            onChange={(e) => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              'aria-label': 'Hire date'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddEmployee(false)}>Cancel</Button>
          <Button onClick={handleAddEmployee} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Overtime Dialog */}
      <Dialog 
        open={openAddOvertime} 
        onClose={() => setOpenAddOvertime(false)}
        aria-labelledby="add-overtime-dialog-title"
        disableScrollLock
      >
        <DialogTitle id="add-overtime-dialog-title">Add Overtime Record</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="overtime-employee-label">Employee</InputLabel>
            <Select
              labelId="overtime-employee-label"
              value={newOvertime.employee_id}
              onChange={(e) => setNewOvertime({ ...newOvertime, employee_id: e.target.value })}
              required
              inputProps={{
                'aria-label': 'Select employee'
              }}
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Overtime Date"
            type="date"
            fullWidth
            value={newOvertime.overtime_date}
            onChange={(e) => setNewOvertime({ ...newOvertime, overtime_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            inputProps={{
              'aria-label': 'Overtime date'
            }}
          />
          <TextField
            margin="dense"
            label="Hours"
            type="number"
            fullWidth
            value={newOvertime.hours}
            onChange={(e) => setNewOvertime({ ...newOvertime, hours: parseInt(e.target.value) })}
            required
            inputProps={{
              min: 1,
              'aria-label': 'Overtime hours'
            }}
          />
          <TextField
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            value={newOvertime.reason}
            onChange={(e) => setNewOvertime({ ...newOvertime, reason: e.target.value })}
            multiline
            rows={2}
            inputProps={{
              'aria-label': 'Overtime reason'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddOvertime(false)}>Cancel</Button>
          <Button onClick={handleAddOvertime} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Leave Dialog */}
      <Dialog 
        open={openAddLeave} 
        onClose={() => setOpenAddLeave(false)}
        aria-labelledby="add-leave-dialog-title"
        disableScrollLock
      >
        <DialogTitle id="add-leave-dialog-title">Add Leave Record</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="leave-employee-label">Employee</InputLabel>
            <Select
              labelId="leave-employee-label"
              value={newLeave.employee_id}
              onChange={(e) => setNewLeave({ ...newLeave, employee_id: e.target.value })}
              required
              inputProps={{
                'aria-label': 'Select employee'
              }}
            >
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Start Date"
                type="date"
                fullWidth
                value={newLeave.start_date}
                onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{
                  'aria-label': 'Leave start date'
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="End Date"
                type="date"
                fullWidth
                value={newLeave.end_date}
                onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{
                  'aria-label': 'Leave end date'
                }}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            value={newLeave.reason}
            onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
            multiline
            rows={2}
            inputProps={{
              'aria-label': 'Leave reason'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddLeave(false)}>Cancel</Button>
          <Button onClick={handleAddLeave} variant="contained" color="primary">
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
    </Container>
  );
};

export default EmployeePage;
