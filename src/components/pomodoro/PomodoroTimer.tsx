import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Task } from '../../types';
import { updateTaskStatus } from '../../utils/tasks';

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
export type PomodoroStatus = 'idle' | 'running' | 'paused';

interface PomodoroTimerProps {
  task: Task;
  onComplete?: (task: Task, distractionCount: number) => void;
  onAbandon?: (task: Task) => void;
  onClose?: () => void;
}

// 颜色常量
const COLORS = {
  backgroundRing: '#E0E0E0',
  progressGreen: '#81C784', // 薄荷绿 - 剩余 >50%
  progressOrange: '#FFB74D', // 珊瑚橙 - 剩余 20%-50%
  progressRed: '#E57373', // 玫瑰红 - 剩余 <20%
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
  
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // 计算总时间（秒）
  const totalSeconds = task.duration * 60;
  
  // 计算进度（0-1）
  const progress = remainingSeconds / totalSeconds;
  
  // 计算剩余百分比
  const remainingPercent = progress * 100;
  
  // 获取颜色
  const getProgressColor = () => {
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
  
  // 开始倒计时
  const handleStart = useCallback(() => {
    if (status === 'idle') {
      // 更新任务状态为进行中
      updateTaskStatus(task.id, 'in_progress');
      // 记录开始时间
      startTimeRef.current = Date.now();
    }
    setStatus('running');
  }, [status, task.id]);
  
  // 暂停倒计时
  const handlePause = useCallback(() => {
    setStatus('paused');
  }, []);
  
  // 恢复倒计时
  const handleResume = useCallback(() => {
    setStatus('running');
  }, []);
  
  // 完成任务
  const handleComplete = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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
          localStorage.setItem('homework_tasks', JSON.stringify(allTasks));
        }
      } catch (e) {
        console.error('Failed to update task:', e);
      }
    }
    
    setStatus('idle');
    onComplete?.(task, distractions.length);
  }, [task, distractions.length, onComplete]);
  
  // 放弃任务
  const handleAbandon = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // 更新任务状态为待开始
    updateTaskStatus(task.id, 'pending');
    
    setStatus('idle');
    setRemainingSeconds(task.duration * 60);
    setDistractions([]);
    onAbandon?.(task);
  }, [task, onAbandon]);
  
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
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // 时间到
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // 自动完成
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
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
  }, [status, handleComplete]);
  
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
  
  return (
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
        <div className="flex justify-center mb-6">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
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
          <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
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
  );
}
