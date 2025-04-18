import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  getEmployeeOvertimes,
  addEmployeeOvertime,
  deleteEmployeeOvertime,
  getEmployeeLeaves,
  addEmployeeLeave,
  deleteEmployeeLeave,
  getAllEmployees,
} from '../api/employeeApi';
import Pagination from '../component/Pagination';
import PdfExportButton from '../component/PdfExportButton';
import { BASE_URL } from '../config';

// 获取环境变量中的API基础URL，如果未定义则使用默认值
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [overtimes, setOvertimes] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [filteredOvertimes, setFilteredOvertimes] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [displayedOvertimes, setDisplayedOvertimes] = useState([]);
  const [displayedLeaves, setDisplayedLeaves] = useState([]);
  const [openOvertimeDialog, setOpenOvertimeDialog] = useState(false);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [openEditOvertimeDialog, setOpenEditOvertimeDialog] = useState(false);
  const [openEditLeaveDialog, setOpenEditLeaveDialog] = useState(false);
  const [editingOvertime, setEditingOvertime] = useState(null);
  const [editingLeave, setEditingLeave] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // 筛选条件状态
  const [overtimeFilter, setOvertimeFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [leaveFilter, setLeaveFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // 分页状态
  const [overtimePagination, setOvertimePagination] = useState({
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 0
  });
  
  const [leavePagination, setLeavePagination] = useState({
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 0
  });

  const [newOvertime, setNewOvertime] = useState({
    overtime_date: '',
    hours: '',
    reason: ''
  });
  
  const [newLeave, setNewLeave] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });

  const [totalOvertimeHours, setTotalOvertimeHours] = useState(0);
  const [totalLeaveDays, setTotalLeaveDays] = useState(0);

  // 更新加班分页信息
  useEffect(() => {
    const total = filteredOvertimes.length;
    const totalPages = Math.ceil(total / overtimePagination.pageSize);
    
    setOvertimePagination(prev => ({
      ...prev,
      total,
      totalPages,
      page: prev.page > totalPages && totalPages > 0 ? totalPages : prev.page
    }));
    
    const startIndex = (overtimePagination.page - 1) * overtimePagination.pageSize;
    const endIndex = startIndex + overtimePagination.pageSize;
    setDisplayedOvertimes(filteredOvertimes.slice(startIndex, endIndex));
  }, [filteredOvertimes, overtimePagination.page, overtimePagination.pageSize]);

  // 更新请假分页信息
  useEffect(() => {
    const total = filteredLeaves.length;
    const totalPages = Math.ceil(total / leavePagination.pageSize);
    
    setLeavePagination(prev => ({
      ...prev,
      total,
      totalPages,
      page: prev.page > totalPages && totalPages > 0 ? totalPages : prev.page
    }));
    
    const startIndex = (leavePagination.page - 1) * leavePagination.pageSize;
    const endIndex = startIndex + leavePagination.pageSize;
    setDisplayedLeaves(filteredLeaves.slice(startIndex, endIndex));
  }, [filteredLeaves, leavePagination.page, leavePagination.pageSize]);

  // 格式化日期
  const formatDate = (dateString) => {
    try {
      return dateString ? new Date(dateString).toLocaleDateString() : 'Not set';
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      return dateString ? new Date(dateString).toLocaleString() : '-';
    } catch (error) {
      return 'Invalid date';
    }
  };

  // 应用加班记录筛选
  const applyOvertimeFilter = useCallback(() => {
    let filtered = [...overtimes];
    if (overtimeFilter.startDate && overtimeFilter.endDate) {
      filtered = overtimes.filter(overtime => {
        const overtimeDate = new Date(overtime.overtime_date);
        const startDate = new Date(overtimeFilter.startDate);
        const endDate = new Date(overtimeFilter.endDate);
        return overtimeDate >= startDate && overtimeDate <= endDate;
      });
    }
    setFilteredOvertimes(filtered);
    setOvertimePagination(prev => ({ ...prev, page: 1 })); // 筛选后重置为第一页
  }, [overtimes, overtimeFilter]);

  // 应用请假记录筛选
  const applyLeaveFilter = useCallback(() => {
    let filtered = [...leaves];
    if (leaveFilter.startDate && leaveFilter.endDate) {
      filtered = leaves.filter(leave => {
        const leaveStartDate = new Date(leave.start_date);
        const leaveEndDate = new Date(leave.end_date);
        const filterStartDate = new Date(leaveFilter.startDate);
        const filterEndDate = new Date(leaveFilter.endDate);
        return leaveStartDate >= filterStartDate && leaveEndDate <= filterEndDate;
      });
    }
    setFilteredLeaves(filtered);
    setLeavePagination(prev => ({ ...prev, page: 1 })); // 筛选后重置为第一页
  }, [leaves, leaveFilter]);

  // 重置筛选
  const resetOvertimeFilter = () => {
    setOvertimeFilter({ startDate: '', endDate: '' });
    setFilteredOvertimes(overtimes);
    setOvertimePagination(prev => ({ ...prev, page: 1 }));
  };

  const resetLeaveFilter = () => {
    setLeaveFilter({ startDate: '', endDate: '' });
    setFilteredLeaves(leaves);
    setLeavePagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理分页变化
  const handleOvertimePageChange = (newPage) => {
    setOvertimePagination(prev => ({ ...prev, page: newPage }));
  };

  const handleOvertimePageSizeChange = (newPageSize) => {
    setOvertimePagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleLeavePageChange = (newPage) => {
    setLeavePagination(prev => ({ ...prev, page: newPage }));
  };

  const handleLeavePageSizeChange = (newPageSize) => {
    setLeavePagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 获取数据
  const fetchData = useCallback(async () => {
    try {
      const [employeesResult, overtimesResult, leavesResult] = await Promise.all([
        getAllEmployees(),
        getEmployeeOvertimes(),
        getEmployeeLeaves()
      ]);

      if (employeesResult.success) {
        const employeeData = employeesResult.employees.find(emp => emp.id === parseInt(id));
        if (employeeData) {
          setEmployee(employeeData);
        } else {
          showSnackbar('Employee not found', 'error');
          navigate('/employee');
        }
      }

      if (overtimesResult.success) {
        const employeeOvertimes = overtimesResult.overtimes.filter(ot => ot.employee_id === parseInt(id));
        setOvertimes(employeeOvertimes);
        setFilteredOvertimes(employeeOvertimes);
      }

      if (leavesResult.success) {
        const employeeLeaves = leavesResult.leaves.filter(leave => leave.employee_id === parseInt(id));
        setLeaves(employeeLeaves);
        setFilteredLeaves(employeeLeaves);
      }
    } catch (error) {
      showSnackbar('Failed to fetch data', 'error');
      navigate('/employee');
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    applyOvertimeFilter();
  }, [overtimeFilter, applyOvertimeFilter]);

  useEffect(() => {
    applyLeaveFilter();
  }, [leaveFilter, applyLeaveFilter]);

  // 计算总加班时间
  useEffect(() => {
    const calculateTotalOvertimeHours = () => {
      const total = filteredOvertimes.reduce((sum, overtime) => 
        sum + parseFloat(overtime.hours || 0), 0);
      setTotalOvertimeHours(total.toFixed(2));
    };
    
    calculateTotalOvertimeHours();
  }, [filteredOvertimes]);

  // 计算总请假时间
  useEffect(() => {
    const calculateTotalLeaveDays = () => {
      const total = filteredLeaves.reduce((sum, leave) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 包括首尾两天
        return sum + diffDays;
      }, 0);
      setTotalLeaveDays(total);
    };
    
    calculateTotalLeaveDays();
  }, [filteredLeaves]);

  // 处理加班记录
  const handleAddOvertime = async () => {
    try {
      const result = await addEmployeeOvertime({
        ...newOvertime,
        employee_id: parseInt(id)
      });
      if (result.success) {
        setOvertimes([...overtimes, result.overtime]);
        setOpenOvertimeDialog(false);
        showSnackbar('Overtime record added successfully', 'success');
        resetNewOvertime();
      } else {
        showSnackbar(result.msg || 'Failed to add overtime', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to add overtime', 'error');
    }
  };

  const handleDeleteOvertime = async (overtimeId) => {
    try {
      const result = await deleteEmployeeOvertime(overtimeId);
      if (result.success) {
        setOvertimes(overtimes.filter(ot => ot.id !== overtimeId));
        showSnackbar('Overtime record deleted successfully', 'success');
      } else {
        showSnackbar(result.msg || 'Failed to delete overtime', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to delete overtime', 'error');
    }
  };

  // 处理请假记录
  const handleAddLeave = async () => {
    try {
      const result = await addEmployeeLeave({
        ...newLeave,
        employee_id: parseInt(id)
      });
      if (result.success) {
        setLeaves([...leaves, result.leave]);
        setOpenLeaveDialog(false);
        showSnackbar('Leave record added successfully', 'success');
        resetNewLeave();
      } else {
        showSnackbar(result.msg || 'Failed to add leave', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to add leave', 'error');
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      const result = await deleteEmployeeLeave(leaveId);
      if (result.success) {
        setLeaves(leaves.filter(leave => leave.id !== leaveId));
        showSnackbar('Leave record deleted successfully', 'success');
      } else {
        showSnackbar(result.msg || 'Failed to delete leave', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to delete leave', 'error');
    }
  };

  // 重置表单
  const resetNewOvertime = () => {
    setNewOvertime({
      overtime_date: '',
      hours: '',
      reason: ''
    });
  };

  const resetNewLeave = () => {
    setNewLeave({
      start_date: '',
      end_date: '',
      reason: ''
    });
  };

  // 显示提示信息
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 处理修改加班记录
  const handleEditOvertime = async () => {
    try {
      const result = await addEmployeeOvertime({
        ...editingOvertime,
        employee_id: parseInt(id)
      });
      if (result.success) {
        setOvertimes(overtimes.map(ot => 
          ot.id === editingOvertime.id ? result.overtime : ot
        ));
        setOpenEditOvertimeDialog(false);
        showSnackbar('Overtime record updated successfully', 'success');
        setEditingOvertime(null);
      } else {
        showSnackbar(result.msg || 'Failed to update overtime', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to update overtime', 'error');
    }
  };

  // 处理修改请假记录
  const handleEditLeave = async () => {
    try {
      const result = await addEmployeeLeave({
        ...editingLeave,
        employee_id: parseInt(id)
      });
      if (result.success) {
        setLeaves(leaves.map(leave => 
          leave.id === editingLeave.id ? result.leave : leave
        ));
        setOpenEditLeaveDialog(false);
        showSnackbar('Leave record updated successfully', 'success');
        setEditingLeave(null);
      } else {
        showSnackbar(result.msg || 'Failed to update leave', 'error');
      }
    } catch (error) {
      showSnackbar('Failed to update leave', 'error');
    }
  };

  return (
    <Container>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/employee')}
          sx={{ mb: 3 }}
        >
          Back to Employee List
        </Button>

        {/* Employee Basic Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" color="primary" gutterBottom>
            Employee Information
          </Typography>
          {employee && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Employee ID:</strong> {employee.id}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Name:</strong> {employee.name}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Email:</strong> {employee.email || 'Not set'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Position:</strong> {employee.position || 'Not set'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Department:</strong> {employee.department || 'Not set'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Join Date:</strong> {formatDate(employee.join_date)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </Paper>

        <Grid container spacing={3}>
          {/* Overtime Records */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">Overtime Records</Typography>
                <Box>
                  <Button 
                    variant="contained" 
                    onClick={() => setOpenOvertimeDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Add Overtime
                  </Button>
                  <PdfExportButton
                    url={`${BASE_URL}/employee-overtimes/employee/${id}/pdf`}
                    queryParams={{
                      startDate: overtimeFilter.startDate,
                      endDate: overtimeFilter.endDate
                    }}
                    filename={`employee-${id}-overtime.pdf`}
                    buttonProps={{ variant: "outlined" }}
                  >
                    Export PDF
                  </PdfExportButton>
                </Box>
              </Box>
              
              {/* Overtime Filter */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={overtimeFilter.startDate}
                    onChange={(e) => setOvertimeFilter({ ...overtimeFilter, startDate: e.target.value })}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={overtimeFilter.endDate}
                    onChange={(e) => setOvertimeFilter({ ...overtimeFilter, endDate: e.target.value })}
                  />
                  <IconButton onClick={resetOvertimeFilter} size="small">
                    <ClearIcon />
                  </IconButton>
                  <Typography>
                    Total: <strong>{totalOvertimeHours}</strong> hours
                  </Typography>
                </Stack>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Hours</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedOvertimes.map((overtime) => (
                      <TableRow key={overtime.id}>
                        <TableCell>{formatDate(overtime.overtime_date)}</TableCell>
                        <TableCell>{overtime.hours}</TableCell>
                        <TableCell>{overtime.reason || '-'}</TableCell>
                        <TableCell>{formatDateTime(overtime.created_at)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingOvertime(overtime);
                              setOpenEditOvertimeDialog(true);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteOvertime(overtime.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {displayedOvertimes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No overtime records</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Pagination 
                pagination={overtimePagination}
                onPageChange={handleOvertimePageChange}
                onPageSizeChange={handleOvertimePageSizeChange}
                totalLabel="Total: {total} records"
              />
            </Paper>
          </Grid>

          {/* Leave Records */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">Leave Records</Typography>
                <Box>
                  <Button 
                    variant="contained" 
                    onClick={() => setOpenLeaveDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    Add Leave
                  </Button>
                  <PdfExportButton
                    url={`${BASE_URL}/employee-leaves/employee/${id}/pdf`}
                    queryParams={{
                      startDate: leaveFilter.startDate,
                      endDate: leaveFilter.endDate
                    }}
                    filename={`employee-${id}-leave.pdf`}
                    buttonProps={{ variant: "outlined" }}
                  >
                    Export PDF
                  </PdfExportButton>
                </Box>
              </Box>

              {/* Leave Filter */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={leaveFilter.startDate}
                    onChange={(e) => setLeaveFilter({ ...leaveFilter, startDate: e.target.value })}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={leaveFilter.endDate}
                    onChange={(e) => setLeaveFilter({ ...leaveFilter, endDate: e.target.value })}
                  />
                  <IconButton onClick={resetLeaveFilter} size="small">
                    <ClearIcon />
                  </IconButton>
                  <Typography>
                    Total: <strong>{totalLeaveDays}</strong> days
                  </Typography>
                </Stack>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Created At</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedLeaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>{formatDate(leave.start_date)}</TableCell>
                        <TableCell>{formatDate(leave.end_date)}</TableCell>
                        <TableCell>{leave.reason || '-'}</TableCell>
                        <TableCell>{formatDateTime(leave.created_at)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingLeave(leave);
                              setOpenEditLeaveDialog(true);
                            }}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteLeave(leave.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {displayedLeaves.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No leave records</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Pagination 
                pagination={leavePagination}
                onPageChange={handleLeavePageChange}
                onPageSizeChange={handleLeavePageSizeChange}
                totalLabel="Total: {total} records"
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Add Overtime Dialog */}
        <Dialog open={openOvertimeDialog} onClose={() => setOpenOvertimeDialog(false)}>
          <DialogTitle>Add Overtime Record</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newOvertime.overtime_date}
              onChange={(e) => setNewOvertime({ ...newOvertime, overtime_date: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Hours"
              type="number"
              fullWidth
              value={newOvertime.hours}
              onChange={(e) => setNewOvertime({ ...newOvertime, hours: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Reason"
              fullWidth
              multiline
              rows={3}
              value={newOvertime.reason}
              onChange={(e) => setNewOvertime({ ...newOvertime, reason: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOvertimeDialog(false)}>Cancel</Button>
            <Button onClick={handleAddOvertime}>Add</Button>
          </DialogActions>
        </Dialog>

        {/* Add Leave Dialog */}
        <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)}>
          <DialogTitle>Add Leave Record</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newLeave.start_date}
              onChange={(e) => setNewLeave({ ...newLeave, start_date: e.target.value })}
            />
            <TextField
              margin="dense"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newLeave.end_date}
              onChange={(e) => setNewLeave({ ...newLeave, end_date: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Reason"
              fullWidth
              multiline
              rows={3}
              value={newLeave.reason}
              onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLeave}>Add</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Overtime Dialog */}
        <Dialog open={openEditOvertimeDialog} onClose={() => setOpenEditOvertimeDialog(false)}>
          <DialogTitle>Edit Overtime Record</DialogTitle>
          <DialogContent>
            {editingOvertime && (
              <>
                <TextField
                  margin="dense"
                  label="Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editingOvertime.overtime_date}
                  onChange={(e) => setEditingOvertime({ 
                    ...editingOvertime, 
                    overtime_date: e.target.value 
                  })}
                />
                <TextField
                  margin="dense"
                  label="Hours"
                  type="number"
                  fullWidth
                  value={editingOvertime.hours}
                  onChange={(e) => setEditingOvertime({ 
                    ...editingOvertime, 
                    hours: e.target.value 
                  })}
                />
                <TextField
                  margin="dense"
                  label="Reason"
                  fullWidth
                  multiline
                  rows={3}
                  value={editingOvertime.reason}
                  onChange={(e) => setEditingOvertime({ 
                    ...editingOvertime, 
                    reason: e.target.value 
                  })}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditOvertimeDialog(false)}>Cancel</Button>
            <Button onClick={handleEditOvertime}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Leave Dialog */}
        <Dialog open={openEditLeaveDialog} onClose={() => setOpenEditLeaveDialog(false)}>
          <DialogTitle>Edit Leave Record</DialogTitle>
          <DialogContent>
            {editingLeave && (
              <>
                <TextField
                  margin="dense"
                  label="Start Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editingLeave.start_date}
                  onChange={(e) => setEditingLeave({ 
                    ...editingLeave, 
                    start_date: e.target.value 
                  })}
                />
                <TextField
                  margin="dense"
                  label="End Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={editingLeave.end_date}
                  onChange={(e) => setEditingLeave({ 
                    ...editingLeave, 
                    end_date: e.target.value 
                  })}
                />
                <TextField
                  margin="dense"
                  label="Reason"
                  fullWidth
                  multiline
                  rows={3}
                  value={editingLeave.reason}
                  onChange={(e) => setEditingLeave({ 
                    ...editingLeave, 
                    reason: e.target.value 
                  })}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditLeaveDialog(false)}>Cancel</Button>
            <Button onClick={handleEditLeave}>Save</Button>
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

export default EmployeeDetailPage; 