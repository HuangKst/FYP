/**
 * General PDF Export Utility
 * Handles PDF file generation and download
 */

/**
 * Export PDF file
 * @param {string} url - API endpoint URL
 * @param {Object} queryParams - Query parameters
 * @param {string} filename - Download filename
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @param {Function} onComplete - Complete callback (regardless of success or failure)
 */
export const exportPDF = async (url, queryParams = {}, filename, onSuccess, onError, onComplete) => {
  try {
    // 如果URL太长会导致404，需要处理筛选订单数据
    let filteredOrdersData;
    
    // 提取并移除filteredOrders对象
    if (queryParams.filteredOrders && queryParams.filteredOrders.length > 0) {
      // 保存filteredOrders的引用，然后从queryParams中删除
      filteredOrdersData = queryParams.filteredOrders;
      delete queryParams.filteredOrders;
      
      // 如果有筛选订单，添加标记并设置includeAllOrders为false
      queryParams.useFilteredOrders = 'true';
      queryParams.includeAllOrders = 'false';
    }

    // 构建查询参数字符串，只处理基本参数
    let fullUrl = url;
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
    
    // 如果URL长度超过2000字符，可能会导致404错误
    if (fullUrl.length > 2000) {
      console.warn('警告: URL长度超过2000字符，可能导致404错误');
      
      // 缩短URL，将一些参数移到POST请求体中
      fullUrl = url + '?' + Object.entries(queryParams)
        .filter(([key, _]) => ['customerId', 'customerName', 'includeAllOrders'].includes(key))
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
    }
    
    console.log('PDF导出URL:', fullUrl);
    
    // 获取认证令牌
    const token = localStorage.getItem('token');
    
    // 准备请求参数
    let fetchOptions = {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    };
    
    // 如果有筛选订单数据，使用POST请求
    if (filteredOrdersData) {
      fetchOptions.method = 'POST';
      fetchOptions.headers['Content-Type'] = 'application/json';
      
      // 将筛选订单数据作为JSON字符串添加到请求体
      fetchOptions.body = JSON.stringify({
        ordersData: JSON.stringify(filteredOrdersData),
        ...queryParams
      });
      
      console.log('使用POST请求发送筛选订单数据，数量:', filteredOrdersData.length);
    }
    
    // 发送请求
    const response = await fetch(fullUrl, fetchOptions);
    
    // 检查响应状态
    if (!response.ok) {
      // 尝试读取错误信息
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.msg || `Error: ${response.status} ${response.statusText}`;
      } catch (e) {
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    // 获取Blob数据
    const blob = await response.blob();
    
    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 清理资源
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    }, 100);
    
    // 调用成功回调
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
    console.error('PDF导出失败:', error);
    // 调用错误回调
    if (onError) {
      onError(error);
    }
  } finally {
    // 调用完成回调
    if (onComplete) {
      onComplete();
    }
  }
}; 