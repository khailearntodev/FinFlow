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
  TrendingUp,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';

import { ConfirmModal } from '@/components/ConfirmModal';
import { useState } from 'react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const menuItems = [
    { name: 'Tổng quan', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Chi tiêu', icon: Receipt, href: '/expenses' },
    { name: 'Gia đình', icon: Users, href: '/family' },
    { name: 'Thanh toán', icon: CreditCard, href: '/settlement' },
    { name: 'Lịch sử', icon: History, href: '/audit' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col transition-all duration-300 z-50">
      <div className="p-8">
        <Link href="/dashboard" className="block">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 group",
              pathname === item.href 
                ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
              pathname === item.href ? "text-indigo-600" : "text-slate-400"
            )} />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <Link href="/profile" className="block mb-4 px-4 py-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.fullName || 'Người dùng'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </Link>
        
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="flex w-full items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all group"
        >
          <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-1" />
          Đăng xuất
        </button>
      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống FinFlow?"
        type="warning"
        confirmText="Đăng xuất"
      />
    </aside>
  );
};
