'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { familyService, getErrorMessage } from '@/services/api';
import {
  UserPlus,
  Shield,
  Mail,
  Trash2,
  UserMinus,
  Calendar,
  Settings,
  Loader2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CreateFamilyForm } from '@/components/CreateFamilyForm';

export default function FamilyPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newMemberEmails, setNewMemberEmails] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: user?.family?.name || '',
    billingDate: user?.family?.billingDate || 25,
  });

  const [confirmDisband, setConfirmDisband] = useState(false);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<{
    email: string;
  } | null>(null);
  const [confirmUpdateSettings, setConfirmUpdateSettings] = useState(false);

  const handleAddMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const emails = newMemberEmails
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      await familyService.addMember({
        familyId: user.family.id,
        userEmail: emails,
        adderEmail: user.email,
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
        adderEmail: user.email,
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
        requestEmail: user.email,
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
    return <CreateFamilyForm />;
  }

  const isHead = user.role === 'HEAD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Quản lý gia đình
        </h1>
        <p className="mt-1 text-sm text-muted">
          Quản lý danh sách thành viên và chu kỳ chốt sổ hàng tháng.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-6">
          {/* Members List */}
          <section className="ff-surface shadow-card overflow-hidden">
            <div className="px-6 py-5 border-b border-rule flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink num">
                Thành viên ({user.family.members.length})
              </h2>
              {isHead && (
                <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft text-accent px-3 py-1 text-xs font-semibold">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Bạn là Chủ hộ</span>
                </span>
              )}
            </div>

            <ul className="divide-y divide-rule">
              {user.family.members.map((member: any) => (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-paper-2/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'h-10 w-10 shrink-0 rounded-input font-display font-bold text-sm flex items-center justify-center',
                        member.role === 'HEAD'
                          ? 'bg-accent text-accent-ink'
                          : 'bg-paper-2 text-ink border border-rule'
                      )}
                    >
                      {member.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">
                          {member.fullName}
                        </p>
                        {member.role === 'HEAD' && (
                          <span className="inline-flex rounded-pill bg-paper-3 text-ink-2 px-2 py-0.5 text-xs font-medium shrink-0">
                            Chủ hộ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted truncate mt-0.5">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  {isHead && member.email !== user.email && (
                    <button
                      type="button"
                      aria-label={`Xóa thành viên ${member.fullName}`}
                      onClick={() =>
                        setConfirmRemoveMember({ email: member.email })
                      }
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input text-muted hover:text-error hover:bg-error-soft transition-colors"
                    >
                      <UserMinus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* Invite Members Form (Head only) */}
          {isHead && (
            <section className="ff-surface shadow-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-input bg-accent-soft text-accent">
                  <UserPlus className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-ink">
                    Mời thành viên mới
                  </h2>
                  <p className="text-xs text-muted">
                    Thêm thành viên đã đăng ký tài khoản bằng địa chỉ email.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddMembers} className="space-y-4">
                <div>
                  <label
                    htmlFor="invite-emails"
                    className="block text-sm font-medium text-ink-2 mb-1.5"
                  >
                    Email thành viên
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="invite-emails"
                      type="text"
                      placeholder="email1@gmail.com, email2@gmail.com..."
                      value={newMemberEmails}
                      onChange={(e) => setNewMemberEmails(e.target.value)}
                      className="ff-input pl-10"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Phân tách nhiều địa chỉ email bằng dấu phẩy.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !newMemberEmails.trim()}
                  className="ff-btn-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      <span>Đang thêm…</span>
                    </>
                  ) : (
                    'Gửi lời mời'
                  )}
                </button>
              </form>
            </section>
          )}
        </div>

        {/* Right Family Settings Panel */}
        <aside className="lg:col-span-4 ff-ink-panel p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-accent-soft" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-paper">
              Thiết lập gia đình
            </h2>
          </div>

          <div className="rounded-input bg-ink-band-2 border border-ink-band-rule p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-band-muted">
              <Calendar className="h-4 w-4 text-accent-soft" aria-hidden="true" />
              <span>Ngày chốt sổ định kỳ</span>
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-paper num">
              Ngày {user.family.billingDate}
            </p>
            <p className="mt-1.5 text-xs text-ink-band-muted leading-relaxed">
              Hệ thống tự động tổng hợp công nợ vào ngày này mỗi tháng.
            </p>
          </div>

          {isHead && (
            <button
              type="button"
              onClick={() => {
                setSettingsForm({
                  name: user.family.name,
                  billingDate: user.family.billingDate,
                });
                setIsSettingsModalOpen(true);
              }}
              className="w-full min-h-[44px] rounded-input bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper-2 whitespace-nowrap transition-colors"
            >
              Thay đổi thiết lập
            </button>
          )}

          <div className="pt-5 border-t border-ink-band-rule space-y-2">
            <p className="text-xs font-medium text-ink-band-muted">
              Thông tin nhóm
            </p>
            <p className="font-display text-base font-bold text-paper">
              {user.family.name}
            </p>
            <p className="font-outlier text-xs text-ink-band-muted break-all">
              ID: {user.family.id}
            </p>
          </div>

          {isHead && (
            <div className="pt-4 border-t border-ink-band-rule">
              <button
                type="button"
                onClick={() => setConfirmDisband(true)}
                className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-input bg-error-soft/15 border border-error/40 text-error-soft hover:bg-error hover:text-accent-ink text-sm font-semibold whitespace-nowrap transition-colors"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Giải tán gia đình</span>
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[400] overflow-y-auto bg-ink/45 p-4 flex items-start md:items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="family-settings-title"
              className="w-full max-w-lg rounded-card bg-surface border border-rule shadow-lift overflow-hidden my-auto"
            >
              <div className="px-6 py-5 border-b border-rule flex items-center justify-between bg-paper-2/60">
                <h2 id="family-settings-title" className="font-display text-xl font-bold text-ink">
                  Cập nhật thiết lập gia đình
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  aria-label="Đóng hộp thoại"
                  className="flex h-9 w-9 items-center justify-center rounded-input text-muted hover:bg-paper-3 hover:text-ink transition-colors"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirmUpdateSettings(true);
                }}
                className="p-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="settings-family-name"
                    className="block text-sm font-medium text-ink-2 mb-1.5"
                  >
                    Tên gia đình
                  </label>
                  <input
                    id="settings-family-name"
                    required
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, name: e.target.value })
                    }
                    className="ff-input font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-ink-2">
                      Ngày chốt sổ hàng tháng (1 đến 28)
                    </label>
                    <span className="font-outlier text-sm font-medium text-accent num">
                      Ngày {settingsForm.billingDate}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((date) => {
                      const active = settingsForm.billingDate === date;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() =>
                            setSettingsForm({
                              ...settingsForm,
                              billingDate: date,
                            })
                          }
                          className={cn(
                            'h-10 rounded-input font-outlier text-sm font-medium num transition-colors',
                            active
                              ? 'bg-accent text-accent-ink border border-accent-deep'
                              : 'bg-paper-2 text-ink-2 border border-transparent hover:border-rule-strong hover:text-ink'
                          )}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-rule flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="ff-btn-secondary w-full sm:w-auto"
                  >
                    Hủy
                  </button>
                  <button
                    disabled={loading || !settingsForm.name.trim()}
                    type="submit"
                    className="ff-btn-primary w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        <span>Đang lưu…</span>
                      </>
                    ) : (
                      'Lưu thiết lập'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
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
    </motion.div>
  );
}
