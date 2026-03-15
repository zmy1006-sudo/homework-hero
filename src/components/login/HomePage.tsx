import { useState, useEffect } from 'react';
import { User } from '../../types';
import { clearUser, maskPhone, getUserPoints, getRankConfig, calculateProgress } from '../../utils';
import { BookOpen, User as UserIcon, LogOut, Star, Trophy, Target, Plus, Clock, Flame, ChevronRight } from 'lucide-react';
import { TaskModal } from '../tasks/TaskModal';
import { TaskList } from '../tasks/TaskList';
import { PointsPage } from '../points/PointsPage';

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

export function HomePage({ user, onLogout }: HomePageProps) {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPointsPage, setShowPointsPage] = useState(false);
  const [userPoints, setUserPoints] = useState(getUserPoints(user.id));
  const [animateProgress, setAnimateProgress] = useState(false);

  useEffect(() => {
    // 刷新积分数据
    setUserPoints(getUserPoints(user.id));
    // 触发进度条动画
    setTimeout(() => setAnimateProgress(true), 500);
  }, [user.id, refreshKey]);

  const handleLogout = () => {
    clearUser();
    onLogout();
  };

  const handleTaskChange = () => {
    setRefreshKey(k => k + 1);
    setUserPoints(getUserPoints(user.id));
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

  const rankConfig = getRankConfig(userPoints.rankLevel);
  const progress = calculateProgress(userPoints.totalPoints, userPoints.rankLevel);

  // 如果显示积分页面
  if (showPointsPage) {
    return (
      <PointsPage 
        user={user} 
        onBack={() => setShowPointsPage(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-violet-400 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800">作业闯关</h1>
              <p className="text-xs text-muted-foreground">每日进步一点点</p>
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

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* 段位展示卡片 - 仅学生显示 */}
        {user.role === 'student' && (
          <div 
            onClick={() => setShowPointsPage(true)}
            className="relative overflow-hidden rounded-3xl p-5 cursor-pointer hover:scale-[1.02] transition-transform"
            style={{ 
              background: `linear-gradient(135deg, ${rankConfig.color}20 0%, ${rankConfig.bgColor}80 100%)`,
              border: `2px solid ${rankConfig.bgColor}`
            }}
          >
            {/* 装饰 */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl filter drop-shadow-sm">
                  {rankConfig.icon}
                </div>
                <div>
                  <div className="text-sm text-gray-600">当前段位</div>
                  <div className="text-xl font-bold" style={{ color: rankConfig.color }}>
                    {rankConfig.name}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-gray-500">
                      连续 {userPoints.streakData.currentStreak} 天
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-800">{userPoints.totalPoints}</div>
                <div className="text-xs text-gray-500">总积分</div>
                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto mt-1" />
              </div>
            </div>

            {/* 进度条 */}
            <div className="mt-3">
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: animateProgress ? `${progress}%` : '0%',
                    backgroundColor: rankConfig.color
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-400/30 to-violet-400/30 rounded-2xl flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-sky-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-800">
                {user.name || '用户'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getRoleText()} {getGradeText()}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {maskPhone(user.phone)}
              </p>
            </div>
            {user.role === 'student' && (
              <button
                onClick={() => setShowPointsPage(true)}
                className="p-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl"
              >
                <Star className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* 任务管理模块 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-500" />
              <h3 className="font-semibold text-gray-800">我的任务</h3>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加任务
            </button>
          </div>
          
          {/* 任务列表 */}
          <TaskList 
            key={refreshKey}
            userId={user.id} 
            onTaskChange={handleTaskChange}
          />
        </div>

        {/* 积分概览 - 仅学生显示 (备用，如果不想点击卡片) */}
        {user.role === 'student' && (
          <div 
            onClick={() => setShowPointsPage(true)}
            className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 cursor-pointer hover:border-amber-200 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="font-semibold text-gray-800">积分中心</div>
                  <div className="text-xs text-gray-500">查看积分明细和段位</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        )}

        {/* 功能菜单 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 px-2">功能中心</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-sky-500" />
              </div>
              <div className="font-medium text-gray-800 text-sm">作业大厅</div>
              <div className="text-xs text-muted-foreground">做作业赚积分</div>
            </button>

            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-green-500" />
              </div>
              <div className="font-medium text-gray-800 text-sm">积分商城</div>
              <div className="text-xs text-muted-foreground">兑换心仪礼品</div>
            </button>

            {user.role === 'student' && (
              <button 
                onClick={() => setShowPointsPage(true)}
                className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div className="font-medium text-gray-800 text-sm">排行榜</div>
                <div className="text-xs text-muted-foreground">查看排名</div>
              </button>
            )}

            <button className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-2">
                <UserIcon className="w-5 h-5 text-violet-500" />
              </div>
              <div className="font-medium text-gray-800 text-sm">个人中心</div>
              <div className="text-xs text-muted-foreground">修改资料</div>
            </button>
          </div>
        </div>

        {/* 家长/老师 特定功能 */}
        {user.role === 'parent' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-100">
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

      {/* 任务创建弹窗 */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        userId={user.id}
        onSuccess={handleTaskChange}
      />
    </div>
  );
}
