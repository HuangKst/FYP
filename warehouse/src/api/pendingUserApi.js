import instance from './axios';
import { handleError } from '../utils/errorHandler';

// 获取待审批的用户列表
export async function fetchPendingUsers() {
  try {
    // 检查API是否存在 - 先用HEAD请求
    const checkResult = await instance.head(`/admin/pending-users`).catch(() => null);
    
    // 如果API不存在，返回一个友好的错误
    if (!checkResult) {
      console.warn('API端点 /admin/pending-users 不存在');
      return { 
        success: false, 
        msg: 'API端点不存在，此功能可能尚未实现', 
        users: [] 
      };
    }
    
    const response = await instance.get(`/admin/pending-users`);
    return response.data;
  } catch (error) {
    return handleError(error, '获取待审批用户失败', { users: [] });
  }
}

// 审批用户（批准/拒绝）
export async function approveUser(userId, isApproved) {
  try {
    const newStatus = isApproved ? 'active' : 'inactive';
    await instance.put(`/admin/approve-user/${userId}`, { status: newStatus });
    return { success: true };
  } catch (error) {
    return handleError(error, 'Failed to approve user');
  }
}
