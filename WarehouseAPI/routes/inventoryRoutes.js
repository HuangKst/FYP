import express from 'express';
import Inventory from '../Models/inventoryModel.js';
import{Op,Sequelize} from 'sequelize';
import { sequelize } from '../db/index.js';
import ExcelJS from 'exceljs';
import { authMiddleware, checkInventoryPermission } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/inventory
 * Retrieve inventory (optional filters: material=?, specification=?, page=?, pageSize=? )
 */
router.get('/',async (req, res) => {
  try {
    const { material, spec, lowStock, page = 1, pageSize = 10 } = req.query;
    const where = {};
    if (material) where.material = material;
    if (spec) where.specification = { [Op.like]: `%${spec}%` };
    if (lowStock === 'true') where.quantity = { [Op.lt]: 20 }; // Trigger low stock warning if less than 20

    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // Get total record count
    const count = await Inventory.count({ where });
    
    // Get paginated data
    const list = await Inventory.findAll({ 
      where, 
      order: [['specification','ASC']],
      offset,
      limit
    });
    
    res.json({ 
      success: true, 
      inventory: list,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch inventory' });
  }
});

/**
 * GET /api/inventory/materials
 * Get all distinct materials
 */
router.get('/materials',async (req, res) => {
  try {
    const materials = await Inventory.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('material')), 'material']],
      order: [['material', 'ASC']]
    });
    res.json({ success: true, materials: materials.map((m) => m.material) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to fetch materials' });
  }
});


/**
 * POST /api/inventory
 * Add a single material (material, specification, quantity, density)
 * Requires permission: boss, admin
 */
router.post('/', authMiddleware, checkInventoryPermission, async (req, res) => {
  try {
    const { material, specification, quantity, density } = req.body;

    if (!material || !specification || !quantity) {
      return res.status(400).json({ success: false, msg: 'Missing required fields' });
    }

    // Handle `density`: convert empty string to `null`
    const densityValue = density === '' ? null : density;

    let inv = await Inventory.findOne({ where: { material, specification } });
    if (inv) {
      const newQty = (parseFloat(inv.quantity) + parseFloat(quantity)).toFixed(2);
      await inv.update({ quantity: newQty, density: densityValue || inv.density });
      return res.json({ success: true, msg: 'Inventory updated successfully', inventory: inv });
    } else {
      const newInv = await Inventory.create({ material, specification, quantity, density: densityValue });
      return res.status(201).json({ success: true, inventory: newInv });
    }
  } catch (err) {
    console.error('❌ Failed to add inventory:', err);
    res.status(500).json({ success: false, msg: 'Failed to add inventory' });
  }
});

/**
 * PUT /api/inventory/:id
 * Update inventory (quantity, density)
 * Requires permission: boss, admin
 */
router.put('/:id', authMiddleware, checkInventoryPermission, async (req, res) => {
  try {
    const { quantity, density } = req.body;
    const [count] = await Inventory.update({ quantity, density }, { where: { id: req.params.id } });
    if (count === 0) return res.status(404).json({ success: false, msg: 'Record not found' });
    res.json({ success: true, msg: 'Inventory updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to update inventory' });
  }
});

/**
 * POST /api/inventory/import
 * Receive parsed inventory data from front-end and store into database
 * Requires permission: boss, admin
 */
