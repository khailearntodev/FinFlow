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
  Settings,
  Menu,
  X
} from 'lucide-react';
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

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-white rounded-2xl shadow-xl shadow-indigo-100 border border-slate-100 text-indigo-600 transition-all active:scale-90"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-500 z-50",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-8">
          <Link href="/dashboard" className="block" onClick={() => setIsOpen(false)}>
            <Logo />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group",
                pathname === item.href
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link 
            href="/profile" 
            onClick={() => setIsOpen(false)}
            className="block mb-4 px-4 py-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-900 truncate">{user?.fullName || 'Người dùng'}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tight">{user?.role}</p>
              </div>
            </div>
          </Link>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="flex w-full items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all group"
          >
            <LogOut className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
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
    </>
  );
};
