// Models/employeeModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';

class Employee extends Model {}

Employee.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(50)
  },
  hire_date: {
    type: DataTypes.DATEONLY
  },
  status: {
    type: DataTypes.ENUM('active','resigned'),
    defaultValue: 'active'
  }
}, {
  sequelize,
  modelName: 'Employee',
  tableName: 'employees',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Employee;
