import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, CheckCircle2, XCircle, AlertCircle, Coffee, Sparkles, Trophy } from 'lucide-react';
import { Task } from '../../types';
import { updateTaskStatus } from '../../utils/tasks';
import { addPointsRecord, updateStreak, getUserPoints } from '../../utils';

// 分心行为类型
export type DistractionType = 'water' | 'stretch' | 'toilet' | 'eat' | 'daze' | 'book' | 'toy' | 'other';

// 分心行为配置
export const DISTRACTIONS: { type: DistractionType; emoji: string; label: string }[] = [
  { type: 'water', emoji: '💧', label: '喝水' },
  { type: 'stretch', emoji: '🙆', label: '伸懒腰' },
  { type: 'toilet', emoji: '🚽', label: '上厕所' },
  { type: 'eat', emoji: '🍎', label: '吃东西' },
  { type: 'daze', emoji: '😴', label: '发呆' },
  { type: 'book', emoji: '📖', label: '看课外书' },
  { type: 'toy', emoji: '🧸', label: '玩玩具' },
  { type: 'other', emoji: '📌', label: '其他' },
];

// 分心记录
export interface DistractionRecord {
  id: string;
  taskId: string;
  type: DistractionType;
  timestamp: string;
}

// 番茄钟状态
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'resting';

interface PomodoroTimerProps {
  task: Task;
  onComplete?: (task: Task, distractionCount: number, overtimeMinutes: number, deductedPoints: number) => void;
  onAbandon?: (task: Task) => void;
  onClose?: () => void;
}

// localStorage 键名
const TIMER_STORAGE_KEY = 'homework_timer_state';

// 存储的倒计时状态
interface TimerState {
  taskId: string;
  startTimestamp: number; // 任务开始时间戳
  plannedDuration: number; // 计划时长（分钟）
}

// 颜色常量
const COLORS = {
  backgroundRing: '#E0E0E0',
  progressGreen: '#81C784', // 薄荷绿 - 剩余 >50%
  progressOrange: '#FFB74D', // 珊瑚橙 - 剩余 20%-50%
  progressRed: '#E57373', // 玫瑰红 - 剩余 <20% 或超时
  overtime: '#E57373', // 玫瑰红 - 超时
  primary: '#4FC3F7', // 天空蓝 - 主色
  success: '#81C784',
  warning: '#FFB74D',
  danger: '#E57373',
};

