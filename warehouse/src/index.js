import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Navigate, Routes} from "react-router-dom";
import HomePage from "./pages/homePage";
import { QueryClientProvider, QueryClient } from "react-query";
import { ReactQueryDevtools } from 'react-query/devtools';
import ProtectedRoutes from "./protectRoutes";
import AdminRoutes from "./AdminRoutes.js";
import PendingPage from "./pages/PendingPage.js"
import LoginPage from "./pages/LoginPage";
import AuthContextProvider from "./contexts/authContext.js";
import SignUpPage from "./pages/signUpPage.js";
import ForbiddenPage from "./pages/forbiddenPage.js";

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
      { } 
      <Routes>
        <Route element={<ProtectedRoutes/>}>
          <Route path="/home" element={<HomePage />} />  
          <Route element={<AdminRoutes/>}>   
          <Route path="/pending" element={<PendingPage/>} />
          </Route>
        </Route>   
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