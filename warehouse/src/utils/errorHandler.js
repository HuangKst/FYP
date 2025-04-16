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
    return {
      success: error.response.data.success || false,
      msg: isDev ? error.response.data.msg || defaultMessage : defaultMessage, // 生产环境不暴露详细错误信息
      status: error.response.status,
      debug: isDev ? error.response.data : undefined, // 开发模式下附带详细错误数据
      ...defaultData // 添加默认数据
    };
  }

  return {
    success: false,
    msg: isDev ? 'Internet error: ' + (error.message || '') : 'Network error', // 生产环境隐藏具体错误信息
    status: 0,
    debug: isDev ? error : undefined, // 仅在开发模式下返回完整错误对象
    ...defaultData // 添加默认数据
  };
};
  