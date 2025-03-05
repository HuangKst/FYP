import { promises as fs } from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'logger', 'log.txt');

const logger = async (req, res, next) => {
  try {
    const user = req.user ? req.user.username || req.user.email || req.user.id : 'Unknown User';
    const ip = req.ip || req.connection.remoteAddress;
    
    // 记录请求时间
    const startTime = Date.now();

    // 监听请求完成时的事件
    res.on('finish', async () => {
      const duration = Date.now() - startTime;
      const logEntry = `${new Date().toISOString()} - User: ${user} - IP: ${ip} - ${req.method} ${req.url} - Status: ${res.statusCode} - ${duration}ms\n`;
      await fs.appendFile(logFilePath, logEntry);
    });

    // 监听错误
    res.on('error', async (err) => {
      const errorLog = `${new Date().toISOString()} - User: ${user} - IP: ${ip} - ERROR: ${err.message} - ${req.method} ${req.url}\n`;
      await fs.appendFile(logFilePath, errorLog);
    });

    next();
  } catch (err) {
    console.error('Logger Error:', err.message);
  }
};

export default logger;
