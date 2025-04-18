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
    console.log(`获取客户ID=${customerId}的订单...`);
    
    // 使用查询参数获取特定客户的订单
    const response = await instance.get('/orders', {
      params: { 
        customerId: customerId, // 使用customerId参数名，与后端API匹配
        page,
        pageSize
      }
    });
    
    console.log(`获取客户订单API返回 ${response.data?.orders?.length || 0} 个订单`);
    
    return response.data;
  } catch (error) {
    return handleError(error, '获取客户订单失败');
  }
};

/**
 * 获取客户的所有订单（不分页，主要用于导出）
 * @param {number} customerId 客户ID
 * @param {string} orderType 可选，订单类型筛选
 * @param {boolean} isPaid 可选，付款状态筛选
 * @param {boolean} isCompleted 可选，完成状态筛选
 * @param {string} orderNumber 可选，订单号筛选
 * @returns {Promise<Object>} 客户的所有订单
 */
export const getAllCustomerOrders = async (customerId, orderType, isPaid, isCompleted, orderNumber) => {
  try {
    const params = {};
    if (orderType) params.orderType = orderType;
    if (isPaid !== null && isPaid !== undefined) params.isPaid = isPaid;
    if (isCompleted !== null && isCompleted !== undefined) params.isCompleted = isCompleted;
    if (orderNumber) params.orderNumber = orderNumber;

    const response = await instance.get(`/customers/${customerId}/orders/all`, { params });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch all customer orders');
  }
};

/**
 * Generate customer orders PDF report - Uses the same API as search to ensure consistent results
 * @param {string} customerId - Customer ID
 * @param {Object} options - Filter and display options
 * @returns {Promise<Object>} - Operation result
 */
export const generateCustomerOrdersPDF = async (customerId, options = {}) => {
  try {
    // Validate customer ID
    if (!customerId) {
      console.error('PDF Generation Error: Customer ID is empty');
      return { success: false, message: 'Customer ID cannot be empty' };
    }
    
    // Log received parameters in detail
    console.log('PDF Export - Original parameters received:', JSON.stringify(options, null, 2));
    
    // Step 1: Use the same API as search to get order data
    // Prepare query parameters - Convert to the same format as fetchOrders
    const searchParams = {
      type: options.orderType,
      paid: options.paymentStatus === 'paid' ? 'true' : 
            options.paymentStatus === 'unpaid' ? 'false' : undefined,
      completed: options.status === 'completed' ? 'true' : 
                options.status === 'pending' ? 'false' : undefined,
      customerId: customerId,  // Add customer ID
      orderNumber: options.orderNumber,
      // No pagination limit, get all matching orders
      page: 1,
      pageSize: 1000 // Use a large enough value to ensure all orders are retrieved
    };
    
    console.log('Using search API to get orders - Parameters:', searchParams);
    
    // Call /orders API to get orders
    const ordersResponse = await instance.get('/orders', {
      params: searchParams
    });
    
    // Check search results
    if (!ordersResponse.data.success) {
      console.error('Order search failed:', ordersResponse.data);
      return { success: false, message: 'Failed to get order data' };
    }
    
    const searchResults = ordersResponse.data;
    console.log(`Search returned ${searchResults.orders.length} orders`);
    
    // Log the order IDs returned by the search
    console.log('Order IDs returned by search:', searchResults.orders.map(o => o.id));
    
    // If no orders found and not explicitly requesting all orders, return suggestion
    if (searchResults.orders.length === 0 && options.includeAllOrders !== true) {
      // If no orders found, try to get count of all orders
      const allOrdersResponse = await instance.get('/orders', {
        params: { customerId }
      });
      
      if (allOrdersResponse.data.success && allOrdersResponse.data.orders.length > 0) {
        return {
          success: false,
          suggestExportAll: true,
          allOrdersCount: allOrdersResponse.data.orders.length,
          message: 'No orders found with current filters. Would you like to export all orders?'
        };
      }
      
      return { success: false, message: 'No orders found' };
    }
    
    // Step 2: Build PDF data
    // Prepare PDF export parameters
    const pdfParams = {
      // Basic parameters
      customerId,
      customerName: options.customerName,
      // Convert search results to JSON string
      ordersData: JSON.stringify(searchResults.orders),
      // Display settings
      showUnpaid: options.showUnpaid === true ? 'true' : 'false',
      unpaidAmount: options.unpaidAmount,
      // Record filter conditions
      orderType: options.orderType,
      orderNumber: options.orderNumber,
      status: options.status,
      paymentStatus: options.paymentStatus,
      // Special flag - Use search API data
      useSearchApiData: 'true'
    };
    
    console.log('PDF Export - Using search API, parameters:', {
      customerId,
      ordersCount: searchResults.orders.length,
      hasFilters: !!(options.orderType || options.orderNumber || 
                     options.status || options.paymentStatus)
    });
    
    // Step 3: Request PDF generation
    // Send request, specify responseType as blob
    const response = await instance.get(`/customers/${customerId}/orders/pdf`, {
      params: pdfParams,
      responseType: 'blob'
    });
    
    // Check if it's a JSON error response (server returned JSON, not PDF blob)
    const contentType = response.headers['content-type'];
    console.log(`PDF response type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      // This is a JSON response, meaning there's an error
      console.log('Received JSON response instead of PDF, possibly an error or suggestion');
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            console.log('JSON response content:', errorData);
            
            // If it's a suggestion for no orders, return the suggestion
            if (errorData.suggestExportAll) {
              console.log(`Backend suggests exporting all orders, total ${errorData.allOrdersCount}`);
              resolve({ 
                success: false, 
                suggestExportAll: true,
                allOrdersCount: errorData.allOrdersCount,
                message: errorData.msg || 'No orders found with current filters. Would you like to export all orders?'
              });
            } else {
              console.log('Received other error:', errorData);
              resolve({ 
                success: false, 
                message: errorData.msg || errorData.error || 'Failed to export PDF' 
              });
            }
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
            reject(new Error('Failed to parse error response'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read error response'));
        reader.readAsText(response.data);
      });
    }
    
    // If response successful, trigger download
    console.log('Received PDF response, preparing download');
    const blob = new Blob([response.data], { type: 'application/pdf' });
    console.log(`PDF size: ${blob.size} bytes`);
    
    // Get filename
    const customerName = options.customerName || 'Customer';
    const date = new Date().toISOString().split('T')[0];
    const filename = `${customerName}_Orders_${date}.pdf`;
    
    // Generate download link
    const url = window.URL.createObjectURL(blob);
    
    // Create download element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    console.log(`Triggered PDF download: ${filename}`);
    
    // Clean up resources
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    return { success: true };
  } catch (error) {
    console.error('Failed to generate customer orders PDF:', error);
    return { 
      success: false, 
      message: error.response?.data?.msg || error.message || 'Failed to export PDF'
    };
  }
};

