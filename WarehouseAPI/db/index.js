import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保加载正确的.env文件
dotenv.config({ path: path.resolve(__dirname, '../.env') }); 

// 从环境变量中获取数据库配置，并提供默认值
const DB_HOST = process.env.DB_HOST ;
const DB_USER = process.env.DB_USER ;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME ;
const DB_DIALECT = process.env.DB_DIALECT ;

console.log('数据库配置:', {
  host: DB_HOST,
  dialect: DB_DIALECT,
  database: DB_NAME,
  username: DB_USER
});

// 建立 Sequelize 连接
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT, // 确保这里有值
  logging: false,      
});

// 测试
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Sequelize: Connection has been established successfully.');
  } catch (error) {
    console.error('Sequelize: Unable to connect to the database:', error);
  }
}
