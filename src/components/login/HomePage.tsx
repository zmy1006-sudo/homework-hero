import { User } from '../../types';
import { clearUser, maskPhone } from '../../utils';
import { BookOpen, User as UserIcon, LogOut, Star, Trophy, Target } from 'lucide-react';

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const handleLogout = () => {
    clearUser();
    onLogout();
  };

  const getRoleText = () => {
    switch (user.role) {
      case 'student':
        return '学生';
      case 'parent':
        return '家长';
      case 'teacher':
        return '老师';
      default:
        return '用户';
    }
  };

  const getGradeText = () => {
    return user.grade ? `${user.grade}` : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-morandi-blue-50 via-morandi-beige-50 to-morandi-green-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">作业闯关积分系统</h1>
              <p className="text-xs text-muted-foreground">欢迎回来</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            title="退出登录"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 用户信息卡片 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-morandi-green-300 rounded-2xl flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {user.name || '用户'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getRoleText()} {getGradeText()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {maskPhone(user.phone)}
              </p>
            </div>
          </div>
        </div>

        {/* 积分概览 - 仅学生显示 */}
        {user.role === 'student' && (
          <div className="bg-gradient-to-r from-morandi-green-100 to-morandi-blue-100 rounded-3xl p-6 border border-morandi-green-200/50">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-morandi-green-500" />
              <span className="font-semibold text-gray-800">我的积分</span>
            </div>
            <div className="text-4xl font-bold text-primary mb-2">0</div>
            <p className="text-sm text-muted-foreground">继续加油，快去完成作业吧！</p>
          </div>
        )}

        {/* 功能菜单 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-white/50">
          <h3 className="font-semibold text-gray-800 mb-4 px-2">功能中心</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
              <div className="w-10 h-10 bg-morandi-blue-100 rounded-xl flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-morandi-blue-500" />
              </div>
              <div className="font-medium text-gray-800 text-sm">作业大厅</div>
              <div className="text-xs text-muted-foreground">做作业赚积分</div>
            </button>

            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
              <div className="w-10 h-10 bg-morandi-green-100 rounded-xl flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-morandi-green-500" />
              </div>
              <div className="font-medium text-gray-800 text-sm">积分商城</div>
              <div className="text-xs text-muted-foreground">兑换心仪礼品</div>
            </button>

            {user.role === 'student' && (
              <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
                <div className="w-10 h-10 bg-morandi-pink-100 rounded-xl flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-morandi-pink-500" />
                </div>
                <div className="font-medium text-gray-800 text-sm">排行榜</div>
                <div className="text-xs text-muted-foreground">查看排名</div>
              </button>
            )}

            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
              <div className="w-10 h-10 bg-morandi-purple-100 rounded-xl flex items-center justify-center mb-2">
                <UserIcon className="w-5 h-5 text-morandi-purple-500" />
              </div>
              <div className="font-medium text-gray-800 text-sm">个人中心</div>
              <div className="text-xs text-muted-foreground">修改资料</div>
            </button>
          </div>
        </div>

        {/* 家长/老师 特定功能 */}
        {user.role === 'parent' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-white/50">
            <h3 className="font-semibold text-gray-800 mb-4 px-2">家长功能</h3>
            <div className="space-y-2">
              <button className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left flex items-center justify-between">
                <span className="text-gray-700">查看孩子学习情况</span>
                <span className="text-muted-foreground">→</span>
              </button>
              <button className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left flex items-center justify-between">
                <span className="text-gray-700">作业提醒设置</span>
                <span className="text-muted-foreground">→</span>
              </button>
            </div>
          </div>
        )}

        {user.role === 'teacher' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-white/50">
            <h3 className="font-semibold text-gray-800 mb-4 px-2">老师功能</h3>
            <div className="space-y-2">
              <button className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left flex items-center justify-between">
                <span className="text-gray-700">发布作业</span>
                <span className="text-muted-foreground">→</span>
              </button>
              <button className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left flex items-center justify-between">
                <span className="text-gray-700">班级管理</span>
                <span className="text-muted-foreground">→</span>
              </button>
              <button className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left flex items-center justify-between">
                <span className="text-gray-700">学生成绩</span>
                <span className="text-muted-foreground">→</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
