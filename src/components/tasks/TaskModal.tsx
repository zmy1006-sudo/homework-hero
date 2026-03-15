import { useState, useEffect } from 'react';
import { X, Clock, GripVertical } from 'lucide-react';
import { Task, TaskCategory } from '../../types';
import { 
  getAllCategories, 
  saveTask, 
  generateTaskId,
  validateTaskTitle,
  validateTaskDuration,
  validateTaskDescription
} from '../../utils/tasks';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
  editTask?: Task;
}

const QUICK_TIME_OPTIONS = [15, 25, 30, 45];

export function TaskModal({ isOpen, onClose, userId, onSuccess, editTask }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('math');
  const [duration, setDuration] = useState(25);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const categories = getAllCategories();
  
  // 重置表单
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setCategory(editTask.category);
      setDuration(editTask.duration);
      setDescription(editTask.description || '');
    } else {
      setTitle('');
      setCategory('math');
      setDuration(25);
      setDescription('');
    }
    setErrors({});
  }, [editTask, isOpen]);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证
    const titleValidation = validateTaskTitle(title);
    const durationValidation = validateTaskDuration(duration);
    const descValidation = validateTaskDescription(description);
    
    const newErrors: Record<string, string> = {};
    if (!titleValidation.valid) newErrors.title = titleValidation.message!;
    if (!durationValidation.valid) newErrors.duration = durationValidation.message!;
    if (!descValidation.valid) newErrors.description = descValidation.message!;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 保存任务
    const task: Task = {
      id: editTask?.id || generateTaskId(),
      title: title.trim(),
      category,
      duration,
      description: description.trim() || undefined,
      status: editTask?.status || 'pending',
      createdAt: editTask?.createdAt || new Date().toISOString(),
      startedAt: editTask?.startedAt,
      completedAt: editTask?.completedAt,
      userId,
    };
    
    saveTask(task);
    onSuccess?.();
    onClose();
  };
  
  const handleQuickTime = (minutes: number) => {
    setDuration(minutes);
    setErrors(prev => ({ ...prev, duration: '' }));
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框 */}
      <div className="relative bg-white rounded-3xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden shadow-xl">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {editTask ? '编辑任务' : '创建新任务'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* 任务标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors(prev => ({ ...prev, title: '' }));
              }}
              placeholder="请输入任务标题"
              maxLength={50}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                errors.title 
                  ? 'border-red-300 bg-red-50 focus:border-red-400' 
                  : 'border-gray-200 focus:border-vibrant-primary'
              }`}
            />
            <div className="flex justify-between mt-1">
              {errors.title && <span className="text-sm text-red-500">{errors.title}</span>}
              <span className="text-xs text-gray-400 ml-auto">{title.length}/50</span>
            </div>
          </div>
          
          {/* 类别选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择类别 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    category === cat.id
                      ? 'border-current shadow-md transform scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ 
                    backgroundColor: category === cat.id ? `${cat.color}20` : 'white',
                    borderColor: category === cat.id ? cat.color : undefined
                  }}
                >
                  <div className="text-xl mb-1">{cat.emoji}</div>
                  <div className="text-xs font-medium" style={{ color: category === cat.id ? cat.color : '#666' }}>
                    {cat.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* 时间设定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预计时长 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setDuration(val);
                    setErrors(prev => ({ ...prev, duration: '' }));
                  }}
                  min={1}
                  max={120}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-colors ${
                    errors.duration 
                      ? 'border-red-300 bg-red-50 focus:border-red-400' 
                      : 'border-gray-200 focus:border-vibrant-primary'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  分钟
                </span>
              </div>
            </div>
            {/* 快捷时间按钮 */}
            <div className="flex gap-2">
              {QUICK_TIME_OPTIONS.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleQuickTime(time)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    duration === time
                      ? 'bg-vibrant-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {time}分钟
                </button>
              ))}
            </div>
            {errors.duration && (
              <span className="text-sm text-red-500 mt-1 block">{errors.duration}</span>
            )}
          </div>
          
          {/* 任务描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述 <span className="text-gray-400">(可选)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="添加任务描述..."
              maxLength={200}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vibrant-primary transition-colors resize-none"
            />
            <div className="text-right mt-1">
              <span className="text-xs text-gray-400">{description.length}/200</span>
            </div>
          </div>
        </form>
        
        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-vibrant-primary text-white font-medium hover:bg-sky-400 transition-colors shadow-lg shadow-sky-200"
          >
            {editTask ? '保存修改' : '创建任务'}
          </button>
        </div>
      </div>
    </div>
  );
}
