import React, { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from './contexts/authContext'

const AdminRoutes = () => {
  const { role } = useContext(AuthContext);
  const location = useLocation();

  return role === "admin" || role === "boss" ? (
    <Outlet />
  ) : (
    <Navigate to="/403" replace state={{ from: location }} />
  );
};

export default AdminRoutes;
