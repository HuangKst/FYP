import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

// 登录请求
export const login = async (username, password) => {
  try {
    // 登录 => POST /api/users （注：如果要登录，需要带 ?action=login 吗？看后端逻辑）
    // 之前的后端逻辑：POST /api/users?action=register or (默认) 登录
    // 如果你的后端是这样：/api/users?action=login 才是登录，就需要加上 ?action=login
    const response = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
    });
    return response.data; // 后端成功返回JSON
  } catch (error) {
    // 1. 先判断是否有 response
    if (error.response && error.response.data) {
      // 2. 我们将后端的返回内容(data)提取出来
      // 这里后端可能是 { success: false, msg: '具体原因' }
      const { data } = error.response;
      // 3. 抛出一个新的错误对象或返回一个对象让调用方处理
      //    这里选择返回一个对象，里面包含 success, msg, status
      return {
        success: data.success || false,
        msg: data.msg || '登录失败',
        status: error.response.status
      };
    }
    // 如果连 error.response 都没有，可能是网络错误或其他
    return {
      success: false,
      msg: '网络错误或服务器无响应',
      status: 0
    };
  }
};


export const signup = async (username, password) => {
    try {
      // 注册 => POST /api/users?action=register
      const response = await axios.post(`${API_BASE_URL}/users?action=register`, {
        username,
        password
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        const { data } = error.response;
        return {
          success: data.success || false,
          msg: data.msg || '注册失败',
          status: error.response.status
        };
      }
      return {
        success: false,
        msg: '网络错误或服务器无响应',
        status: 0
      };
    }
  };
  