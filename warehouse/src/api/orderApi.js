import instance from './axios';

// 获取订单列表
export const fetchOrders = async (type, paid, completed, customerName, customerId, orderNumber) => {
  try {
    let url = '/orders';
    const params = {};
    
    // 确保类型参数正确传递，添加调试日志
    console.log("fetchOrders 参数:", { type, paid, completed, customerName, customerId, orderNumber });
    
    if (type) params.order_type = type.toUpperCase(); // 确保类型参数始终是大写
    if (paid !== undefined) params.is_paid = paid;
    if (completed !== undefined) params.is_completed = completed;
    if (customerName) params.customerName = customerName;
    if (customerId) params.customer_id = customerId;
    if (orderNumber) params.order_number = orderNumber;
    
    // 移除模糊搜索参数，改用精确匹配
    // if (orderNumber) params.fuzzy_search = true;
    
    // 设置精确匹配参数
    if (orderNumber) params.exact_match = false; // 设置为false启用模糊匹配，但不会匹配全部

    console.log("API请求参数:", params);
    const response = await instance.get(url, { params });
    
    // 如果后端不支持订单号筛选，在前端过滤结果
    if (orderNumber && response.data.success && response.data.orders) {
      // 本地筛选，确保订单号包含搜索文本
      response.data.orders = response.data.orders.filter(order => 
        order.order_number && order.order_number.includes(orderNumber)
      );
    }
    
    // 如果后端不支持类型筛选，在前端过滤
    if (type && response.data.success && response.data.orders) {
      console.log("前端类型过滤前:", response.data.orders.length);
      response.data.orders = response.data.orders.filter(order => 
        order.order_type === type.toUpperCase()
      );
      console.log("前端类型过滤后:", response.data.orders.length);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, msg: 'Failed to fetch orders' };
  }
};

// 获取单个订单详情
export const fetchOrderById = async (orderId) => {
  try {
    const response = await instance.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    return { success: false, msg: 'Failed to fetch order details' };
  }
};

// 创建新订单
export const createOrder = async (orderData) => {
  try {
    const response = await instance.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, msg: 'Failed to create order' };
  }
};

// 更新订单状态
export const updateOrderStatus = async (orderId, statusData) => {
  try {
    const response = await instance.put(`/orders/${orderId}`, statusData);
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, msg: 'Failed to update order status' };
  }
};

// 删除订单
export const deleteOrder = async (orderId) => {
  try {
    const response = await instance.delete(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, msg: 'Failed to delete order' };
  }
};

// 更新订单
export const updateOrder = async (orderId, updateData) => {
  try {
    const response = await instance.put(`/orders/${orderId}/edit`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, msg: 'Failed to update order' };
  }
};
