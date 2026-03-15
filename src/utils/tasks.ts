import { Task, TaskCategory, CategoryConfig, PresetCategory } from '../types';

// 存储键名
export const STORAGE_KEYS = {
  USER: 'homework_user',
  TOKEN: 'homework_token',
  TASKS: 'homework_tasks',
  CUSTOM_CATEGORIES: 'homework_custom_categories',
} as const;

// 预设类别配置
export const PRESET_CATEGORIES: CategoryConfig[] = [
  { id: 'math', name: '数学', emoji: '🔢', color: '#42A5F5' },
  { id: 'chinese', name: '语文', emoji: '📝', color: '#66BB6A' },
  { id: 'english', name: '英语', emoji: '🔤', color: '#FFA726' },
  { id: 'science', name: '科学', emoji: '🔬', color: '#AB47BC' },
];

/**
 * 获取所有类别配置（预设+自定义）
 */
export const getAllCategories = (): CategoryConfig[] => {
  const customCategories = getCustomCategories();
  return [...PRESET_CATEGORIES, ...customCategories];
};

/**
 * 获取类别配置
 */
export const getCategoryConfig = (categoryId: TaskCategory): CategoryConfig | undefined => {
  return getAllCategories().find(c => c.id === categoryId);
};

/**
 * 获取自定义类别
 */
export const getCustomCategories = (): CategoryConfig[] => {
  const str = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
  if (!str) return [];
  try {
    return JSON.parse(str) as CategoryConfig[];
  } catch {
    return [];
  }
};

/**
 * 保存自定义类别
 */
export const saveCustomCategories = (categories: CategoryConfig[]): void => {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
};

/**
 * 添加自定义类别
 */
export const addCustomCategory = (category: CategoryConfig): boolean => {
  const customCategories = getCustomCategories();
  if (customCategories.length >= 5) return false; // 最多5个
  
  // 检查是否已存在
  if (customCategories.find(c => c.id === category.id)) return false;
  
  customCategories.push(category);
  saveCustomCategories(customCategories);
  return true;
};

/**
 * 删除自定义类别
 */
export const deleteCustomCategory = (categoryId: string): void => {
  const customCategories = getCustomCategories();
  const filtered = customCategories.filter(c => c.id !== categoryId);
  saveCustomCategories(filtered);
};

/**
 * 获取用户的所有任务
 */
export const getTasks = (userId: string): Task[] => {
  const str = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!str) return [];
  try {
    const allTasks = JSON.parse(str) as Task[];
    return allTasks.filter(t => t.userId === userId);
  } catch {
    return [];
  }
};

/**
 * 保存任务到localStorage
 */
export const saveTask = (task: Task): void => {
  const str = localStorage.getItem(STORAGE_KEYS.TASKS);
  let allTasks: Task[] = [];
  
  if (str) {
    try {
      allTasks = JSON.parse(str) as Task[];
    } catch {
      allTasks = [];
    }
  }
  
  // 检查是否已存在
  const existingIndex = allTasks.findIndex(t => t.id === task.id);
  if (existingIndex >= 0) {
    allTasks[existingIndex] = task;
  } else {
    allTasks.push(task);
  }
  
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
};

/**
 * 删除任务
 */
export const deleteTask = (taskId: string): void => {
  const str = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!str) return;
  
  try {
    const allTasks = JSON.parse(str) as Task[];
    const filtered = allTasks.filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
  } catch {
    // 忽略错误
  }
};

/**
 * 更新任务状态
 */
export const updateTaskStatus = (taskId: string, status: Task['status']): void => {
  const str = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!str) return;
  
  try {
    const allTasks = JSON.parse(str) as Task[];
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'in_progress' && !task.startedAt) {
        task.startedAt = new Date().toISOString();
      } else if (status === 'completed' && !task.completedAt) {
        task.completedAt = new Date().toISOString();
      }
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    }
  } catch {
    // 忽略错误
  }
};

/**
 * 按类别分组任务
 */
export const groupTasksByCategory = (tasks: Task[]): Map<TaskCategory, Task[]> => {
  const grouped = new Map<TaskCategory, Task[]>();
  
  tasks.forEach(task => {
    const existing = grouped.get(task.category) || [];
    existing.push(task);
    grouped.set(task.category, existing);
  });
  
  return grouped;
};

/**
 * 生成唯一ID
 */
export const generateTaskId = (): string => {
  return 'task_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

/**
 * 生成自定义类别ID
 */
export const generateCustomCategoryId = (): string => {
  return 'custom_' + Date.now().toString(36);
};

/**
 * 获取状态显示文本
 */
export const getStatusText = (status: Task['status']): string => {
  switch (status) {
    case 'pending':
      return '待开始';
    case 'in_progress':
      return '进行中';
    case 'completed':
      return '已完成';
    default:
      return '未知';
  }
};

/**
 * 验证任务标题
 */
export const validateTaskTitle = (title: string): { valid: boolean; message?: string } => {
  if (!title.trim()) {
    return { valid: false, message: '请输入任务标题' };
  }
  if (title.length > 50) {
    return { valid: false, message: '任务标题不能超过50个字符' };
  }
  return { valid: true };
};

/**
 * 验证任务时长
 */
export const validateTaskDuration = (duration: number): { valid: boolean; message?: string } => {
  if (duration < 1 || duration > 120) {
    return { valid: false, message: '任务时长需在1-120分钟之间' };
  }
  return { valid: true };
};

/**
 * 验证任务描述
 */
export const validateTaskDescription = (description: string): { valid: boolean; message?: string } => {
  if (description.length > 200) {
    return { valid: false, message: '任务描述不能超过200个字符' };
  }
  return { valid: true };
};
