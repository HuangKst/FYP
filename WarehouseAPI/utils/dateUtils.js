/**
 * 日期格式化函数
 * @param {Date} date - 要格式化的日期对象
 * @param {String} format - 格式字符串，默认为 'YYYY-MM-DD'
 * @returns {String} - 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    return 'Invalid Date';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取当前日期的开始时间
 * @returns {Date} - 当天的00:00:00
 */
export function getStartOfDay(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * 获取当前日期的结束时间
 * @returns {Date} - 当天的23:59:59
 */
export function getEndOfDay(date = new Date()) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * 获取本周的开始日期（星期一）
 * @returns {Date} - 本周一的日期
 */
export function getStartOfWeek(date = new Date()) {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * 获取本周的结束日期（星期日）
 * @returns {Date} - 本周日的日期
 */
export function getEndOfWeek(date = new Date()) {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay();
  const diff = endOfWeek.getDate() + (day === 0 ? 0 : 7 - day);
  endOfWeek.setDate(diff);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * 获取本月的开始日期
 * @returns {Date} - 本月1号的日期
 */
export function getStartOfMonth(date = new Date()) {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * 获取本月的结束日期
 * @returns {Date} - 本月最后一天的日期
 */
export function getEndOfMonth(date = new Date()) {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
} 