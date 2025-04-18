/**
 * 通用PDF导出工具
 * 处理PDF文件的生成和下载
 */

/**
 * 导出PDF文件
 * @param {string} url - API端点URL
 * @param {Object} queryParams - 查询参数
 * @param {string} filename - 下载文件名
 * @param {Function} onSuccess - 成功回调
 * @param {Function} onError - 错误回调
 * @param {Function} onComplete - 完成回调（无论成功或失败）
 */
export const exportPDF = async (url, queryParams = {}, filename, onSuccess, onError, onComplete) => {
  try {
    // 构建URL和查询参数
    let fullUrl = url;
    const queryString = Object.entries(queryParams)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    if (queryString) {
      fullUrl += `?${queryString}`;
    }
    
    // 获取认证令牌
    const token = localStorage.getItem('token');
    
    // 发送请求
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : undefined
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      // 尝试读取错误信息
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.msg || `错误: ${response.status} ${response.statusText}`;
      } catch (e) {
        errorMessage = `错误: ${response.status} ${response.statusText}`;
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
    
    // 清理
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    }, 100);
    
    // 调用成功回调
    if (onSuccess) {
      onSuccess();
    }
  } catch (error) {
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