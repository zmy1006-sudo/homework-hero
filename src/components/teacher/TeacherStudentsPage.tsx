import { useState } from 'react';
import { User } from '../../types';
import { ArrowLeft, Search, Filter, Trophy, TrendingUp, TrendingDown, Star, Calendar, BookOpen } from 'lucide-react';

interface TeacherStudentsPageProps {
  user: User;
  onBack: () => void;
}

interface StudentGrade {
  id: string;
  studentId: string;
  name: string;
  className: string;
  subject: string;
  scores: {
    homework: number;
    quiz: number;
    exam: number;
    total: number;
  }[];
  totalPoints: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

// 模拟学生成绩数据
const mockGrades: StudentGrade[] = [
  {
    id: 's1',
    studentId: '2024001',
    name: '张小明',
    className: '一年级(1)班',
    subject: '数学',
    scores: [
      { homework: 95, quiz: 88, exam: 92, total: 275 }
    ],
    totalPoints: 1250,
    rank: 1,
    trend: 'up'
  },
  {
    id: 's2',
    studentId: '2024002',
    name: '李小红',
    className: '一年级(1)班',
    subject: '数学',
    scores: [
      { homework: 85, quiz: 90, exam: 87, total: 262 }
    ],
    totalPoints: 980,
    rank: 2,
    trend: 'stable'
  },
  {
    id: 's3',
    studentId: '2024003',
    name: '王小刚',
    className: '一年级(1)班',
    subject: '数学',
    scores: [
      { homework: 78, quiz: 82, exam: 85, total: 245 }
    ],
    totalPoints: 1560,
    rank: 3,
    trend: 'up'
  },
  {
    id: 's4',
    studentId: '2024004',
    name: '赵小丽',
    className: '一年级(1)班',
    subject: '语文',
    scores: [
      { homework: 90, quiz: 85, exam: 88, total: 263 }
    ],
    totalPoints: 870,
    rank: 4,
    trend: 'down'
  },
  {
    id: 's5',
    studentId: '2024005',
    name: '陈小华',
    className: '一年级(2)班',
    subject: '英语',
    scores: [
      { homework: 92, quiz: 95, exam: 90, total: 277 }
    ],
    totalPoints: 1100,
    rank: 1,
    trend: 'up'
  },
];

const subjects = ['全部', '语文', '数学', '英语', '科学'];
const classes = ['全部班级', '一年级(1)班', '一年级(2)班'];

export function TeacherStudentsPage({ user, onBack }: TeacherStudentsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('全部');
  const [selectedClass, setSelectedClass] = useState('全部班级');
  const [showDetail, setShowDetail] = useState<StudentGrade | null>(null);

  const filteredGrades = mockGrades.filter(grade => {
    const matchSearch = grade.name.includes(searchTerm) || grade.studentId.includes(searchTerm);
    const matchSubject = selectedSubject === '全部' || grade.subject === selectedSubject;
    const matchClass = selectedClass === '全部班级' || grade.className === selectedClass;
    return matchSearch && matchSubject && matchClass;
  });

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-white';
    if (rank === 2) return 'bg-gray-300 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4 text-gray-400">-</span>;
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
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-sky-500" />
            <h1 className="font-semibold text-gray-800">学生成绩</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 搜索和筛选 */}
        <div className="space-y-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索学生姓名或学号"
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 筛选按钮 */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {subjects.map(subject => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedSubject === subject
                      ? 'bg-white text-sky-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          {/* 班级筛选 */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {classes.map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedClass === cls
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-sky-500">{filteredGrades.length}</div>
            <div className="text-xs text-gray-400">学生人数</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-500">
              {filteredGrades.length > 0 
                ? Math.round(filteredGrades.reduce((sum, g) => sum + g.scores[0].total, 0) / filteredGrades.length)
                : 0}
            </div>
            <div className="text-xs text-gray-400">平均分</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-amber-500">
              {filteredGrades.reduce((sum, g) => sum + g.totalPoints, 0)}
            </div>
            <div className="text-xs text-gray-400">总积分</div>
          </div>
        </div>

        {/* 成绩列表 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">成绩排名</h3>
          {filteredGrades.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无数据</p>
            </div>
          ) : (
            filteredGrades
              .sort((a, b) => a.rank - b.rank)
              .map((grade, index) => (
                <div
                  key={grade.id}
                  onClick={() => setShowDetail(grade)}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-sky-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* 排名 */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${getRankColor(grade.rank)}`}>
                      {grade.rank}
                    </div>

                    {/* 学生信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{grade.name}</h4>
                        {getTrendIcon(grade.trend)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <span>{grade.studentId}</span>
                        <span>·</span>
                        <span>{grade.className}</span>
                        <span>·</span>
                        <span className="px-1.5 py-0.5 bg-sky-100 text-sky-600 rounded">{grade.subject}</span>
                      </div>
                    </div>

                    {/* 分数 */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {grade.scores[0].total}
                      </div>
                      <div className="text-xs text-gray-400">总分</div>
                    </div>
                  </div>

                  {/* 分数明细 */}
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="text-center flex-1">
                      <div className="text-sm font-medium text-gray-600">{grade.scores[0].homework}</div>
                      <div className="text-xs text-gray-400">作业</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-sm font-medium text-gray-600">{grade.scores[0].quiz}</div>
                      <div className="text-xs text-gray-400">测验</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-sm font-medium text-gray-600">{grade.scores[0].exam}</div>
                      <div className="text-xs text-gray-400">考试</div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="text-sm font-bold text-amber-500">{grade.totalPoints}</div>
                      <div className="text-xs text-gray-400">积分</div>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* 成绩详情弹窗 */}
        {showDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md mx-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">学生详情</h3>
                <button
                  onClick={() => setShowDetail(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <span className="text-gray-400">✕</span>
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-violet-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                  {showDetail.name.charAt(0)}
                </div>
                <h4 className="text-xl font-semibold text-gray-800">{showDetail.name}</h4>
                <p className="text-sm text-gray-400">
                  {showDetail.className} · {showDetail.subject}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">综合排名</span>
                    <span className="text-lg font-bold text-sky-500">第 {showDetail.rank} 名</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">总积分</span>
                    <span className="text-lg font-bold text-amber-500">{showDetail.totalPoints} 分</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-gray-700">成绩明细</h5>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-sky-50 rounded-xl p-3">
                      <div className="text-lg font-bold text-sky-600">{showDetail.scores[0].homework}</div>
                      <div className="text-xs text-gray-400">作业</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <div className="text-lg font-bold text-green-600">{showDetail.scores[0].quiz}</div>
                      <div className="text-xs text-gray-400">测验</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <div className="text-lg font-bold text-amber-600">{showDetail.scores[0].exam}</div>
                      <div className="text-xs text-gray-400">考试</div>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3">
                      <div className="text-lg font-bold text-violet-600">{showDetail.scores[0].total}</div>
                      <div className="text-xs text-gray-400">总分</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetail(null)}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
