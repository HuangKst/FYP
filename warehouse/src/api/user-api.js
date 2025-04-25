import axios from 'axios';
import { handleError } from '../utils/errorHandler';
import instance from './axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Login request
export const login = async (username, password) => {
  try {
    // 删除captchaToken相关逻辑
    const requestBody = { username, password };
    
    const response = await axios.post(`${API_BASE_URL}/users`, requestBody);
    return response.data;
  } catch (error) {
    return handleError(error, 'Login failed');
  }
};

// Register request
export const signup = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users?action=register`, { username, password });
    return response.data;
  } catch (error) {
    return handleError(error, 'Register failed');
  }
};

// Get employee users (users with employee role)
export const fetchEmployeeUsers = async (page = 1, pageSize = 10) => {
  try {
    // 确保API请求包含认证令牌
    const response = await instance.get('/users/employees', {
      params: { page, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching employee users:', error);
    
    // Check for unauthorized error
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        msg: 'Unauthorized. Please login again.',
        users: [],
        pagination: { total: 0, page, pageSize, totalPages: 0 }
      };
    }
    
    // Check for forbidden error
    if (error.response && error.response.status === 403) {
      return {
        success: false,
        msg: 'Access denied. You do not have permission to view employee users.',
        users: [],
        pagination: { total: 0, page, pageSize, totalPages: 0 }
      };
    }
    
    // Handle other errors
    return handleError(error, 'Failed to fetch user list', { 
      users: [], 
      pagination: { total: 0, page, pageSize, totalPages: 0 } 
    });
  }
};

// Update user password
export const updateUserPassword = async (userId, newPassword) => {
  try {
    // 确保API请求包含认证令牌
    const response = await instance.put(`/users/${userId}/password`, {
      password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Error updating password:', error);
    
    // Check for unauthorized error
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        msg: 'Unauthorized. Please login again.'
      };
    }
    
    // Check for forbidden error
    if (error.response && error.response.status === 403) {
      return {
        success: false,
        msg: 'Access denied. You do not have permission to update passwords.'
      };
    }
    
    // Check for validation error
    if (error.response && error.response.status === 400) {
      return {
        success: false,
        msg: error.response.data.msg || 'Password does not meet requirements.'
      };
    }
    
    return handleError(error, 'Failed to update password');
  }
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
  try {
    // 确保API请求包含认证令牌
    const response = await instance.put(`/users/${userId}`, {
      role: newRole
    });
    
    // The backend returns a different format for this endpoint
    if (response.data.code === 200) {
      return {
        success: true,
        msg: 'Role updated successfully'
      };
    } else {
      return {
        success: false,
        msg: response.data.msg || 'Failed to update role'
      };
    }
  } catch (error) {
    console.error('Error updating role:', error);
    
    // Check for unauthorized error
    if (error.response && error.response.status === 401) {
      return {
        success: false,
        msg: 'Unauthorized. Please login again.'
      };
    }
    
    // Check for forbidden error
    if (error.response && error.response.status === 403) {
      return {
        success: false,
        msg: 'Access denied. You do not have permission to update user roles.'
      };
    }
    
    return handleError(error, 'Failed to update role');
  }
};
