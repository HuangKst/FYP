// scripts/initMaterialPrices.js
import { 
  validateTushareConfig, 
  updateAllMaterialPrices, 
  getDateRange 
} from '../utils/materialPriceUtils.js';
import DailyMaterialPrice from '../Models/dailyMaterialPriceModel.js';
import { sequelize } from '../db/index.js';

async function initMaterialPriceDatabase() {
  try {
    console.log('🔍 Validating Tushare API configuration...');
    if (!validateTushareConfig()) {
      throw new Error('Tushare API configuration validation failed, please check environment variables');
    }
    
    console.log('🔄 Verifying database connection...');
    await sequelize.authenticate();
    
    console.log('📊 Checking if daily_material_price table exists...');
    // Create table if it doesn't exist (force: false means it won't recreate if it exists)
    await DailyMaterialPrice.sync({ force: false });
    
    const { startDate, endDate } = getDateRange(180);
    console.log(`🚀 Starting material price database initialization...`);
    console.log(`📅 Fetching data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    const startTime = Date.now();
    const records = await updateAllMaterialPrices();
    const endTime = Date.now();
    
    const newRecords = records.filter(record => record.created);
    
    console.log(`✅ Initialization complete!`);
    console.log(`⏱️ Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    console.log(`📝 Total records: ${records.length}`);
    console.log(`🆕 New records: ${newRecords.length}`);
    console.log(`🔄 Updated records: ${records.length - newRecords.length}`);
    
    // Simple statistics
    const materials = [...new Set(records.map(r => r.material))];
    for (const material of materials) {
      const materialRecords = records.filter(r => r.material === material);
      const newMaterialRecords = newRecords.filter(r => r.material === material);
      console.log(`- ${material}: ${materialRecords.length} total records (new: ${newMaterialRecords.length})`);
    }
    
    console.log('\n📊 Price range statistics:');
    for (const material of materials) {
      const prices = records
        .filter(r => r.material === material)
        .map(r => parseFloat(r.price));
      
      if (prices.length > 0) {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        console.log(`- ${material}: min ${min.toFixed(2)}, max ${max.toFixed(2)}, avg ${avg.toFixed(2)}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Initialization failed: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  } finally {
    // Close database connection and exit process
    try {
      await sequelize.close();
      console.log('🔌 Database connection closed');
    } catch (e) {
      console.error('Error closing database connection:', e);
    } finally {
      console.log('👋 Script execution complete');
      process.exit(0);
    }
  }
}

// Execute initialization script
initMaterialPriceDatabase(); 