import { useState, useEffect, useMemo } from 'react';
import { User, FocusSession, TaskCategory } from '../../types';
import { 
  getFocusSessionsByUser, 
  generateFocusReport, 
  formatMinutes,
  getCategoryColor,
  getCategoryName
} from '../../utils';
import { 
  ArrowLeft, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  PieChart,
  Calendar,
  Target,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface FocusReportPageProps {
  user: User;
  onBack: () => void;
}

type Period = 'day' | 'week' | 'month';

export function FocusReportPage({ user, onBack }: FocusReportPageProps) {
  // 这里需要家长选择查看哪个孩子的数据
  // 简化处理：使用本地存储中已有的孩子ID，或者展示所有孩子的数据
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [children, setChildren] = useState<{ id: string; name: string }[]>([]);
  const [period, setPeriod] = useState<Period>('week');
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [showChildSelector, setShowChildSelector] = useState(false);

  useEffect(() => {
    // 尝试从 localStorage 获取绑定的孩子信息
    // 这里简化处理，实际应该从后端获取
    loadChildrenData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadFocusSessions();
    }
  }, [selectedChildId, period]);

  const loadChildrenData = () => {
    // 查找所有学生的兑换记录或专注记录来确定孩子
    const records = JSON.parse(localStorage.getItem('homework_exchange_records') || '[]');
    const focusSessions = JSON.parse(localStorage.getItem('homework_focus_sessions') || '[]');
    
    // 收集所有唯一的用户ID
    const userIds = new Set<string>();
    records.forEach((r: any) => userIds.add(r.userId));
    focusSessions.forEach((s: any) => userIds.add(s.userId));
    
    // 从用户存储中获取孩子信息
    const users = JSON.parse(localStorage.getItem('homework_users') || '[]');
    const childrenList = Array.from(userIds)
      .map(id => {
        const child = users.find((u: any) => u.id === id);
        return child ? { id: child.id, name: child.name || '孩子' } : { id, name: '孩子' };
      })
      .filter(c => c.id);
    
    // 如果没有找到，添加示例数据
    if (childrenList.length === 0) {
      // 检查本地是否有任何积分记录
      const pointsKeys = Object.keys(localStorage).filter(k => k.startsWith('homework_points_'));
      pointsKeys.forEach(key => {
        const userId = key.replace('homework_points_', '');
        if (!childrenList.find(c => c.id === userId)) {
          childrenList.push({ id: userId, name: '孩子' });
        }
      });
    }
    
    setChildren(childrenList);
    if (childrenList.length > 0) {
      setSelectedChildId(childrenList[0].id);
    }
  };

  const loadFocusSessions = () => {
    const userSessions = getFocusSessionsByUser(selectedChildId);
    setSessions(userSessions);
  };

  const report = useMemo(() => {
    if (!selectedChildId) return null;
    return generateFocusReport(selectedChildId, period);
  }, [selectedChildId, period, sessions]);

  const periodLabels = {
    day: '今日',
    week: '本周',
    month: '本月',
  };

  const categoryColors: Record<string, string> = {
    math: '#42A5F5',
    chinese: '#66BB6A',
    english: '#FFA726',
    science: '#AB47BC',
  };

  const categoryNames: Record<string, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语',
    science: '科学',
  };

  // 分心原因数据
  const distractionReasons = report?.distractionStats || [];
  const totalDistractions = distractionReasons.reduce((sum, d) => sum + d.count, 0);

  // 类别分布数据
  const categoryData = report?.categoryBreakdown 
    ? Object.entries(report.categoryBreakdown)
        .filter(([_, minutes]) => minutes > 0)
        .sort((a, b) => b[1] - a[1])
    : [];

  const maxCategoryMinutes = categoryData.length > 0 ? categoryData[0][1] : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-amber-50">
      {/* 顶部导航 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-violet-500" />
            <h1 className="font-semibold text-gray-800">专注报告</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* 孩子选择器 */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <button
              onClick={() => setShowChildSelector(!showChildSelector)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-violet-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-gray-500">查看孩子</div>
                  <div className="font-medium text-gray-800">
                    {children.find(c => c.id === selectedChildId)?.name || '请选择'}
                  </div>
                </div>
              </div>
              {showChildSelector ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {showChildSelector && children.length > 1 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => {
                      setSelectedChildId(child.id);
                      setShowChildSelector(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left transition-colors ${
                      selectedChildId === child.id
                        ? 'bg-violet-100 text-violet-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 时间周期选择 */}
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-violet-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {!report || report.totalSessions === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无专注数据</p>
            <p className="text-sm text-gray-400 mt-1">孩子在番茄钟中完成专注后会有记录</p>
          </div>
        ) : (
          <>
            {/* 核心指标 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-4">
                <Clock className="w-5 h-5 text-blue-600 mb-2" />
                <div className="text-xl font-bold text-blue-700">
                  {formatMinutes(report.totalMinutes)}
                </div>
                <div className="text-xs text-blue-600">总专注时长</div>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-4">
                <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
                <div className="text-xl font-bold text-green-700">
                  {formatMinutes(report.averageMinutes)}
                </div>
                <div className="text-xs text-green-600">平均时长</div>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl p-4">
                <Zap className="w-5 h-5 text-amber-600 mb-2" />
                <div className="text-xl font-bold text-amber-700">
                  {formatMinutes(report.maxMinutes)}
                </div>
                <div className="text-xs text-amber-600">最长专注</div>
              </div>
            </div>

            {/* 专注次数 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-gray-800">专注统计</h3>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-violet-600">{report.totalSessions}</div>
                  <div className="text-xs text-gray-500">专注次数</div>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((report.totalSessions / (period === 'day' ? 1 : period === 'week' ? 7 : 30)) * 10) / 10}
                  </div>
                  <div className="text-xs text-gray-500">日均次数</div>
                </div>
              </div>
            </div>

            {/* 趋势图（简化为数据条） */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-gray-800">趋势数据</h3>
              </div>
              <div className="flex items-end justify-between gap-1 h-24">
                {report.dailyData.slice(-7).map((day, index) => {
                  const maxMinutes = Math.max(...report.dailyData.map(d => d.minutes), 1);
                  const height = (day.minutes / maxMinutes) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-violet-400 to-violet-300 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      ></div>
                      <span className="text-[10px] text-gray-400 mt-1">
                        {day.date.slice(-2)}日
                      </span>
                    </div>
                  );
                })}
              </div>
              {report.dailyData.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">暂无趋势数据</p>
              )}
            </div>

            {/* 类别分布 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-gray-800">类别用时分布</h3>
              </div>
              
              {categoryData.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">暂无类别数据</p>
              ) : (
                <div className="space-y-3">
                  {categoryData.map(([category, minutes]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoryColors[category] || '#9E9E9E' }}
                          ></div>
                          <span className="text-sm text-gray-700">
                            {categoryNames[category] || category}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {formatMinutes(minutes)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${(minutes / maxCategoryMinutes) * 100}%`,
                            backgroundColor: categoryColors[category] || '#9E9E9E'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 中断原因统计 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-gray-800">中断原因分析</h3>
              </div>
              
              {distractionReasons.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">暂无中断记录，很专注哦！</p>
              ) : (
                <div className="space-y-3">
                  {distractionReasons.map((stat, index) => {
                    const percentage = totalDistractions > 0 
                      ? Math.round((stat.count / totalDistractions) * 100) 
                      : 0;
                    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 truncate">{stat.reason}</span>
                            <span className="text-sm text-gray-500 ml-2">{percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: colors[index % colors.length]
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
