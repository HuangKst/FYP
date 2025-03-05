import axios from 'axios';
import { handleError } from '../utils/errorHandler';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 登录请求
export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users`, { username, password });
    return response.data;
  } catch (error) {
    return handleError(error, 'Login failed');
  }
};

// 注册请求
export const signup = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users?action=register`, { username, password });
    return response.data;
  } catch (error) {
    return handleError(error, 'Register failed');
  }
};
