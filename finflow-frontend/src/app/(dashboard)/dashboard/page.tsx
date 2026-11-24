'use client';

import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Plus,
  Clock,
  Receipt,
  Users,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
          settlementService.getMyBills(user.id),
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

  const currentMonthExpenses = expenses.filter((e) =>
    e.expenseDate.startsWith(currentMonth)
  );
  const totalMonthlySpend = currentMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const myTotalPaid = currentMonthExpenses
    .filter((e) => e.paidByEmail === user?.email)
    .reduce((sum, e) => sum + e.amount, 0);

  const memberCount = user?.family?.members?.length || 0;

  const recentExpenses = [...expenses]
    .sort(
      (a, b) =>
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    )
    .slice(0, 5);

  const pendingSettlement = myBills.find(
    (b) => b.status === 'PENDING' || b.status === 'WAITING_FOR_CONFIRMATION'
  );

  if (!user?.family) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="ff-surface p-10 sm:p-14 text-center max-w-xl mx-auto mt-8"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-input bg-accent-soft text-accent">
          <Users className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Chào mừng {user?.fullName}
        </h1>
        <p className="mt-3 text-sm text-muted max-w-[42ch] mx-auto leading-relaxed">
          Bạn chưa tham gia gia đình nào. Hãy tạo nhóm mới hoặc yêu cầu chủ hộ thêm email của bạn vào gia đình để bắt đầu ghi sổ.
        </p>
        <div className="mt-7 flex justify-center">
          <Link href="/family" className="ff-btn-primary">
            Tạo gia đình mới
          </Link>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-label="Đang tải tổng quan">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-72 rounded-input bg-paper-3/50 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-11 w-36 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="ff-surface h-28 animate-pulse motion-reduce:animate-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 ff-surface h-80 animate-pulse motion-reduce:animate-none" />
          <div className="lg:col-span-5 ff-ink-panel h-80 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Xin chào, {user.fullName.split(' ').pop()}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Tổng quan sổ chi tiêu tháng {currentMonth.slice(5)}/{currentMonth.slice(0, 4)} của {user.family.name}.
          </p>
        </div>
        <Link href="/expenses?action=create" className="ff-btn-primary w-full sm:w-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Thêm chi tiêu</span>
        </Link>
      </header>

      {/* Unified Ledger Stat Band */}
      <section aria-label="Chỉ số tháng hiện tại" className="ff-surface shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
          <div className="p-6">
            <p className="text-sm font-medium text-muted">Tổng chi tiêu tháng</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink num">
              {formatCurrency(totalMonthlySpend)}
            </p>
            <p className="mt-1.5 text-xs text-muted num">
              {currentMonthExpenses.length} khoản ghi nhận trong tháng
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-medium text-muted">Bạn đã ứng trước</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-accent num">
              {formatCurrency(myTotalPaid)}
            </p>
            <p className="mt-1.5 text-xs text-muted">
              Tính trên các khoản bạn trực tiếp chi trả
            </p>
          </div>

          <div className="p-6">
            <p className="text-sm font-medium text-muted">Thành viên gia đình</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-ink num">
              {memberCount} người
            </p>
            <p className="mt-1.5 text-xs text-muted num">
              Chốt sổ tự động ngày {user.family.billingDate} hàng tháng
            </p>
          </div>
        </div>
      </section>

      {/* Main Split: Recent Ledger + Settlement Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 ff-surface shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-rule">
            <h2 className="font-display text-lg font-bold text-ink">Chi tiêu gần đây</h2>
            <Link
              href="/expenses"
              className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-accent-deep underline-offset-4 hover:underline whitespace-nowrap transition-colors"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <Receipt className="h-8 w-8 text-muted mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-ink-2">Chưa có khoản chi nào gần đây</p>
              <p className="mt-1 text-xs text-muted">
                Nhấn &ldquo;Thêm chi tiêu&rdquo; để bắt đầu ghi nhận khoản đầu tiên.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-rule">
              {recentExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-paper-2/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {expense.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                      <span className="font-outlier num">{expense.expenseDate}</span>
                      <span>
                        Người chi:{' '}
                        <strong className="font-medium text-ink-2">
                          {expense.paidByEmail === user.email
                            ? 'Bạn'
                            : expense.paidByEmail.split('@')[0]}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <p className="font-display text-base font-bold text-ink num shrink-0">
                    {formatCurrency(expense.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-5 ff-ink-panel p-6 sm:p-7 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-paper">
                Trạng thái chốt sổ
              </h2>
              <p className="mt-1 text-sm text-ink-band-muted">
                {pendingSettlement
                  ? `Kỳ tháng ${pendingSettlement.month}/${pendingSettlement.year}`
                  : 'Hiện không có kỳ chốt sổ nào cần xử lý'}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
          </div>

          {!pendingSettlement ? (
            <div className="rounded-input bg-ink-band-2 border border-ink-band-rule p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-accent-soft shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-paper">Đang chờ đến kỳ chốt sổ</p>
                <p className="mt-1 text-xs text-ink-band-muted num">
                  Ngày chốt định kỳ: ngày {user.family.billingDate} hàng tháng
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-input bg-ink-band-2 border border-ink-band-rule p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-ink-band-muted">
                    {pendingSettlement.amount > 0 ? 'Bạn cần đóng về quỹ' : 'Bạn sẽ nhận lại'}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium',
                      pendingSettlement.status === 'PENDING'
                        ? 'bg-warning-soft text-warning-ink'
                        : pendingSettlement.status === 'WAITING_FOR_CONFIRMATION'
                          ? 'bg-info-soft text-info-ink'
                          : 'bg-success-soft text-success-ink'
                    )}
                  >
                    {pendingSettlement.status === 'PENDING'
                      ? 'Chờ thanh toán'
                      : pendingSettlement.status === 'WAITING_FOR_CONFIRMATION'
                        ? 'Đợi xác nhận'
                        : pendingSettlement.status === 'COMPLETED'
                          ? 'Hoàn tất'
                          : pendingSettlement.status}
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl font-bold text-paper num">
                  {formatCurrency(Math.abs(pendingSettlement.amount))}
                </p>
              </div>
            </div>
          )}

          <Link
            href="/settlement"
            className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-input bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper-2 whitespace-nowrap transition-colors"
          >
            <span>Chi tiết công nợ</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </motion.div>
  );
}
