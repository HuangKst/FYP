import ExcelJS from 'exceljs';
import instance from './axios';
import { handleError } from '../utils/errorHandler';
// 获取库存数据（支持按材质和规格筛选，增加分页功能）
export const fetchInventory = async (material, specification, lowStock = false, page = 1, pageSize = 10) => {
  try {
    const response = await instance.get(`/inventory`, {
      params: {
        material,
        spec: specification,
        lowStock: lowStock ? 'true' : undefined,
        page,
        pageSize
      },
    });
    console.log("✅ Inventory data received:", response.data);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch inventory')
  }
};

/**
 * 获取所有库存数据，不使用分页
 * 主要用于库存检查和订单创建，确保能获取到所有数据
 * @param {string} material - 可选，按材料筛选
 * @param {string} specification - 可选，按规格筛选
 * @param {boolean} lowStock - 可选，是否只显示低库存项目
 * @returns {Promise<Object>} 返回所有匹配的库存数据
 */
export const fetchAllInventory = async (material, specification, lowStock = false) => {
  try {
    const response = await instance.get(`/inventory/all`, {
      params: {
        material,
        spec: specification,
        lowStock: lowStock ? 'true' : undefined
      },
    });
    console.log("✅ All inventory data received:", response.data);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to fetch all inventory')
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

// 删除库存项
export const deleteInventoryItem = async (id) => {
  try {
    const response = await instance.delete(`/inventory/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Failed to delete inventory item')
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
export const exportInventoryToExcel = async (material, specification, lowStock) => {
  try {
    const response = await instance.get(`/inventory/export`, {
      params: {
        material,
        spec: specification,
        lowStock: lowStock ? 'true' : undefined,
      },
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
