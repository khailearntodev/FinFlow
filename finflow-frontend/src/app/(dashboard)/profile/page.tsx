'use client';

import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Users, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const isHead = user.role === 'HEAD';

  const infoItems = [
    { label: 'Họ và tên', value: user.fullName, icon: User },
    { label: 'Email liên hệ', value: user.email, icon: Mail },
    {
      label: 'Vai trò trong gia đình',
      value: isHead ? 'Chủ hộ (Quản trị)' : 'Thành viên',
      icon: Shield,
      accent: isHead,
    },
    {
      label: 'Gia đình hiện tại',
      value: user.family?.name || 'Chưa tham gia',
      icon: Users,
    },
    {
      label: 'Ngày tham gia',
      value: new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN'),
      icon: Calendar,
      isNumeric: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Thông tin cá nhân
        </h1>
        <p className="mt-1 text-sm text-muted">
          Xem thông tin tài khoản và vai trò của bạn trong hệ thống FinFlow.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <aside className="md:col-span-4 ff-surface shadow-card p-6 text-center">
          <div className="mx-auto h-20 w-20 rounded-pill bg-accent text-accent-ink font-display text-3xl font-bold flex items-center justify-center mb-4">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            {user.fullName}
          </h2>
          <p className="text-sm text-muted mt-1 break-all">{user.email}</p>

          <div className="mt-5 pt-5 border-t border-rule flex justify-center">
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
        </aside>

        <section className="md:col-span-8 ff-surface shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-rule bg-paper-2/60">
            <h3 className="font-display text-base font-bold text-ink">
              Chi tiết tài khoản
            </h3>
          </div>

          <dl className="divide-y divide-rule">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-paper-2 text-muted">
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <dt className="text-xs font-medium text-muted">
                    {item.label}
                  </dt>
                  <dd
                    className={cn(
                      'mt-0.5 text-sm sm:text-base font-semibold break-all',
                      item.accent ? 'text-accent' : 'text-ink',
                      item.isNumeric && 'font-outlier num'
                    )}
                  >
                    {item.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <div className="px-6 py-4 border-t border-rule bg-paper-2/40">
            <p className="text-xs text-muted">
              Mọi yêu cầu thay đổi thông tin tài khoản vui lòng liên hệ Quản trị viên hệ thống.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
