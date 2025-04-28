/**
 * 通用错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} defaultMessage - 显示给用户的错误消息
 * @param {Object} defaultData - 默认返回数据（可选）
 * @returns {Object} 标准化的错误响应对象
 */
export const handleError = (error, defaultMessage, defaultData = {}) => {
  const isDev = process.env.REACT_APP_ENV === 'development';
  
  if (error.response && error.response.data) {
    // 检查是否为密码相关错误或导入相关错误，如果是则始终显示详细信息
    let errorMsg = error.response.data.msg || defaultMessage;
    
    // 增强密码错误提示，显示允许的特殊字符
    if (errorMsg.includes('Password does not meet strength requirements') || 
        errorMsg.includes('密码') || 
        errorMsg.includes('Password is invalid')) {
      errorMsg = 'Password does not meet strength requirements: minimum 8 characters with at least one letter, one number, and one special character (@$!%*?&)';
    }

    // 始终显示导入相关的错误信息
    const isImportError = defaultMessage.includes('import') || 
                         defaultMessage.includes('导入') ||
                         errorMsg.includes('Row') ||
                         errorMsg.includes('行');
    
    return {
      success: error.response.data.success || false,
      // 如果是密码错误、导入错误或在开发环境中，显示详细信息
      msg: errorMsg.includes('密码') || 
           errorMsg.includes('Password') || 
           isImportError ? 
           errorMsg : 
           (isDev ? errorMsg : defaultMessage),
      status: error.response.status,
      debug: isDev ? error.response.data : undefined, // 开发模式下附带详细错误数据
      ...defaultData // 添加默认数据
    };
  }

  // 对于网络错误，如果是导入相关的错误，也显示详细信息
  const isImportError = defaultMessage.includes('import') || defaultMessage.includes('导入');
  return {
    success: false,
    msg: isImportError ? 
        (error.message || defaultMessage) : 
        (isDev ? 'Internet error: ' + (error.message || '') : 'Network error'),
    status: 0,
    debug: isDev ? error : undefined,
    ...defaultData
  };
};
  