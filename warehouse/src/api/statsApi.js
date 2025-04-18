import instance from './axios';
import { handleError } from '../utils/errorHandler';

/**
 * Get order statistics including current month orders and previous month orders
 * @returns {Promise<Object>} Order statistics data
 */
export const getOrderStats = async () => {
  try {
    const response = await instance.get('/stats/orders');
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch order statistics');
  }
};

/**
 * Get inventory statistics including total inventory and new items added this month
 * @returns {Promise<Object>} Inventory statistics data
 */
export const getInventoryStats = async () => {
  try {
    const response = await instance.get('/stats/inventory');
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch inventory statistics');
  }
};

/**
 * Get customer statistics including total customers and new customers this month
 * @returns {Promise<Object>} Customer statistics data
 */
export const getCustomerStats = async () => {
  try {
    const response = await instance.get('/stats/customers');
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch customer statistics');
  }
};

/**
 * Get employee statistics including total employees and new employees this month
 * @returns {Promise<Object>} Employee statistics data
 */
export const getEmployeeStats = async () => {
  try {
    const response = await instance.get('/stats/employees');
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch employee statistics');
  }
};

/**
 * Get all dashboard statistics in a single API call
 * @returns {Promise<Object>} All dashboard statistics
 */
export const getDashboardStats = async () => {
  try {
    const response = await instance.get('/stats/dashboard');
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch dashboard statistics');
  }
};

/**
 * Get sales statistics by time period
 * @param {string} period - Time period for data aggregation (weekly, monthly, quarterly)
 * @param {number} year - Year to get sales data for (e.g., 2024, 2025)
 * @param {number} quarter - Quarter number (1-4) when viewing quarterly data
 * @param {number} month - Month number (1-12) when viewing monthly data
 * @returns {Promise<Object>} Sales statistics data
 */
export const getSalesStats = async (period = 'monthly', year = null, quarter = null, month = null) => {
  try {
    // 构建查询参数
    const params = { period };
    
    // 添加年份参数（如果提供）
    if (year) params.year = year;
    
    // 添加季度参数（如果提供）
    if (quarter) params.quarter = quarter;
    
    // 添加月份参数（如果提供）
    if (month) params.month = month;
    
    // 如果后端暂未实现对应参数，也可在前端获取全部数据后按参数过滤
    const response = await instance.get('/stats/sales', {
      params
    });
    
    // 调试日志：在控制台输出请求参数和响应数据
    console.log('Sales stats request params:', params);
    console.log('Sales stats response:', response.data);
    
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch sales statistics');
  }
}; 