import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

/**
 * Reusable pagination component with page size selector
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination data object containing total, page, pageSize, totalPages
 * @param {Function} props.onPageChange - Function to call when page changes
 * @param {Function} props.onPageSizeChange - Function to call when page size changes
 * @param {Array} props.pageSizeOptions - Available page size options (default: [5, 10, 20, 50])
 * @param {boolean} props.showTotal - Whether to show the total count (default: true)
 * @param {string} props.totalLabel - Label for total count (default: "Total: {total} items")
 * @returns {JSX.Element}
 */
const Pagination = ({
  pagination = { total: 0, page: 1, pageSize: 10, totalPages: 0 },
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showTotal = true,
  totalLabel = "Total: {total} items"
}) => {
  // Handle page change
  const handlePageChange = (event, newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    if (onPageSizeChange) {
      onPageSizeChange(parseInt(event.target.value));
    }
  };

  // Format total label
  const formattedTotalLabel = totalLabel.replace('{total}', pagination.total);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2, mb: 2 }}>
      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="page-size-select-label">Items per page</InputLabel>
        <Select
          labelId="page-size-select-label"
          id="page-size-select"
          value={pagination.pageSize.toString()}
          label="Items per page"
          onChange={handlePageSizeChange}
        >
          {pageSizeOptions.map(size => (
            <MenuItem key={size} value={size}>
              {size} items
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <MuiPagination 
        count={pagination.totalPages} 
        page={pagination.page} 
        onChange={handlePageChange}
        color="primary"
        showFirstButton
        showLastButton
      />
      
      {showTotal && (
        <Typography variant="body2" sx={{ ml: 2 }}>
          {formattedTotalLabel}
        </Typography>
      )}
    </Box>
  );
};

export default Pagination; 