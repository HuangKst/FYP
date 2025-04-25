import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Print directly from DOM element using iframe to avoid breaking React state
export const printElement = (elementId) => {
  const printContent = document.getElementById(elementId);
  if (!printContent) return;
  
  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  document.body.appendChild(iframe);
  
  // Get iframe document and write content
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <html>
      <head>
        <style>
          @page { 
            size: auto; 
            margin: 10mm; 
            margin-top: 0;
            margin-bottom: 0;
          }
          /* Hide header and footer */
          @media print {
            html, body { height: 99%; }
            body { margin: 0 !important; padding: 5px !important; }
            /* Remove browser default headers and footers */
            html {
              -webkit-print-color-adjust: exact;
            }
            /* Ensure tables aren't truncated when printing */
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td { word-wrap: break-word; }
            .disclaimer-box { page-break-inside: avoid; }
          }
          body { font-family: Arial, sans-serif; padding: 10px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; table-layout: fixed; }
          th, td { border: 1px solid #ddd; padding: 4px; text-align: left; font-size: 10px; overflow: hidden; text-overflow: ellipsis; }
          th { background-color: #f2f2f2; }
          h5 { text-align: center; margin: 8px 0; font-size: 16px; }
          h6, .subtitle1 { font-size: 13px; font-weight: bold; margin: 5px 0; }
          .divider { border-top: 1px solid #ddd; margin: 8px 0; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
          
          /* Grid layout */
          .MuiGrid-container { display: flex; flex-wrap: wrap; margin: -4px; }
          .MuiGrid-item { flex: 0 0 auto; padding: 4px; box-sizing: border-box; }
          .MuiGrid-grid-xs-3 { flex-basis: 25%; max-width: 25%; }
          .MuiGrid-grid-xs-6 { flex-basis: 50%; max-width: 50%; }
          
          /* Font sizes */
          .smaller-text { font-size: 10px; }
          .small-text { font-size: 11px; }
          .normal-text { font-size: 12px; }
          
          /* Company header style */
          h4 { margin-bottom: 3px; color: #333; font-size: 18px; }
          
          /* Disclaimer style */
          .disclaimer-box { 
            border: 1px solid #ddd; 
            padding: 6px; 
            margin: 10px 0; 
            background-color: #f9f9f9; 
          }
          .disclaimer-title { 
            font-weight: bold; 
            margin-bottom: 3px; 
            font-size: 11px; 
          }
          .disclaimer-text { 
            font-size: 6px; 
            line-height: 1.2; 
            display: block;
            margin-bottom: 2px;
          }
          .disclaimer-text strong {
            font-weight: bold;
          }
          
          /* Signature area style */
          .signature-line {
            border-top: 1px solid #000;
            width: 150px;
            margin-top: 15px;
            margin-left: auto;
            padding-top: 3px;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${printContent.innerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();
  
  // Wait for iframe to load before printing
  iframe.onload = () => {
    // Print
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Remove iframe after print dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 500);
  };
};

// Export DOM element as PDF - using backend API
export const exportToPDF = async (elementId, filename = 'order.pdf') => {
  let loadingToast = null;
  
  try {
    // Get order ID (from URL)
    const pathParts = window.location.pathname.split('/');
    const orderId = pathParts[pathParts.length - 1];
    
    // Confirm we have a valid order ID
    if (!orderId || isNaN(parseInt(orderId))) {
      throw new Error('Unable to get order ID');
    }
    
    // Build API URL
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL ;
    const url = `${apiBaseUrl}/orders/${orderId}/pdf`;
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Authentication token not found, PDF generation may fail');
    }
    
    // Create request headers
    const headers = {
      'Accept': 'application/pdf',
    };
    
    // Add authentication token (if exists)
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Create download status notification
    loadingToast = document.createElement('div');
    loadingToast.style.position = 'fixed';
    loadingToast.style.bottom = '20px';
    loadingToast.style.right = '20px';
    loadingToast.style.background = 'rgba(0, 0, 0, 0.7)';
    loadingToast.style.color = 'white';
    loadingToast.style.padding = '10px 20px';
    loadingToast.style.borderRadius = '4px';
    loadingToast.style.zIndex = '9999';
    loadingToast.textContent = 'Generating PDF, please wait...';
    document.body.appendChild(loadingToast);
    
    console.log(`Initiating PDF export request: ${url}, Order ID: ${orderId}`);
    console.log('Request headers:', headers);
    
    try {
      // Make request to get PDF - using fetch API to handle binary response manually
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      console.log('PDF export request response status:', response.status, response.statusText);
      console.log('Response headers:', [...response.headers.entries()].map(h => `${h[0]}: ${h[1]}`).join(', '));
      
      if (!response.ok) {
        let errorMessage = `Status code: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          console.error('Error response content:', errorText);
          errorMessage += ` - ${errorText}`;
        } catch (e) {
          console.error('Unable to parse error response:', e);
        }
        throw new Error(`PDF export failed: ${errorMessage}`);
      }
      
      // Get PDF data - explicitly use arrayBuffer() instead of blob()
      const arrayBuffer = await response.arrayBuffer();
      console.log('Received ArrayBuffer data size:', arrayBuffer.byteLength, 'bytes');
      
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Exported PDF file size is 0, generation may have failed');
      }
      
      // Create Blob object - explicitly specify MIME type
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      console.log('Created Blob object:', blob.size, 'bytes, type:', blob.type);
      
      // Remove loading notification
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
        loadingToast = null;
      }
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Download or preview PDF
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = downloadUrl;
      a.download = filename || `order-${orderId}.pdf`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      
      // Clean up resources
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }, 200);
      
      console.log('PDF download initiated');
      
    } catch (error) {
      // Remove loading notification (if still exists)
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
        loadingToast = null;
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    
    // Ensure loading notification is removed
    if (loadingToast && document.body.contains(loadingToast)) {
      document.body.removeChild(loadingToast);
    }
    
    // Show friendly error message
    alert(`PDF export failed: ${error.message}`);
  }
};