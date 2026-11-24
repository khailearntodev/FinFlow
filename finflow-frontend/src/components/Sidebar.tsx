'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  Users,
  CreditCard,
  LogOut,
  History,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useState } from 'react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Chi tiêu', icon: Receipt, href: '/expenses' },
    { name: 'Gia đình', icon: Users, href: '/family' },
    { name: 'Thanh toán', icon: CreditCard, href: '/settlement' },
    { name: 'Lịch sử', icon: History, href: '/audit' },
  ];

  const roleLabel = user?.role === 'HEAD' ? 'Chủ hộ' : 'Thành viên';

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-[310] h-16 bg-surface border-b border-rule px-4 flex items-center justify-between">
        <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center">
          <Logo className="h-9 max-w-[132px]" />
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          aria-expanded={isOpen}
          className="flex h-11 w-11 items-center justify-center rounded-input border border-rule bg-paper text-ink hover:bg-paper-2 transition-colors"
        >
          {isOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Scrim */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-ink/45 z-[290] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed left-0 top-0 h-dvh w-64 bg-paper-2 border-r border-rule flex flex-col z-[300] transition-transform duration-200 ease-out motion-reduce:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="px-6 py-6 border-b border-rule">
          <Link href="/dashboard" className="block" onClick={() => setIsOpen(false)}>
            <Logo />
          </Link>
          {user?.family?.name && (
            <p className="mt-2.5 text-xs font-medium text-muted truncate">
              {user.family.name}
            </p>
          )}
        </div>

        <nav aria-label="Điều hướng chính" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-input text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-accent-ink'
                    : 'text-ink-2 hover:bg-paper-3/70 hover:text-ink'
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                    className="absolute inset-0 rounded-input bg-accent"
                    aria-hidden="true"
                  />
                )}
                <item.icon
                  className={cn(
                    'relative z-10 h-[18px] w-[18px] shrink-0',
                    isActive ? 'text-accent-ink' : 'text-muted'
                  )}
                  aria-hidden="true"
                />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-rule space-y-1.5">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-input border transition-colors',
              pathname === '/profile'
                ? 'bg-surface border-accent text-ink'
                : 'bg-surface/80 border-rule hover:bg-surface hover:border-rule-strong'
            )}
          >
            <div className="h-9 w-9 shrink-0 rounded-input bg-accent-soft text-accent font-display font-bold text-sm flex items-center justify-center">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">
                {user?.fullName || 'Người dùng'}
              </p>
              <p className="text-xs text-muted truncate">{roleLabel}</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex w-full items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-input text-sm font-medium text-error-ink hover:bg-error-soft whitespace-nowrap transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Đăng xuất khỏi FinFlow"
        message="Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại?"
        type="warning"
        confirmText="Đăng xuất"
      />
    </>
  );
};
