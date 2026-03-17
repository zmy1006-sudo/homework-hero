import { useState } from 'react';
import { User } from '../../types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Users, UserPlus, GraduationCap } from 'lucide-react';

interface TeacherClassPageProps {
  user: User;
  onBack: () => void;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  studentCount: number;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  classId: string;
  points: number;
  parentPhone?: string;
}

// 模拟班级数据
const mockClasses: Class[] = [
  { id: 'class1', name: '一年级(1)班', grade: '一年级', studentCount: 35 },
  { id: 'class2', name: '一年级(2)班', grade: '一年级', studentCount: 32 },
];

// 模拟学生数据
const mockStudents: Student[] = [
  { id: 's1', name: '张小明', studentId: '2024001', classId: 'class1', points: 1250, parentPhone: '138****1234' },
  { id: 's2', name: '李小红', studentId: '2024002', classId: 'class1', points: 980, parentPhone: '139****5678' },
  { id: 's3', name: '王小刚', studentId: '2024003', classId: 'class1', points: 1560, parentPhone: '137****9012' },
  { id: 's4', name: '赵小丽', studentId: '2024004', classId: 'class1', points: 870, parentPhone: '136****3456' },
  { id: 's5', name: '陈小华', studentId: '2024005', classId: 'class2', points: 1100, parentPhone: '135****7890' },
];

const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export function TeacherClassPage({ user, onBack }: TeacherClassPageProps) {
  const [classes, setClasses] = useState<Class[]>(mockClasses);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [showClassForm, setShowClassForm] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classFormData, setClassFormData] = useState({ name: '', grade: '一年级' });
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    studentId: '',
    classId: '',
    parentPhone: ''
  });

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: Class = {
      ...classFormData,
      id: Date.now().toString(),
      studentCount: 0
    };
    setClasses(prev => [...prev, newClass]);
    setShowClassForm(false);
    setClassFormData({ name: '', grade: '一年级' });
  };

  const handleDeleteClass = (id: string) => {
    if (confirm('确定要删除这个班级吗？')) {
      setClasses(prev => prev.filter(c => c.id !== id));
      setStudents(prev => prev.filter(s => s.classId !== id));
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const newStudent: Student = {
      ...studentFormData,
      id: Date.now().toString(),
      points: 0
    };
    setStudents(prev => [...prev, newStudent]);
    // 更新班级学生数
    setClasses(prev => prev.map(c => 
      c.id === studentFormData.classId 
        ? { ...c, studentCount: c.studentCount + 1 }
        : c
    ));
    setShowStudentForm(false);
    setStudentFormData({ name: '', studentId: '', classId: '', parentPhone: '' });
  };

  const handleDeleteStudent = (id: string, classId: string) => {
    if (confirm('确定要删除这个学生吗？')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setClasses(prev => prev.map(c => 
        c.id === classId 
          ? { ...c, studentCount: Math.max(0, c.studentCount - 1) }
          : c
      ));
    }
  };

  const filteredStudents = selectedClassId 
    ? students.filter(s => s.classId === selectedClassId)
    : students;

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
            <Users className="w-5 h-5 text-sky-500" />
            <h1 className="font-semibold text-gray-800">班级管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowClassForm(true)}
            className="flex-1 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            添加班级
          </button>
          <button
            onClick={() => {
              setShowStudentForm(true);
              if (!selectedClassId && classes.length > 0) {
                setStudentFormData(prev => ({ ...prev, classId: classes[0].id }));
              }
            }}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            添加学生
          </button>
        </div>

        {/* 班级列表 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">班级列表</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedClassId(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-colors ${
                !selectedClassId 
                  ? 'bg-sky-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部班级
            </button>
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-colors ${
                  selectedClassId === cls.id
                    ? 'bg-sky-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        {/* 班级卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {classes.map(cls => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{cls.name}</h4>
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{cls.studentCount} 名学生</span>
              </div>
            </div>
          ))}
        </div>

        {/* 学生列表 */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 px-1">
            学生列表 {selectedClassId && `- ${classes.find(c => c.id === selectedClassId)?.name}`}
          </h3>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>暂无学生</p>
            </div>
          ) : (
            filteredStudents.map(student => (
              <div
                key={student.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-violet-400 rounded-xl flex items-center justify-center text-white font-medium">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{student.name}</h4>
                      <p className="text-xs text-gray-400">学号: {student.studentId}</p>
                      {student.parentPhone && (
                        <p className="text-xs text-gray-400">家长: {student.parentPhone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-amber-500">{student.points}分</span>
                    <button
                      onClick={() => handleDeleteStudent(student.id, student.classId)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 添加班级弹窗 */}
        {showClassForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md mx-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">添加班级</h3>
                <button
                  onClick={() => setShowClassForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年级
                  </label>
                  <select
                    value={classFormData.grade}
                    onChange={e => setClassFormData(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    班级名称
                  </label>
                  <input
                    type="text"
                    value={classFormData.name}
                    onChange={e => setClassFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="如: (1)班"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowClassForm(false)}
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

        {/* 添加学生弹窗 */}
        {showStudentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md mx-auto p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">添加学生</h3>
                <button
                  onClick={() => setShowStudentForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学生姓名
                  </label>
                  <input
                    type="text"
                    value={studentFormData.name}
                    onChange={e => setStudentFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="请输入学生姓名"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    学号
                  </label>
                  <input
                    type="text"
                    value={studentFormData.studentId}
                    onChange={e => setStudentFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="请输入学号"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所属班级
                  </label>
                  <select
                    value={studentFormData.classId}
                    onChange={e => setStudentFormData(prev => ({ ...prev, classId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    <option value="">请选择班级</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.grade}{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    家长电话（选填）
                  </label>
                  <input
                    type="tel"
                    value={studentFormData.parentPhone}
                    onChange={e => setStudentFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="请输入家长电话"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStudentForm(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-400 transition-colors flex items-center justify-center gap-2"
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
