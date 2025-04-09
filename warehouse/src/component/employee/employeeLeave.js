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
  MenuItem,
  Grid
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const EmployeeLeave = ({
  leaves,
  employees,
  onAddLeave,
  onDeleteLeave,
  getEmployeeName
}) => {
  // Move form state into component
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employee_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  });

  // Handle add leave
  const handleAddLeave = () => {
    onAddLeave(newLeave);
    handleCloseDialog();
  };

  // Handle delete leave
  const handleDeleteLeave = (id) => {
    if (window.confirm('Are you sure you want to delete this leave record?')) {
      onDeleteLeave(id);
    }
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setOpenAddDialog(false);
    setNewLeave({
      employee_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
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

      <Dialog
        open={openAddDialog}
        onClose={handleCloseDialog}
        aria-labelledby="add-leave-dialog-title"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleAddLeave} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeLeave;
