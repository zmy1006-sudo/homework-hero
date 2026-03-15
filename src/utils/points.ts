import { 
  PointsRecord, 
  UserPoints, 
  StreakData, 
  PointsAction, 
  RankLevel,
  STORAGE_KEYS,
  RANK_CONFIGS,
  POINTS_ACTIONS
} from '../types';
import { generateId } from './index';

/**
 * 获取用户积分数据
 */
export const getUserPoints = (userId: string): UserPoints => {
  const key = `${STORAGE_KEYS.POINTS}_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data) as UserPoints;
    } catch {
      return createDefaultUserPoints(userId);
    }
  }
  return createDefaultUserPoints(userId);
};

/**
 * 创建默认用户积分数据
 */
const createDefaultUserPoints = (userId: string): UserPoints => ({
  userId,
  totalPoints: 0,
  todayPoints: 0,
  lastPointsDate: '',
  streakData: {
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastCompleteDate: '',
    completedTaskIds: [],
  },
  rankLevel: 'beginner',
});

/**
 * 保存用户积分数据
 */
export const saveUserPoints = (points: UserPoints): void => {
  const key = `${STORAGE_KEYS.POINTS}_${points.userId}`;
  localStorage.setItem(key, JSON.stringify(points));
};

/**
 * 获取积分记录
 */
export const getPointsHistory = (userId: string): PointsRecord[] => {
  const key = `${STORAGE_KEYS.POINTS_HISTORY}_${userId}`;
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data) as PointsRecord[];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * 保存积分记录
 */
export const savePointsHistory = (userId: string, history: PointsRecord[]): void => {
  const key = `${STORAGE_KEYS.POINTS_HISTORY}_${userId}`;
  localStorage.setItem(key, JSON.stringify(history));
};

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * 获取段位等级
 */
export const getRankLevel = (points: number): RankLevel => {
  for (const config of RANK_CONFIGS) {
    if (points >= config.minPoints && points <= config.maxPoints) {
      return config.level;
    }
  }
  return 'legend';
};

/**
 * 获取段位配置
 */
export const getRankConfig = (level: RankLevel): typeof RANK_CONFIGS[0] => {
  return RANK_CONFIGS.find(r => r.level === level) || RANK_CONFIGS[0];
};

/**
 * 获取下一个段位配置
 */
export const getNextRankConfig = (level: RankLevel): typeof RANK_CONFIGS[0] | null => {
  const currentIndex = RANK_CONFIGS.findIndex(r => r.level === level);
  if (currentIndex < RANK_CONFIGS.length - 1) {
    return RANK_CONFIGS[currentIndex + 1];
  }
  return null;
};

/**
 * 计算进度百分比
 */
export const calculateProgress = (points: number, level: RankLevel): number => {
  const config = getRankConfig(level);
  const nextConfig = getNextRankConfig(level);
  
  if (!nextConfig) {
    return 100; // 已达到最高段位
  }
  
  const currentMin = config.minPoints;
  const nextMin = nextConfig.minPoints;
  const progress = ((points - currentMin) / (nextMin - currentMin)) * 100;
  return Math.min(100, Math.max(0, progress));
};

/**
 * 计算积分 (带提前分钟数)
 */
export const calculatePoints = (
  action: PointsAction, 
  extraMinutes?: number
): number => {
  const actionConfig = {
    on_time_start: 5,
    on_time_complete: 10,
    early_complete: 10 + (extraMinutes || 0), // 提前完成 = 10 + 提前分钟数
    first_complete: 20,
    streak_3: 30,
    streak_7: 100,
    streak_30: 500,
    overdue_complete: -(extraMinutes || 0), // 超时扣分 = 超时分钟数
    abandon_task: -5,
  };
  
  return actionConfig[action] || 0;
};

/**
 * 添加积分记录
 */
export const addPointsRecord = (
  userId: string,
  action: PointsAction,
  taskId?: string,
  taskTitle?: string,
  extraMinutes?: number
): { points: number; newRank: RankLevel; rankUp: boolean } => {
  const userPoints = getUserPoints(userId);
  const today = getTodayString();
  
  // 计算积分
  let points = calculatePoints(action, extraMinutes);
  
  // 每日上限检查 (加分才检查)
  if (points > 0) {
    // 如果是新的日期，重置今日积分
    if (userPoints.lastPointsDate !== today) {
      userPoints.todayPoints = 0;
    }
    
    // 检查是否达到每日上限 (100分)
    const remainingToday = Math.max(0, 100 - userPoints.todayPoints);
    points = Math.min(points, remainingToday);
    
    if (points <= 0) {
      return { points: 0, newRank: userPoints.rankLevel, rankUp: false };
    }
  }
  
  // 更新总积分 (不低于0)
  userPoints.totalPoints = Math.max(0, userPoints.totalPoints + points);
  
  // 更新今日积分
  if (userPoints.lastPointsDate !== today) {
    userPoints.todayPoints = points;
  } else {
    userPoints.todayPoints += points;
  }
  userPoints.lastPointsDate = today;
  
  // 检查段位升级
  const oldRank = userPoints.rankLevel;
  const newRank = getRankLevel(userPoints.totalPoints);
  userPoints.rankLevel = newRank;
  const rankUp = newRank !== oldRank && RANK_CONFIGS.findIndex(r => r.level === newRank) > RANK_CONFIGS.findIndex(r => r.level === oldRank);
  
  // 保存更新后的积分数据
  saveUserPoints(userPoints);
  
  // 添加积分记录
  const record: PointsRecord = {
    id: generateId(),
    userId,
    action,
    points,
    taskId,
    taskTitle,
    createdAt: new Date().toISOString(),
  };
  
  const history = getPointsHistory(userId);
  history.unshift(record); // 添加到开头
  savePointsHistory(userId, history);
  
  return { points, newRank, rankUp };
};

/**
 * 检查并更新连续打卡
 */
export const updateStreak = (userId: string, taskId: string): {
  streakBonus: number;
  streakDays: number;
} => {
  const userPoints = getUserPoints(userId);
  const today = getTodayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  let streakBonus = 0;
  const streakData = userPoints.streakData;
  
  // 检查今日是否已完成过该任务
  if (streakData.lastCompleteDate === today && streakData.completedTaskIds.includes(taskId)) {
    // 今日已完成，不重复计算
    return { streakBonus: 0, streakDays: streakData.currentStreak };
  }
  
  // 更新连续天数
  if (streakData.lastCompleteDate === yesterdayStr || streakData.lastCompleteDate === today) {
    // 昨天或今天已完成，连续
    if (streakData.lastCompleteDate !== today) {
      streakData.currentStreak += 1;
    }
  } else {
    // 中断了，重新开始
    streakData.currentStreak = 1;
  }
  
  // 更新最长连续记录
  if (streakData.currentStreak > streakData.longestStreak) {
    streakData.longestStreak = streakData.currentStreak;
  }
  
  // 更新完成日期和任务ID
  streakData.lastCompleteDate = today;
  if (!streakData.completedTaskIds.includes(taskId)) {
    streakData.completedTaskIds.push(taskId);
  }
  
  // 检查连续打卡奖励
  if (streakData.currentStreak === 3) {
    streakBonus = 30;
    addPointsRecord(userId, 'streak_3', undefined, '连续3天打卡奖励');
  } else if (streakData.currentStreak === 7) {
    streakBonus = 100;
    addPointsRecord(userId, 'streak_7', undefined, '连续7天打卡奖励');
  } else if (streakData.currentStreak === 30) {
    streakBonus = 500;
    addPointsRecord(userId, 'streak_30', undefined, '连续30天打卡奖励');
  }
  
  // 保存
  userPoints.streakData = streakData;
  saveUserPoints(userPoints);
  
  return { streakBonus, streakDays: streakData.currentStreak };
};

/**
 * 获取积分行为描述
 */
export const getPointsActionDescription = (action: PointsAction): string => {
  const config = POINTS_ACTIONS.find(a => a.action === action);
  return config?.description || action;
};

/**
 * 格式化积分记录显示
 */
export const formatPointsRecord = (record: PointsRecord): string => {
  const actionDesc = getPointsActionDescription(record.action);
  const taskInfo = record.taskTitle ? ` - ${record.taskTitle}` : '';
  const prefix = record.points > 0 ? '+' : '';
  return `${actionDesc}${taskInfo}: ${prefix}${record.points}分`;
};

/**
 * 按日期筛选积分记录
 */
export const filterPointsByDate = (
  records: PointsRecord[], 
  date: string // YYYY-MM-DD
): PointsRecord[] => {
  return records.filter(r => r.createdAt.startsWith(date));
};

/**
 * 获取分页积分记录
 */
export const getPaginatedPointsHistory = (
  userId: string,
  page: number = 1,
  pageSize: number = 20,
  dateFilter?: string
): { records: PointsRecord[]; hasMore: boolean } => {
  let history = getPointsHistory(userId);
  
  if (dateFilter) {
    history = filterPointsByDate(history, dateFilter);
  }
  
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    records: history.slice(start, end),
    hasMore: end < history.length,
  };
};
