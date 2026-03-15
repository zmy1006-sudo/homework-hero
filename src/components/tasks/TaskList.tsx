import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  Trash2,
  Edit,
  Timer
} from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { 
  getTasks, 
  getAllCategories, 
  groupTasksByCategory, 
  updateTaskStatus,
  deleteTask,
  getStatusText,
  generateCustomCategoryId,
  addCustomCategory,
  deleteCustomCategory,
  getCategoryConfig
} from '../../utils/tasks';
import { PomodoroTimer } from '../pomodoro/PomodoroTimer';

interface TaskListProps {
  userId: string;
  onTaskChange?: () => void;
}

export function TaskList({ userId, onTaskChange }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📚');
  const [activePomodoroTask, setActivePomodoroTask] = useState<Task | null>(null);
  
  const categories = getAllCategories();
  
  // 加载任务
  const loadTasks = () => {
    const userTasks = getTasks(userId);
    setTasks(userTasks);
  };
  
  useEffect(() => {
    loadTasks();
  }, [userId]);
  
  // 按类别分组
  const groupedTasks = groupTasksByCategory(tasks);
  
  // 切换折叠状态
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };
  
  // 开始任务 - 打开番茄钟
  const handleStartTask = (task: Task) => {
    setActivePomodoroTask(task);
  };
  
  // 番茄钟完成回调
  const handlePomodoroComplete = (completedTask: Task, distractionCount: number) => {
    loadTasks();
    onTaskChange?.();
    setActivePomodoroTask(null);
    // 可以在这里添加奖励积分的逻辑
    if (distractionCount === 0) {
      console.log('任务完成，无分心！');
    }
  };
  
  // 番茄钟放弃回调
  const handlePomodoroAbandon = (abandonedTask: Task) => {
    loadTasks();
    onTaskChange?.();
    setActivePomodoroTask(null);
  };
  
  // 完成任务
  const handleCompleteTask = (taskId: string) => {
    updateTaskStatus(taskId, 'completed');
    loadTasks();
    onTaskChange?.();
  };
  
  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(taskId);
      loadTasks();
      onTaskChange?.();
    }
  };
  
  // 添加自定义类别
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    const existingCustomCount = categories.filter(c => c.isCustom).length;
    
    const newCategory = {
      id: generateCustomCategoryId(),
      name: newCategoryName.trim(),
      emoji: newCategoryEmoji,
      color: colors[existingCustomCount % colors.length],
      isCustom: true,
    };
    
    if (addCustomCategory(newCategory)) {
      setNewCategoryName('');
      setNewCategoryEmoji('📚');
      setShowCategoryModal(false);
      // 强制刷新
      window.location.reload();
    } else {
      alert('最多只能添加5个自定义类别');
    }
  };
  
  // 删除自定义类别
  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (confirm(`确定要删除类别"${categoryName}"吗？该类别下的任务将变为未分类。`)) {
      deleteCustomCategory(categoryId);
      window.location.reload();
    }
  };
  
  // 获取状态样式
  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-500',
          border: 'border-gray-200',
          icon: <Clock className="w-4 h-4" />
        };
      case 'in_progress':
        return {
          bg: 'bg-green-100',
          text: 'text-green-600',
          border: 'border-green-200',
          icon: <Play className="w-4 h-4" />
        };
      case 'completed':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'border-blue-200',
          icon: <CheckCircle2 className="w-4 h-4" />
        };
    }
  };
  
  // 统计各类别任务数
  const getCategoryStats = (categoryId: string) => {
    const categoryTasks = groupedTasks.get(categoryId) || [];
    const total = categoryTasks.length;
    const completed = categoryTasks.filter(t => t.status === 'completed').length;
    const inProgress = categoryTasks.filter(t => t.status === 'in_progress').length;
    return { total, completed, inProgress };
  };
  
  // 如果没有任务
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/50 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">还没有任务</h3>
        <p className="text-gray-500 text-sm">点击上方"添加任务"按钮创建第一个任务吧！</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const categoryTasks = groupedTasks.get(category.id) || [];
        if (categoryTasks.length === 0) return null;
        
        const isCollapsed = collapsedCategories.has(category.id);
        const stats = getCategoryStats(category.id);
        const isCustom = category.isCustom;
        
        return (
          <div 
            key={category.id}
            className="bg-white rounded-2xl shadow-sm border border-white/50 overflow-hidden"
          >
            {/* 类别标题栏 */}
            
                            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.emoji}</span>
                <div className="text-left">
                  <div className="font-semibold text-gray-800">{category.name}</div>
                  <div className="text-xs text-gray-500">
                    {stats.completed}/{stats.total} 完成
                    {stats.inProgress > 0 && ` · ${stats.inProgress}进行中`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isCustom && (
                  
                            <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(category.id, category.name);
                    }}
                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                    title="删除类别"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            
            {/* 任务列表 */}
            {!isCollapsed && (
              <div className="border-t border-gray-100">
                {categoryTasks.map((task) => {
                  const statusStyle = getStatusStyle(task.status);
                  
                  return (
                    <div
                      key={task.id}
                      className="px-4 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                              {statusStyle.icon}
                              <span className="whitespace-nowrap">{getStatusText(task.status)}</span>
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              {task.duration}分钟
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-800 truncate">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-gray-500 truncate">{task.description}</p>
                          )}
                        </div>
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center gap-0.5 ml-2">
                          {task.status === 'pending' && (
                            
                            <button
                              onClick={() => handleStartTask(task)}
                              className="p-2.5 hover:bg-green-100 rounded-xl transition-colors"
                              title="开始任务"
                            >
                              <Timer className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          {task.status === 'in_progress' && (
                            
                            <button
                              onClick={() => handleStartTask(task)}
                              className="p-2.5 hover:bg-blue-100 rounded-xl transition-colors"
                              title="继续任务"
                            >
                              <Timer className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {task.status === 'completed' && (
                            
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="p-2.5 hover:bg-blue-100 rounded-xl transition-colors"
                              title="查看"
                            >
                              <CheckCircle2 className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          
                            <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2.5 hover:bg-red-100 rounded-xl transition-colors"
                            title="删除任务"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      
      {/* 添加类别按钮 */}
      {categories.filter(c => c.isCustom).length < 5 && (
        
                            <button
          onClick={() => setShowCategoryModal(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-vibrant-primary hover:text-vibrant-primary transition-colors text-sm font-medium"
        >
          + 添加自定义类别
        </button>
      )}
      
      {/* 自定义类别弹窗 */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCategoryModal(false)}
          />
          <div className="relative bg-white rounded-3xl w-full max-w-sm mx-4 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">添加自定义类别</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">类别名称</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="如：体育、音乐"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vibrant-primary transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择图标</label>
                <div className="flex flex-wrap gap-2">
                  {['📚', '🎨', '🎵', '🏃', '🔬', '💻', '🌱', '🎮', '🏀', '📖'].map((emoji) => (
                    
                            <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCategoryEmoji(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-colors ${
                        newCategoryEmoji === emoji 
                          ? 'bg-vibrant-primary/20 ring-2 ring-vibrant-primary' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              
                            <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              
                            <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1 py-3 rounded-xl bg-vibrant-primary text-white font-medium hover:bg-sky-400 transition-colors disabled:opacity-50"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 番茄钟弹窗 */}
      {activePomodoroTask && (
        <PomodoroTimer
          task={activePomodoroTask}
          onComplete={handlePomodoroComplete}
          onAbandon={handlePomodoroAbandon}
          onClose={() => setActivePomodoroTask(null)}
        />
      )}
    </div>
  );
}
