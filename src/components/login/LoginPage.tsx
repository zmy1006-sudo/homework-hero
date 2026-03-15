import { useState } from 'react';
import { UserRole, GRADE_OPTIONS, User, LoginFormData } from '../../types';
import { saveUser, isValidPhone, isValidClassCode, generateId } from '../../utils';
import { BookOpen, Users, GraduationCap, ArrowLeft, LogIn } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

type LoginStep = 'role' | 'form';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [step, setStep] = useState<LoginStep>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<LoginFormData>({
    phone: '',
    name: '',
    grade: '',
    boundPhone: '',
    classCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 选择角色
  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('form');
    setError('');
    setFormData({
      phone: '',
      name: '',
      grade: '',
      boundPhone: '',
      classCode: '',
    });
  };

  // 返回角色选择
  const handleBack = () => {
    setStep('role');
    setRole(null);
    setError('');
  };

  // 输入框变化
  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!isValidPhone(formData.phone)) {
      setError('请输入正确的11位手机号');
      return false;
    }

    if (role === 'student') {
      if (!formData.name?.trim()) {
        setError('请输入姓名');
        return false;
      }
      if (!formData.grade) {
        setError('请选择年级');
        return false;
      }
    } else if (role === 'parent') {
      if (!formData.boundPhone) {
        setError('请输入绑定孩子的手机号');
        return false;
      }
      if (!isValidPhone(formData.boundPhone)) {
        setError('请输入正确的11位孩子手机号');
        return false;
      }
    } else if (role === 'teacher') {
      if (!isValidClassCode(formData.classCode || '')) {
        setError('请输入6位班级码');
        return false;
      }
    }

    return true;
  };

  // 登录提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    // 模拟登录延迟
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      // 创建用户对象
      const user: User = {
        id: generateId(),
        phone: formData.phone,
        role: role!,
        name: role === 'student' ? formData.name : role === 'teacher' ? '老师' : undefined,
        grade: role === 'student' ? formData.grade : undefined,
        classCode: role === 'teacher' ? formData.classCode : undefined,
        boundPhone: role === 'parent' ? formData.boundPhone : undefined,
        createdAt: new Date().toISOString(),
      };

      // 保存用户信息
      saveUser(user);
      
      // 回调成功
      onLoginSuccess(user);
    } catch (err) {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-morandi-blue-50 via-morandi-beige-50 to-morandi-green-50 flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-morandi-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-morandi-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-morandi-green-100/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">作业闯关积分系统</h1>
          <p className="text-muted-foreground">让孩子学习更有动力</p>
        </div>

        {/* 卡片容器 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
          {/* 步骤指示器 */}
          {step === 'form' && (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">重新选择角色</span>
            </button>
          )}

          {/* 角色选择 */}
          {step === 'role' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center mb-6">请选择您的身份</h2>
              
              <button
                onClick={() => handleRoleSelect('student')}
                className="w-full p-4 bg-gradient-to-r from-morandi-green-100 to-morandi-green-50 hover:from-morandi-green-200 hover:to-morandi-green-100 rounded-2xl border border-morandi-green-200 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-morandi-green-400 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 group-hover:text-morandi-green-700">学生</div>
                    <div className="text-sm text-muted-foreground">完成作业赚积分</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('parent')}
                className="w-full p-4 bg-gradient-to-r from-morandi-pink-100 to-morandi-pink-50 hover:from-morandi-pink-200 hover:to-morandi-pink-100 rounded-2xl border border-morandi-pink-200 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-morandi-pink-400 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 group-hover:text-morandi-pink-700">家长</div>
                    <div className="text-sm text-muted-foreground">绑定孩子账号</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('teacher')}
                className="w-full p-4 bg-gradient-to-r from-morandi-blue-100 to-morandi-blue-50 hover:from-morandi-blue-200 hover:to-morandi-blue-100 rounded-2xl border border-morandi-blue-200 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-morandi-blue-400 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-800 group-hover:text-morandi-blue-700">老师</div>
                    <div className="text-sm text-muted-foreground">管理班级作业</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* 登录表单 */}
          {step === 'form' && role && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-center mb-6">
                {role === 'student' && '学生登录'}
                {role === 'parent' && '家长登录'}
                {role === 'teacher' && '老师登录'}
              </h2>

              {/* 手机号 - 通用 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="请输入11位手机号"
                  maxLength={11}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* 学生：姓名和年级 */}
              {role === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="请输入姓名"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">年级</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                    >
                      <option value="">请选择年级</option>
                      {GRADE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* 家长：绑定孩子手机号 */}
              {role === 'parent' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">绑定孩子手机号</label>
                  <input
                    type="tel"
                    value={formData.boundPhone}
                    onChange={(e) => handleInputChange('boundPhone', e.target.value)}
                    placeholder="请输入孩子的手机号"
                    maxLength={11}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              )}

              {/* 老师：班级码 */}
              {role === 'teacher' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">班级码</label>
                  <input
                    type="text"
                    value={formData.classCode}
                    onChange={(e) => handleInputChange('classCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入6位班级码"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
              )}

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-morandi-green-500 hover:from-morandi-green-600 hover:to-morandi-green-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>登录</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          登录即表示同意用户协议和隐私政策
        </p>
      </div>
    </div>
  );
}