export function PomodoroTimer({ task, onComplete, onAbandon, onClose }: PomodoroTimerProps) {
  // 状态
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(task.duration * 60);
  const [distractions, setDistractions] = useState<DistractionRecord[]>([]);
  const [showDistractionPanel, setShowDistractionPanel] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false); // 是否超时
  const [overtimeSeconds, setOvertimeSeconds] = useState(0); // 超时秒数
  const [showRestModal, setShowRestModal] = useState(false); // 休息提醒
  const [restRemainingSeconds, setRestRemainingSeconds] = useState(5 * 60); // 休息倒计时
  const [hasStarted, setHasStarted] = useState(false); // 是否已开始过
  const [pointsEarned, setPointsEarned] = useState<{ points: number; descriptions: string[] } | null>(null); // 本次获得的积分
  
  const intervalRef = useRef<number | null>(null);
  const restIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // 计算总时间（秒）
  const totalSeconds = task.duration * 60;
  
  // 计算进度（0-1），超时时为0
  const progress = isOvertime ? 0 : remainingSeconds / totalSeconds;
  
  // 计算剩余百分比
  const remainingPercent = progress * 100;
  
  // 获取颜色
  const getProgressColor = () => {
    if (isOvertime) return COLORS.overtime;
    if (remainingPercent > 50) return COLORS.progressGreen;
    if (remainingPercent >= 20) return COLORS.progressOrange;
    return COLORS.progressRed;
  };
  
  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 保存倒计时状态到 localStorage
  const saveTimerState = useCallback((taskId: string, plannedDuration: number) => {
    const state: TimerState = {
      taskId,
      startTimestamp: Date.now(),
      plannedDuration,
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, []);
  
  // 从 localStorage 恢复倒计时状态
  const restoreTimerState = useCallback((): TimerState | null => {
    const str = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!str) return null;
    try {
      const state = JSON.parse(str) as TimerState;
      // 检查是否是当前任务
      if (state.taskId !== task.id) return null;
      return state;
    } catch {
      return null;
    }
  }, [task.id]);
  
  // 清除 localStorage 状态
  const clearTimerState = useCallback(() => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);
  
  // 计算当前剩余时间（基于存储的开始时间）
  const calculateRemainingSeconds = useCallback((startTimestamp: number, plannedDuration: number): number => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000); // 已过秒数
    const plannedSeconds = plannedDuration * 60; // 计划秒数
    const remaining = plannedSeconds - elapsed;
    return remaining;
  }, []);
  
  // 恢复倒计时
  const restoreCountdown = useCallback(() => {
    const savedState = restoreTimerState();
    if (savedState) {
      const remaining = calculateRemainingSeconds(savedState.startTimestamp, savedState.plannedDuration);
      if (remaining <= 0) {
        // 已经超时
        setIsOvertime(true);
        setOvertimeSeconds(Math.abs(remaining));
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(remaining);
      }
      // 恢复开始时间
      startTimeRef.current = savedState.startTimestamp;
      setStatus('running');
    }
  }, [restoreTimerState, calculateRemainingSeconds]);
  
  // 页面可见性变化时更新倒计时
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        // 页面重新可见时，重新计算剩余时间
        const savedState = restoreTimerState();
        if (savedState) {
          const remaining = calculateRemainingSeconds(savedState.startTimestamp, savedState.plannedDuration);
          if (remaining <= 0 && !isOvertime) {
            // 刚刚超时
            setIsOvertime(true);
            setOvertimeSeconds(Math.abs(remaining));
            setRemainingSeconds(0);
          } else if (!isOvertime) {
            setRemainingSeconds(remaining);
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status, restoreTimerState, calculateRemainingSeconds, isOvertime]);
  
  // 开始倒计时
  const handleStart = useCallback(() => {
    if (status === 'idle') {
      // 更新任务状态为进行中
      updateTaskStatus(task.id, 'in_progress');
      // 记录开始时间
      startTimeRef.current = Date.now();
      // 保存倒计时状态到 localStorage
      saveTimerState(task.id, task.duration);
      // 标记已开始
      setHasStarted(true);
      
      // 添加积分：按时开始 (+5分)
      const result = addPointsRecord(task.userId, 'on_time_start', task.id, task.title);
      if (result.points > 0) {
        console.log(`按时开始任务 +${result.points}分`);
      }
    }
    setStatus('running');
  }, [status, task.id, task.duration, task.userId, task.title, saveTimerState]);
  
  // 暂停倒计时
  const handlePause = useCallback(() => {
    setStatus('paused');
  }, []);
  
  // 恢复倒计时
  const handleResume = useCallback(() => {
    // 恢复时重新设置开始时间，确保计算正确
    const savedState = restoreTimerState();
    if (savedState) {
      // 基于当前剩余时间重新设置开始时间
      const currentRemaining = isOvertime ? overtimeSeconds : remainingSeconds;
      const newStartTimestamp = Date.now() - ((isOvertime ? task.duration * 60 + overtimeSeconds : task.duration * 60 - currentRemaining) * 1000);
      saveTimerState(task.id, task.duration);
    }
    setStatus('running');
  }, [task.id, task.duration, saveTimerState, restoreTimerState, isOvertime, overtimeSeconds, remainingSeconds]);
  
  // 计算超时分钟数和扣分
  const calculateOvertimePenalty = useCallback((): { minutes: number; points: number } => {
    const overtimeMinutes = Math.ceil(overtimeSeconds / 60); // 不足1分钟按1分钟算
    const points = overtimeMinutes * 1; // 超时分钟 × 1分
    return { minutes: overtimeMinutes, points };
  }, [overtimeSeconds]);
  
  // 完成任务
  const handleComplete = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // 清除倒计时状态
    clearTimerState();
    
    // 计算超时扣分
    const { minutes: overtimeMinutes, points: deductedPoints } = calculateOvertimePenalty();
    
    // 获取用户当前积分数据
    const userPoints = getUserPoints(task.userId);
    
    // 计算积分获取
    let totalPoints = 0;
    const descriptions: string[] = [];
    
    // 检查是否是首次完成该任务
    const taskKey = `task_first_complete_${task.id}`;
    const isFirstComplete = !localStorage.getItem(taskKey);
    if (isFirstComplete) {
      localStorage.setItem(taskKey, 'true');
      const firstResult = addPointsRecord(task.userId, 'first_complete', task.id, task.title);
      if (firstResult.points > 0) {
        totalPoints += firstResult.points;
        descriptions.push(`首次完成: +${firstResult.points}分`);
      }
    }
    
    // 根据完成情况添加积分
    if (isOvertime && overtimeMinutes > 0) {
      // 超时完成：扣除超时分钟数 × 1分
      const overdueResult = addPointsRecord(task.userId, 'overdue_complete', task.id, task.title, overtimeMinutes);
      // 超时是负分
      if (overdueResult.points < 0) {
        totalPoints += overdueResult.points;
        descriptions.push(`超时完成: ${overdueResult.points}分`);
      }
    } else if (remainingSeconds > 0) {
      // 提前完成：10分 + 提前分钟 × 1分
      const earlyMinutes = Math.floor(remainingSeconds / 60);
      const earlyResult = addPointsRecord(task.userId, 'early_complete', task.id, task.title, earlyMinutes);
      if (earlyResult.points > 0) {
        totalPoints += earlyResult.points;
        descriptions.push(`提前完成: +${earlyResult.points}分 (含提前奖励)`);
      }
    } else {
      // 按时完成：10分
      const onTimeResult = addPointsRecord(task.userId, 'on_time_complete', task.id, task.title);
      if (onTimeResult.points > 0) {
        totalPoints += onTimeResult.points;
        descriptions.push(`按时完成: +${onTimeResult.points}分`);
      }
    }
    
    // 更新连续打卡
    const streakResult = updateStreak(task.userId, task.id);
    if (streakResult.streakBonus > 0) {
      totalPoints += streakResult.streakBonus;
      descriptions.push(`连续${streakResult.streakDays}天打卡: +${streakResult.streakBonus}分`);
    }
    
    // 保存本次获得的积分信息，用于显示
    if (totalPoints !== 0 || descriptions.length > 0) {
      setPointsEarned({ points: totalPoints, descriptions });
    }
    
    // 更新任务状态为已完成
    updateTaskStatus(task.id, 'completed');
    
    // 更新任务完成时间
    const str = localStorage.getItem('homework_tasks');
    if (str) {
      try {
        const allTasks = JSON.parse(str);
        const taskItem = allTasks.find((t: Task) => t.id === task.id);
        if (taskItem) {
          taskItem.completedAt = new Date().toISOString();
          // 记录实际用时
          taskItem.actualDuration = Math.floor((Date.now() - startTimeRef.current) / 60000);
          // 记录超时时间
          if (isOvertime) {
            taskItem.overtimeMinutes = overtimeMinutes;
            taskItem.deductedPoints = deductedPoints;
          }
          localStorage.setItem('homework_tasks', JSON.stringify(allTasks));
        }
      } catch (e) {
        console.error('Failed to update task:', e);
      }
    }
    
    setStatus('idle');
    // 显示休息提醒
    setShowRestModal(true);
    setRestRemainingSeconds(5 * 60); // 5分钟
    
    // 触发完成回调（传入超时信息）
    onComplete?.(task, distractions.length, overtimeMinutes, deductedPoints);
  }, [task, distractions.length, isOvertime, onComplete, clearTimerState, calculateOvertimePenalty, remainingSeconds]);
  
  // 确认完成（休息后）
  const handleConfirmComplete = useCallback(() => {
    setShowRestModal(false);
    // 关闭番茄钟
    onClose?.();
  }, [onClose]);
  
  // 跳过休息
  const handleSkipRest = useCallback(() => {
    if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    setShowRestModal(false);
    onClose?.();
  }, [onClose]);
  
  // 放弃任务
  const handleAbandon = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // 清除倒计时状态
    clearTimerState();
    
    // 如果已开始过任务，扣除放弃积分 (-5分)
    if (hasStarted) {
      addPointsRecord(task.userId, 'abandon_task', task.id, task.title);
    }
    
    // 更新任务状态为待开始
    updateTaskStatus(task.id, 'pending');
    
    setStatus('idle');
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setRemainingSeconds(task.duration * 60);
    setDistractions([]);
    onAbandon?.(task);
  }, [task, onAbandon, clearTimerState, hasStarted]);
  
  // 记录分心
  const handleDistraction = useCallback((type: DistractionType) => {
    const newDistraction: DistractionRecord = {
      id: 'dist_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      taskId: task.id,
      type,
      timestamp: new Date().toISOString(),
    };
    setDistractions(prev => [...prev, newDistraction]);
    setShowDistractionPanel(false);
    
    // 保存到localStorage
    const str = localStorage.getItem('homework_distractions');
    let allDistractions: DistractionRecord[] = [];
    if (str) {
      try {
        allDistractions = JSON.parse(str);
      } catch (e) {
        allDistractions = [];
      }
    }
    allDistractions.push(newDistraction);
    localStorage.setItem('homework_distractions', JSON.stringify(allDistractions));
  }, [task.id]);
  
  // 倒计时效果
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        if (isOvertime) {
          // 超时状态：时间继续增加
          setOvertimeSeconds(prev => prev + 1);
        } else {
          // 正常倒计时
          setRemainingSeconds(prev => {
            if (prev <= 1) {
              // 时间到，进入超时状态
              setIsOvertime(true);
              setOvertimeSeconds(1);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, isOvertime]);
  
  // 休息倒计时效果
  useEffect(() => {
    if (showRestModal) {
      restIntervalRef.current = window.setInterval(() => {
        setRestRemainingSeconds(prev => {
          if (prev <= 1) {
            if (restIntervalRef.current) {
              clearInterval(restIntervalRef.current);
              restIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
        restIntervalRef.current = null;
      }
    };
  }, [showRestModal]);
  
  // 尝试恢复之前的倒计时状态
  useEffect(() => {
    const savedState = restoreTimerState();
    if (savedState && status === 'idle') {
      restoreCountdown();
    }
  }, []); // 只在组件挂载时执行一次
  
  // 关闭弹窗时清除状态
  useEffect(() => {
    return () => {
      clearTimerState();
    };
  }, [clearTimerState]);
  
  // SVG 环形参数 - 调整尺寸以确保在不同屏幕上都能完整显示
  const size = typeof window !== 'undefined' && window.innerWidth >= 768 ? 260 : 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  
  // 中心点
  const center = size / 2;
  
  // 计算文字大小
  const timeFontSize = typeof window !== 'undefined' && window.innerWidth >= 768 ? '56px' : '40px';
  const labelFontSize = typeof window !== 'undefined' && window.innerWidth >= 768 ? '14px' : '12px';
  
  // 超时闪烁效果
  const overtimeAnimation = isOvertime ? 'animate-pulse' : '';
  
  // 计算超时分钟数和扣分（用于显示）
  const { minutes: overtimeMinutes, points: deductedPoints } = calculateOvertimePenalty();
  
  // 显示的超时时间
  const displayOvertimeSeconds = isOvertime ? overtimeSeconds : 0;
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="relative bg-white rounded-3xl w-full max-w-md mx-auto p-5 shadow-xl max-h-[90vh] overflow-y-auto">
          {/* 关闭按钮 */}
          {status === 'idle' && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-xl transition-colors z-10"
            >
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          )}
          
          {/* 任务标题 */}
          <div className="text-center mb-4 pt-2">
            <h2 className="text-lg font-semibold text-gray-800 truncate px-8">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{task.duration}分钟</p>
          </div>
          
          {/* 环形倒计时 */}
          <div className="relative flex justify-center mb-6" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              className={`transform -rotate-90 ${overtimeAnimation}`}
            >
              {/* 背景环 */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={COLORS.backgroundRing}
                strokeWidth={strokeWidth}
              />
              {/* 进度环 */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={getProgressColor()}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            
            {/* 中央时间显示 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isOvertime ? (
                // 超时显示
                <div className="flex flex-col items-center">
                  <span 
                    className="font-bold tabular-nums"
                    style={{ 
                      fontSize: timeFontSize,
                      color: COLORS.overtime,
                      lineHeight: 1.2
                    }}
                  >
                    {formatTime(displayOvertimeSeconds)}
                  </span>
                  <span 
                    className="text-xs font-medium mt-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600"
                    style={{ fontSize: labelFontSize }}
                  >
                    超时
                  </span>
                </div>
              ) : (
                // 正常显示
                <div className="flex flex-col items-center">
                  <span 
                    className="font-bold tabular-nums transition-colors duration-300"
                    style={{ 
                      fontSize: timeFontSize,
                      color: getProgressColor(),
                      lineHeight: 1.2
                    }}
                  >
                    {formatTime(remainingSeconds)}
                  </span>
                  <span className="text-gray-500 mt-1" style={{ fontSize: labelFontSize }}>
                    {status === 'idle' ? '准备开始' : status === 'running' ? '专注中...' : '已暂停'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* 分心计数提示 */}
          {distractions.length > 0 && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                已分心 {distractions.length} 次
              </span>
            </div>
          )}
          
          {/* 控制按钮 */}
          <div className="flex flex-wrap justify-center gap-3 mb-4 px-2">
            {status === 'idle' && (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-6 py-3 min-w-[100px] bg-vibrant-primary text-white rounded-xl font-medium hover:bg-sky-400 transition-colors"
              >
                <Play className="w-5 h-5" />
                <span>开始</span>
              </button>
            )}
            
            {status === 'running' && (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-w-[72px] bg-vibrant-primary text-white rounded-xl font-medium hover:bg-sky-400 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-sm">暂停</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-w-[72px] bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">完成</span>
                </button>
                <button
                  onClick={handleAbandon}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-w-[72px] bg-red-400 text-white rounded-xl font-medium hover:bg-red-300 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">放弃</span>
                </button>
              </>
            )}
            
            {status === 'paused' && (
              <>
                <button
                  onClick={handleResume}
                  className="flex items-center justify-center gap-2 px-6 py-3 min-w-[100px] bg-vibrant-primary text-white rounded-xl font-medium hover:bg-sky-400 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>继续</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-w-[72px] bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">完成</span>
                </button>
                <button
                  onClick={handleAbandon}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 min-w-[72px] bg-red-400 text-white rounded-xl font-medium hover:bg-red-300 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">放弃</span>
                </button>
              </>
            )}
          </div>
          
          {/* 分心记录按钮 */}
          {status === 'running' && (
            <div className="text-center">
              <button
                onClick={() => setShowDistractionPanel(!showDistractionPanel)}
                className="text-sm text-gray-500 hover:text-vibrant-primary transition-colors"
              >
                {showDistractionPanel ? '收起分心记录' : '记录分心行为'}
              </button>
            </div>
          )}
          
          {/* 分心记录面板 */}
          {showDistractionPanel && status === 'running' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-3">点击记录分心行为，不中断倒计时</p>
              <div className="grid grid-cols-4 gap-2">
                {DISTRACTIONS.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => handleDistraction(item.type)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 最近分心记录 */}
          {distractions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">最近分心:</p>
              <div className="flex flex-wrap gap-1">
                {distractions.slice(-5).map((d) => {
                  const config = DISTRACTIONS.find(x => x.type === d.type);
                  return (
                    <span 
                      key={d.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {config?.emoji}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 休息提醒弹窗 */}
      {showRestModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-3xl w-full max-w-sm mx-auto p-6 shadow-xl text-center">
            {/* 积分获得提示 */}
            {pointsEarned && pointsEarned.descriptions.length > 0 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-semibold">本次获得积分</span>
                </div>
                {pointsEarned.descriptions.map((desc, idx) => (
                  <p key={idx} className="text-sm text-green-700">{desc}</p>
                ))}
                {pointsEarned.points !== 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <span className="text-lg font-bold text-green-600">
                      {pointsEarned.points > 0 ? '+' : ''}{pointsEarned.points} 分
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* 超时提示 */}
            {isOvertime && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl">
                <p className="text-red-600 font-medium mb-1">
                  加油！超时了哦💪 别灰心！
                </p>
                <p className="text-sm text-red-500">
                  超时了 {overtimeMinutes} 分钟
                </p>
              </div>
            )}
            
            {/* 休息图标 */}
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-10 h-10 text-amber-500" />
            </div>
            
            {/* 休息标题 */}
            <h3 className="text-xl font-semibold text-gray-800 mb-2">休息一下</h3>
            <p className="text-gray-500 mb-4">完成作业了，奖励自己休息一下吧！</p>
            
            {/* 休息倒计时 */}
            <div className="mb-6">
              <span className="text-4xl font-bold text-amber-500 tabular-nums">
                {formatTime(restRemainingSeconds)}
              </span>
            </div>
            
            {/* 按钮 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirmComplete}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors"
              >
                休息好了，继续加油！🎉
              </button>
              <button
                onClick={handleSkipRest}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                跳过休息
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
