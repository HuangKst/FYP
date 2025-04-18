import React, { useState, useEffect } from 'react';
import { getCustomers, addCustomer, deleteCustomer } from '../api/customerApi';
import { useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Pagination from '../component/Pagination';

const CustomerPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '', remark: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1
  });

  useEffect(() => {
    fetchCustomers();
  }, [page, pageSize]); // 页码或每页数量变化时重新加载

  // 确保分页数据完整性
  const ensurePaginationData = (paginationData) => {
    return {
      total: paginationData?.total || 0,
      page: paginationData?.page || page,
      pageSize: paginationData?.pageSize || pageSize,
      totalPages: paginationData?.totalPages || 1
    };
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await getCustomers(searchInput, page, pageSize);
      if (response.success) {
        setCustomers(response.customers || []);
        setPagination(ensurePaginationData(response.pagination));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // 重置到第一页
    fetchCustomers();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 处理页码变化
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // 处理每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
  };

  const handleAddCustomer = async () => {
    const customerData = { ...newCustomer };
    if (customerData.remark === '') {
      customerData.remark = null;
    }
    
    const response = await addCustomer(customerData);
    if (response.success) {
      fetchCustomers();
      setNewCustomer({ name: '', phone: '', address: '', remark: '' });
      setOpenDialog(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    const response = await deleteCustomer(customerId);
    if (response.success) {
      // 如果当前页只有一条数据且不是第一页，则返回上一页
      if (customers.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        // 否则重新加载当前页
        fetchCustomers();
      }
    }
  };

  const handleViewCustomerDetail = (customerId) => {
    navigate(`/customers/${customerId}`);
  };

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
            Customer Management
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
            Manage customer information and relationships
          </Typography>
        </Paper>

        <Box sx={{ flex: 1, p: 3, backgroundColor: '#f5f5f5', overflowY: 'auto' }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Search customer by name"
                  variant="outlined"
                  sx={{ maxWidth: '350px', flexGrow: 1 }}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSearch} edge="end">
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
                >
                  Add Customer
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Total Debt</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No customers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map(customer => (
                        <TableRow key={customer.id}>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.address}</TableCell>
                          <TableCell>
                            ¥{parseFloat(customer.total_debt || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                color="primary"
                                variant="outlined"
                                size="small"
                                onClick={() => handleViewCustomerDetail(customer.id)}
                              >
                                Details
                              </Button>
                              <Button 
                                color="error" 
                                variant="outlined"
                                size="small"
                                onClick={() => handleDeleteCustomer(customer.id)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 使用通用分页组件 */}
              <Pagination 
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
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
          <TextField
            label="Address"
            fullWidth
            margin="normal"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
          />
          <TextField
            label="Remark"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={newCustomer.remark}
            onChange={(e) => setNewCustomer({ ...newCustomer, remark: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCustomer} variant="contained" color="primary">Add</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerPage;
