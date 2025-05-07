import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from './contexts/authContext'

const AdminRoutes = () => {
  const { role, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  // 如果用户未登录，跳转到登录页面
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 如果用户已登录但不是管理员，跳转到 403 页面
  if (role !== "admin" && role !== "boss") {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default AdminRoutes;
