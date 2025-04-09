import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import usersRouter from './routes/userRoutes.js';
import defaultErrHandler from './errHandler/index.js';
import authenticate from './authenticate/index.js';
import adminAuth from './authenticate/adminAuth.js';
import adminRouter from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import employeeLeaveRoutes from './routes/employeeLeaveRoutes.js';
import employeeOvertimeRoutes from './routes/employeeOvertimeRoutes.js';
import logger from './logger/index.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/users', usersRouter); // 如果部分路由不需要认证，可直接使用
app.use('/api/admin', authenticate, adminAuth, logger, adminRouter);
app.use('/api/customers', authenticate, logger, customerRoutes);
app.use('/api/orders', authenticate, logger, orderRoutes);
app.use('/api/inventory', authenticate, logger, inventoryRoutes);

// 员工相关路由需要管理员权限
app.use('/api/employees', authenticate, adminAuth, logger, employeeRoutes);
app.use('/api/employee-leaves', authenticate, adminAuth, logger, employeeLeaveRoutes);
app.use('/api/employee-overtimes', authenticate, adminAuth, logger, employeeOvertimeRoutes);

// 错误处理器
app.use(defaultErrHandler);

// 监听
app.listen(port, () => {
  if (process.env.NODE_ENV === 'development') {
    console.info(`Server running at port ${port}`);
  }
});

// 捕获全局错误
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
