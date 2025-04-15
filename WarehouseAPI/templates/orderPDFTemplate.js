/**
 * 订单PDF模板生成函数
 * @param {Object} orderData - 订单数据对象
 * @returns {string} - 返回HTML模板字符串
 */
export const generateOrderTemplate = (orderData) => {
  // 确保数据安全性，防止undefined值
  const safeData = {
    order_number: orderData.order_number || 'N/A',
    order_type: orderData.order_type || 'N/A',
    created_at: orderData.created_at || 'N/A',
    total_price: orderData.total_price || '0.00',
    is_paid: orderData.is_paid || false,
    is_completed: orderData.is_completed || false,
    is_sales: orderData.is_sales || false,
    remark: orderData.remark || '',
    Customer: {
      name: orderData.Customer?.name || '未知客户',
      address: orderData.Customer?.address || ''
    },
    User: {
      username: orderData.User?.username || '未知用户',
      role: orderData.User?.role || ''
    },
    order_items: Array.isArray(orderData.order_items) ? orderData.order_items : [],
    generated_date: orderData.generated_date || new Date().toLocaleDateString()
  };

  // 构建表格行HTML
  const tableRows = safeData.order_items.map(item => `
    <tr>
      <td>${item.material || ''}</td>
      <td>${item.specification || ''}</td>
      <td>${item.quantity || ''}</td>
      <td>${item.unit || ''}</td>
      <td>${item.unit_price || ''}</td>
      <td>${item.subtotal || ''}</td>
    </tr>
  `).join('');
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Order ${safeData.order_number}</title>
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
      .disclaimer-box {
        margin-top: 20px;
        border: 1px solid #ddd;
        padding: 10px;
        background-color: #f9f9f9;
        font-size: 8pt;
      }
      .disclaimer-title {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 9pt;
      }
      .disclaimer-text {
        margin-bottom: 5px;
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
      <h2>Order: ${safeData.order_number}</h2>
    </div>

    <div class="info">
      <div class="info-row">
        <div class="info-item"><strong>Order Type:</strong> ${safeData.order_type}</div>
        <div class="info-item"><strong>Customer:</strong> ${safeData.Customer.name}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>Created Date:</strong> ${safeData.created_at}</div>
        <div class="info-item"><strong>Created By:</strong> ${safeData.User.username}</div>
      </div>
      ${safeData.is_sales ? `
      <div class="info-row">
        <div class="info-item"><strong>Payment Status:</strong> ${safeData.is_paid ? 'Paid' : 'Unpaid'}</div>
        <div class="info-item"><strong>Completion Status:</strong> ${safeData.is_completed ? 'Completed' : 'In Progress'}</div>
      </div>
      ` : ''}
    </div>

    <h3>Order Items</h3>
    <table>
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
        ${tableRows}
        <tr>
          <td colspan="5" style="text-align: right;"><strong>Total Amount</strong></td>
          <td><strong>${safeData.total_price}</strong></td>
        </tr>
      </tbody>
    </table>

    ${safeData.remark ? `
    <h3>Remarks</h3>
    <p>${safeData.remark}</p>
    ` : ''}

    <div class="disclaimer-box">
      <div class="disclaimer-title">Disclaimer</div>
      <div class="disclaimer-text"><strong>1. Product Information:</strong> The specifications, models, quantities, and prices of the products listed in this order form are confirmed by the customer before the order is generated. If there are any special requirements, please inform us before placing the order. Otherwise, we will process the order according to standard procedures, and any resulting consequences shall be borne by the customer.</div>
      <div class="disclaimer-text"><strong>2. Delivery Time and Method:</strong> We will make every effort to deliver the goods as agreed. However, we shall not be held responsible for any delays or failure in delivery caused by force majeure events (such as natural disasters, transportation delays, policy changes, etc.).</div>
      <div class="disclaimer-text"><strong>3. Payment Terms:</strong> The customer shall make payment in accordance with the agreed method and within the specified time frame. In case of delayed payment, we reserve the right to suspend the supply until full payment is received, and we shall not be liable for any losses caused as a result.</div>
      <div class="disclaimer-text"><strong>4. Return and Exchange Policy:</strong> Unless due to quality issues, products confirmed in the order may not be returned or exchanged. If any quality issues are found, a written notice along with relevant evidence must be submitted within 7 working days after receipt. Late claims will be deemed as acceptance of the goods.</div>
      <div class="disclaimer-text"><strong>5. Intellectual Property Rights:</strong> The customer shall ensure that any designs, drawings, or other materials provided do not infringe on any third-party intellectual property rights. The customer shall bear full responsibility for any disputes arising therefrom.</div>
      <div class="disclaimer-text"><strong>6. Final Interpretation Right:</strong> This disclaimer is an integral part of the order form. We reserve the right of final interpretation of its contents.</div>
    </div>

    <div class="signature-section">
      <div class="signature-line">
        Customer Signature
      </div>
    </div>

    <div class="footer">
      This document was generated by Smart Steel - ${safeData.generated_date}
    </div>
  </body>
  </html>`;
}; 