import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const EmployeeOvertime = ({
  overtimes,
  employees,
  onAddOvertime,
  onDeleteOvertime,
  getEmployeeName
}) => {
  // Move form state into component
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newOvertime, setNewOvertime] = useState({
    employee_id: '',
    overtime_date: format(new Date(), 'yyyy-MM-dd'),
    hours: 1,
    reason: ''
  });

  // Handle add overtime
  const handleAddOvertime = () => {
    onAddOvertime(newOvertime);
    handleCloseDialog();
  };

  // Handle delete overtime
  const handleDeleteOvertime = (id) => {
    if (window.confirm('Are you sure you want to delete this overtime record?')) {
      onDeleteOvertime(id);
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setNewOvertime({
      employee_id: '',
      overtime_date: format(new Date(), 'yyyy-MM-dd'),
      hours: 1,
      reason: ''
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
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

      <Dialog
        open={openAddDialog}
        onClose={handleCloseDialog}
        aria-labelledby="add-overtime-dialog-title"
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
          />
          <TextField
            margin="dense"
            label="Hours"
            type="number"
            fullWidth
            value={newOvertime.hours}
            onChange={(e) => setNewOvertime({ ...newOvertime, hours: parseInt(e.target.value) })}
            required
            inputProps={{ min: 1 }}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddOvertime} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeOvertime;
