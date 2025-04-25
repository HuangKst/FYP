// Script to manually run the migration
import { sequelize } from './db/index.js';
import { up } from './migrations/add_login_security_fields.js';
import { DataTypes } from 'sequelize';

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Create a queryInterface object that's normally provided by Sequelize CLI
    const queryInterface = sequelize.getQueryInterface();
    
    // Run the migration
    await up(queryInterface, DataTypes);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 