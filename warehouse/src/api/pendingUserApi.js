
import axios from 'axios';

export async function fetchPendingUsers() {
  const token = localStorage.getItem('token'); // 从 localStorage 获取纯 token
  if (!token) {
    throw new Error('Token is missing. Please log in first.');
  }

  const response = await axios.get('http://localhost:8080/api/admin/pending-users', {
    headers: {
      Authorization: `Bearer ${token}`, // 前端负责添加 "Bearer "
    },
  });

  return response.data;
}



export async function approveUser(userId, isApproved) {
  const token = localStorage.getItem('token'); // 从 localStorage 获取 token
  if (!token) {
    throw new Error('No token found. Please log in first.');
  }

  const newStatus = isApproved ? 'active' : 'inactive';
  await axios.put(`${process.env.REACT_APP_API_BASE_URL }/admin/approve-user/${userId}`, 
    { status: newStatus },
    {
      headers: {
        Authorization: `Bearer ${token}`, // 设置 Authorization 头
      },
    }
  );
}

