import { promises as fs } from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'logger', 'log.txt');
const logger = async (req, res, next) => {
  try {
    const user = req.user ? req.user.username || req.user.email || req.user.id : 'Unknown User';
    const ip = req.ip || req.connection.remoteAddress;
    const logEntry = `${new Date().toISOString()} - User: ${user} - IP: ${ip} - ${req.method} ${req.url}\n`;

    await fs.appendFile(logFilePath, logEntry);
    next();
  } catch (err) {
    console.error('Logger Error:', err.message);
  }
};

export default logger;
