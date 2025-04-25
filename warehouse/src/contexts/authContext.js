import React, { createContext, useState, useEffect } from 'react';
import { login, signup } from '../api/user-api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState("employee");

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    try {
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.userId) {
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setRole(parsedUser.userRole || "employee");
        }
      }
    } catch (error) {
      console.error('Failed to read the local data :', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  const handleLogin = async (username, password, captchaToken = null) => {
    const result = await login(username, password, captchaToken);
    if (result && result.success) {
      const { token, user } = result;
      setToken(token);
      setUser(user);
      console.log("Setting isAuthenticated to true");
      setIsAuthenticated(true);
      setRole(user.userRole || "employee");
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      console.error('Login Failed:', result?.msg || 'Error');
    }
    return result;
  };

  const handleSignup = async (username, password) => {
    const result = await signup(username, password);
    if (result.success) {
      await handleLogin(username, password);
    }
    return result;
  };

  const handleLogout = async () => {
    try {
      console.log('Logout Successfully');
    } catch (error) {
      console.error('Logout Failed:', error);
    } finally {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setRole("employee");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const hasPermission = (requiredRole) => {
    const rolesHierarchy = ['employee', 'boss', 'admin'];
    return rolesHierarchy.indexOf(role) >= rolesHierarchy.indexOf(requiredRole);
  };

  const contextValue = {
    role,
    token,
    user,
    isAuthenticated,
    handleLogin,
    handleSignup,
    handleLogout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
