// test-db.js
import { sequelize } from '../db/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Print environment variables
console.log('Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_DIALECT:', process.env.DB_DIALECT);
console.log('TUSHARE_API_KEY:', process.env.TUSHARE_API_KEY ? 'Set (hidden)' : 'Not set');
console.log('TUSHARE_API_URL:', process.env.TUSHARE_API_URL);

// Test database connection
async function testDB() {
  try {
    console.log('\nTesting database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Get all tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('\nDatabase tables:', tables);
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

testDB(); 