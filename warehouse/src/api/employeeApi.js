import instance from './axios';
import { handleError } from '../utils/errorHandler';

/**
 * 获取员工列表，支持按名称筛选和分页
 * @param {string} name - 员工名称关键字
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Object>} 返回员工列表和分页信息
 */
export const getAllEmployees = async (name, page = 1, pageSize = 10) => {
  try {
    const response = await instance.get('/employees', {
      params: {
        name,
        page,
        pageSize
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to get employees');
  }
};

// 获取单个员工详情
export const getEmployeeById = async (employeeId) => {
  try {
    const response = await instance.get(`/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to get employee details');
  }
};

// 添加新员工
export const addEmployee = async (employeeData) => {
  try {
    const response = await instance.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to add employee');
  }
};

// 更新员工信息
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const response = await instance.put(`/employees/${employeeId}`, employeeData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to update employee');
  }
};

// 删除员工
export const deleteEmployee = async (employeeId) => {
  try {
    const response = await instance.delete(`/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to delete employee');
  }
};

// 获取员工加班记录
export const getEmployeeOvertimes = async () => {
  try {
    const response = await instance.get('/employee-overtimes');
    return response.data;
  } catch (error) {
    return handleError(error, '获取加班记录失败');
  }
};

// 添加员工加班记录
export const addEmployeeOvertime = async (overtimeData) => {
  try {
    const response = await instance.post('/employee-overtimes', overtimeData);
    return response.data;
  } catch (error) {
    return handleError(error, '添加加班记录失败');
  }
};

// 删除员工加班记录
export const deleteEmployeeOvertime = async (overtimeId) => {
  try {
    const response = await instance.delete(`/employee-overtimes/${overtimeId}`);
    return response.data;
  } catch (error) {
    return handleError(error, '删除加班记录失败');
  }
};

// 获取员工请假记录
export const getEmployeeLeaves = async () => {
  try {
    const response = await instance.get('/employee-leaves');
    return response.data;
  } catch (error) {
    return handleError(error, '获取请假记录失败');
  }
};

// 添加员工请假记录
export const addEmployeeLeave = async (leaveData) => {
  try {
    const response = await instance.post('/employee-leaves', leaveData);
    return response.data;
  } catch (error) {
    return handleError(error, '添加请假记录失败');
  }
};

// 删除员工请假记录
export const deleteEmployeeLeave = async (leaveId) => {
  try {
    const response = await instance.delete(`/employee-leaves/${leaveId}`);
    return response.data;
  } catch (error) {
    return handleError(error, '删除请假记录失败');
  }
};

// 获取待审批用户
export const fetchPendingUsers = async () => {
  try {
    // 检查API是否存在 - 先用HEAD请求
    const checkResult = await instance.head('/auth/pending-users').catch(() => null);
    
    // 如果API不存在，返回一个友好的错误
    if (!checkResult) {
      console.warn('API端点 /auth/pending-users 不存在');
      return { 
        success: false, 
        msg: 'API端点不存在，此功能可能尚未实现', 
        users: [] 
      };
    }
    
    // 如果API存在，正常请求
    const response = await instance.get('/auth/pending-users');
    return response.data;
  } catch (error) {
    console.error('获取待审批用户失败:', error);
    // 确保返回一个有效的对象，避免前端解构时出错
    return handleError(error, '获取待审批用户失败', { users: [] });
  }
};

// 审批用户
export const approveUser = async (userId, isApproved) => {
  try {
    const response = await instance.put(`/auth/approve-user/${userId}`, {
      approved: isApproved
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to approve user');
  }
};
