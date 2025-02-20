import axios from 'axios';
import ExcelJS from 'exceljs';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 获取库存数据（支持按材质和规格筛选）
export const fetchInventory = async (material, specification,lowStock=false) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory`, {
      params: {
        material,
        spec: specification,
        lowStock: lowStock ? 'true' : undefined,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const { data } = error.response;
      return {
        success: data.success || false,
        msg: data.msg || 'Failed to fetch inventory',
        status: error.response.status,
      };
    }
    return {
      success: false,
      msg: 'Internet error',
      status: 0,
    };
  }
};

/**
 * 获取所有材质列表
 * @returns {Promise<Object>} 返回材质数组
 */
export const fetchMaterials = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/materials`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        const { data } = error.response;
        return {
          success: data.success || false,
          msg: data.msg || 'Failed to fetch materials',
          status: error.response.status,
        };
      }
      return {
        success: false,
        msg: 'Internet error',
        status: 0,
      };
    }
  };

  
  
// 添加库存项
export const addInventoryItem = async (material, specification, quantity, density) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/inventory`, {
      material,
      specification,
      quantity,
      density,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const { data } = error.response;
      return {
        success: data.success || false,
        msg: data.msg || 'Failed to add inventory item',
        status: error.response.status,
      };
    }
    return {
      success: false,
      msg: 'Internet error',
      status: 0,
    };
  }
};

// 修改库存项
export const updateInventoryItem = async (id, quantity, density) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/inventory/${id}`, {
      quantity,
      density,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const { data } = error.response;
      return {
        success: data.success || false,
        msg: data.msg || 'Failed to update inventory item',
        status: error.response.status,
      };
    }
    return {
      success: false,
      msg: 'Internet error',
      status: 0,
    };
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
    const response = await axios.post(`${API_BASE_URL}/inventory/import`, {
      inventory: inventoryData,
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      const { data } = error.response;
      return {
        success: data.success || false,
        msg: data.msg || 'Failed to import inventory',
        status: error.response.status,
      };
    }
    return {
      success: false,
      msg: 'Internet error',
      status: 0,
    };
  }
};

// 在文件末尾新增
export const exportInventoryToExcel = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/inventory/export`, {
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
    
    return { success: true };
  } catch (error) {
    if (error.response && error.response.data) {
      const { data } = error.response;
      return { success: false, msg: data.msg || 'Export failed' };
    }
    return { success: false, msg: 'Network error' };
  }
};
