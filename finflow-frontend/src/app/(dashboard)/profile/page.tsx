'use client';

import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const infoItems = [
    { label: 'Họ và tên', value: user.fullName, icon: User },
    { label: 'Email liên hệ', value: user.email, icon: Mail },
    { label: 'Vai trò', value: user.role === 'HEAD' ? 'Chủ hộ (Admin)' : 'Thành viên', icon: Shield, color: user.role === 'HEAD' ? 'text-indigo-600' : 'text-slate-600' },
    { label: 'Gia đình', value: user.family?.name || 'Chưa tham gia', icon: Users },
    { label: 'Ngày tham gia', value: new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN'), icon: Calendar },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thông tin cá nhân</h1>
        <p className="mt-2 text-slate-500 font-medium">Xem và quản lý thông tin tài khoản của bạn.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-1">
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 text-center">
            <div className="mx-auto h-32 w-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-200 mb-6">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-2xl font-black text-slate-900">{user.fullName}</h2>
            <p className="text-slate-500 font-medium mt-1 break-all">{user.email}</p>
            
            <div className={cn(
              "mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest",
              user.role === 'HEAD' ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-500"
            )}>
              <Shield className="h-4 w-4" />
              {user.role}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <User className="h-6 w-6 text-indigo-600" />
              Chi tiết tài khoản
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-center gap-6 p-6 rounded-3xl bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className={cn("text-lg font-bold text-slate-900 break-all", item.color)}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50">
              <p className="text-sm text-slate-400 italic font-medium text-center">
                * Mọi thay đổi thông tin vui lòng liên hệ Quản trị viên hệ thống.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
