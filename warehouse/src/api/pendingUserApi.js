import instance from './axios';
import { handleError } from '../utils/errorHandler';

// 获取待审批的用户列表
export async function fetchPendingUsers() {
  try {
    const response = await instance.get(`/admin/pending-users`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch pending users');
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
