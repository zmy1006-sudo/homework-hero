import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, CheckCircle2, XCircle, AlertCircle, Coffee, Sparkles } from 'lucide-react';
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
  startTimestamp: number;
  plannedDuration: number;
}

// 活力童趣配色方案 - 青春活泼版
const COLORS = {
  // 主色调 - 更鲜艳
  primary: '#00BFFF',      // 活力蓝
  secondary: '#FF6B9D',     // 糖果粉
  accent: '#FFD700',       // 明亮黄
  success: '#2ED573',      // 鲜绿
  warning: '#FFA502',      // 橙黄
  danger: '#FF4757',       // 亮红
  
  // 番茄钟进度色 - 更亮
  progressGreen: '#2ED573',   // 鲜绿 - 剩余>50%
  progressOrange: '#FFA502',   // 橙黄 - 剩余20-50%
  progressRed: '#FF4757',      // 亮红 - 剩余<20%
  overtime: '#FF4757',        // 亮红 - 超时
  
  // 背景
  background: '#F8FAFC',
  backgroundRing: '#E8F4FD',
  white: '#FFFFFF',
};

export function PomodoroTimer({ task, onComplete, onAbandon, onClose }: PomodoroTimerProps) {
  const [status, setStatus] = useState<PomodoroStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState(task.duration * 60);
  const [distractions, setDistractions] = useState<DistractionRecord[]>([]);
  const [showDistractionPanel, setShowDistractionPanel] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);
  const [showRestModal, setShowRestModal] = useState(false);
  const [restRemainingSeconds, setRestRemainingSeconds] = useState(5 * 60);
  const [hasStarted, setHasStarted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<{ points: number; descriptions: string[] } | null>(null);
  
  const intervalRef = useRef<number | null>(null);
  const restIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const totalSeconds = task.duration * 60;
  const progress = isOvertime ? 0 : remainingSeconds / totalSeconds;
  const remainingPercent = progress * 100;
  
  // V1.6配色 - 进度颜色
  const getProgressColor = () => {
    if (isOvertime) return COLORS.overtime;
    if (remainingPercent > 50) return COLORS.progressGreen;
    if (remainingPercent >= 20) return COLORS.progressOrange;
    return COLORS.progressRed;
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // localStorage 操作
  const saveTimerState = useCallback((taskId: string, plannedDuration: number) => {
    const state: TimerState = { taskId, startTimestamp: Date.now(), plannedDuration };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, []);
  
  const restoreTimerState = useCallback((): TimerState | null => {
    const str = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!str) return null;
    try {
      const state = JSON.parse(str) as TimerState;
      if (state.taskId !== task.id) return null;
      return state;
    } catch { return null; }
  }, [task.id]);
  
  const clearTimerState = useCallback(() => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }, []);
  
  const calculateRemainingSeconds = useCallback((startTimestamp: number, plannedDuration: number): number => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    const plannedSeconds = plannedDuration * 60;
    return plannedSeconds - elapsed;
  }, []);
  
  // 恢复倒计时
  const restoreCountdown = useCallback(() => {
    const savedState = restoreTimerState();
    if (savedState) {
      const remaining = calculateRemainingSeconds(savedState.startTimestamp, savedState.plannedDuration);
      if (remaining <= 0) {
        setIsOvertime(true);
        setOvertimeSeconds(Math.abs(remaining));
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(remaining);
      }
      startTimeRef.current = savedState.startTimestamp;
      setStatus('running');
    }
  }, [restoreTimerState, calculateRemainingSeconds]);
  
  // 页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        const savedState = restoreTimerState();
        if (savedState) {
          const remaining = calculateRemainingSeconds(savedState.startTimestamp, savedState.plannedDuration);
          if (remaining <= 0 && !isOvertime) {
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
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, restoreTimerState, calculateRemainingSeconds, isOvertime]);
  
  // 开始
  const handleStart = useCallback(() => {
    if (status === 'idle') {
      updateTaskStatus(task.id, 'in_progress');
      startTimeRef.current = Date.now();
      saveTimerState(task.id, task.duration);
      setHasStarted(true);
      addPointsRecord(task.userId, 'on_time_start', task.id, task.title);
    }
    setStatus('running');
  }, [status, task, saveTimerState]);
  
  // 暂停
  const handlePause = useCallback(() => setStatus('paused'), []);
  
  // 恢复
  const handleResume = useCallback(() => {
    const savedState = restoreTimerState();
    if (savedState) {
      saveTimerState(task.id, task.duration);
    }
    setStatus('running');
  }, [task.id, task.duration, saveTimerState, restoreTimerState]);
  
  // 计算超时
  const calculateOvertimePenalty = useCallback((): { minutes: number; points: number } => {
    const overtimeMinutes = Math.ceil(overtimeSeconds / 60);
    return { minutes: overtimeMinutes, points: overtimeMinutes * 1 };
  }, [overtimeSeconds]);
  
  // 完成
  const handleComplete = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    clearTimerState();
    
    const { minutes: overtimeMinutes, points: deductedPoints } = calculateOvertimePenalty();
    
    let totalPoints = 0;
    const descriptions: string[] = [];
    
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
    
    if (isOvertime && overtimeMinutes > 0) {
      const overdueResult = addPointsRecord(task.userId, 'overdue_complete', task.id, task.title, overtimeMinutes);
      if (overdueResult.points < 0) {
        totalPoints += overdueResult.points;
        descriptions.push(`超时完成: ${overdueResult.points}分`);
      }
    } else if (remainingSeconds > 0) {
      const earlyMinutes = Math.floor(remainingSeconds / 60);
      const earlyResult = addPointsRecord(task.userId, 'early_complete', task.id, task.title, earlyMinutes);
      if (earlyResult.points > 0) {
        totalPoints += earlyResult.points;
        descriptions.push(`提前完成: +${earlyResult.points}分`);
      }
    } else {
      const onTimeResult = addPointsRecord(task.userId, 'on_time_complete', task.id, task.title);
      if (onTimeResult.points > 0) {
        totalPoints += onTimeResult.points;
        descriptions.push(`按时完成: +${onTimeResult.points}分`);
      }
    }
    
    const streakResult = updateStreak(task.userId, task.id);
    if (streakResult.streakBonus > 0) {
      totalPoints += streakResult.streakBonus;
      descriptions.push(`连续${streakResult.streakDays}天: +${streakResult.streakBonus}分`);
    }
    
    if (totalPoints !== 0 || descriptions.length > 0) {
      setPointsEarned({ points: totalPoints, descriptions });
    }
    
    updateTaskStatus(task.id, 'completed');
    setStatus('idle');
    setShowRestModal(true);
    setRestRemainingSeconds(5 * 60);
    onComplete?.(task, distractions.length, overtimeMinutes, deductedPoints);
  }, [task, distractions.length, isOvertime, onComplete, clearTimerState, calculateOvertimePenalty, remainingSeconds]);
  
  // 确认完成
  const handleConfirmComplete = useCallback(() => {
    setShowRestModal(false);
    onClose?.();
  }, [onClose]);
  
  // 跳过休息
  const handleSkipRest = useCallback(() => {
    if (restIntervalRef.current) { clearInterval(restIntervalRef.current); restIntervalRef.current = null; }
    setShowRestModal(false);
    onClose?.();
  }, [onClose]);
  
  // 放弃
  const handleAbandon = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    clearTimerState();
    if (hasStarted) {
      addPointsRecord(task.userId, 'abandon_task', task.id, task.title);
    }
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
    
    const str = localStorage.getItem('homework_distractions');
    let allDistractions: DistractionRecord[] = str ? JSON.parse(str) : [];
    allDistractions.push(newDistraction);
    localStorage.setItem('homework_distractions', JSON.stringify(allDistractions));
  }, [task.id]);
  
  // 倒计时效果
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = window.setInterval(() => {
        if (isOvertime) {
          setOvertimeSeconds(prev => prev + 1);
        } else {
          setRemainingSeconds(prev => {
            if (prev <= 1) {
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, isOvertime]);
  
  // 休息倒计时
  useEffect(() => {
    if (showRestModal) {
      restIntervalRef.current = window.setInterval(() => {
        setRestRemainingSeconds(prev => {
          if (prev <= 1) {
            if (restIntervalRef.current) clearInterval(restIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current);
      restIntervalRef.current = null;
    }
    return () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); };
  }, [showRestModal]);
  
  // 恢复状态
  useEffect(() => {
    const savedState = restoreTimerState();
    if (savedState && status === 'idle') restoreCountdown();
  }, []);
  
  useEffect(() => { return () => clearTimerState(); }, [clearTimerState]);
  
  // SVG参数 - 加大尺寸确保不重叠
  const size = 280;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;
  
  const progressColor = getProgressColor();
  const { minutes: overtimeMinutes } = calculateOvertimePenalty();
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative bg-white rounded-3xl w-full max-w-md mx-auto p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* 关闭按钮 */}
          {status === 'idle' && (
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-colors z-10">
              <XCircle className="w-6 h-6 text-gray-400" />
            </button>
          )}
          
          {/* 任务标题 */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 truncate px-8">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{task.duration}分钟</p>
          </div>
          
          {/* 番茄钟环形 - 居中大圆环 */}
          <div className="flex justify-center mb-8">
            <div className="relative" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="transform -rotate-90">
                {/* 背景环 */}
                <circle
                  cx={center} cy={center} r={radius}
                  fill="none"
                  stroke={COLORS.backgroundRing}
                  strokeWidth={strokeWidth}
                />
                {/* 进度环 */}
                <circle
                  cx={center} cy={center} r={radius}
                  fill="none"
                  stroke={progressColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              
              {/* 中央时间 - 绝对定位居中 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isOvertime ? (
                  <div className="text-center">
                    <span className="font-bold text-5xl tabular-nums" style={{ color: COLORS.overtime, lineHeight: 1 }}>
                      {formatTime(overtimeSeconds)}
                    </span>
                    <div className="mt-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                      超时中
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="font-bold text-5xl tabular-nums" style={{ color: progressColor, lineHeight: 1 }}>
                      {formatTime(remainingSeconds)}
                    </span>
                    <span className="block mt-2 text-gray-500 text-sm">
                      {status === 'idle' ? '准备开始' : status === 'running' ? '专注中...' : '已暂停'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 分心提示 */}
          {distractions.length > 0 && (
            <div className="text-center mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                <AlertCircle className="w-4 h-4" />
                已分心 {distractions.length} 次
              </span>
            </div>
          )}
          
          {/* 控制按钮 */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {status === 'idle' && (
              <button onClick={handleStart} className="flex items-center gap-2 px-8 py-3 bg-sky-400 text-white rounded-xl font-semibold hover:bg-sky-300 transition-colors shadow-lg shadow-sky-200">
                <Play className="w-5 h-5" />
                开始
              </button>
            )}
            
            {status === 'running' && (
              <>
                <button onClick={handlePause} className="flex items-center gap-1 px-5 py-2.5 bg-amber-400 text-white rounded-xl font-medium hover:bg-amber-300 transition-colors">
                  <Pause className="w-4 h-4" />
                  <span className="text-sm">暂停</span>
                </button>
                <button onClick={handleComplete} className="flex items-center gap-1 px-5 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">完成</span>
                </button>
                <button onClick={handleAbandon} className="flex items-center gap-1 px-5 py-2.5 bg-red-400 text-white rounded-xl font-medium hover:bg-red-300 transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">放弃</span>
                </button>
              </>
            )}
            
            {status === 'paused' && (
              <>
                <button onClick={handleResume} className="flex items-center gap-2 px-8 py-3 bg-sky-400 text-white rounded-xl font-semibold hover:bg-sky-300 transition-colors shadow-lg shadow-sky-200">
                  <Play className="w-5 h-5" />
                  继续
                </button>
                <button onClick={handleComplete} className="flex items-center gap-1 px-5 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">完成</span>
                </button>
                <button onClick={handleAbandon} className="flex items-center gap-1 px-5 py-2.5 bg-red-400 text-white rounded-xl font-medium hover:bg-red-300 transition-colors">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">放弃</span>
                </button>
              </>
            )}
          </div>
          
          {/* 分心记录 */}
          {status === 'running' && (
            <div className="text-center">
              <button onClick={() => setShowDistractionPanel(!showDistractionPanel)} className="text-sm text-gray-500 hover:text-sky-500 transition-colors">
                {showDistractionPanel ? '收起分心记录' : '记录分心行为'}
              </button>
            </div>
          )}
          
          {showDistractionPanel && status === 'running' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-3">点击记录分心，不中断倒计时</p>
              <div className="grid grid-cols-4 gap-2">
                {DISTRACTIONS.map((item) => (
                  <button key={item.type} onClick={() => handleDistraction(item.type)} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-100 transition-colors">
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
              <p className="text-xs text-gray-500 mb-2">最近:</p>
              <div className="flex flex-wrap gap-1">
                {distractions.slice(-5).map((d) => {
                  const config = DISTRACTIONS.find(x => x.type === d.type);
                  return <span key={d.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs">{config?.emoji}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 休息弹窗 */}
      {showRestModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-3xl w-full max-w-sm mx-auto p-6 shadow-2xl text-center">
            {/* 积分提示 */}
            {pointsEarned && pointsEarned.descriptions.length > 0 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-semibold">本次获得</span>
                </div>
                {pointsEarned.descriptions.map((desc, idx) => (
                  <p key={idx} className="text-sm text-green-700">{desc}</p>
                ))}
                {pointsEarned.points !== 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <span className="text-xl font-bold text-green-600">
                      {pointsEarned.points > 0 ? '+' : ''}{pointsEarned.points} 分
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {/* 超时提示 */}
            {isOvertime && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl">
                <p className="text-red-600 font-medium mb-1">加油！超时了哦💪</p>
                <p className="text-sm text-red-500">超时 {overtimeMinutes} 分钟</p>
              </div>
            )}
            
            {/* 休息内容 */}
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coffee className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">休息一下</h3>
            <p className="text-gray-500 mb-4">完成作业了，休息一下吧！</p>
            
            <div className="mb-6">
              <span className="text-4xl font-bold text-amber-500 tabular-nums">{formatTime(restRemainingSeconds)}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              <button onClick={handleConfirmComplete} className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors">
                好了，继续加油！🎉
              </button>
              <button onClick={handleSkipRest} className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                跳过休息
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
