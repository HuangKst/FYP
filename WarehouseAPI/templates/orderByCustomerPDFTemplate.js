import { formatDate } from '../utils/dateUtils.js';

/**
 * 生成客户订单PDF模板
 * @param {Object} data - 包含客户信息、订单和过滤器的数据对象
 * @returns {String} - 返回HTML字符串
 */
export function generateCustomerOrdersTemplate(data) {
  // 记录收到的数据，便于调试
  console.log('PDF模板收到数据:', JSON.stringify({
    customerName: data.customer?.name,
    ordersCount: data.orders?.length,
    totalUnpaid: data.totalUnpaid,
    hasFilters: Object.keys(data.filters || {}).length > 0
  }));
  
  const { customer, orders, filters = {}, totalUnpaid = 0 } = data;
  
  // 计算订单总数和金额
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
  // 格式化客户信息
  const customerInfo = `
    <div class="info">
      <div class="info-row">
        <div class="info-item"><strong>客户名称:</strong> ${customer.name || 'N/A'}</div>
        <div class="info-item"><strong>联系人:</strong> ${customer.contactPerson || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>电话:</strong> ${customer.phone || 'N/A'}</div>
        <div class="info-item"><strong>邮箱:</strong> ${customer.email || 'N/A'}</div>
      </div>
      <div class="info-row">
        <div class="info-item"><strong>地址:</strong> ${customer.address || 'N/A'}</div>
        <div class="info-item"><strong>报告日期:</strong> ${formatDate(new Date())}</div>
      </div>
    </div>
  `;
  
  // 生成摘要信息
  const summary = `
    <div class="summary-info">
      <h3>订单摘要</h3>
      <table>
        <tr>
          <th>订单总数</th>
          <th>总金额</th>
          <th>未付款总额</th>
        </tr>
        <tr>
          <td>${totalOrders}</td>
          <td>¥${totalAmount.toFixed(2)}</td>
          <td>¥${parseFloat(totalUnpaid).toFixed(2)}</td>
        </tr>
      </table>
    </div>
  `;
  
  // 生成过滤器信息
  let filterInfo = '';
  if (Object.keys(filters).length > 0) {
    const filterItems = [];
    
    if (filters.startDate) {
      filterItems.push(`<li><strong>开始日期:</strong> ${formatDate(new Date(filters.startDate))}</li>`);
    }
    
    if (filters.endDate) {
      filterItems.push(`<li><strong>结束日期:</strong> ${formatDate(new Date(filters.endDate))}</li>`);
    }
    
    if (filters.status) {
      let statusText = filters.status;
      if (filters.status === 'completed') statusText = '已完成';
      if (filters.status === 'pending') statusText = '待处理';
      filterItems.push(`<li><strong>订单状态:</strong> ${statusText}</li>`);
    }
    
    if (filters.paymentStatus) {
      let paymentText = filters.paymentStatus;
      if (filters.paymentStatus === 'paid') paymentText = '已付款';
      if (filters.paymentStatus === 'unpaid') paymentText = '未付款';
      filterItems.push(`<li><strong>支付状态:</strong> ${paymentText}</li>`);
    }
    
    if (filterItems.length > 0) {
      filterInfo = `
        <div class="filter-info">
          <h3>应用的过滤器</h3>
          <ul class="filter-list">${filterItems.join('')}</ul>
        </div>
      `;
    }
  }
  
  // 生成订单列表
  let orderRows = '';
  let orderDetails = '';
  
  orders.forEach((order, index) => {
    // 确保日期格式正确
    let orderDate;
    try {
      orderDate = formatDate(new Date(order.orderDate));
    } catch (e) {
      console.error('日期格式化错误:', e);
      orderDate = order.orderDate || 'N/A';
    }
    
    const paymentStatus = order.paymentStatus === 'paid' ? '已付款' : 
                          order.paymentStatus === 'partial' ? '部分付款' : '未付款';
    
    const orderStatus = 
      order.status === 'pending' ? '待处理' :
      order.status === 'processing' ? '处理中' :
      order.status === 'shipped' ? '已发货' :
      order.status === 'delivered' ? '已送达' :
      order.status === 'completed' ? '已完成' :
      order.status === 'cancelled' ? '已取消' : order.status;
    
    // 添加到订单汇总表
    orderRows += `
      <tr class="${index % 2 === 0 ? 'even-row' : 'odd-row'}">
        <td>${order.orderNumber || `ORD-${order._id?.substring(0, 8)}` || `ORD-${index+1}`}</td>
        <td>${orderDate}</td>
        <td>${orderStatus}</td>
        <td>${paymentStatus}</td>
        <td>¥${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
      </tr>
    `;
    
    // 为每个订单创建详细信息部分
    orderDetails += `
      <div class="order-detail">
        <h3>订单 #${order.orderNumber || `ORD-${order._id?.substring(0, 8)}` || `ORD-${index+1}`}</h3>
        <div class="order-info">
          <div class="info-row">
            <div class="info-item"><strong>订单日期:</strong> ${orderDate}</div>
            <div class="info-item"><strong>订单状态:</strong> ${orderStatus}</div>
          </div>
          <div class="info-row">
            <div class="info-item"><strong>支付状态:</strong> ${paymentStatus}</div>
            <div class="info-item"><strong>订单金额:</strong> ¥${parseFloat(order.totalAmount || 0).toFixed(2)}</div>
          </div>
          ${order.remark ? `<div class="info-row"><div class="info-item"><strong>备注:</strong> ${order.remark}</div></div>` : ''}
        </div>
        ${order.items && order.items.length > 0 ? `
          <table class="items-table">
            <thead>
              <tr>
                <th>物料</th>
                <th>规格</th>
                <th>数量</th>
                <th>单位</th>
                <th>单价</th>
                <th>小计</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.material || 'N/A'}</td>
                  <td>${item.specification || 'N/A'}</td>
                  <td>${item.quantity || 0}</td>
                  <td>${item.unit || 'PCS'}</td>
                  <td>¥${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                  <td>¥${parseFloat(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="5" style="text-align: right;"><strong>总计</strong></td>
                <td><strong>¥${parseFloat(order.totalAmount || 0).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        ` : '<p>此订单没有详细项目信息</p>'}
      </div>
    `;
  });
  
  // 如果没有订单，显示一个提示
  if (!orderRows) {
    orderRows = `
      <tr>
        <td colspan="5" style="text-align:center">未找到符合条件的订单</td>
      </tr>
    `;
    orderDetails = `<p class="no-orders">未找到符合条件的订单</p>`;
  }
  
  // 主HTML模板
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>客户订单报告</title>
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
        <h2>客户订单报告</h2>
      </div>
      
      ${customerInfo}
      
      ${summary}
      
      ${filterInfo}
      
      <div class="orders-list">
        <h3>订单汇总</h3>
        <table>
          <thead>
            <tr>
              <th>订单号</th>
              <th>日期</th>
              <th>状态</th>
              <th>支付状态</th>
              <th>金额</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows}
          </tbody>
        </table>
      </div>
      
      <div class="order-details-section">
        <h3>订单详细信息</h3>
        ${orderDetails}
      </div>
      
      <div class="signature-section">
        <div class="signature-line">
          客户签名
        </div>
      </div>
      
      <div class="footer">
        <p>此报告由仓库管理系统生成于 ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
} 