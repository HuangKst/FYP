import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../db/index.js';
import bcrypt from 'bcrypt';
import { validatePasswordStrength } from '../utils/passwordValidator.js';
class User extends Model {
  // 比较密码方法
  async comparePassword(plainPass) {
    try {
      return await bcrypt.compare(plainPass, this.password);
    } catch (error) {
      console.error('Password is wrong', error);
      return false;
    }
  }
  

  // static 方法可放一些查询逻辑
  static findByUserName(username) {
    return this.findOne({ where: { username } });
  }
  

}

User.init({
  // 主键ID
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  // username
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  // 密码（加密存储）
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  // role
  role: {
    type: DataTypes.ENUM('admin', 'boss', 'employee'),
    defaultValue: 'employee'
  },
  // status
  status: {
    type: DataTypes.ENUM('pending','active','inactive'),
    defaultValue: 'pending'
  },
  // Track login attempts for account locking
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Track the time of last failed login
  lastFailedLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,           // 启用createdAt/updatedAt
  createdAt: 'created_at',    // 映射到表字段
  updatedAt: 'updated_at'
});

// 在save/update之前对密码检查强度再hash
User.beforeSave(async (user, options) => {
  try {
    if (user.changed('password')) {
      const isValid = validatePasswordStrength(user.password);
      if (!isValid) {
        console.error('Invalid password:', user.password);
        throw new Error('Password is invalid');
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  } catch (error) {
    console.error('Error in beforeSave:', error.message);
    throw error;
  }
});



export default User;
