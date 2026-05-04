'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { familyService, getErrorMessage } from '@/services/api';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  UserMinus,
  Calendar,
  Settings,
  Plus,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function FamilyPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newMemberEmails, setNewMemberEmails] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: user?.family?.name || '',
    billingDate: user?.family?.billingDate || 25
  });

  const [confirmDisband, setConfirmDisband] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{ email: string } | null>(null);
  const [confirmUpdateSettings, setConfirmUpdateSettings] = useState(false);

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emails = newMemberEmails.split(',').map(e => e.trim());
      await familyService.addMember({
        familyId: user.family.id,
        userEmail: emails,
        adderEmail: user.email
      });
      showToast('Đã thêm thành viên thành công!', 'success');
      setNewMemberEmails('');
      refreshUser();
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!confirmRemoveMember) return;
    setLoading(true);
    try {
      await familyService.revokeMember({
        familyId: user.family.id,
        userEmail: [confirmRemoveMember.email],
        adderEmail: user.email
      });
      showToast('Đã xóa thành viên thành công!', 'success');
      setConfirmRemoveMember(null);
      refreshUser();
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisbandFamily = async () => {
    setLoading(true);
    try {
      await familyService.delete(user.family.id, user.email);
      showToast('Đã giải tán gia đình thành công!', 'success');
      setConfirmDisband(false);
      refreshUser();
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setLoading(true);
    try {
      await familyService.update({
        familyId: user.family.id,
        name: settingsForm.name,
        billingDate: settingsForm.billingDate,
        requestEmail: user.email
      });
      showToast('Cập nhật thiết lập thành công!', 'success');
      setConfirmUpdateSettings(false);
      setIsSettingsModalOpen(false);
      refreshUser();
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.family) {
    return <CreateFamilyView />;
  }

  const isHead = user.role === 'HEAD';

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Quản lý gia đình</h1>
        <p className="mt-2 text-slate-500 font-medium">Quản lý thành viên và thiết lập ngày chốt sổ.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900">Thành viên ({user.family.members.length})</h2>
              {isHead && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs">
                  <Shield className="h-4 w-4" />
                  Bạn là Chủ hộ
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.family.members.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg",
                      member.role === 'HEAD' ? "bg-amber-500 shadow-amber-200" : "bg-indigo-500 shadow-indigo-200"
                    )}>
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{member.fullName}</p>
                      <p className="text-xs font-medium text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  {isHead && member.email !== user.email && (
                    <button 
                      onClick={() => setConfirmRemoveMember({ email: member.email })}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <UserMinus className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {isHead && (
            <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <UserPlus className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Mời thành viên</h2>
              </div>

              <form onSubmit={handleAddMembers} className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Email thành viên</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="email1@gmail.com, email2@gmail.com..." 
                      value={newMemberEmails}
                      onChange={(e) => setNewMemberEmails(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-400 font-medium">Phân tách nhiều email bằng dấu phẩy.</p>
                </div>

                <button 
                  disabled={loading || !newMemberEmails}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 font-bold text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Gửi lời mời'}
                </button>
              </form>
            </section>
          )}
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Settings className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black">Thiết lập</h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                  <p className="font-bold text-slate-300 uppercase text-xs tracking-widest">Ngày chốt sổ</p>
                </div>
                <p className="text-4xl font-black">Ngày {user.family.billingDate}</p>
                <p className="mt-2 text-xs text-slate-500 font-medium italic">Hệ thống sẽ tự động tổng hợp vào ngày này hàng tháng.</p>
              </div>

              {isHead && (
                <button 
                  onClick={() => {
                    setSettingsForm({
                      name: user.family.name,
                      billingDate: user.family.billingDate
                    });
                    setIsSettingsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 py-4 font-bold hover:bg-white/20 transition-all"
                >
                  Thay đổi thiết lập
                </button>
              )}

              <div className="pt-6 border-t border-white/10">
                <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">Thông tin gia đình</p>
                <div className="space-y-2">
                  <p className="text-lg font-black">{user.family.name}</p>
                  <p className="text-sm text-slate-400">ID: {user.family.id}</p>
                </div>
              </div>

              {isHead && (
                <button 
                  onClick={() => setConfirmDisband(true)}
                  className="w-full mt-10 flex items-center justify-center gap-2 text-rose-500 font-bold hover:bg-rose-500/10 py-3 rounded-xl transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                  Giải tán gia đình
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between text-white">
              <h2 className="text-2xl font-black">Thiết lập gia đình</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
 
            <form onSubmit={(e) => {
              e.preventDefault();
              setConfirmUpdateSettings(true);
            }} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Tên gia đình</label>
                <input 
                  required
                  type="text" 
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg"
                />
              </div>
 
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Ngày chốt sổ hàng tháng (1 - 28)</label>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((date) => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, billingDate: date })}
                      className={cn(
                        "py-2 rounded-xl font-black text-sm transition-all",
                        settingsForm.billingDate === date
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>
 
              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-all"
                >
                  Hủy
                </button>
                <button
                  disabled={loading || !settingsForm.name}
                  type="submit"
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 font-bold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Lưu thiết lập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Các Modal xác nhận */}
      <ConfirmModal
        isOpen={confirmDisband}
        onClose={() => setConfirmDisband(false)}
        onConfirm={handleDisbandFamily}
        title="Giải tán gia đình?"
        message="Hành động này sẽ xóa toàn bộ dữ liệu chi tiêu, thanh toán và lịch sử của gia đình. Bạn không thể hoàn tác!"
        confirmText="Giải tán ngay"
        isLoading={loading}
      />

      <ConfirmModal
        isOpen={!!confirmRemoveMember}
        onClose={() => setConfirmRemoveMember(null)}
        onConfirm={handleRemoveMember}
        title="Xóa thành viên?"
        message={`Bạn có chắc chắn muốn mời ${confirmRemoveMember?.email} rời khỏi gia đình?`}
        confirmText="Xóa thành viên"
        isLoading={loading}
      />

      <ConfirmModal
        isOpen={confirmUpdateSettings}
        onClose={() => setConfirmUpdateSettings(false)}
        onConfirm={handleUpdateSettings}
        title="Lưu thiết lập?"
        message="Bạn có chắc chắn muốn cập nhật tên gia đình và ngày chốt sổ mới?"
        confirmText="Lưu thay đổi"
        type="info"
        isLoading={loading}
      />
    </div>
  );
}

const CreateFamilyView = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [billingDate, setBillingDate] = useState('25');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await familyService.create({
        name,
        billingDate: parseInt(billingDate),
        creatorEmail: user.email
      });
      refreshUser();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
            <Plus className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bắt đầu gia đình mới</h1>
          <p className="mt-4 text-slate-500 font-medium text-lg">Tạo không gian chung để quản lý chi tiêu cùng mọi người.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-8">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Tên gia đình</label>
            <input 
              required
              type="text" 
              placeholder="VD: Gia đình Hạnh Phúc, Căn hộ 402..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-center text-2xl font-black placeholder:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Ngày chốt sổ hàng tháng (1 - 28)</label>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setBillingDate(date.toString())}
                  className={cn(
                    "py-3 rounded-xl font-black text-sm transition-all",
                    billingDate === date.toString()
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  {date}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 font-medium italic">Vào ngày này, hệ thống sẽ tự động tổng hợp công nợ cho tất cả thành viên.</p>
          </div>

          <button 
            disabled={loading || !name}
            className="w-full flex items-center justify-center gap-3 rounded-[2rem] bg-indigo-600 py-6 text-xl font-black text-white shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Xác nhận tạo gia đình'}
          </button>
        </form>
      </div>
    </div>
  );
}
