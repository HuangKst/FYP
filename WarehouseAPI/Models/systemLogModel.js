// Models/systemLogModel.js
import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';
import User from './userModel.js';

class SystemLog extends Model {}

SystemLog.init({
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  operation_type: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  sequelize,
  modelName: 'SystemLog',
  tableName: 'system_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt:false,
});

// 外键 user_id -> users.id
SystemLog.belongsTo(User, {
  foreignKey: 'user_id',
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE'
});

User.hasMany(SystemLog, { foreignKey: 'user_id' })

export default SystemLog;
