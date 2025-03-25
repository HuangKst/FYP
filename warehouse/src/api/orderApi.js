import instance from './axios';

// 获取订单列表
export const fetchOrders = async (type, paid, completed, customerName) => {
  try {
    let url = '/orders';
    const params = {};
    
    if (type) params.order_type = type;
    if (paid !== undefined) params.is_paid = paid;
    if (completed !== undefined) params.is_completed = completed;
    if (customerName) params.customerName = customerName;

    const response = await instance.get(url, { params });
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
