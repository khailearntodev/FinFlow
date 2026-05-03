'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authService, getErrorMessage } from '@/services/api';
import Link from 'next/link';
import { Mail, Lock, Loader2 } from 'lucide-react';
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[3rem] bg-white shadow-2xl">
        <div className="bg-indigo-600 p-10 text-center text-white">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white p-2">
            <Logo variant="icon" className="h-full w-full" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Chào mừng trở lại</h1>
          <p className="mt-2 text-indigo-100 font-medium">Đăng nhập vào FinFlow để quản lý chi tiêu</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 ring-1 ring-red-100">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 transition-all outline-none border hover:border-slate-300"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border-slate-200 pl-10 pr-4 py-3 focus:border-indigo-500 focus:ring-indigo-500 transition-all outline-none border hover:border-slate-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Đăng nhập'}
          </button>

          <p className="mt-8 text-center text-sm text-slate-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 underline-offset-4 hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
