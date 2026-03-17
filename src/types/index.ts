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

// ============ 任务管理相关类型 ============

// 任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// 预设类别
export type PresetCategory = 'math' | 'chinese' | 'english' | 'science';

// 任务类别（预设+自定义）
export type TaskCategory = PresetCategory | string;

// 任务类别配置
export interface CategoryConfig {
  id: TaskCategory;
  name: string;
  emoji: string;
  color: string;
  isCustom?: boolean;
}

// 任务
export interface Task {
  id: string;
  title: string; // 任务标题（最长50字符）
  category: TaskCategory;
  duration: number; // 分钟数（1-120）
  description?: string; // 任务描述（可选，最长200字符）
  status: TaskStatus;
  createdAt: string;
  startedAt?: string; // 开始时间
  completedAt?: string; // 完成时间
  userId: string; // 所属用户
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
  POINTS: 'homework_points',
  POINTS_HISTORY: 'homework_points_history',
  STREAK_DATA: 'homework_streak_data',
  REWARDS: 'homework_rewards',
  EXCHANGE_RECORDS: 'homework_exchange_records',
  FOCUS_SESSIONS: 'homework_focus_sessions',
} as const;

// ============ 积分系统相关类型 ============

// 段位等级
export type RankLevel = 'beginner' | 'student' | 'star' | 'god' | 'legend';

// 段位配置
export interface RankConfig {
  level: RankLevel;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  bgColor: string;
}

// 段位配置列表
export const RANK_CONFIGS: RankConfig[] = [
  { level: 'beginner', name: '初心学者', icon: '🌱', minPoints: 0, maxPoints: 499, color: '#2E7D32', bgColor: '#A5D6A7' },
  { level: 'student', name: '勤学少年', icon: '📚', minPoints: 500, maxPoints: 1999, color: '#0277BD', bgColor: '#81D4FA' },
  { level: 'star', name: '学霸之星', icon: '⭐', minPoints: 2000, maxPoints: 4999, color: '#F57F17', bgColor: '#FFD54F' },
  { level: 'god', name: '学神降临', icon: '🎓', minPoints: 5000, maxPoints: 9999, color: '#7B1FA2', bgColor: '#CE93D8' },
  { level: 'legend', name: '传奇学神', icon: '👑', minPoints: 10000, maxPoints: Infinity, color: '#FF8F00', bgColor: '#FFCA28' },
];

// 积分行为类型
export type PointsAction = 
  | 'on_time_start'       // 按时开始
  | 'on_time_complete'   // 按时完成
  | 'early_complete'     // 提前完成
  | 'first_complete'     // 首次完成
  | 'streak_3'           // 连续3天
  | 'streak_7'           // 连续7天
  | 'streak_30'          // 连续30天
  | 'overdue_complete'   // 超时完成
  | 'abandon_task';     // 放弃任务

// 积分行为配置
export interface PointsActionConfig {
  action: PointsAction;
  description: string;
  points: number;
  isBonus: boolean; // true=加分, false=扣分
}

// 积分行为配置列表
export const POINTS_ACTIONS: PointsActionConfig[] = [
  { action: 'on_time_start', description: '按时开始任务', points: 5, isBonus: true },
  { action: 'on_time_complete', description: '按时完成任务', points: 10, isBonus: true },
  { action: 'early_complete', description: '提前完成任务', points: 10, isBonus: true },
  { action: 'first_complete', description: '首次完成该任务', points: 20, isBonus: true },
  { action: 'streak_3', description: '连续3天完成任务', points: 30, isBonus: true },
  { action: 'streak_7', description: '连续7天完成任务', points: 100, isBonus: true },
  { action: 'streak_30', description: '连续30天完成任务', points: 500, isBonus: true },
  { action: 'overdue_complete', description: '超时完成任务', points: 1, isBonus: false },
  { action: 'abandon_task', description: '放弃任务', points: 5, isBonus: false },
];

// 积分记录
export interface PointsRecord {
  id: string;
  userId: string;
  action: PointsAction;
  points: number; // 正数加分，负数扣分
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
  note?: string;
}

// 连续打卡数据
export interface StreakData {
  userId: string;
  currentStreak: number; // 当前连续天数
  longestStreak: number; // 最长连续天数
  lastCompleteDate: string; // 上次完成日期 (YYYY-MM-DD)
  completedTaskIds: string[]; // 今日已完成的 taskId
}

// 用户积分数据
export interface UserPoints {
  userId: string;
  totalPoints: number; // 总积分
  todayPoints: number; // 今日积分
  lastPointsDate: string; // 上次积分日期 (YYYY-MM-DD)
  streakData: StreakData;
  rankLevel: RankLevel;
}

// ============ 奖励系统相关类型 ============

// 奖励状态
export type RewardStatus = 'active' | 'inactive';

// 奖励
export interface Reward {
  id: string;
  name: string; // 奖励名称
  pointsRequired: number; // 所需积分
  description?: string; // 奖励描述
  status: RewardStatus; // 上架/下架
  createdAt: string;
  createdBy: string; // 家长ID
}

// 兑换记录状态
export type ExchangeStatus = 'pending' | 'approved' | 'rejected';

// 兑换记录
export interface ExchangeRecord {
  id: string;
  rewardId: string;
  rewardName: string; // 奖励名称（冗余存储）
  userId: string; // 孩子ID
  userName: string; // 孩子名称
  pointsSpent: number; // 消耗积分
  status: ExchangeStatus;
  createdAt: string; // 申请时间
  reviewedAt?: string; // 审核时间
  reviewedBy?: string; // 审核人ID
  rejectReason?: string; // 拒绝原因
}

// ============ 专注记录相关类型 ============

// 专注会话
export interface FocusSession {
  id: string;
  userId: string;
  category: TaskCategory; // 任务类别
  plannedDuration: number; // 计划时长（分钟）
  actualDuration: number; // 实际专注时长（分钟）
  startTime: string; // 开始时间
  endTime: string; // 结束时间
  interruptions: number; // 中断次数
  interruptionReasons: string[]; // 中断原因列表
  completed: boolean; // 是否完成
}

// 分心类型统计
export interface DistractionStats {
  reason: string;
  count: number;
  totalMinutes: number;
}

// 专注报告数据
export interface FocusReport {
  totalMinutes: number; // 总专注分钟数
  averageMinutes: number; // 平均每次专注分钟数
  maxMinutes: number; // 单次最长专注分钟数
  totalSessions: number; // 总专注次数
  categoryBreakdown: Record<TaskCategory, number>; // 各类别用时分布（分钟）
  distractionStats: DistractionStats[]; // 分心原因统计
  dailyData: { date: string; minutes: number }[]; // 每日数据趋势
}
