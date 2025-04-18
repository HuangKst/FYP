import React, { useState } from 'react';
import { Button, Tooltip, Snackbar, Alert } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { exportPDF } from '../utils/pdfExporter';

/**
 * Generic PDF Export Button Component
 * @param {Object} props - Component properties
 * @param {string} props.url - API endpoint URL
 * @param {Object} props.queryParams - Query parameters object
 * @param {string} props.filename - Downloaded filename
 * @param {string} props.tooltip - Mouse hover tooltip
 * @param {Function} props.onExportStart - Export start callback
 * @param {Function} props.onExportSuccess - Export success callback
 * @param {Function} props.onExportError - Export error callback
 * @param {Function} props.onExportComplete - Export complete callback
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Object} props.buttonProps - Other properties passed to Button component
 */
const PdfExportButton = ({
  url,
  queryParams = {},
  filename = 'export.pdf',
  tooltip = 'Export PDF',
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

  // Show notification message
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Close notification message
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle export click
  const handleExport = () => {
    if (exporting) return;
    
    setExporting(true);
    if (onExportStart) onExportStart();
    
    // Show export start notification
    showSnackbar('Generating PDF, please wait...', 'info');
    
    // Call PDF export utility
    exportPDF(
      url,
      queryParams,
      filename,
      // Success callback
      () => {
        showSnackbar('PDF generated, download started', 'success');
        if (onExportSuccess) onExportSuccess();
      },
      // Error callback
      (error) => {
        console.error('PDF export failed:', error);
        showSnackbar(`PDF export failed: ${error.message || 'Unknown error'}`, 'error');
        if (onExportError) onExportError(error);
      },
      // Complete callback
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
            {children || (exporting ? 'Exporting...' : 'Export PDF')}
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