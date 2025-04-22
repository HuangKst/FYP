import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Navigate, Routes,Outlet} from "react-router-dom";
import HomePage from "./pages/homePage";
import { QueryClientProvider, QueryClient } from "react-query";
import { ReactQueryDevtools } from 'react-query/devtools';
import ProtectedRoutes, { EmployeeRestricted } from "./protectRoutes";
import AdminRoutes from "./AdminRoutes.js";
import LoginPage from "./pages/LoginPage";
import AuthContextProvider from "./contexts/authContext.js";
import SignUpPage from "./pages/signUpPage.js";
import ForbiddenPage from "./pages/forbiddenPage.js";
import InventoryPage from "./pages/inventoryPage.js";
import SiteHeader from "./component/siteHeader/index.js";
import CustomerPage from "./pages/customerPage.js";
import OrderPage from "./pages/orderPage.js";
import CreateOrderPage from "./pages/createOrderPage.js";
import OrderDetailPage from "./pages/orderDetail.js";
import EditOrderPage from "./pages/editOrderPage.js";
import EmployeePage from "./pages/employeePage.js";
import EmployeeDetailPage from "./pages/employeeDetailPage.js";
import CustomerDetailPage from "./pages/customerDetailPage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 360000,
      refetchInterval: 360000, 
      refetchOnWindowFocus: false
    },
  },
});

const Layout = () => {
  return (
    <>
      <Routes>
        {/* 所有受保护的路由在 ProtectedRoutes 下 */}
        <Route element={<ProtectedRoutes />}>
          {/* 登录后的公共布局（包含 Header 和内容区域） */}
          <Route element={
            <>
              <SiteHeader /> {/* 登录后显示 Header */}
              <Outlet />     {/* 子路由内容 */}
            </>
          }>
            <Route path="/home" element={<HomePage />} />  
            <Route path="/inventory" element={<InventoryPage/>} />
            <Route path="/customer" element={<CustomerPage/>} />
            <Route path="/customers/:customerId" element={
              <EmployeeRestricted>
                <CustomerDetailPage/>
              </EmployeeRestricted>
            } />
            <Route path="/orders" element={<OrderPage/>} />
            <Route path="/order/:orderId" element={<OrderDetailPage/>} />
            <Route path="/edit-order/:orderId" element={<EditOrderPage/>} />
            <Route path="/create-order" element={<CreateOrderPage/>} />
            {/* 管理员专属路由 */}
            <Route element={<AdminRoutes />}>   
              <Route path="/employee" element={<EmployeePage/>} />
              <Route path="/employee/:id" element={<EmployeeDetailPage/>} />
            </Route>
          </Route>
        </Route>   
        {/* 无需登录的路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage/>}/>
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthContextProvider>
            <Layout /> {/* 将 Layout 放在 BrowserRouter 内部 */}
        </AuthContextProvider>
      </BrowserRouter>
      
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};


const rootElement = createRoot( document.getElementById("root") )
rootElement.render(<App />);