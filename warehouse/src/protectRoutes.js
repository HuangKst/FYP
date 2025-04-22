import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from './contexts/authContext'

const ProtectedRoutes = () => {

  const context = useContext(AuthContext);
  const location = useLocation();

  return context.isAuthenticated === true ? (
    <Outlet /> 
  ) : (
    <Navigate to='/login' replace state={{ from: location }}/>
  );
};

const EmployeeRestricted = ({ children }) => {
  const { role } = useContext(AuthContext);
  
  // 检查是否为员工角色，且访问的是客户详情页面（路径为 /customers/:id）
  if (role === 'employee' && window.location.pathname.match(/^\/customers\/\d+$/)) {
    // 员工尝试访问客户详情页面，重定向到客户列表页面
    return <Navigate to="/customer" replace />;
  }
  
  return children;
};

export { ProtectedRoutes, EmployeeRestricted };
export default ProtectedRoutes;
