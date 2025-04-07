import axiosInstance from './axios';
import { handleError } from '../utils/errorHandler';

// 获取所有员工
export const getAllEmployees = async () => {
  try {
    const response = await axiosInstance.get('/employees');
    return response.data;
  } catch (error) {
    return handleError(error, '获取员工列表失败');
  }
};

// 添加新员工
export const addEmployee = async (employeeData) => {
  try {
    const response = await axiosInstance.post('/employees', employeeData);
    return response.data;
  } catch (error) {
    return handleError(error, '添加员工失败');
  }
};

// 删除员工
export const deleteEmployee = async (employeeId) => {
  try {
    const response = await axiosInstance.delete(`/employees/${employeeId}`);
    return response.data;
  } catch (error) {
    return handleError(error, '删除员工失败');
  }
};

// 获取员工加班记录
export const getEmployeeOvertimes = async () => {
  try {
    const response = await axiosInstance.get('/employee-overtimes');
    return response.data;
  } catch (error) {
    return handleError(error, '获取加班记录失败');
  }
};

// 添加员工加班记录
export const addEmployeeOvertime = async (overtimeData) => {
  try {
    const response = await axiosInstance.post('/employee-overtimes', overtimeData);
    return response.data;
  } catch (error) {
    return handleError(error, '添加加班记录失败');
  }
};

// 删除员工加班记录
export const deleteEmployeeOvertime = async (overtimeId) => {
  try {
    const response = await axiosInstance.delete(`/employee-overtimes/${overtimeId}`);
    return response.data;
  } catch (error) {
    return handleError(error, '删除加班记录失败');
  }
};

// 获取员工请假记录
export const getEmployeeLeaves = async () => {
  try {
    const response = await axiosInstance.get('/employee-leaves');
    return response.data;
  } catch (error) {
    return handleError(error, '获取请假记录失败');
  }
};

// 添加员工请假记录
export const addEmployeeLeave = async (leaveData) => {
  try {
    const response = await axiosInstance.post('/employee-leaves', leaveData);
    return response.data;
  } catch (error) {
    return handleError(error, '添加请假记录失败');
  }
};

// 删除员工请假记录
export const deleteEmployeeLeave = async (leaveId) => {
  try {
    const response = await axiosInstance.delete(`/employee-leaves/${leaveId}`);
    return response.data;
  } catch (error) {
    return handleError(error, '删除请假记录失败');
  }
};
