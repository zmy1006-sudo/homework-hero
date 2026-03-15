import { User, STORAGE_KEYS } from '../types';

/**
 * 保存用户信息到localStorage
 */
export const saveUser = (user: User): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

/**
 * 从localStorage获取用户信息
 */
export const getUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

/**
 * 清除用户信息
 */
export const clearUser = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

/**
 * 验证手机号格式
 */
export const isValidPhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证班级码格式 (6位数字)
 */
export const isValidClassCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

/**
 * 生成简单UUID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * 格式化手机号显示 (中间四位脱敏)
 */
export const maskPhone = (phone: string): string => {
  if (phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};