router.post('/import', authMiddleware, checkInventoryPermission, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { inventory } = req.body; // Receive parsed data from front-end

    if (!inventory || !Array.isArray(inventory)) {
      return res.status(400).json({ success: false, msg: 'Invalid inventory data' });
    }

    // Protection: limit to maximum 500 records per import
    if (inventory.length > 500) {
      return res.status(400).json({ success: false, msg: 'You can import at most 500 inventory items at once. Please split into smaller batches.' });
    }

    // Define function to detect potential malicious content (e.g., formulas)
    const isFormulaLike = (str) => {
      if (typeof str !== 'string') return false;
      // Check if string starts with formula characters
      return ['=', '+', '-', '@', '\\'].some(char => str.trim().startsWith(char));
    };
    
    // Define function to validate that text contains only English letters, numbers, and allowed punctuation
    const isValidText = (str) => {
      if (typeof str !== 'string') return true;
      // Allow letters, numbers, spaces, and basic punctuation
      return /^[a-zA-Z0-9\s.,\-_()[\]#&*/\\:;?!$%@+]*$/.test(str);
    };

    // Validate each record to prevent malicious content or invalid format
    for (const [idx, item] of inventory.entries()) {
      const { material, specification, quantity, density } = item;
      
      // Check for formula injection
      if (isFormulaLike(material)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - material may contain a formula or unsafe content` });
      }
      if (isFormulaLike(specification)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - specification may contain a formula or unsafe content` });
      }
      
      // Validate only English characters and allowed punctuation
      if (!isValidText(material)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - material contains invalid characters` });
      }
      if (!isValidText(specification)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - specification contains invalid characters` });
      }
      
      // Validate required fields and types
      if (!material || typeof material !== 'string' || material.length > 100) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid material field` });
      }
      if (!specification || typeof specification !== 'string' || specification.length > 100) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid specification field` });
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid quantity field` });
      }
      if (density !== '' && density !== undefined) {
        const den = parseFloat(density);
        if (isNaN(den) || den < 0) {
          return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid density field` });
        }
      }
    }

    // Sanitization: escape potential formulas and ensure only English characters
    const sanitizedInventory = inventory.map(item => {
      const sanitized = { ...item };
      
      // If string starts with a formula character, prepend a single quote to escape
      if (typeof sanitized.material === 'string' && isFormulaLike(sanitized.material)) {
        sanitized.material = "'" + sanitized.material;
      }
      if (typeof sanitized.specification === 'string' && isFormulaLike(sanitized.specification)) {
        sanitized.specification = "'" + sanitized.specification;
      }
      
      return sanitized;
    });

    for (const item of sanitizedInventory) {
      const { material, specification, quantity, density } = item;

      if (!material || !specification || !quantity) {
        continue; // Skip records missing required fields
      }

      const existingItem = await Inventory.findOne({ where: { material, specification } });

      if (existingItem) {
        const newQuantity = (parseFloat(existingItem.quantity) + parseFloat(quantity)).toFixed(2);
        await existingItem.update({ quantity: newQuantity, density: density || existingItem.density });
      } else {
        await Inventory.create({ material, specification, quantity, density });
      }
    }
    await transaction.commit(); // Commit transaction
    res.json({ success: true, msg: 'Inventory imported successfully' });
  } catch (err) {
    await transaction.rollback(); // Rollback transaction
    console.error(err);
    res.status(500).json({ success: false, msg: 'Failed to import inventory' });
  }
});

/**
 * GET /api/inventory/all
 * Get all inventory data without pagination - mainly used for inventory check and order creation
 */
router.get('/all',async (req, res) => {
  try {
    const { material, spec, lowStock } = req.query;
    const where = {};
    if (material) where.material = material;
    if (spec) where.specification = { [Op.like]: `%${spec}%` };
    if (lowStock === 'true') where.quantity = { [Op.lt]: 20 }; // Trigger low stock warning if less than 20

    // 获取所有匹配的数据，不应用分页限制
    const list = await Inventory.findAll({ 
      where, 
      order: [['specification','ASC']]
    });
    
    res.json({ 
      success: true, 
      inventory: list,
      total: list.length
    });
  } catch (err) {
    console.error('获取所有库存数据失败:', err);
    res.status(500).json({ success: false, msg: 'Failed to fetch all inventory' });
  }
});

/**
 * GET /api/inventory/export
 * Export inventory to Excel
 * Requires permission: boss, admin
 */
router.get('/export', authMiddleware, checkInventoryPermission, async (req, res) => {
  try {
    const { material, spec, lowStock } = req.query;
    const where = {};
    
    // Add filter conditions
    if (material) where.material = material;
    if (spec) where.specification = { [Op.like]: `%${spec}%` };
    if (lowStock === 'true') where.quantity = { [Op.lt]: 20 }; // Trigger low stock warning if less than 20
    
    const data = await Inventory.findAll({
      where,
      order: [['material', 'ASC'], ['specification', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Set worksheet columns (should correspond to database fields)
    worksheet.columns = [
      { header: 'Material', key: 'material', width: 20 },
      { header: 'Specification', key: 'specification', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 15 },
      { header: 'Density', key: 'density', width: 15 },
      { header: 'Created At', key: 'created_at', width: 20 },
      { header: 'Updated At', key: 'updated_at', width: 20 }
    ];

    // Fill data
    data.forEach(item => {
      worksheet.addRow({
        material: item.material,
        specification: item.specification,
        quantity: item.quantity,
        density: item.density,
        created_at: item.created_at,
        updated_at: item.updated_at
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="inventory_export.xlsx"'
    );

    // Send file stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Export failed:', err);
    res.status(500).json({ success: false, msg: 'Export failed' });
  }
});

export default router;