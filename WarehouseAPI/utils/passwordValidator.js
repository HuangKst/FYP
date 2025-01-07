/**
 * 检查密码是否符合至少8个字符，包含字母、数字和特殊字符的要求
 * @param {string} password -
 * @returns {boolean} 
 */
export function validatePasswordStrength(password) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }
  