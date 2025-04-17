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
 * 生成客户订单PDF报告 - 使用与搜索相同的API，确保结果一致
 * @param {string} customerId - 客户ID
 * @param {Object} options - 过滤和显示选项
 * @returns {Promise<Object>} - 操作结果
 */
export const generateCustomerOrdersPDF = async (customerId, options = {}) => {
  try {
    // 校验客户ID
    if (!customerId) {
      console.error('生成PDF错误: 客户ID为空');
      return { success: false, message: '客户ID不能为空' };
    }
    
    // 详细记录接收到的原始参数
    console.log('PDF导出 - 接收到的原始参数:', JSON.stringify(options, null, 2));
    
    // 1. 第一步：使用与搜索相同的API获取订单数据
    // 准备查询参数 - 转换为与fetchOrders相同的格式
    const searchParams = {
      type: options.orderType,
      paid: options.paymentStatus === 'paid' ? 'true' : 
            options.paymentStatus === 'unpaid' ? 'false' : undefined,
      completed: options.status === 'completed' ? 'true' : 
                options.status === 'pending' ? 'false' : undefined,
      customerId: customerId,  // 添加客户ID
      orderNumber: options.orderNumber,
      // 不设置分页限制，获取所有符合条件的订单
      page: 1,
      pageSize: 1000 // 使用一个足够大的值确保获取所有订单
    };
    
    console.log('使用搜索API获取订单 - 参数:', searchParams);
    
    // 调用 /orders API 获取订单
    const ordersResponse = await instance.get('/orders', {
      params: searchParams
    });
    
    // 检查搜索结果
    if (!ordersResponse.data.success) {
      console.error('订单搜索失败:', ordersResponse.data);
      return { success: false, message: '获取订单数据失败' };
    }
    
    const searchResults = ordersResponse.data;
    console.log(`搜索返回 ${searchResults.orders.length} 个订单`);
    
    // 记录搜索到的订单ID
    console.log('搜索返回的订单ID:', searchResults.orders.map(o => o.id));
    
    // 如果没有找到订单，且不是主动要求导出所有订单，返回提示
    if (searchResults.orders.length === 0 && options.includeAllOrders !== true) {
      // 如果没有找到订单，尝试获取所有订单的数量
      const allOrdersResponse = await instance.get('/orders', {
        params: { customerId }
      });
      
      if (allOrdersResponse.data.success && allOrdersResponse.data.orders.length > 0) {
        return {
          success: false,
          suggestExportAll: true,
          allOrdersCount: allOrdersResponse.data.orders.length,
          message: '当前筛选条件下没有订单，要导出所有订单吗？'
        };
      }
      
      return { success: false, message: '没有找到任何订单' };
    }
    
    // 2. 第二步：构建PDF数据
    // 准备导出PDF的参数
    const pdfParams = {
      // 基本参数
      customerId,
      customerName: options.customerName,
      // 将搜索结果转换为JSON字符串传递
      ordersData: JSON.stringify(searchResults.orders),
      // 显示设置
      showUnpaid: options.showUnpaid === true ? 'true' : 'false',
      unpaidAmount: options.unpaidAmount,
      // 记录筛选条件
      orderType: options.orderType,
      orderNumber: options.orderNumber,
      status: options.status,
      paymentStatus: options.paymentStatus,
      // 特殊标记 - 使用搜索API数据
      useSearchApiData: 'true'
    };
    
    console.log('PDF导出 - 使用搜索API，参数:', {
      customerId,
      ordersCount: searchResults.orders.length,
      hasFilters: !!(options.orderType || options.orderNumber || 
                     options.status || options.paymentStatus)
    });
    
    // 3. 第三步：请求生成PDF
    // 发送请求，指定responseType为blob
    const response = await instance.get(`/customers/${customerId}/orders/pdf`, {
      params: pdfParams,
      responseType: 'blob'
    });
    
    // 检查是否是JSON错误响应(服务器返回了JSON，不是PDF blob)
    const contentType = response.headers['content-type'];
    console.log(`PDF响应类型: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      // 这是一个JSON响应，意味着有错误
      console.log('收到JSON响应而非PDF，可能是错误或建议');
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            console.log('JSON响应内容:', errorData);
            
            // 如果是无订单的建议，返回建议
            if (errorData.suggestExportAll) {
              console.log(`后端建议导出所有订单，共 ${errorData.allOrdersCount} 个`);
              resolve({ 
                success: false, 
                suggestExportAll: true,
                allOrdersCount: errorData.allOrdersCount,
                message: errorData.msg || '当前筛选条件下没有订单，要导出所有订单吗？'
              });
            } else {
              console.log('接收到其他错误:', errorData);
              resolve({ 
                success: false, 
                message: errorData.msg || errorData.error || '导出PDF失败' 
              });
            }
          } catch (e) {
            console.error('解析JSON响应失败:', e);
            reject(new Error('解析错误响应失败'));
          }
        };
        reader.onerror = () => reject(new Error('读取错误响应失败'));
        reader.readAsText(response.data);
      });
    }
    
    // 如果响应成功，触发下载
    console.log('收到PDF响应，准备下载');
    const blob = new Blob([response.data], { type: 'application/pdf' });
    console.log(`PDF大小: ${blob.size} 字节`);
    
    // 获取文件名
    const customerName = options.customerName || 'Customer';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${customerName}_Orders_${date}.pdf`;
    
    // 生成下载链接
    const url = window.URL.createObjectURL(blob);
    
    // 创建下载元素
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    console.log(`触发PDF下载: ${filename}`);
    
    // 清理资源
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    return { success: true };
  } catch (error) {
    console.error('生成客户订单PDF失败:', error);
    return { 
      success: false, 
      message: error.response?.data?.msg || error.message || '导出PDF失败'
    };
  }
};

