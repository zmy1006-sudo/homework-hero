import { useState } from 'react';
import { User } from '../../types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, BookOpen, Users, Calendar } from 'lucide-react';

interface TeacherPublishPageProps {
  user: User;
  onBack: () => void;
}

interface Homework {
  id: string;
  title: string;
  subject: string;
  description: string;
  deadline: string;
  points: number;
  classId: string;
}

// 模拟作业数据
const mockHomeworks: Homework[] = [
  {
    id: '1',
    title: '数学练习册 P20-25',
    subject: '数学',
    description: '完成练习册第20到25页的所有题目',
    deadline: '2024-03-20',
    points: 20,
    classId: 'class1'
  },
  {
    id: '2',
    title: '语文生字抄写',
    subject: '语文',
    description: '抄写第10课生字每个3遍',
    deadline: '2024-03-18',
    points: 10,
    classId: 'class1'
  }
];

const subjects = ['语文', '数学', '英语', '科学', '艺术'];

export function TeacherPublishPage({ user, onBack }: TeacherPublishPageProps) {
  const [homeworks, setHomeworks] = useState<Homework[]>(mockHomeworks);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '数学',
    description: '',
    deadline: '',
    points: 10,
    classId: 'class1'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setHomeworks(prev => prev.map(h => h.id === editingId ? { ...formData, id: editingId } : h));
      setEditingId(null);
    } else {
      const newHomework: Homework = {
        ...formData,
        id: Date.now().toString()
      };
      setHomeworks(prev => [...prev, newHomework]);
    }
    setShowForm(false);
    setFormData({
      title: '',
      subject: '数学',
      description: '',
      deadline: '',
      points: 10,
      classId: 'class1'
    });
  };

  const handleEdit = (homework: Homework) => {
    setFormData(homework);
    setEditingId(homework.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条作业吗？')) {
      setHomeworks(prev => prev.filter(h => h.id !== id));
    }
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
            <BookOpen className="w-5 h-5 text-sky-500" />
            <h1 className="font-semibold text-gray-800">发布作业</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 发布作业按钮 */}
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              title: '',
              subject: '数学',
              description: '',
              deadline: '',
              points: 10,
              classId: 'class1'
            });
          }}
          className="w-full py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          发布新作业
        </button>

        {/* 作业列表 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">已发布的作业</h3>
          {homeworks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无作业</p>
            </div>
          ) : (
            homeworks.map(homework => (
              <div
                key={homework.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{homework.title}</h4>
                    <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-600 text-xs rounded-full mt-1">
                      {homework.subject}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(homework)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(homework.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">{homework.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {homework.deadline}
                    </span>
                  </div>
                  <span className="font-medium text-amber-500">+{homework.points}分</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 发布/编辑作业表单弹窗 */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md mx-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? '编辑作业' : '发布作业'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作业标题
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="请输入作业标题"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    科目
                  </label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作业描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    rows={3}
                    placeholder="请输入作业描述"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      截止日期
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      积分奖励
                    </label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={e => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
