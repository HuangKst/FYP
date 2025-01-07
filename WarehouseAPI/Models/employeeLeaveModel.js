// Models/employeeLeaveModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';
import Employee from './employeeModel.js';

class EmployeeLeave extends Model {}

EmployeeLeave.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'EmployeeLeave',
  tableName: 'employee_leaves',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 外键 employee_id -> Employee.id
EmployeeLeave.belongsTo(Employee, {
  foreignKey: 'employee_id',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

Employee.hasMany(EmployeeLeave, { foreignKey: 'employee_id' });

export default EmployeeLeave;
