// routes/materialDailyPriceRoutes.js
import express from 'express';
import DailyMaterialPrice from '../Models/dailyMaterialPriceModel.js';
import {
  validateTushareConfig,
  CONTRACTS,
  getDateRange,
  saveMaterialPrice,
  getLatestMaterialPrices,
  updateAllMaterialPrices
} from '../utils/materialPriceUtils.js';

// Validate Tushare API configuration
validateTushareConfig();

const router = express.Router();

// Initialize database - API endpoint
router.post('/init-database', async (req, res) => {
  try {
    // Get 6 months of data and update all material prices (default 180 days)
    const savedRecords = await updateAllMaterialPrices();
    
    // Filter only newly created records
    const newRecords = savedRecords.filter(record => record.created);
    
    res.status(200).json({
      success: true,
      message: 'Material price database initialized successfully',
      data: {
        totalRecords: newRecords.length,
        records: newRecords
      }
    });
  } catch (error) {
    console.error('Error initializing material price database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize material price database',
      error: error.message
    });
  }
});

// Get real-time prices (without storing to database) - API endpoint
router.get('/real-time', async (req, res) => {
  try {
    // Get latest material price data
    const realTimeData = await getLatestMaterialPrices();
    
    res.status(200).json({
      success: true,
      message: 'Real-time prices retrieved successfully',
      data: realTimeData,
      fetchTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting real-time prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get real-time prices',
      error: error.message
    });
  }
});

// Manually update material prices - API endpoint
router.post('/update-prices', async (req, res) => {
  try {
    // Get and update 6 months of material price data (default 180 days)
    const savedRecords = await updateAllMaterialPrices();
    
    res.status(200).json({
      success: true,
      message: 'Material prices updated successfully',
      data: {
        totalRecords: savedRecords.length,
        records: savedRecords
      }
    });
  } catch (error) {
    console.error('Error updating material prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update material prices',
      error: error.message
    });
  }
});

// Automatic price update helper function
export async function updateMaterialPrices() {
  try {
    // Get and update most recent 7 days of material price data
    await updateAllMaterialPrices(7);
    console.log('Material prices automatically updated successfully');
    return true;
  } catch (error) {
    console.error('Error during automatic material price update:', error);
    return false;
  }
}

// Get all material prices
router.get('/', async (req, res) => {
  try {
    const prices = await DailyMaterialPrice.findAll({
      order: [['date', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Error getting material prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get material prices',
      error: error.message
    });
  }
});

// Get prices by material
router.get('/:material', async (req, res) => {
  try {
    const { material } = req.params;
    const prices = await DailyMaterialPrice.findAll({
      where: { material },
      order: [['date', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Error getting material prices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get material prices',
      error: error.message
    });
  }
});

export default router;
