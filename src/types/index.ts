// 用户角色类型
export type UserRole = 'student' | 'parent' | 'teacher';

// 用户信息接口
export interface User {
  id: string;
  phone: string;
  name?: string;
  role: UserRole;
  grade?: string; // 学生年级
  classCode?: string; // 老师班级码
  boundPhone?: string; // 家长绑定的孩子手机号
  createdAt?: string;
}

// 登录表单数据
export interface LoginFormData {
  phone: string;
  name?: string;
  grade?: string;
  boundPhone?: string;
  classCode?: string;
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
}

// 年级选项
export const GRADE_OPTIONS = [
  { value: '一年级', label: '一年级' },
  { value: '二年级', label: '二年级' },
  { value: '三年级', label: '三年级' },
  { value: '四年级', label: '四年级' },
  { value: '五年级', label: '五年级' },
  { value: '六年级', label: '六年级' },
  { value: '初一', label: '初一' },
  { value: '初二', label: '初二' },
  { value: '初三', label: '初三' },
] as const;

// 存储键名
export const STORAGE_KEYS = {
  USER: 'homework_user',
  TOKEN: 'homework_token',
} as const;
