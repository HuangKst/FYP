import { formatDate } from '../utils/dateUtils.js';

/**
 * Generate customer orders PDF template
 * @param {Object} data - Data object containing customer information, orders and filters
 * @returns {String} - Returns HTML string
 */
export function generateCustomerOrdersTemplate(data) {
  console.log('Generating customer order PDF template, data:', {
    customerName: data.customer?.name,
    ordersCount: data.orders?.length,
    totalUnpaid: data.totalUnpaid,
    showUnpaid: data.showUnpaid
  });
  
  // Print detailed showUnpaid parameter value
  console.log(`showUnpaid parameter value: ${data.showUnpaid}, type: ${typeof data.showUnpaid}`);
  
  // Check if the orders array is complete
  console.log(`Orders received by PDF template: ${data.orders ? data.orders.length : 0}`);
  console.log(`Orders array type: ${Array.isArray(data.orders) ? 'Array' : typeof data.orders}`);
  
  // Print detailed information for each order
  if (data.orders && data.orders.length > 0) {
    console.log('========== START PROCESSING ORDER DETAILS ==========');
    data.orders.forEach((order, index) => {
      console.log(`Processing order ${index+1}/${data.orders.length}:`, {
        id: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        itemsCount: order.items ? order.items.length : 0
      });
      
      // If there are order items, print the first item information
      if (order.items && order.items.length > 0) {
        console.log(`  - Order ${index+1} first item:`, {
          material: order.items[0].material,
          specification: order.items[0].specification,
          quantity: order.items[0].quantity,
          unit_price: order.items[0].unit_price
        });
      } else {
        console.log(`  - Order ${index+1} has no items`);
      }
    });
    console.log('========== END PROCESSING ORDER DETAILS ==========');
  } else {
    console.log('No order data to display or orders array is empty');
  }
  
  const { customer, orders, filters = {}, totalUnpaid = 0, showUnpaid = true } = data;
  
  // Calculate total orders and amount
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
  // Calculate orders by type
  const quoteOrders = orders.filter(order => order.orderType === 'QUOTE');
  const salesOrders = orders.filter(order => order.orderType === 'SALES');
  
  const quoteOrdersCount = quoteOrders.length;
  const quoteOrdersAmount = quoteOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
  const salesOrdersCount = salesOrders.length;
  const salesOrdersAmount = salesOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
  // Format customer information
  const customerInfo = `
    <div class="info">
      <div class="info-row">
        <div class="info-item"><strong>Customer Name:</strong> ${customer.name || 'N/A'}</div>
        <div class="info-item"><strong>Contact Person:</strong> ${customer.contactPerson || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>Phone:</strong> ${customer.phone || 'N/A'}</div>
        <div class="info-item"><strong>Email:</strong> ${customer.email || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>Address:</strong> ${customer.address || 'N/A'}</div>
        <div class="info-item"><strong>Report Date:</strong> ${formatDate(new Date())}</div>
      </div>
    </div>
  `;
  
  // Generate summary information
  const summary = `
    <div class="summary-info">
      <h3>Order Summary</h3>
      <table>
        <tr>
          <th>Type</th>
          <th>Total Orders</th>
          <th>Total Amount</th>
          ${showUnpaid ? '<th>Total Unpaid</th>' : ''}
        </tr>
        ${!filters.orderType || filters.orderType === 'QUOTE' ? `
        <tr>
          <td>Quotes</td>
          <td>${quoteOrdersCount}</td>
          <td>¥${quoteOrdersAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
          ${showUnpaid ? '<td>--</td>' : ''}
        </tr>` : ''}
        ${!filters.orderType || filters.orderType === 'SALES' ? `
        <tr>
          <td>Sales Orders</td>
          <td>${salesOrdersCount}</td>
          <td>¥${salesOrdersAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
          ${showUnpaid ? `<td>¥${parseFloat(totalUnpaid).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>` : ''}
        </tr>` : ''}
        <tr class="total-row">
          <td>Total</td>
          <td>${totalOrders}</td>
          <td>¥${totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
          ${showUnpaid && (!filters.orderType || filters.orderType === 'SALES') ? 
            `<td>¥${parseFloat(totalUnpaid).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>` : 
            showUnpaid ? '<td>--</td>' : ''}
        </tr>
      </table>
    </div>
  `;
  
  // Generate filter information
  let filterInfo = '';
  if (Object.keys(filters).length > 0) {
    const filterItems = [];
    
    if (filters.orderType) {
      let typeText = filters.orderType.toUpperCase();
      if (typeText === 'QUOTE') typeText = 'Quote';
      if (typeText === 'SALES') typeText = 'Sales Order';
      filterItems.push(`<li><strong>Order Type:</strong> ${typeText}</li>`);
    }
    
    if (filters.orderNumber) {
      filterItems.push(`<li><strong>Order Number:</strong> ${filters.orderNumber}</li>`);
    }
    
    if (filters.status) {
      let statusText = filters.status;
      if (filters.status === 'completed') statusText = 'Completed';
      if (filters.status === 'pending') statusText = 'Pending';
      filterItems.push(`<li><strong>Order Status:</strong> ${statusText}</li>`);
    }
    
    if (filters.paymentStatus) {
      let paymentText = filters.paymentStatus;
      if (filters.paymentStatus === 'paid') paymentText = 'Paid';
      if (filters.paymentStatus === 'unpaid') paymentText = 'Unpaid';
      filterItems.push(`<li><strong>Payment Status:</strong> ${paymentText}</li>`);
    }
    
    if (filterItems.length > 0) {
      filterInfo = `
        <div class="filter-info">
          <h3>Applied Filters</h3>
          <ul class="filter-list">${filterItems.join('')}</ul>
        </div>
      `;
    }
  }
  
  // Generate order list
  let orderRows = '';
  let orderDetails = '';
  
  orders.forEach((order, index) => {
    // Ensure date format is correct
    let orderDate;
    try {
      orderDate = formatDate(new Date(order.orderDate));
    } catch (e) {
      console.error('Date formatting error:', e);
      orderDate = order.orderDate || 'N/A';
    }
    
    // Determine order type
    const isQuoteOrder = order.orderType === 'QUOTE';
    
    // For quotes use "--" for payment and completion status, for sales orders show actual status
    const paymentStatus = isQuoteOrder ? '--' : (order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid');
    const orderStatus = isQuoteOrder ? '--' : (order.status === 'pending' ? 'Pending' : 
                                               order.status === 'completed' ? 'Completed' : order.status);
    
    // Order type for summary table display
    const orderType = order.orderType === 'QUOTE' ? 'Quote' : 
                     order.orderType === 'SALES' ? 'Sales Order' : 
                     'Unknown Type';
    
    // Add to order summary table, including order type column
    orderRows += `
      <tr class="${index % 2 === 0 ? 'even-row' : 'odd-row'}">
        <td>${order.orderNumber || `ORD-${order._id?.substring(0, 8)}` || `ORD-${index+1}`}</td>
        <td>${orderDate}</td>
        <td>${orderType}</td>
        <td>${orderStatus}</td>
        <td>${paymentStatus}</td>
        <td>¥${parseFloat(order.totalAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
      </tr>
    `;
    
    // Create detailed information section for each order, add order type
    const itemsTable = order.items && order.items.length > 0 ? `
      <table class="items-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Specification</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.material || 'N/A'}</td>
              <td>${item.specification || 'N/A'}</td>
              <td>${item.quantity || 0}</td>
              <td>${item.unit || 'PCS'}</td>
              <td>¥${parseFloat(item.unit_price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
              <td>¥${parseFloat(item.subtotal || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="5" style="text-align: right;"><strong>Total</strong></td>
            <td><strong>¥${parseFloat(order.totalAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</strong></td>
          </tr>
        </tbody>
      </table>
    ` : '<p>This order has no detailed item information</p>';
    
    orderDetails += `
      <div class="order-detail">
        <h3>Order #${order.orderNumber || `ORD-${order._id?.substring(0, 8)}` || `ORD-${index+1}`}</h3>
        <div class="order-info">
          <div class="info-row">
            <div class="info-item"><strong>Order Type:</strong> ${orderType}</div>
            <div class="info-item"><strong>Order Date:</strong> ${orderDate}</div>
          </div>
          <div class="info-row">
            <div class="info-item"><strong>Order Status:</strong> ${orderStatus}</div>
            <div class="info-item"><strong>Payment Status:</strong> ${paymentStatus}</div>
          </div>
          <div class="info-row">
            <div class="info-item"><strong>Order Amount:</strong> ¥${parseFloat(order.totalAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
            ${order.remark ? `<div class="info-item"><strong>Remarks:</strong> ${order.remark}</div>` : ''}
          </div>
        </div>
        ${itemsTable}
      </div>
    `;
  });
  
  // If no orders, show a message
  if (!orderRows) {
    orderRows = `
      <tr>
        <td colspan="5" style="text-align:center">No orders found matching the criteria</td>
      </tr>
    `;
    orderDetails = `<p class="no-orders">No orders found matching the criteria</p>`;
  }
  
  // Main HTML template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Customer Order Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 10px; 
          font-size: 10pt;
          line-height: 1.4;
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          padding-bottom: 10px;
          border-bottom: 2px solid #2c3e50;
        }
        .header h1 {
          font-size: 16pt;
          margin-bottom: 5px;
          color: #2c3e50;
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
          border-top: 1px solid #ddd;
          padding-top: 10px;
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
        .even-row {
          background-color: #f9f9f9;
        }
        .odd-row {
          background-color: #ffffff;
        }
        .summary-info, .filter-info {
          margin-bottom: 20px;
        }
        .summary-info table {
          border: 1px solid #ddd;
        }
        .summary-info th {
          background-color: #f2f2f2;
          padding: 8px;
        }
        .summary-info td {
          padding: 8px;
        }
        .summary-info tr.total-row {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .summary-info tr.total-row td {
          border-top: 2px solid #ddd;
        }
        h3 {
          color: #2c3e50;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-top: 20px;
          font-size: 12pt;
        }
        .filter-list {
          margin: 0;
          padding-left: 20px;
        }
        .order-detail {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .items-table {
          font-size: 8pt;
        }
        .no-orders {
          text-align: center;
          color: #666;
          font-style: italic;
        }
        .signature-section {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 150px;
          padding-top: 5px;
          text-align: center;
          font-size: 9pt;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Smart Steel</h1>
        <h2>Customer Order Report</h2>
      </div>
      
      ${customerInfo}
      
      ${summary}
      
      ${filterInfo}
      
      <div class="orders-list">
        <h3>Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Payment Status</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows}
          </tbody>
        </table>
      </div>
      
      <div class="order-details-section">
        <h3>Order Details</h3>
        ${orderDetails}
      </div>
      
      <div class="signature-section">
        <div class="signature-line">
          Customer Signature
        </div>
      </div>
      
      <div class="footer">
        <p>This report was generated by Warehouse Management System on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
} 