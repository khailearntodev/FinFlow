'use client';

import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import {
  TrendingUp,
  Wallet,
  Plus,
  ArrowRight,
  Clock,
  Receipt,
  Users,
  CreditCard,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { expenseService, settlementService } from '@/services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [myBills, setMyBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.family?.id) {
        setLoading(false);
        return;
      }
      try {
        const [expRes, billRes] = await Promise.all([
          expenseService.getAll(user.family.id),
          settlementService.getMyBills(user.id)
        ]);
        setExpenses(expRes.data);
        setMyBills(billRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const currentMonthExpenses = expenses.filter(e => e.expenseDate.startsWith(currentMonth));
  const totalMonthlySpend = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const myTotalPaid = currentMonthExpenses
    .filter(e => e.paidByEmail === user?.email)
    .reduce((sum, e) => sum + e.amount, 0);

  // Stats calculation
  const stats = [
    { name: 'Tổng chi tiêu tháng', value: totalMonthlySpend, icon: Wallet, color: 'bg-blue-500', shadow: 'shadow-blue-200' },
    { name: 'Đã ứng trước', value: myTotalPaid, icon: TrendingUp, color: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
    { name: 'Số thành viên', value: user?.family?.members?.length || 0, icon: Users, color: 'bg-indigo-500', shadow: 'shadow-indigo-200' },
  ];

  const recentExpenses = expenses
    .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
    .slice(0, 5);

  const pendingSettlement = myBills.find(b => b.status === 'PENDING' || b.status === 'WAITING_FOR_CONFIRMATION');

  if (!user?.family) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 h-24 w-24 rounded-3xl bg-indigo-100 flex items-center justify-center text-indigo-600">
          <Users className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Chào mừng {user?.fullName}!</h1>
        <p className="mt-4 text-slate-600 max-w-md">
          Bạn chưa tham gia gia đình nào. Hãy tạo mới hoặc yêu cầu chủ hộ thêm bạn vào gia đình để bắt đầu.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/family" className="rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
            Tạo gia đình mới
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Chào mừng, {user.fullName.split(' ').pop()}!</h1>
          <p className="mt-2 text-slate-500 font-medium">Hôm nay là một ngày tuyệt vời để quản lý tài chính.</p>
        </div>
        <Link
          href="/expenses?action=create"
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus className="h-5 w-5" />
          Thêm chi tiêu
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
            <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150", stat.color)}></div>
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {stat.name === 'Số thành viên' ? stat.value : formatCurrency(stat.value)}
                </p>
              </div>
              <div className={cn("rounded-2xl p-3 text-white shadow-lg", stat.color, stat.shadow)}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900">Chi tiêu gần đây</h2>
            <Link href="/expenses" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              Xem tất cả
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentExpenses.length === 0 ? (
              <p className="py-10 text-center text-slate-400 font-medium italic">Chưa có chi tiêu nào gần đây.</p>
            ) : recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{expense.title}</p>
                    <p className="text-xs font-medium text-slate-500">{expense.expenseDate} • Bởi {expense.paidByEmail === user.email ? 'Bạn' : expense.paidByEmail.split('@')[0]}</p>
                  </div>
                </div>
                <p className="text-lg font-black text-slate-900">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 rounded-3xl p-8 shadow-2xl text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <CreditCard className="h-32 w-32 rotate-12" />
          </div>

          <h2 className="text-2xl font-black mb-2">Trạng thái chốt sổ</h2>
          <p className="text-slate-400 font-medium mb-8">
            {pendingSettlement ? `Kỳ tháng ${pendingSettlement.month}, ${pendingSettlement.year}` : 'Hiện không có kỳ chốt sổ nào cần xử lý'}
          </p>

          <div className="space-y-6 relative">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold">Đang chờ chốt sổ</p>
                <p className="text-xs text-slate-400">Ngày chốt: {user.family.billingDate} hàng tháng</p>
              </div>
            </div>

            {pendingSettlement && (
              <div className={cn(
                "p-6 rounded-2xl shadow-xl",
                pendingSettlement.amount > 0 ? "bg-rose-600" : "bg-emerald-600"
              )}>
                <p className="text-sm font-bold text-white/80 uppercase tracking-widest mb-1">
                  {pendingSettlement.amount > 0 ? 'Bạn cần đóng' : 'Bạn sẽ nhận lại'}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-black">{formatCurrency(Math.abs(pendingSettlement.amount))}</p>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-tighter backdrop-blur-md">
                    {pendingSettlement.status === 'PENDING' ? 'Chờ thanh toán' :
                      pendingSettlement.status === 'WAITING_FOR_CONFIRMATION' ? 'Đợi xác nhận' :
                        pendingSettlement.status === 'COMPLETED' ? 'Hoàn tất' : pendingSettlement.status}
                  </span>
                </div>
              </div>
            )}

            <Link
              href="/settlement"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-4 font-bold text-slate-900 transition-all hover:bg-slate-100 active:scale-95"
            >
              Chi tiết công nợ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

