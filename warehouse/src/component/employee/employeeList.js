import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  IconButton,
  Typography,
  Grid,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const EmployeeList = ({ employees, onAddEmployee, onDeleteEmployee }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    joinDate: '',
  });

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewEmployee({
      name: '',
      email: '',
      position: '',
      department: '',
      joinDate: '',
    });
  };

  const handleSubmit = () => {
    onAddEmployee(newEmployee);
    handleCloseDialog();
  };

  return (
    <Box>
      <Button variant="contained" color="primary" onClick={handleOpenDialog} sx={{ mb: 2 }}>
        Add Employee
      </Button>

      <List>
        {employees.map((employee) => (
          <ListItem
            key={employee.id}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Grid container alignItems="center">
              <Grid item xs={11}>
                <Typography variant="subtitle1">
                  {employee.name} - {employee.position || 'Position not set'}
                </Typography>
              </Grid>
              <Grid item xs={1}>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEmployee(employee.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </ListItem>
        ))}
      </List>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={newEmployee.name}
            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newEmployee.email}
            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Position"
            fullWidth
            value={newEmployee.position}
            onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Department"
            fullWidth
            value={newEmployee.department}
            onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Join Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={newEmployee.joinDate}
            onChange={(e) => setNewEmployee({ ...newEmployee, joinDate: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
