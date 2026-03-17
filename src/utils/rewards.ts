import { Reward, ExchangeRecord, FocusSession, TaskCategory, STORAGE_KEYS, FocusReport, DistractionStats } from '../types';
import { generateId, getTodayString } from './index';

/**
 * 获取所有奖励列表
 */
export const getRewards = (): Reward[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REWARDS);
  if (data) {
    try {
      return JSON.parse(data) as Reward[];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * 保存奖励列表
 */
export const saveRewards = (rewards: Reward[]): void => {
  localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
};

/**
 * 获取家长的奖励列表
 */
export const getRewardsByParent = (parentId: string): Reward[] => {
  return getRewards().filter(r => r.createdBy === parentId);
};

/**
 * 创建新奖励
 */
export const createReward = (
  name: string,
  pointsRequired: number,
  description: string,
  parentId: string
): Reward => {
  const reward: Reward = {
    id: generateId(),
    name,
    pointsRequired,
    description,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: parentId,
  };
  
  const rewards = getRewards();
  rewards.push(reward);
  saveRewards(rewards);
  
  return reward;
};

/**
 * 更新奖励
 */
export const updateReward = (rewardId: string, updates: Partial<Reward>): Reward | null => {
  const rewards = getRewards();
  const index = rewards.findIndex(r => r.id === rewardId);
  
  if (index === -1) return null;
  
  rewards[index] = { ...rewards[index], ...updates };
  saveRewards(rewards);
  
  return rewards[index];
};

/**
 * 删除奖励
 */
export const deleteReward = (rewardId: string): boolean => {
  const rewards = getRewards();
  const filtered = rewards.filter(r => r.id !== rewardId);
  
  if (filtered.length === rewards.length) return false;
  
  saveRewards(filtered);
  return true;
};

/**
 * 切换奖励状态（上架/下架）
 */
export const toggleRewardStatus = (rewardId: string): Reward | null => {
  const rewards = getRewards();
  const reward = rewards.find(r => r.id === rewardId);
  
  if (!reward) return null;
  
  return updateReward(rewardId, {
    status: reward.status === 'active' ? 'inactive' : 'active'
  });
};

/**
 * 获取所有兑换记录
 */
export const getExchangeRecords = (): ExchangeRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EXCHANGE_RECORDS);
  if (data) {
    try {
      return JSON.parse(data) as ExchangeRecord[];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * 保存兑换记录
 */
export const saveExchangeRecords = (records: ExchangeRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.EXCHANGE_RECORDS, JSON.stringify(records));
};

/**
 * 获取孩子的兑换记录
 */
export const getExchangeRecordsByUser = (userId: string): ExchangeRecord[] => {
  return getExchangeRecords().filter(r => r.userId === userId);
};

/**
 * 创建兑换记录
 */
export const createExchangeRecord = (
  rewardId: string,
  rewardName: string,
  userId: string,
  userName: string,
  pointsSpent: number
): ExchangeRecord => {
  const record: ExchangeRecord = {
    id: generateId(),
    rewardId,
    rewardName,
    userId,
    userName,
    pointsSpent,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  const records = getExchangeRecords();
  records.unshift(record);
  saveExchangeRecords(records);
  
  return record;
};

/**
 * 审核兑换记录
 */
export const reviewExchangeRecord = (
  recordId: string,
  approved: boolean,
  reviewerId: string,
  rejectReason?: string
): ExchangeRecord | null => {
  const records = getExchangeRecords();
  const index = records.findIndex(r => r.id === recordId);
  
  if (index === -1) return null;
  
  records[index] = {
    ...records[index],
    status: approved ? 'approved' : 'rejected',
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    rejectReason: approved ? undefined : rejectReason,
  };
  
  saveExchangeRecords(records);
  return records[index];
};

/**
 * 获取专注会话记录
 */
export const getFocusSessions = (): FocusSession[] => {
  const data = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
  if (data) {
    try {
      return JSON.parse(data) as FocusSession[];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * 保存专注会话记录
 */
export const saveFocusSessions = (sessions: FocusSession[]): void => {
  localStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(sessions));
};

/**
 * 获取孩子的专注会话
 */
export const getFocusSessionsByUser = (userId: string): FocusSession[] => {
  return getFocusSessions().filter(s => s.userId === userId);
};

/**
 * 保存专注会话
 */
export const saveFocusSession = (session: FocusSession): void => {
  const sessions = getFocusSessions();
  sessions.push(session);
  saveFocusSessions(sessions);
};

/**
 * 生成专注报告
 */
export const generateFocusReport = (
  userId: string,
  period: 'day' | 'week' | 'month' = 'week'
): FocusReport => {
  const sessions = getFocusSessionsByUser(userId);
  const now = new Date();
  let startDate = new Date();
  
  // 根据周期设置开始日期
  if (period === 'day') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  // 过滤周期内的会话
  const filteredSessions = sessions.filter(s => 
    new Date(s.startTime) >= startDate && s.completed
  );
  
  // 计算总时长
  const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.actualDuration, 0);
  const totalSessions = filteredSessions.length;
  const averageMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const maxMinutes = totalSessions > 0 ? Math.max(...filteredSessions.map(s => s.actualDuration)) : 0;
  
  // 类别用时分布
  const categoryBreakdown: Record<string, number> = {
    math: 0,
    chinese: 0,
    english: 0,
    science: 0,
  };
  
  filteredSessions.forEach(s => {
    if (categoryBreakdown[s.category] !== undefined) {
      categoryBreakdown[s.category] += s.actualDuration;
    } else {
      categoryBreakdown[s.category] = s.actualDuration;
    }
  });
  
  // 分心原因统计
  const reasonCount: Record<string, { count: number; totalMinutes: number }> = {};
  filteredSessions.forEach(s => {
    s.interruptionReasons.forEach(reason => {
      if (!reasonCount[reason]) {
        reasonCount[reason] = { count: 0, totalMinutes: 0 };
      }
      reasonCount[reason].count += 1;
      reasonCount[reason].totalMinutes += s.actualDuration;
    });
  });
  
  const distractionStats: DistractionStats[] = Object.entries(reasonCount).map(([reason, data]) => ({
    reason,
    count: data.count,
    totalMinutes: data.totalMinutes,
  })).sort((a, b) => b.count - a.count);
  
  // 每日数据趋势
  const dailyDataMap: Record<string, number> = {};
  filteredSessions.forEach(s => {
    const date = s.startTime.split('T')[0];
    dailyDataMap[date] = (dailyDataMap[date] || 0) + s.actualDuration;
  });
  
  const dailyData = Object.entries(dailyDataMap)
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalMinutes,
    averageMinutes,
    maxMinutes,
    totalSessions,
    categoryBreakdown: categoryBreakdown as Record<TaskCategory, number>,
    distractionStats,
    dailyData,
  };
};

/**
 * 格式化分钟数为可读字符串
 */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${mins}分钟`;
};

/**
 * 获取类别颜色
 */
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    math: '#42A5F5',
    chinese: '#66BB6A',
    english: '#FFA726',
    science: '#AB47BC',
  };
  return colors[category] || '#9E9E9E';
};

/**
 * 获取类别名称
 */
export const getCategoryName = (category: string): string => {
  const names: Record<string, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    science: '科学',
  };
  return names[category] || category;
};
