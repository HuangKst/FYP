import React, { useState, useEffect } from 'react';
import { getCustomers, addCustomer, deleteCustomer } from '../api/customerApi';
import { TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Typography, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const customersPerPage = 20;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const response = await getCustomers();
    if (response.success) {
      setCustomers(response.customers);
    }
  };

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleAddCustomer = async () => {
    const response = await addCustomer(newCustomer);
    if (response.success) {
      fetchCustomers();
      setNewCustomer({ name: '', phone: '' });
      setOpenDialog(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    const response = await deleteCustomer(customerId);
    if (response.success) {
      fetchCustomers();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Customer List</Typography>
      <TextField
        label="Search customer by name"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={() => setOpenDialog(true)} sx={{ mb: 2 }}>
        Add Customer
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentCustomers.map(customer => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  <Button color="secondary" onClick={() => handleDeleteCustomer(customer.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={Math.ceil(filteredCustomers.length / customersPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Customer</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />
          <TextField
            label="Phone"
            fullWidth
            margin="normal"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerPage;
