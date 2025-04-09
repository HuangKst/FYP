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
  TextField
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const EmployeeList = ({ employees, onAddEmployee, onDeleteEmployee }) => {
  // Move form state into component
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    hire_date: format(new Date(), 'yyyy-MM-dd')
  });

  // Handle add employee
  const handleAddEmployee = () => {
    onAddEmployee(newEmployee);
    handleCloseDialog();
  };

  // Handle delete employee
  const handleDeleteEmployee = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      onDeleteEmployee(id);
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setNewEmployee({
      name: '',
      phone: '',
      hire_date: format(new Date(), 'yyyy-MM-dd')
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

      <Dialog
        open={openAddDialog}
        onClose={handleCloseDialog}
        aria-labelledby="add-employee-dialog-title"
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
          />
          <TextField
            margin="dense"
            label="Phone"
            type="text"
            fullWidth
            value={newEmployee.phone}
            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Hire Date"
            type="date"
            fullWidth
            value={newEmployee.hire_date}
            onChange={(e) => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddEmployee} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
