export const handleError = (error, defaultMessage) => {
    const isDev = process.env.REACT_APP_ENV === 'development';
  
    if (error.response && error.response.data) {
      return {
        success: error.response.data.success || false,
        msg: isDev ? error.response.data.msg || defaultMessage : defaultMessage, // 生产环境不暴露详细错误信息
        status: error.response.status,
        debug: isDev ? error.response.data : undefined, // 开发模式下附带详细错误数据
      };
    }
  
    return {
      success: false,
      msg: isDev ? 'Internet error: ' + (error.message || '') : 'Network error', // 生产环境隐藏具体错误信息
      status: 0,
      debug: isDev ? error : undefined, // 仅在开发模式下返回完整错误对象
    };
  };
  