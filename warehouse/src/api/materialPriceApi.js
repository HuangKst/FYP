import instance from './axios';
import { handleError } from '../utils/errorHandler';

/**
 * 获取指定材料的历史价格数据
 * @param {string} material - 材料类型 (stainless_steel or hot_rolled_coil)
 * @returns {Promise<Object>} 返回材料价格数据
 */
export const getMaterialPrices = async (material) => {
  try {
    const response = await instance.get(`/material-prices/${material}`);
    return response.data;
  } catch (error) {
    return handleError(error, `获取${material}价格数据失败`);
  }
};

/**
 * 获取所有材料的价格数据
 * @returns {Promise<Object>} 返回所有材料价格数据
 */
export const getAllMaterialPrices = async () => {
  try {
    const response = await instance.get('/material-prices');
    return response.data;
  } catch (error) {
    return handleError(error, '获取所有材料价格数据失败');
  }
};

/**
 * 获取实时材料价格
 * @returns {Promise<Object>} 返回实时价格数据
 */
export const getRealTimePrices = async () => {
  try {
    const response = await instance.get('/material-prices/real-time');
    return response.data;
  } catch (error) {
    return handleError(error, '获取实时价格数据失败');
  }
};

/**
 * 将数据库格式的价格数据转换为图表可用的格式
 * @param {Array} priceData - 从API获取的价格数据
 * @returns {Object} 包含日期和价格的格式化数据
 */
export const formatPriceDataForChart = (priceData) => {
  if (!priceData || !Array.isArray(priceData)) {
    return { dates: [], prices: [] };
  }
  
  // 按日期排序（从早到晚）
  const sortedData = [...priceData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  // 提取日期和价格
  const dates = sortedData.map(item => {
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`; // 格式化为 "月/日"
  });
  
  const prices = sortedData.map(item => parseFloat(item.price_per_ton));
  
  return { dates, prices };
}; 