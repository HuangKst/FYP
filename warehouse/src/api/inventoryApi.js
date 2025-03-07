import ExcelJS from 'exceljs';
import instance from './axios';
import { handleError } from '../utils/errorHandler';
// 获取库存数据（支持按材质和规格筛选）
export const fetchInventory = async (material, specification, lowStock = false) => {
  try {
    const response = await instance.get(`/inventory`, {
      params: {
        material,
        spec: specification,
        lowStock: lowStock ? 'true' : undefined,
      },
    });
    console.log("✅ Inventory data received:", response.data);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch inventory')
  }
};

/**
 * 获取所有材质列表
 * @returns {Promise<Object>} 返回材质数组
 */
export const fetchMaterials = async () => {
  try {
    const response = await instance.get(`/inventory/materials`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch materials')
  }
};


// 添加库存项
export const addInventoryItem = async (material, specification, quantity, density) => {
  try {
    const response = await instance.post(`/inventory`, {
      material,
      specification,
      quantity,
      density,
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to add inventory item')
  }
};

// 修改库存项
export const updateInventoryItem = async (id, quantity, density) => {
  try {
    const response = await instance.put(`/inventory/${id}`, {
      quantity,
      density,
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to update inventory item')
  }
};

// 导入库存数据的功能（使用 exceljs 解析 Excel 文件并上传 JSON 数据）
export const importInventoryFromExcel = async (file) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file);
    const worksheet = workbook.getWorksheet(1); // 默认读取第一个工作表

    const inventoryData = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // 跳过表头

      const material = row.getCell(1).value;
      const specification = row.getCell(2).value;
      const quantity = row.getCell(3).value;
      const density = row.getCell(4).value;

      if (material && specification && quantity) {
        inventoryData.push({ material, specification, quantity, density });
      }
    });

    // 发送数据到后端
    const response = await instance.post(`/inventory/import`, {
      inventory: inventoryData,
    });

    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to import inventory')
  }
};

// 导出库存数据到 Excel
export const exportInventoryToExcel = async () => {
  try {
    const response = await instance.get(`/inventory/export`, {
      responseType: 'blob',
    });

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory_export.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // 释放 URL，避免内存泄漏

    return { success: true };
  } catch (error) {
    return handleError(error, 'Export failed')
  }
};
