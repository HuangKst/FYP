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
import materialDailyPriceRoutes from './routes/materialDailyPriceRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import { initScheduler } from './scheduler.js';
import logger from './logger/index.js';
dotenv.config();

const app = express();
const port = process.env.PORT;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/users', logger, usersRouter); // 用户路由需要添加日志记录，但不需要默认认证

// 添加PDF下载路由特例 - 不需要认证
app.get('/api/orders/:id/pdf', orderRoutes);
// 添加员工请假和加班记录PDF下载特例 - 不需要认证
app.get('/api/employee-leaves/employee/:id/pdf', employeeLeaveRoutes);
app.get('/api/employee-overtimes/employee/:id/pdf', employeeOvertimeRoutes);

// 添加实时材料价格路由 - 不需要认证
app.get('/api/material-prices/real-time',authenticate, adminAuth, logger, materialDailyPriceRoutes);
// 添加初始化材料价格数据库路由 - 需要认证
app.post('/api/material-prices/init-database', authenticate, adminAuth, logger, materialDailyPriceRoutes);

// 统计路由 - 需要认证
app.use('/api/stats', authenticate, logger, statsRoutes);

// 其他routes需要认证
app.use('/api/admin', authenticate, adminAuth, logger, adminRouter);
app.use('/api/customers', authenticate, logger, customerRoutes);
app.use('/api/orders', authenticate, logger, orderRoutes);
app.use('/api/inventory', authenticate, logger, inventoryRoutes);
app.use('/api/material-prices', authenticate, logger, materialDailyPriceRoutes);

// 员工相关路由需要管理员权限
app.use('/api/employees', authenticate, adminAuth, logger, employeeRoutes);
app.use('/api/employee-leaves', authenticate, adminAuth, logger, employeeLeaveRoutes);
app.use('/api/employee-overtimes', authenticate, adminAuth, logger, employeeOvertimeRoutes);

// 错误处理器
app.use(defaultErrHandler);

// 初始化调度器
initScheduler();

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
