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
      maxWidth="md" 
      fullWidth
      PaperProps={{ style: { maxHeight: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">订单预览</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
            <Box id="order-print-content" ref={printRef}>
              <Typography variant="h5" gutterBottom align="center">
                订单详情: {order.order_number}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">订单类型</Typography>
                  <Typography>{order.order_type === 'QUOTE' ? '报价单' : '销售单'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">客户</Typography>
                  <Typography>
                    {order.Customer ? order.Customer.name : '未知'}
                    {order.Customer?.address && (
                      <Typography variant="body2" color="textSecondary">
                        {order.Customer.address}
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">创建日期</Typography>
                  <Typography>{new Date(order.created_at).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">创建者</Typography>
                  <Typography>
                    {order.User ? order.User.username : '未知'}
                    {order.User?.role && ` (${order.User.role})`}
                  </Typography>
                </Grid>
                
                {order.order_type === 'SALES' && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">支付状态</Typography>
                      <Typography>{order.is_paid ? '已付款' : '未付款'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">完成状态</Typography>
                      <Typography>{order.is_completed ? '已完成' : '处理中'}</Typography>
                    </Grid>
                  </>
                )}
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Typography variant="h6" gutterBottom>订单项目</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>物料</TableCell>
                      <TableCell>规格</TableCell>
                      <TableCell>数量</TableCell>
                      <TableCell>单位</TableCell>
                      <TableCell>重量</TableCell>
                      <TableCell>单价</TableCell>
                      <TableCell>小计</TableCell>
                      <TableCell>备注</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(order.OrderItems || []).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.material}</TableCell>
                        <TableCell>{item.specification}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.weight || '-'}</TableCell>
                        <TableCell>{item.unit_price}</TableCell>
                        <TableCell>{item.subtotal}</TableCell>
                        <TableCell>{item.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={6} align="right">
                        <Typography variant="subtitle1">总金额</Typography>
                      </TableCell>
                      <TableCell colSpan={2}>
                        <Typography variant="subtitle1">
                          ¥{order.total_price || (order.OrderItems || []).reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              {order.remark && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>备注</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography>{order.remark}</Typography>
                  </Paper>
                </Box>
              )}
              
              <Box sx={{ mt: 4, mb: 2, borderTop: '1px solid #ddd', pt: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  此文档由仓库管理系统生成 - {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>关闭</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          variant="outlined" 
          startIcon={<PictureAsPdfIcon />}
          onClick={handleExportPDF}
          sx={{ mr: 1 }}
        >
          导出PDF
        </Button>
        <Button 
          variant="contained" 
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          color="primary"
        >
          打印
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderPrintPreview; 