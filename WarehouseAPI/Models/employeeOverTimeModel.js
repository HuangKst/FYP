// Models/employeeOvertimeModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';
import Employee from './employeeModel.js';

class EmployeeOvertime extends Model {}

EmployeeOvertime.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  overtime_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  hours: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  reason: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'EmployeeOvertime',
  tableName: 'employee_overtimes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// 外键 employee_id -> Employee.id
EmployeeOvertime.belongsTo(Employee, {
  foreignKey: 'employee_id',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

Employee.hasMany(EmployeeOvertime, { foreignKey: 'employee_id' })

export default EmployeeOvertime;
