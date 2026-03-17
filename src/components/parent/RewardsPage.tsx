import { useState, useEffect } from 'react';
import { User, Reward } from '../../types';
import { 
  getRewardsByParent, 
  createReward, 
  updateReward, 
  deleteReward, 
  toggleRewardStatus 
} from '../../utils';
import { 
  ArrowLeft, 
  Plus, 
  Gift, 
  Star, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Edit3,
  Check,
  X,
  Sparkles
} from 'lucide-react';

interface RewardsPageProps {
  user: User;
  onBack: () => void;
}

export function RewardsPage({ user, onBack }: RewardsPageProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pointsRequired: 100,
    description: '',
  });

  useEffect(() => {
    loadRewards();
  }, [user.id]);

  const loadRewards = () => {
    const parentRewards = getRewardsByParent(user.id);
    setRewards(parentRewards);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.pointsRequired <= 0) {
      return;
    }

    if (editingReward) {
      updateReward(editingReward.id, {
        name: formData.name,
        pointsRequired: formData.pointsRequired,
        description: formData.description,
      });
    } else {
      createReward(
        formData.name,
        formData.pointsRequired,
        formData.description,
        user.id
      );
    }

    loadRewards();
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', pointsRequired: 100, description: '' });
    setShowForm(false);
    setEditingReward(null);
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      pointsRequired: reward.pointsRequired,
      description: reward.description || '',
    });
    setShowForm(true);
  };

  const handleToggleStatus = (rewardId: string) => {
    toggleRewardStatus(rewardId);
    loadRewards();
  };

  const handleDelete = (rewardId: string) => {
    if (confirm('确定要删除这个奖励吗？')) {
      deleteReward(rewardId);
      loadRewards();
    }
  };

  const activeRewards = rewards.filter(r => r.status === 'active');
  const inactiveRewards = rewards.filter(r => r.status === 'inactive');

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
            <h1 className="font-semibold text-gray-800">奖励配置</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-5">
        {/* 添加/编辑表单 */}
        {showForm ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                {editingReward ? '编辑奖励' : '添加新奖励'}
              </h3>
              <button onClick={resetForm} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  奖励名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：玩具汽车、零食券"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  所需积分 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.pointsRequired}
                    onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })}
                    placeholder="100"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                    min={1}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Star className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  描述说明
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个奖励的具体内容..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:from-violet-400 hover:to-purple-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingReward ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 text-violet-500 font-medium hover:bg-violet-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加新奖励
          </button>
        )}

        {/* 奖励统计 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-xs text-violet-600">上架中</span>
            </div>
            <div className="text-2xl font-bold text-violet-700">{activeRewards.length}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ToggleLeft className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-500">已下架</span>
            </div>
            <div className="text-2xl font-bold text-gray-600">{inactiveRewards.length}</div>
          </div>
        </div>

        {/* 奖励列表 */}
        {rewards.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">还没有奖励哦</p>
            <p className="text-sm text-gray-400 mt-1">点击上方按钮添加第一个奖励</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 上架中的奖励 */}
            {activeRewards.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 px-1">
                  上架中 ({activeRewards.length})
                </h3>
                <div className="space-y-2">
                  {activeRewards.map(reward => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      onToggle={() => handleToggleStatus(reward.id)}
                      onEdit={() => handleEdit(reward)}
                      onDelete={() => handleDelete(reward.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 已下架的奖励 */}
            {inactiveRewards.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2 px-1">
                  已下架 ({inactiveRewards.length})
                </h3>
                <div className="space-y-2">
                  {inactiveRewards.map(reward => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      onToggle={() => handleToggleStatus(reward.id)}
                      onEdit={() => handleEdit(reward)}
                      onDelete={() => handleDelete(reward.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// 奖励卡片组件
interface RewardCardProps {
  reward: Reward;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function RewardCard({ reward, onToggle, onEdit, onDelete }: RewardCardProps) {
  const isActive = reward.status === 'active';

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
      isActive 
        ? 'border-gray-100 hover:border-violet-200' 
        : 'border-gray-100 opacity-60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-800 truncate">{reward.name}</h4>
            {isActive ? (
              <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                上架
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                下架
              </span>
            )}
          </div>
          {reward.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{reward.description}</p>
          )}
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="font-medium text-amber-600">{reward.pointsRequired} 积分</span>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-xl transition-colors ${
              isActive 
                ? 'text-green-500 hover:bg-green-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={isActive ? '下架' : '上架'}
          >
            {isActive ? (
              <ToggleRight className="w-6 h-6" />
            ) : (
              <ToggleLeft className="w-6 h-6" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-xl transition-colors"
            title="编辑"
          >
            <Edit3 className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="删除"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
