import React, { useState } from 'react';
import { Button, Tooltip, Snackbar, Alert } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { exportPDF } from '../utils/pdfExporter';

/**
 * 通用PDF导出按钮组件
 * @param {Object} props - 组件属性
 * @param {string} props.url - API端点URL
 * @param {Object} props.queryParams - 查询参数对象
 * @param {string} props.filename - 下载的文件名
 * @param {string} props.tooltip - 鼠标悬停提示
 * @param {Function} props.onExportStart - 导出开始回调
 * @param {Function} props.onExportSuccess - 导出成功回调
 * @param {Function} props.onExportError - 导出错误回调
 * @param {Function} props.onExportComplete - 导出完成回调
 * @param {boolean} props.disabled - 是否禁用按钮
 * @param {Object} props.buttonProps - 传递给Button组件的其他属性
 */
const PdfExportButton = ({
  url,
  queryParams = {},
  filename = 'export.pdf',
  tooltip = '导出PDF',
  onExportStart,
  onExportSuccess,
  onExportError,
  onExportComplete,
  disabled = false,
  buttonProps = {},
  children
}) => {
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // 显示通知消息
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // 关闭通知消息
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 处理导出点击
  const handleExport = () => {
    if (exporting) return;
    
    setExporting(true);
    if (onExportStart) onExportStart();
    
    // 显示开始导出提示
    showSnackbar('正在生成PDF，请稍候...', 'info');
    
    // 调用PDF导出工具
    exportPDF(
      url,
      queryParams,
      filename,
      // 成功回调
      () => {
        showSnackbar('PDF已生成，开始下载', 'success');
        if (onExportSuccess) onExportSuccess();
      },
      // 错误回调
      (error) => {
        console.error('PDF导出失败:', error);
        showSnackbar(`PDF导出失败: ${error.message || '未知错误'}`, 'error');
        if (onExportError) onExportError(error);
      },
      // 完成回调
      () => {
        setExporting(false);
        if (onExportComplete) onExportComplete();
      }
    );
  };

  return (
    <>
      <Tooltip title={tooltip}>
        <span>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExport}
            disabled={disabled || exporting}
            {...buttonProps}
          >
            {children || (exporting ? '导出中...' : '导出PDF')}
          </Button>
        </span>
      </Tooltip>
      
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
    </>
  );
};

export default PdfExportButton; 