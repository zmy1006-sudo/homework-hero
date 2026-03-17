import { useState, useEffect } from 'react';
import { User, ExchangeRecord, ExchangeStatus } from '../../types';
import { 
  getExchangeRecords, 
  reviewExchangeRecord,
  getUserPoints 
} from '../../utils';
import { 
  ArrowLeft, 
  Gift, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Star,
  User as UserIcon
} from 'lucide-react';

interface ExchangeRecordsPageProps {
  user: User;
  onBack: () => void;
}

export function ExchangeRecordsPage({ user, onBack }: ExchangeRecordsPageProps) {
  const [records, setRecords] = useState<ExchangeRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<ExchangeStatus | 'all'>('all');
  const [selectedRecord, setSelectedRecord] = useState<ExchangeRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = getExchangeRecords();
    // 家长可以看到所有孩子的兑换记录
    setRecords(allRecords.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleApprove = (recordId: string) => {
    // 获取孩子的积分
    const childPoints = getUserPoints(recordId);
    
    // 这里简化处理：直接通过
    reviewExchangeRecord(recordId, true, user.id);
    loadRecords();
    setSelectedRecord(null);
  };

  const handleReject = () => {
    if (!selectedRecord) return;
    reviewExchangeRecord(selectedRecord.id, false, user.id, rejectReason);
    loadRecords();
    setShowRejectModal(false);
    setSelectedRecord(null);
    setRejectReason('');
  };

  const openRejectModal = (record: ExchangeRecord) => {
    setSelectedRecord(record);
    setShowRejectModal(true);
  };

  const filteredRecords = statusFilter === 'all' 
    ? records 
    : records.filter(r => r.status === statusFilter);

  const pendingRecords = records.filter(r => r.status === 'pending');
  const approvedRecords = records.filter(r => r.status === 'approved');
  const rejectedRecords = records.filter(r => r.status === 'rejected');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: ExchangeStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
            <AlertCircle className="w-3 h-3" />
            待审核
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <XCircle className="w-3 h-3" />
            已拒绝
          </span>
        );
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
            <Gift className="w-6 h-6 text-violet-500" />
            <h1 className="font-semibold text-gray-800">兑换记录</h1>
          </div>
          {pendingRecords.length > 0 && (
            <span className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {pendingRecords.length}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl transition-all ${
              statusFilter === 'all'
                ? 'bg-violet-100 border-2 border-violet-300'
                : 'bg-white border border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="text-2xl font-bold text-gray-800">{records.length}</div>
            <div className="text-xs text-gray-500">全部</div>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-2xl transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-100 border-2 border-amber-300'
                : 'bg-white border border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="text-2xl font-bold text-amber-600">{pendingRecords.length}</div>
            <div className="text-xs text-gray-500">待审核</div>
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-2xl transition-all ${
              statusFilter === 'approved'
                ? 'bg-green-100 border-2 border-green-300'
                : 'bg-white border border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="text-2xl font-bold text-green-600">{approvedRecords.length}</div>
            <div className="text-xs text-gray-500">已通过</div>
          </button>
        </div>

        {/* 筛选标签 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? 'bg-violet-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status === 'all' && '全部'}
              {status === 'pending' && '待审核'}
              {status === 'approved' && '已通过'}
              {status === 'rejected' && '已拒绝'}
            </button>
          ))}
        </div>

        {/* 记录列表 */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {statusFilter === 'all' ? '还没有兑换记录' : '暂无此类记录'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map(record => (
              <div
                key={record.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Gift className="w-5 h-5 text-violet-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{record.rewardName}</h4>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <UserIcon className="w-3 h-3" />
                        {record.userName}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-amber-600">
                    <Star className="w-4 h-4 fill-amber-600" />
                    <span className="font-medium">{record.pointsSpent} 积分</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                </div>

                {/* 审核操作按钮 */}
                {record.status === 'pending' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleApprove(record.id)}
                      className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      通过
                    </button>
                    <button
                      onClick={() => openRejectModal(record)}
                      className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-400 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝
                    </button>
                  </div>
                )}

                {/* 拒绝原因 */}
                {record.status === 'rejected' && record.rejectReason && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">拒绝原因：</p>
                    <p className="text-sm text-red-600">{record.rejectReason}</p>
                  </div>
                )}

                {/* 审核时间 */}
                {record.reviewedAt && (
                  <div className="mt-2 text-xs text-gray-400">
                    审核时间：{formatDate(record.reviewedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 拒绝弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-semibold text-gray-800 mb-4">拒绝兑换</h3>
            <p className="text-sm text-gray-500 mb-4">
              请输入拒绝原因（选填）：
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="例如：积分不足、奖励已兑完..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              rows={3}
              maxLength={200}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRecord(null);
                  setRejectReason('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-400 transition-colors"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
