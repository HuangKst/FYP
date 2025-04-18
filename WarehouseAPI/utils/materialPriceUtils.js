import axios from 'axios';
import DailyMaterialPrice from '../Models/dailyMaterialPriceModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Get Tushare API configuration from environment variables
export const TUSHARE_TOKEN = process.env.TUSHARE_API_KEY;
export const TUSHARE_API_URL = process.env.TUSHARE_API_URL;

// Validate Tushare API configuration
export function validateTushareConfig() {
  if (!TUSHARE_TOKEN) {
    console.error('❌ Tushare API Key is not set! Please check TUSHARE_API_KEY in .env file');
    return false;
  }
  
  if (!TUSHARE_API_URL) {
    console.error('❌ Tushare API URL is not set! Please check TUSHARE_API_URL in .env file');
    return false;
  }
  
  return true;
}

// Define contract codes
export const CONTRACTS = {
  SS: 'SS2506.SHF',  // Stainless Steel
  HC: 'HC2510.SHF'   // Hot Rolled Coil
};

// Get futures daily data for specified date range
export async function getFutureDaily(tsCode, startDate, endDate) {
  try {
    const response = await axios.post(TUSHARE_API_URL, {
      api_name: 'fut_daily',
      token: TUSHARE_TOKEN,
      params: {
        ts_code: tsCode,
        start_date: startDate,
        end_date: endDate
      },
      fields: 'trade_date,close'
    });

    if (response.data.code !== 0) {
      throw new Error(`Tushare API error: ${response.data.msg}`);
    }

    const data = response.data.data;
    
    // Check if data is returned
    if (!data.items || data.items.length === 0) {
      console.warn(`⚠️ Contract ${tsCode} has no trading data (may not have started trading yet)`);
      return [];
    }
    
    const items = data.items.map(item => ({
      trade_date: item[0],
      close: item[1]
    }));

    return items.sort((a, b) => a.trade_date.localeCompare(b.trade_date));
  } catch (error) {
    console.error(`Error fetching data for ${tsCode}:`, error);
    throw error;
  }
}

// Date formatting: YYYYMMDD -> YYYY-MM-DD
export function formatDate(dateString) {
  if (!dateString || dateString.length !== 8) {
    return null;
  }
  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

// Get date range
export function getDateRange(daysBack = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const startDateStr = startDate.toISOString().slice(0, 10).replace(/-/g, '');
  const endDateStr = endDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  return { startDateStr, endDateStr, startDate, endDate };
}

// Save material price records to database
export async function saveMaterialPrice(data, material, onlyReturnCreated = false) {
  const savedRecords = [];
  
  for (const item of data) {
    const formattedDate = formatDate(item.trade_date);
    if (!formattedDate) continue;
    
    const [record, created] = await DailyMaterialPrice.findOrCreate({
      where: {
        date: formattedDate,
        material: material
      },
      defaults: {
        price_per_ton: item.close,
        created_at: formattedDate
      }
    });
    
    // If record exists and needs update
    if (!created && !onlyReturnCreated) {
      record.price_per_ton = item.close;
      await record.save();
    }
    
    // Whether to return only newly created records
    if ((created || !onlyReturnCreated)) {
      savedRecords.push({
        id: record.id,
        date: record.date,
        material: record.material,
        price: record.price_per_ton,
        created: created
      });
    }
  }
  
  return savedRecords;
}

// Get latest material prices
export async function getLatestMaterialPrices() {
  try {
    // Get date range for last 7 days
    const { startDateStr, endDateStr } = getDateRange(7);
    
    // Get real-time data for stainless steel and hot rolled coil
    const [ssData, hcData] = await Promise.all([
      getFutureDaily(CONTRACTS.SS, startDateStr, endDateStr),
      getFutureDaily(CONTRACTS.HC, startDateStr, endDateStr)
    ]);
    
    // Prepare response data
    const realTimeData = [];
    
    // Get latest stainless steel price data
    if (ssData.length > 0) {
      const latestSS = ssData[ssData.length - 1];
      const formattedDate = formatDate(latestSS.trade_date);
      realTimeData.push({
        material: 'stainless_steel',
        date: formattedDate,
        price: latestSS.close,
        contract: CONTRACTS.SS
      });
    } else {
      realTimeData.push({
        material: 'stainless_steel',
        date: null,
        price: null,
        contract: CONTRACTS.SS,
        message: 'No trading data available'
      });
    }
    
    // Get latest hot rolled coil price data
    if (hcData.length > 0) {
      const latestHC = hcData[hcData.length - 1];
      const formattedDate = formatDate(latestHC.trade_date);
      realTimeData.push({
        material: 'hot_rolled_coil',
        date: formattedDate,
        price: latestHC.close,
        contract: CONTRACTS.HC
      });
    } else {
      realTimeData.push({
        material: 'hot_rolled_coil',
        date: null,
        price: null,
        contract: CONTRACTS.HC,
        message: 'No trading data available'
      });
    }
    
    return realTimeData;
  } catch (error) {
    console.error('Error getting latest material prices:', error);
    throw error;
  }
}

// Update all material prices
export async function updateAllMaterialPrices(daysBack = 180) { // Default: 6 months data
  try {
    // Get date range
    const { startDateStr, endDateStr } = getDateRange(daysBack);
    
    // Get stainless steel and hot rolled coil data
    const [ssData, hcData] = await Promise.all([
      getFutureDaily(CONTRACTS.SS, startDateStr, endDateStr),
      getFutureDaily(CONTRACTS.HC, startDateStr, endDateStr)
    ]);
    
    // Save to database
    const ssRecords = await saveMaterialPrice(ssData, 'stainless_steel');
    const hcRecords = await saveMaterialPrice(hcData, 'hot_rolled_coil');
    
    // Merge records
    return [...ssRecords, ...hcRecords];
  } catch (error) {
    console.error('Error updating all material prices:', error);
    throw error;
  }
}
