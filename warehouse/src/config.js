/**
 * 全局配置文件
 */

// API服务器基础URL
export const BASE_URL = process.env.REACT_APP_API_BASE_URL ;

// 分页默认设置
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

// 本地存储键名
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language'
};

// 日期格式
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'; 

// reCAPTCHA sitekey (use Vite environment variable)
export const RECAPTCHA_SITE_KEY = '6LfnjyUrAAAAAGR6DWUvFYq0j3eqRf3tmc0aV7BD';