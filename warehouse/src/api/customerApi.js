import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 获取所有客户
export const getCustomers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/customers`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch customers');
  }
};

// 添加新客户
export const addCustomer = async (customerData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/customers`, customerData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to add customer');
  }
};

// 获取某个客户详情
export const getCustomerById = async (customerId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/customers/${customerId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch customer details');
  }
};

// 更新客户信息
export const updateCustomer = async (customerId, updatedData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/customers/${customerId}`, updatedData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to update customer');
  }
};

// 删除客户
export const deleteCustomer = async (customerId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/customers/${customerId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to delete customer');
  }
};

// 统一错误处理函数
const handleError = (error, defaultMsg) => {
  if (error.response && error.response.data) {
    return {
      success: error.response.data.success || false,
      msg: error.response.data.msg || defaultMsg,
      status: error.response.status
    };
  }
  return {
    success: false,
    msg: 'Internet Error',
    status: 0
  };
};
