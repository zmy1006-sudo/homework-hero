import { useState, useEffect } from 'react';
import { User, PointsRecord, POINTS_ACTIONS, RANK_CONFIGS } from '../../types';
import { 
  getUserPoints, 
  getPaginatedPointsHistory, 
  getRankConfig, 
  getNextRankConfig, 
  calculateProgress,
  getPointsActionDescription,
  formatPointsRecord 
} from '../../utils';
import { 
  Trophy, 
  Star, 
  ChevronLeft, 
  Calendar,
  Filter,
  Info,
  Sparkles,
  TrendingUp,
  Target,
  Flame
} from 'lucide-react';

interface PointsPageProps {
  user: User;
  onBack: () => void;
  onRankUp?: (newRank: string) => void;
}

export function PointsPage({ user, onBack, onRankUp }: PointsPageProps) {
  const [userPoints, setUserPoints] = useState(getUserPoints(user.id));
  const [history, setHistory] = useState<PointsRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);

  const rankConfig = getRankConfig(userPoints.rankLevel);
  const nextRankConfig = getNextRankConfig(userPoints.rankLevel);
  const progress = calculateProgress(userPoints.totalPoints, userPoints.rankLevel);

  // 加载积分历史
  const loadHistory = (pageNum: number, date?: string) => {
    const result = getPaginatedPointsHistory(user.id, pageNum, 20, date || undefined);
    if (pageNum === 1) {
      setHistory(result.records);
    } else {
      setHistory(prev => [...prev, ...result.records]);
    }
    setHasMore(result.hasMore);
    setPage(pageNum);
  };

  useEffect(() => {
    loadHistory(1);
    // 触发进度条动画
    setTimeout(() => setAnimateProgress(true), 300);
  }, [user.id]);

  // 处理日期筛选
  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    loadHistory(1, date);
  };

  // 加载更多
  const handleLoadMore = () => {
    if (hasMore) {
      loadHistory(page + 1, selectedDate || undefined);
    }
  };

  // 格式化时间显示
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="font-semibold text-gray-800">积分中心</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 段位卡片 */}
        <div 
          className="relative overflow-hidden rounded-3xl p-6 text-white"
          style={{ 
            background: `linear-gradient(135deg, ${rankConfig.color} 0%, ${rankConfig.bgColor} 100%)` 
          }}
        >
          {/* 装饰元素 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            {/* 段位图标和名称 */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl filter drop-shadow-lg animate-pulse-slow">
                {rankConfig.icon}
              </div>
              <div>
                <div className="text-sm opacity-90">当前段位</div>
                <div className="text-2xl font-bold">{rankConfig.name}</div>
              </div>
            </div>

            {/* 总积分 */}
            <div className="mb-4">
              <div className="text-5xl font-bold">{userPoints.totalPoints}</div>
              <div className="text-sm opacity-90">总积分</div>
            </div>

            {/* 进度条 */}
            {nextRankConfig && (
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1 opacity-90">
                  <span>距离 {nextRankConfig.name}</span>
                  <span>{nextRankConfig.minPoints - userPoints.totalPoints} 分</span>
                </div>
                <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: animateProgress ? `${progress}%` : '0%',
                      transitionDelay: '0.3s'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* 连续打卡 */}
            <div className="flex items-center gap-2 mt-4">
              <Flame className="w-5 h-5" />
              <span className="font-medium">
                连续 {userPoints.streakData.currentStreak} 天
              </span>
              {userPoints.streakData.longestStreak > 0 && (
                <span className="text-xs opacity-75">
                  (最长 {userPoints.streakData.longestStreak} 天)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 今日积分 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-sky-400" />
              <span className="text-gray-600">今日积分</span>
            </div>
            <span className="text-2xl font-bold text-sky-500">{userPoints.todayPoints}/100</span>
          </div>
        </div>

        {/* 功能按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowRules(!showRules)}
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Info className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-medium text-gray-700">积分规则</span>
          </button>
          
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">
              今日还需 {Math.max(0, 100 - userPoints.todayPoints)} 分
            </span>
          </div>
        </div>

        {/* 积分规则说明 */}
        {showRules && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              积分获取规则
            </h3>
            <div className="space-y-2 text-sm">
              {POINTS_ACTIONS.filter(a => a.isBonus).map(action => (
                <div key={action.action} className="flex justify-between text-gray-600">
                  <span>{action.description}</span>
                  <span className="text-green-500 font-medium">+{action.points}分</span>
                </div>
              ))}
            </div>
            
            <h3 className="font-semibold text-gray-800 mt-4 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
              积分扣除规则
            </h3>
            <div className="space-y-2 text-sm">
              {POINTS_ACTIONS.filter(a => !a.isBonus).map(action => (
                <div key={action.action} className="flex justify-between text-gray-600">
                  <span>{action.description}</span>
                  <span className="text-red-500 font-medium">
                    {action.points === 1 ? '-超时分钟×1分' : `-${Math.abs(action.points)}分`}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
              💡 每日积分上限: 100分 | 积分最低: 0分 (不会为负)
            </div>
          </div>
        )}

        {/* 积分明细 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">积分明细</h3>
              
              {/* 日期筛选 */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-sky-400"
                />
                {selectedDate && (
                  <button
                    onClick={() => handleDateFilter('')}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 记录列表 */}
          <div className="divide-y divide-gray-50">
            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>暂无积分记录</p>
                <p className="text-xs mt-1">开始完成任务来获取积分吧！</p>
              </div>
            ) : (
              history.map(record => (
                <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {getPointsActionDescription(record.action)}
                      </div>
                      {record.taskTitle && (
                        <div className="text-xs text-gray-500 mt-0.5">{record.taskTitle}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(record.createdAt)}
                      </div>
                    </div>
                    <div className={`text-lg font-bold ${record.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {record.points > 0 ? '+' : ''}{record.points}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 加载更多 */}
          {hasMore && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLoadMore}
                className="w-full py-2 text-sm text-sky-500 hover:text-sky-600 transition-colors"
              >
                加载更多
              </button>
            </div>
          )}
        </div>

        {/* 段位展示 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">段位一览</h3>
          <div className="space-y-3">
            {[
              { level: 'beginner', icon: '🌱', name: '初心学者', range: '0-499' },
              { level: 'student', icon: '📚', name: '勤学少年', range: '500-1999' },
              { level: 'star', icon: '⭐', name: '学霸之星', range: '2000-4999' },
              { level: 'god', icon: '🎓', name: '学神降临', range: '5000-9999' },
              { level: 'legend', icon: '👑', name: '传奇学神', range: '10000+' },
            ].map((rank, index) => {
              const isCurrentRank = rank.level === userPoints.rankLevel;
              const isReached = RANK_CONFIGS.findIndex(r => r.level === rank.level) <= 
                RANK_CONFIGS.findIndex(r => r.level === userPoints.rankLevel);
              
              return (
                <div 
                  key={rank.level}
                  className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                    isCurrentRank ? 'bg-sky-50 border border-sky-200' : ''
                  }`}
                >
                  <span className={`text-xl ${isReached ? '' : 'opacity-30'}`}>
                    {rank.icon}
                  </span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${isCurrentRank ? 'text-sky-600' : 'text-gray-700'}`}>
                      {rank.name}
                    </div>
                    <div className="text-xs text-gray-400">{rank.range} 分</div>
                  </div>
                  {isCurrentRank && (
                    <span className="px-2 py-0.5 bg-sky-500 text-white text-xs rounded-full">
                      当前
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
