import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Box,
  Divider,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { printElement, exportToPDF } from '../../utils/printUtils';

const OrderPrintPreview = ({ order, open, onClose }) => {
  const printRef = useRef(null);

  // 处理打印
  const handlePrint = () => {
    printElement('order-print-content');
  };

  // 处理导出PDF
  const handleExportPDF = () => {
    exportToPDF('order-print-content', `Order-${order?.order_number || 'export'}.pdf`);
  };

  if (!order) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ style: { maxHeight: '90vh', maxWidth: '90vw' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Order Preview</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Paper elevation={2} sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
            <Box id="order-print-content" ref={printRef} sx={{ width: '100%', overflow: 'visible' }}>
              <Box sx={{ textAlign: 'center', mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
                  Smart Steel
                </Typography>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 1 }}>
                Order Details: {order.order_number}
              </Typography>
              
              <Grid container spacing={1} sx={{ fontSize: '0.85rem', mb: 1 }}>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>Order Type</Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>{order.order_type === 'QUOTE' ? 'Quote' : 'Sales'}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>Customer</Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    {order.Customer ? order.Customer.name : 'Unknown'}
                    {order.Customer?.address && (
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                        {order.Customer.address}
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>Created Date</Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>{new Date(order.created_at).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>Created By</Typography>
                  <Typography sx={{ fontSize: '0.8rem' }}>
                    {order.User ? order.User.username : 'Unknown'}
                    {order.User?.role && ` (${order.User.role})`}
                  </Typography>
                </Grid>
                
                {order.order_type === 'SALES' && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>Payment Status</Typography>
                      <Typography sx={{ fontSize: '0.8rem' }}>{order.is_paid ? 'Paid' : 'Unpaid'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ fontSize: '0.8rem' }}>Completion Status</Typography>
                      <Typography sx={{ fontSize: '0.8rem' }}>{order.is_completed ? 'Completed' : 'In Progress'}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 0.5 }}>Order Items</Typography>
              <TableContainer>
                <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell width="15%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Material</TableCell>
                      <TableCell width="15%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Specification</TableCell>
                      <TableCell width="10%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Quantity</TableCell>
                      <TableCell width="10%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Unit</TableCell>
                      <TableCell width="10%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Weight</TableCell>
                      <TableCell width="10%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Unit Price</TableCell>
                      <TableCell width="15%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Subtotal</TableCell>
                      <TableCell width="15%" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(order.OrderItems || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.material}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.specification}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.quantity}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.unit}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.weight || '-'}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.unit_price}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.subtotal}</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>{item.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={6} align="right" sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>Total Amount</Typography>
                      </TableCell>
                      <TableCell colSpan={2} sx={{ fontSize: '0.75rem', py: 0.5, px: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontSize: '0.75rem' }}>
                          ¥{order.total_price || (order.OrderItems || []).reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {order.remark && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Remarks</Typography>
                  <Paper variant="outlined" sx={{ p: 1 }}>
                    <Typography sx={{ fontSize: '0.75rem' }}>{order.remark}</Typography>
                  </Paper>
                </Box>
              )}
              
              <Box className="disclaimer-box" sx={{ mt: 2, mb: 1, border: '1px solid #ddd', p: 1 }}>
                <Typography className="disclaimer-title" variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', fontSize: '0.75rem', mb: 0.5 }}>Disclaimer</Typography>
                <Box sx={{ fontSize: '6px', lineHeight: 1.2 }}>
                  <Typography className="disclaimer-text" variant="caption" paragraph sx={{ mb: 0.2 }}>
                    <strong>1. Product Information:</strong> The specifications, models, quantities, and prices of the products listed in this order form are confirmed by the customer before the order is generated. If there are any special requirements, please inform us before placing the order. Otherwise, we will process the order according to standard procedures, and any resulting consequences shall be borne by the customer.
                  </Typography>
                  <Typography className="disclaimer-text" variant="caption" paragraph sx={{ mb: 0.2 }}>
                    <strong>2. Delivery Time and Method:</strong> We will make every effort to deliver the goods as agreed. However, we shall not be held responsible for any delays or failure in delivery caused by force majeure events (such as natural disasters, transportation delays, policy changes, etc.).
                  </Typography>
                  <Typography className="disclaimer-text" variant="caption" paragraph sx={{ mb: 0.2 }}>
                    <strong>3. Payment Terms:</strong> The customer shall make payment in accordance with the agreed method and within the specified time frame. In case of delayed payment, we reserve the right to suspend the supply until full payment is received, and we shall not be liable for any losses caused as a result.
                  </Typography>
                  <Typography className="disclaimer-text" variant="caption" paragraph sx={{ mb: 0.2 }}>
                    <strong>4. Return and Exchange Policy:</strong> Unless due to quality issues, products confirmed in the order may not be returned or exchanged. If any quality issues are found, a written notice along with relevant evidence must be submitted within 7 working days after receipt. Late claims will be deemed as acceptance of the goods.
                  </Typography>
                  <Typography className="disclaimer-text" variant="caption" paragraph sx={{ mb: 0.2 }}>
                    <strong>5. Intellectual Property Rights:</strong> The customer shall ensure that any designs, drawings, or other materials provided do not infringe on any third-party intellectual property rights. The customer shall bear full responsibility for any disputes arising therefrom.
                  </Typography>
                  <Typography className="disclaimer-text" variant="caption">
                    <strong>6. Final Interpretation Right:</strong> This disclaimer is an integral part of the order form. We reserve the right of final interpretation of its contents.
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Box className="signature-line">
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>Customer Signature</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                  This document was generated by Smart Steel - {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="contained" 
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          color="primary"
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderPrintPreview; 