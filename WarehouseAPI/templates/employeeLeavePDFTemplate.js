/**
 * Employee Leave Records PDF Template Generation Function
 * @param {Object} data - Leave data object
 * @returns {string} - Returns HTML template string
 */
export const generateLeaveTemplate = (data) => {
  // Ensure data safety
  const safeData = {
    employee: data.employee || {},
    leaves: Array.isArray(data.leaves) ? data.leaves : [],
    filterStartDate: data.filterStartDate || '',
    filterEndDate: data.filterEndDate || '',
    totalDays: data.totalDays || '0',
    generatedDate: new Date().toLocaleDateString()
  };

  // Build table row HTML
  const tableRows = safeData.leaves.map(item => `
    <tr>
      <td>${new Date(item.start_date).toLocaleDateString() || '-'}</td>
      <td>${new Date(item.end_date).toLocaleDateString() || '-'}</td>
      <td>${item.reason || '-'}</td>
      <td>${new Date(item.created_at).toLocaleString() || '-'}</td>
    </tr>
  `).join('');
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Employee Leave Records</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        padding: 10px; 
        font-size: 10pt;
        line-height: 1.4;
      }
      .header { 
        text-align: center; 
        margin-bottom: 20px; 
      }
      .header h1 {
        font-size: 16pt;
        margin-bottom: 5px;
      }
      .header h2 {
        font-size: 14pt;
        margin-top: 0;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 15px 0; 
      }
      th, td { 
        border: 1px solid #ddd; 
        padding: 5px; 
        text-align: left; 
        font-size: 9pt;
      }
      th { 
        background-color: #f2f2f2; 
      }
      .footer { 
        margin-top: 20px; 
        font-size: 8pt; 
        text-align: center;
        color: #666;
      }
      .info {
        margin-bottom: 15px;
      }
      .info-row {
        display: flex;
        flex-wrap: wrap;
        margin-bottom: 5px;
      }
      .info-item {
        width: 50%;
        padding: 3px 0;
      }
      .summary {
        margin-top: 20px;
        margin-bottom: 10px;
        padding: 10px;
        background-color: #f9f9f9;
        border: 1px solid #ddd;
      }
      .summary-title {
        font-weight: bold;
        font-size: 12pt;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Smart Steel</h1>
      <h2>Employee Leave Records</h2>
    </div>

    <div class="info">
      <div class="info-row">
        <div class="info-item"><strong>Employee ID:</strong> ${safeData.employee.id || '-'}</div>
        <div class="info-item"><strong>Employee Name:</strong> ${safeData.employee.name || '-'}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>Department:</strong> ${safeData.employee.department || '-'}</div>
        <div class="info-item"><strong>Position:</strong> ${safeData.employee.position || '-'}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>Date Range:</strong> ${safeData.filterStartDate ? new Date(safeData.filterStartDate).toLocaleDateString() : 'All'} - ${safeData.filterEndDate ? new Date(safeData.filterEndDate).toLocaleDateString() : 'All'}</div>
        <div class="info-item"><strong>Total Records:</strong> ${safeData.leaves.length}</div>
      </div>
    </div>

    <h3>Leave Records</h3>
    <table>
      <thead>
        <tr>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Reason</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-title">Summary</div>
      <div><strong>Total Leave Days:</strong> ${safeData.totalDays}</div>
    </div>

    <div class="footer">
      This document was generated by Smart Steel System - ${safeData.generatedDate}
    </div>
  </body>
  </html>`;
}; 