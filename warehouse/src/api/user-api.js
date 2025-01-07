import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL 

// 登录请求
export const login = async (username, password) => {
  try {
     const response = await axios.post(`${API_BASE_URL}/users`, {
      username,
      password,
    });
    return response.data; 
  } catch (error) {

    if (error.response && error.response.data) {

      const { data } = error.response;

      return {
        success: data.success || false,
        msg: data.msg || 'Login failed',
        status: error.response.status
      };
    }
 
    return {
      success: false,
      msg: 'Internet Error',
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
          msg: data.msg || 'Register failed',
          status: error.response.status
        };
      }
      return {
        success: false,
        msg: 'Internet error',
        status: 0
      };
    }
  };
  