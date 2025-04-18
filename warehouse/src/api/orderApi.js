import instance from './axios';
import { handleError } from '../utils/errorHandler';

/**
 * 获取订单列表，支持筛选和分页
 * @param {string} orderType - 订单类型 (QUOTE/SALES)
 * @param {boolean} isPaid - 是否已支付
 * @param {boolean} isCompleted - 是否已完成
 * @param {string} customerName - 客户名称
 * @param {number} customerId - 客户ID 
 * @param {string} orderNumber - 订单号
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 返回订单列表和分页信息
 */
export const fetchOrders = async (orderType, isPaid, isCompleted, customerName, customerId, orderNumber, page = 1, pageSize = 10) => {
  try {
    const response = await instance.get('/orders', {
      params: {
        type: orderType,
        paid: isPaid !== undefined ? String(isPaid) : undefined,
        completed: isCompleted !== undefined ? String(isCompleted) : undefined,
        customerName,
        customerId,
        orderNumber,
        page,
        pageSize
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch orders');
  }
};

// 获取单个订单详情
export const fetchOrderDetail = async (orderId) => {
  try {
    const response = await instance.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch order details');
  }
};

// 更新订单状态
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    // 确保数据格式正确，支持order_type字段用于报价单转销售单
    const { is_paid, is_completed, remark, order_type } = statusData;
    const response = await instance.put(`/orders/${orderId}`, {
      is_paid,
      is_completed,
      remark,
      order_type  // 新增字段，用于支持报价单转换为销售单
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to update order');
  }
};

// 编辑订单详情
export const updateOrder = async (orderId, updateData) => {
  try {
    const response = await instance.put(`/orders/${orderId}/edit`, updateData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to update order');
  }
};

// 创建新订单
export const createOrder = async (orderData) => {
  try {
    const response = await instance.post('/orders', orderData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to create order');
  }
};

// 删除订单
export const deleteOrder = async (orderId) => {
  try {
    const response = await instance.delete(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to delete order');
  }
};

// 生成订单PDF
export const generateOrderPDF = async (orderId) => {
  try {
    const response = await instance.get(`/orders/${orderId}/pdf`, {
      responseType: 'blob'
    });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `order-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Failed to generate PDF');
  }
};

// 获取报价订单列表（最多10条）
export const fetchQuoteOrders = async (limit = 10) => {
  try {
    const response = await instance.get('/orders', {
      params: {
        type: 'QUOTE',
        page: 1,
        pageSize: limit
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch quote orders');
  }
};

// 获取未完成订单列表（最多10条）
export const fetchIncompleteOrders = async (limit = 10) => {
  try {
    const response = await instance.get('/orders', {
      params: {
        type: 'SALES',
        completed: 'false',
        page: 1,
        pageSize: limit
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch incomplete orders');
  }
};

// 获取未付款订单列表（最多10条）
export const fetchUnpaidOrders = async (limit = 10) => {
  try {
    const response = await instance.get('/orders', {
      params: {
        type: 'SALES',
        paid: 'false',
        page: 1,
        pageSize: limit
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch unpaid orders');
  }
};

// 将报价单转换为销售单
export const convertQuoteToSalesOrder = async (orderId) => {
  try {
    const response = await instance.put(`/orders/${orderId}`, {
      order_type: 'SALES'
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to convert quote to sales order');
  }
};

// 标记订单为已完成
export const markOrderAsCompleted = async (orderId) => {
  try {
    const response = await instance.put(`/orders/${orderId}`, {
      is_completed: true
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to mark order as completed');
  }
};

// 标记订单为已付款
export const markOrderAsPaid = async (orderId) => {
  try {
    const response = await instance.put(`/orders/${orderId}`, {
      is_paid: true
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to mark order as paid');
  }
};
