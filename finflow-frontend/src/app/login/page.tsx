'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService, getErrorMessage } from '@/services/api';
import Link from 'next/link';
import { Mail, Lock, Loader2, Receipt, ShieldCheck, CalendarClock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { useToast } from '@/contexts/ToastContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      await login(response.data.token, response.data.email);
      showToast('Đăng nhập thành công!', 'success');
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
      {/* Left Brand & Ledger Context Panel */}
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
              Sổ chi tiêu chung rõ ràng cho cả nhà.
            </h2>
            <p className="text-sm text-ink-band-muted leading-relaxed max-w-[42ch]">
              Ghi nhận từng khoản chi, chia tỷ lệ theo đúng người tham gia và chốt sổ định kỳ về một đầu mối duy nhất.
            </p>
          </div>
        </div>

        <ul className="space-y-4 border-t border-ink-band-rule pt-8">
          <li className="flex items-start gap-3">
            <Receipt className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-paper">Ghi sổ minh bạch</p>
              <p className="text-xs text-ink-band-muted mt-0.5">
                Khóa dữ liệu tự động ngay khi kỳ thanh toán được chốt.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CalendarClock className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-paper">Tất toán định kỳ</p>
              <p className="text-xs text-ink-band-muted mt-0.5">
                Tự động bù trừ công nợ theo ngày chốt sổ của gia đình.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-paper">Lưu vết đối soát</p>
              <p className="text-xs text-ink-band-muted mt-0.5">
                Biên lai chuyển khoản và lịch sử chỉnh sửa được lưu đầy đủ.
              </p>
            </div>
          </li>
        </ul>
      </aside>

      {/* Right Sign-in Form */}
      <main className="lg:col-span-7 flex flex-col items-center justify-center p-6 sm:p-10 ff-paper-grain">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-8 lg:hidden">
            <Logo className="h-10 max-w-[150px]" />
          </div>

          <div className="ff-surface p-7 sm:p-9 shadow-card">
            <header className="mb-7">
              <h1 className="font-display text-2xl font-bold text-ink">Chào mừng trở lại</h1>
              <p className="mt-1.5 text-sm text-muted">
                Đăng nhập vào FinFlow để quản lý chi tiêu gia đình.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-input bg-error-soft border border-error/30 px-4 py-3 text-sm text-error-ink font-medium"
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-ink-2 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="ff-input pl-10"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-ink-2 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ff-input pl-10"
                    placeholder="Nhập mật khẩu của bạn"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="ff-btn-primary w-full mt-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span>Đang đăng nhập…</span>
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            <p className="mt-6 pt-5 border-t border-rule text-center text-sm text-muted">
              Chưa có tài khoản?{' '}
              <Link
                href="/register"
                className="font-semibold text-accent hover:text-accent-deep underline-offset-4 hover:underline transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
