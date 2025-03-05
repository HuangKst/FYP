
import instance from './axios';
import { handleError } from '../utils/errorHandler';

// 获取所有客户
export const getCustomers = async () => {
  try {
    const response = await instance.get(`/customers`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch customers');
  }
};

// 添加新客户
export const addCustomer = async (customerData) => {
  try {
    const response = await instance.post(`/customers`, customerData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to add customer');
  }
};

// 获取某个客户详情
export const getCustomerById = async (customerId) => {
  try {
    const response = await instance.get(`/customers/${customerId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch customer details');
  }
};

// 更新客户信息
export const updateCustomer = async (customerId, updatedData) => {
  try {
    const response = await instance.put(`/customers/${customerId}`, updatedData);
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

