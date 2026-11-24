'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage, userService } from '@/services/api';
import {
  User,
  Mail,
  Shield,
  Users,
  Calendar,
  Landmark,
  Lock,
  Loader2,
  Phone,
  ChevronDown,
  Save,
  QrCode,
  Download,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { buildVietQrImageUrl } from '@/lib/vietqr';

const VIETNAM_BANKS = [
  { code: 'MB', name: 'MB Bank (Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'OCB', name: 'OCB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'VBA', name: 'Agribank' },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
    bankCode: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [debouncedBank, setDebouncedBank] = useState({
    bankCode: '',
    bankAccountNumber: '',
    bankAccountName: '',
  });

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      fullName: user.fullName || '',
      phoneNumber: user.phoneNumber || '',
      bankCode: user.bankCode || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankAccountName: user.bankAccountName || '',
    });
    setDebouncedBank({
      bankCode: user.bankCode || '',
      bankAccountNumber: user.bankAccountNumber || '',
      bankAccountName: user.bankAccountName || '',
    });
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedBank({
        bankCode: profileForm.bankCode,
        bankAccountNumber: profileForm.bankAccountNumber,
        bankAccountName: profileForm.bankAccountName,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [profileForm.bankCode, profileForm.bankAccountNumber, profileForm.bankAccountName]);

  if (!user) return null;

  const isHead = user.role === 'HEAD';

  const qrSvgUrl = buildVietQrImageUrl({
    bankCode: debouncedBank.bankCode,
    accountNumber: debouncedBank.bankAccountNumber,
    accountName: debouncedBank.bankAccountName,
    format: 'svg',
  });

  const qrPngUrl = buildVietQrImageUrl({
    bankCode: debouncedBank.bankCode,
    accountNumber: debouncedBank.bankAccountNumber,
    accountName: debouncedBank.bankAccountName,
    format: 'png',
  });

  const hasUnsavedBankChanges =
    (profileForm.bankCode || '').trim() !== (user.bankCode || '').trim() ||
    (profileForm.bankAccountNumber || '').trim() !== (user.bankAccountNumber || '').trim() ||
    (profileForm.bankAccountName || '').trim() !== (user.bankAccountName || '').trim();

  const handleDownloadQr = async () => {
    if (!qrPngUrl) return;
    setDownloadingQr(true);
    try {
      const response = await fetch(qrPngUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanBank = debouncedBank.bankCode.trim().toUpperCase();
      const cleanAcc = debouncedBank.bankAccountNumber.trim().replace(/\s+/g, '');
      link.href = objectUrl;
      link.download = `FinFlow_VietQR_${cleanBank}_${cleanAcc}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      showToast('Đã tải ảnh mã VietQR (PNG)!', 'success');
    } catch {
      window.open(qrPngUrl, '_blank', 'noopener,noreferrer');
      showToast('Đã mở ảnh mã QR trong tab mới để bạn lưu về máy.', 'info');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userService.updateProfile({
        email: user.email,
        fullName: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
        bankCode: profileForm.bankCode,
        bankAccountNumber: profileForm.bankAccountNumber,
        bankAccountName: profileForm.bankAccountName,
      });
      await refreshUser();
      showToast('Đã cập nhật thông tin cá nhân và tài khoản ngân hàng!', 'success');
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.changePassword({
        email: user.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showToast('Đổi mật khẩu thành công!', 'success');
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Thông tin cá nhân
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cập nhật hồ sơ, tài khoản ngân hàng nhận VietQR và bảo mật mật khẩu của bạn.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Summary + Personal VietQR */}
        <div className="lg:col-span-4 space-y-6">
          <aside className="ff-surface shadow-card p-6 space-y-5">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 rounded-pill bg-accent text-accent-ink font-display text-3xl font-bold flex items-center justify-center mb-4">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-display text-xl font-bold text-ink">
                {user.fullName}
              </h2>
              <p className="text-sm text-muted mt-1 break-all">{user.email}</p>

              <div className="mt-4 flex justify-center">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold',
                    isHead
                      ? 'bg-accent-soft text-accent'
                      : 'bg-paper-2 text-ink-2'
                  )}
                >
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isHead ? 'Chủ hộ' : 'Thành viên'}</span>
                </span>
              </div>
            </div>

            <dl className="pt-5 border-t border-rule space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Gia đình</span>
                </dt>
                <dd className="font-semibold text-ink truncate">
                  {user.family?.name || 'Chưa tham gia'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>Ngày tham gia</span>
                </dt>
                <dd className="font-outlier text-xs font-medium text-ink num">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-2 text-muted">
                  <Landmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>VietQR</span>
                </dt>
                <dd
                  className={cn(
                    'text-xs font-semibold',
                    user.bankCode && user.bankAccountNumber
                      ? 'text-success-ink'
                      : 'text-muted'
                  )}
                >
                  {user.bankCode && user.bankAccountNumber
                    ? `${user.bankCode} (${user.bankAccountNumber})`
                    : 'Chưa thiết lập'}
                </dd>
              </div>
            </dl>
          </aside>

          {/* Personal VietQR Preview & Download Card */}
          <section className="ff-surface shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-rule bg-paper-2/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <QrCode className="h-4 w-4 text-accent shrink-0" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-ink truncate">
                  Mã VietQR cá nhân
                </h3>
              </div>
              {hasUnsavedBankChanges && qrSvgUrl && (
                <span className="shrink-0 rounded-pill bg-warn-soft px-2.5 py-0.5 text-xs font-semibold text-warn-ink">
                  Chưa lưu
                </span>
              )}
            </div>

            <div className="p-6 space-y-4">
              {qrSvgUrl ? (
                <>
                  <div className="flex justify-center bg-paper p-3 rounded-input">
                    <img
                      src={qrSvgUrl}
                      alt="Mã VietQR cá nhân"
                      className="w-56 h-auto max-w-full rounded-input"
                    />
                  </div>

                  <p className="text-xs text-muted text-center">
                    Quét thử bằng ứng dụng ngân hàng để kiểm tra đúng tài khoản nhận tiền.
                  </p>

                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    disabled={downloadingQr || !qrPngUrl}
                    className="ff-btn-secondary w-full"
                  >
                    {downloadingQr ? (
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{downloadingQr ? 'Đang tải…' : 'Tải ảnh QR (PNG)'}</span>
                  </button>
                </>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-pill bg-paper-2 text-muted">
                    <QrCode className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-ink">Chưa có mã VietQR</p>
                  <p className="text-xs text-muted">
                    Chọn ngân hàng và nhập số tài khoản ở khung bên cạnh để xem trước và tải mã QR của bạn.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile & Bank Account Form */}
          <section className="ff-surface shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-rule bg-paper-2/60 flex items-center gap-2.5">
              <User className="h-4 w-4 text-accent" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-ink">
                Hồ sơ & Tài khoản ngân hàng (VietQR)
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="profile-fullname" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Họ và tên
                  </label>
                  <input
                    id="profile-fullname"
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, fullName: e.target.value })
                    }
                    className="ff-input"
                  />
                </div>

                <div>
                  <label htmlFor="profile-phone" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="profile-phone"
                      type="tel"
                      required
                      value={profileForm.phoneNumber}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phoneNumber: e.target.value })
                      }
                      className="ff-input pl-10 font-outlier num"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="profile-email" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Email đăng nhập
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="profile-email"
                      type="email"
                      disabled
                      value={user.email}
                      className="ff-input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-rule space-y-4">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    Thông tin nhận chuyển khoản VietQR
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Dùng để tự động tạo mã QR khi chốt sổ tháng (cho Chủ hộ thu quỹ hoặc thành viên nhận tiền hoàn).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="profile-bank-code" className="block text-sm font-medium text-ink-2 mb-1.5">
                      Ngân hàng
                    </label>
                    <div className="relative">
                      <select
                        id="profile-bank-code"
                        value={profileForm.bankCode}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, bankCode: e.target.value })
                        }
                        className="ff-input appearance-none pr-10"
                      >
                        <option value="">Chọn ngân hàng…</option>
                        {VIETNAM_BANKS.map((bank) => (
                          <option key={bank.code} value={bank.code}>
                            {bank.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-bank-acc" className="block text-sm font-medium text-ink-2 mb-1.5">
                      Số tài khoản
                    </label>
                    <input
                      id="profile-bank-acc"
                      type="text"
                      placeholder="VD: 0123456789"
                      value={profileForm.bankAccountNumber}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          bankAccountNumber: e.target.value,
                        })
                      }
                      className="ff-input font-outlier num"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="profile-bank-name" className="block text-sm font-medium text-ink-2 mb-1.5">
                      Tên chủ tài khoản (không dấu)
                    </label>
                    <input
                      id="profile-bank-name"
                      type="text"
                      placeholder="VD: NGUYEN VAN A"
                      value={profileForm.bankAccountName}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          bankAccountName: e.target.value,
                        })
                      }
                      className="ff-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingProfile} className="ff-btn-primary">
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      <span>Đang lưu…</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          {/* Change Password Form */}
          <section className="ff-surface shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-rule bg-paper-2/60 flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-accent" aria-hidden="true" />
              <h3 className="font-display text-base font-bold text-ink">
                Đổi mật khẩu
              </h3>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label htmlFor="pwd-current" className="block text-sm font-medium text-ink-2 mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <input
                  id="pwd-current"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="ff-input"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pwd-new" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Mật khẩu mới
                  </label>
                  <input
                    id="pwd-new"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="ff-input"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div>
                  <label htmlFor="pwd-confirm" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    id="pwd-confirm"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="ff-input"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={savingPassword} className="ff-btn-secondary">
                  {savingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      <span>Đang cập nhật…</span>
                    </>
                  ) : (
                    'Cập nhật mật khẩu'
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
