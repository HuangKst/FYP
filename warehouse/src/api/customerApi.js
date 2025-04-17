import instance from './axios';
import { handleError } from '../utils/errorHandler';

/**
 * 获取客户列表，支持按名称筛选和分页
 * @param {string} name - 客户名称关键字
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 返回客户列表和分页信息
 */
export const getCustomers = async (name, page = 1, pageSize = 20) => {
  try {
    const response = await instance.get('/customers', {
      params: {
        name,
        page,
        pageSize
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to get customers');
  }
};

// 获取单个客户详情
export const getCustomerById = async (customerId) => {
  try {
    const response = await instance.get(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to get customer details');
  }
};

// 添加新客户
export const addCustomer = async (customerData) => {
  try {
    const response = await instance.post('/customers', customerData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to add customer');
  }
};

// 更新客户信息
export const updateCustomer = async (customerId, customerData) => {
  try {
    const response = await instance.put(`/customers/${customerId}`, customerData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to update customer');
  }
};

// 删除客户
export const deleteCustomer = async (customerId) => {
  try {
    const response = await instance.delete(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to delete customer');
  }
};

// 获取客户所有订单
export const getCustomerOrders = async (customerId, page = 1, pageSize = 10) => {
  try {
    // 使用查询参数获取特定客户的订单
    const response = await instance.get('/orders', {
      params: { 
        customer_id: customerId,
        page,
        pageSize
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, '获取客户订单失败');
  }
};

/**
 * 生成客户订单PDF报告
 * @param {string} customerId - 客户ID
 * @param {Object} filters - 过滤条件
 * @returns {Promise<Object>} - 操作结果
 */
export const generateCustomerOrdersPDF = async (customerId, filters = {}) => {
  try {
    const response = await instance.get(`/customers/${customerId}/orders/pdf`, {
      params: filters,
      responseType: 'blob'
    });
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // 设置文件名
    const customerName = filters.customerName || 'Customer';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${customerName}_Orders_${date}.pdf`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    return handleError(error, '生成客户订单PDF失败');
  }
};

