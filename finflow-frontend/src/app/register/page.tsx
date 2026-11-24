'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService, getErrorMessage } from '@/services/api';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Loader2, Users, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { useToast } from '@/contexts/ToastContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      const msg = 'Mật khẩu xác nhận không khớp.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authService.register(registerData);
      await login(response.data.token, response.data.email);
      showToast('Đăng ký tài khoản thành công!', 'success');
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-paper text-ink grid grid-cols-1 lg:grid-cols-12">
      {/* Left Brand Context Panel */}
      <aside className="hidden lg:flex lg:col-span-5 bg-ink-band text-paper flex-col justify-between p-12 border-r border-ink-band-rule">
        <div>
          <div className="inline-flex items-center gap-3">
            <Logo variant="icon" className="h-11 w-11 border-ink-band-rule" />
            <span className="font-display text-xl font-bold tracking-tight text-paper">
              FinFlow
            </span>
          </div>

          <div className="mt-16 space-y-5">
            <h2 className="font-display text-3xl font-bold text-paper leading-tight max-w-[18ch]">
              Thiết lập sổ tài chính gia đình trong vài phút.
            </h2>
            <p className="text-sm text-ink-band-muted leading-relaxed max-w-[42ch]">
              Tạo tài khoản cá nhân để bắt đầu nhóm gia đình mới hoặc tham gia ngay khi chủ hộ gửi lời mời qua email.
            </p>
          </div>
        </div>

        <ul className="space-y-4 border-t border-ink-band-rule pt-8">
          <li className="flex items-start gap-3">
            <Users className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-paper">Phân quyền chủ hộ và thành viên</p>
              <p className="text-xs text-ink-band-muted mt-0.5">
                Mỗi thành viên đều có thể ghi chi tiêu và theo dõi công nợ cá nhân.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-paper">Xuất báo cáo Excel theo tháng</p>
              <p className="text-xs text-ink-band-muted mt-0.5">
                Tải bảng kê chi tiêu định kỳ bất cứ lúc nào cần lưu trữ.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-paper">Duyệt biên lai rõ ràng</p>
              <p className="text-xs text-ink-band-muted mt-0.5">
                Tải ảnh chuyển khoản trực tiếp để chủ hộ xác nhận hoàn tất.
              </p>
            </div>
          </li>
        </ul>
      </aside>

      {/* Right Registration Form */}
      <main className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 ff-paper-grain">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px]"
        >
          <div className="mb-8 lg:hidden">
            <Logo className="h-10 w-[150px]" />
          </div>

          <div className="ff-surface p-7 sm:p-9 shadow-card">
            <header className="mb-6">
              <h1 className="font-display text-2xl font-bold text-ink">Tạo tài khoản</h1>
              <p className="mt-1.5 text-sm text-muted">
                Bắt đầu quản lý tài chính minh bạch cùng gia đình.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-input bg-error-soft border border-error/30 px-4 py-3 text-sm text-error-ink font-medium"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="reg-fullname" className="block text-sm font-medium text-ink-2 mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="ff-input pl-10"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="ff-input pl-10"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="reg-phone"
                      name="phoneNumber"
                      type="tel"
                      required
                      autoComplete="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="ff-input pl-10"
                      placeholder="0987654321"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="reg-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="ff-input pl-10"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="block text-sm font-medium text-ink-2 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="reg-confirm"
                      name="confirmPassword"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="ff-input pl-10"
                      placeholder="Nhập lại mật khẩu"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="ff-btn-primary w-full mt-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span>Đang tạo tài khoản…</span>
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </form>

            <p className="mt-6 pt-5 border-t border-rule text-center text-sm text-muted">
              Đã có tài khoản?{' '}
              <Link
                href="/login"
                className="font-semibold text-accent hover:text-accent-deep underline-offset-4 hover:underline transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
