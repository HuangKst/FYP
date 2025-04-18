import { formatDate } from '../utils/dateUtils.js';

/**
 * 生成客户订单PDF模板
 * @param {Object} data - 包含客户信息、订单和过滤器的数据对象
 * @returns {String} - 返回HTML字符串
 */
export function generateCustomerOrdersTemplate(data) {
  console.log('生成客户订单PDF模板，数据:', {
    customerName: data.customer?.name,
    ordersCount: data.orders?.length,
    totalUnpaid: data.totalUnpaid,
    showUnpaid: data.showUnpaid
  });
  
  // 详细打印showUnpaid参数值
  console.log(`showUnpaid参数值: ${data.showUnpaid}, 类型: ${typeof data.showUnpaid}`);
  
  // 检查订单数组是否完整
  console.log(`PDF模板收到的订单数量: ${data.orders ? data.orders.length : 0}`);
  console.log(`订单数组类型: ${Array.isArray(data.orders) ? 'Array' : typeof data.orders}`);
  
  // 详细打印每个订单的信息
  if (data.orders && data.orders.length > 0) {
    console.log('========== 开始处理订单详情 ==========');
    data.orders.forEach((order, index) => {
      console.log(`处理订单 ${index+1}/${data.orders.length}:`, {
        id: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        itemsCount: order.items ? order.items.length : 0
      });
      
      // 如果有订单项，打印第一个订单项信息
      if (order.items && order.items.length > 0) {
        console.log(`  - 订单${index+1}的第一个订单项:`, {
          material: order.items[0].material,
          specification: order.items[0].specification,
          quantity: order.items[0].quantity,
          unit_price: order.items[0].unit_price
        });
      } else {
        console.log(`  - 订单${index+1}无订单项`);
      }
    });
    console.log('========== 结束处理订单详情 ==========');
  } else {
    console.log('没有订单数据可显示或订单数组为空');
  }
  
  const { customer, orders, filters = {}, totalUnpaid = 0, showUnpaid = true } = data;
  
  // 计算订单总数和金额
  const totalOrders = orders.length;
  const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
  // 按类型分类计算订单数据
  const quoteOrders = orders.filter(order => order.orderType === 'QUOTE');
  const salesOrders = orders.filter(order => order.orderType === 'SALES');
  
  const quoteOrdersCount = quoteOrders.length;
  const quoteOrdersAmount = quoteOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
  const salesOrdersCount = salesOrders.length;
  const salesOrdersAmount = salesOrders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0);
  
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
          <th>类型</th>
          <th>订单总数</th>
          <th>总金额</th>
          ${showUnpaid ? '<th>未付款总额</th>' : ''}
        </tr>
        <tr>
          <td>报价单</td>
          <td>${quoteOrdersCount}</td>
          <td>¥${quoteOrdersAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
          ${showUnpaid ? '<td>--</td>' : ''}
        </tr>
        <tr>
          <td>销售订单</td>
          <td>${salesOrdersCount}</td>
          <td>¥${salesOrdersAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
          ${showUnpaid ? `<td>¥${parseFloat(totalUnpaid).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>` : ''}
        </tr>
        <tr class="total-row">
          <td>合计</td>
          <td>${totalOrders}</td>
          <td>¥${totalAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
          ${showUnpaid ? `<td>¥${parseFloat(totalUnpaid).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>` : ''}
        </tr>
      </table>
    </div>
  `;
  
  // 生成过滤器信息
  let filterInfo = '';
  if (Object.keys(filters).length > 0) {
    const filterItems = [];
    
    if (filters.orderType) {
      let typeText = filters.orderType.toUpperCase();
      if (typeText === 'QUOTE') typeText = '报价单';
      if (typeText === 'SALES') typeText = '销售订单';
      filterItems.push(`<li><strong>订单类型:</strong> ${typeText}</li>`);
    }
    
    if (filters.orderNumber) {
      filterItems.push(`<li><strong>订单号:</strong> ${filters.orderNumber}</li>`);
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
    
    // 判断订单类型
    const isQuoteOrder = order.orderType === 'QUOTE';
    
    // 对于报价单使用"--"表示付款和完成状态，对于销售订单显示实际状态
    const paymentStatus = isQuoteOrder ? '--' : (order.paymentStatus === 'paid' ? '已付款' : '未付款');
    const orderStatus = isQuoteOrder ? '--' : (order.status === 'pending' ? '待处理' : 
                                               order.status === 'completed' ? '已完成' : order.status);
    
    // 订单类型，用于订单汇总表显示
    const orderType = order.orderType === 'QUOTE' ? '报价' : 
                     order.orderType === 'SALES' ? '销售订单' : 
                     '未知类型';
    
    // 添加到订单汇总表，增加订单类型列
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
    
    // 为每个订单创建详细信息部分，添加订单类型
    const itemsTable = order.items && order.items.length > 0 ? `
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
              <td>¥${parseFloat(item.unit_price || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
              <td>¥${parseFloat(item.subtotal || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="5" style="text-align: right;"><strong>总计</strong></td>
            <td><strong>¥${parseFloat(order.totalAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</strong></td>
          </tr>
        </tbody>
      </table>
    ` : '<p>此订单没有详细项目信息</p>';
    
    orderDetails += `
      <div class="order-detail">
        <h3>订单 #${order.orderNumber || `ORD-${order._id?.substring(0, 8)}` || `ORD-${index+1}`}</h3>
        <div class="order-info">
          <div class="info-row">
            <div class="info-item"><strong>订单类型:</strong> ${orderType}</div>
            <div class="info-item"><strong>订单日期:</strong> ${orderDate}</div>
          </div>
          <div class="info-row">
            <div class="info-item"><strong>订单状态:</strong> ${orderStatus}</div>
            <div class="info-item"><strong>支付状态:</strong> ${paymentStatus}</div>
          </div>
          <div class="info-row">
            <div class="info-item"><strong>订单金额:</strong> ¥${parseFloat(order.totalAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
            ${order.remark ? `<div class="info-item"><strong>备注:</strong> ${order.remark}</div>` : ''}
          </div>
        </div>
        ${itemsTable}
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
              <th>类型</th>
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