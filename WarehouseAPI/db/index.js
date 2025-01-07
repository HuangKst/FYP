import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); 

// 从环境变量中获取数据库配置
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_DIALECT,
} = process.env;

// 建立 Sequelize 连接
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT, 
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
