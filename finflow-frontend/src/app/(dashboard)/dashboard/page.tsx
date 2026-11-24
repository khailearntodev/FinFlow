'use client';

import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/categories';
import {
  Plus,
  Clock,
  Receipt,
  Users,
  Calendar,
  ArrowUpRight,
  BarChart3,
  PieChart,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { expenseService, settlementService } from '@/services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [myBills, setMyBills] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.family?.id) {
        setLoading(false);
        return;
      }
      try {
        const [expRes, billRes, analyticsRes] = await Promise.all([
          expenseService.getAll(user.family.id),
          settlementService.getMyBills(user.id),
          expenseService.getAnalytics(user.family.id, 6).catch(() => ({ data: null })),
        ]);
        setExpenses(expRes.data);
        setMyBills(billRes.data);
        setAnalytics(analyticsRes.data);
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

  const trendPoints = analytics?.monthlyTrend || [];
  const maxTrendAmount = Math.max(
    ...trendPoints.map((p: any) => Number(p.totalAmount || 0)),
    1
  );
  const activeTrendMonths = trendPoints.filter((p: any) => Number(p.totalAmount || 0) > 0);
  const avgMonthlySpend =
    activeTrendMonths.length > 0
      ? Math.round(
          activeTrendMonths.reduce((sum: number, p: any) => sum + Number(p.totalAmount || 0), 0) /
            activeTrendMonths.length
        )
      : 0;
  const categorySlices = analytics?.categoryBreakdown || [];

  const activePoint = hoveredMonth
    ? trendPoints.find((p: any) => `${p.year}-${p.month}` === hoveredMonth)
    : null;

  if (!user?.family) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
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
      <div className="space-y-6" aria-busy="true" aria-label="Đang tải tổng quan">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-52 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
            <div className="h-4 w-72 rounded-input bg-paper-3/50 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="h-11 w-36 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="ff-surface h-24 animate-pulse motion-reduce:animate-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 ff-surface h-72 animate-pulse motion-reduce:animate-none" />
          <div className="lg:col-span-4 ff-ink-panel h-72 animate-pulse motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="space-y-6"
    >
      {/* Compact Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Xin chào, {user.fullName.split(' ').pop()}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sổ chi tiêu tháng {currentMonth.slice(5)}/{currentMonth.slice(0, 4)} của {user.family.name}.
          </p>
        </div>
        <Link href="/expenses?action=create" className="ff-btn-primary w-full sm:w-auto">
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Thêm chi tiêu</span>
        </Link>
      </header>

      {/* Row 1: Compact Unified Ledger Stat Strip + Optional Budget Bar */}
      <section aria-label="Chỉ số tháng hiện tại" className="ff-surface shadow-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
          <div className="px-5 py-4">
            <p className="text-xs font-medium text-muted">Tổng chi tiêu tháng</p>
            <p className="mt-1.5 font-display text-2xl font-bold text-ink num">
              {formatCurrency(totalMonthlySpend)}
            </p>
            <p className="mt-1 text-xs text-muted num">
              {currentMonthExpenses.length} khoản ghi nhận trong tháng
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-medium text-muted">Bạn đã ứng trước</p>
            <p className="mt-1.5 font-display text-2xl font-bold text-accent num">
              {formatCurrency(myTotalPaid)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Tính trên các khoản bạn trực tiếp chi trả
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-xs font-medium text-muted">Thành viên gia đình</p>
            <p className="mt-1.5 font-display text-2xl font-bold text-ink num">
              {memberCount} người
            </p>
            <p className="mt-1 text-xs text-muted num">
              Chốt sổ tự động ngày {user.family.billingDate} hàng tháng
            </p>
          </div>
        </div>

        {analytics?.monthlyBudget && analytics.budgetStatus !== 'NONE' && (
          <div className="px-5 py-3.5 border-t border-rule bg-paper-2/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {analytics.budgetStatus !== 'SAFE' && (
                  <AlertTriangle
                    className={cn(
                      'h-4 w-4 shrink-0',
                      analytics.budgetStatus === 'EXCEEDED' ? 'text-error' : 'text-warning'
                    )}
                    aria-hidden="true"
                  />
                )}
                <span className="font-semibold text-ink num">
                  Ngân sách tháng: {formatCurrency(Number(analytics.monthlyBudget))}
                </span>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold num',
                  analytics.budgetStatus === 'EXCEEDED'
                    ? 'bg-error-soft text-error-ink'
                    : analytics.budgetStatus === 'WARNING'
                      ? 'bg-warning-soft text-warning-ink'
                      : 'bg-success-soft text-success-ink'
                )}
              >
                Đã dùng {analytics.budgetUsagePercent}%
                {analytics.budgetStatus === 'EXCEEDED'
                  ? ' (Vượt ngân sách)'
                  : analytics.budgetStatus === 'WARNING'
                    ? ' (Sắp chạm hạn mức)'
                    : ''}
              </span>
            </div>

            <div className="h-2 w-full rounded-pill bg-paper-3 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-pill transition-transform duration-300 origin-left',
                  analytics.budgetStatus === 'EXCEEDED'
                    ? 'bg-error'
                    : analytics.budgetStatus === 'WARNING'
                      ? 'bg-warning'
                      : 'bg-accent'
                )}
                style={{
                  transform: `scaleX(${Math.min(Number(analytics.budgetUsagePercent || 0) / 100, 1)})`,
                }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Row 2 (ABOVE THE FOLD): 6-Month Spending Trend + Settlement Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-8 ff-surface shadow-card p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-ink">
                  Xu hướng chi tiêu 6 tháng
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted num">
                {activePoint
                  ? `Tháng ${activePoint.month}/${activePoint.year}: ${formatCurrency(Number(activePoint.totalAmount || 0))}`
                  : avgMonthlySpend > 0
                    ? `Trung bình các tháng có chi tiêu: ${formatCurrency(avgMonthlySpend)}/tháng`
                    : 'So sánh tổng chi tiêu chung theo từng tháng'}
              </p>
            </div>
            <span className="inline-flex items-center rounded-pill bg-paper-2 border border-rule px-2.5 py-1 text-xs font-medium text-ink-2">
              6 tháng gần nhất
            </span>
          </div>

          {trendPoints.length > 0 ? (
            <div className="relative pt-2">
              {/* Subtle horizontal reference rules */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between"
              >
                <div className="border-t border-dashed border-rule/80" />
                <div className="border-t border-dashed border-rule/60" />
                <div className="border-t border-rule" />
              </div>

              <div className="relative grid grid-cols-6 gap-2 sm:gap-4 h-48 items-end">
                {trendPoints.map((point: any, idx: number) => {
                  const key = `${point.year}-${point.month}`;
                  const amount = Number(point.totalAmount || 0);
                  const ratio = maxTrendAmount > 0 ? amount / maxTrendAmount : 0;
                  const barHeightPct = amount > 0 ? Math.max(Math.round(ratio * 100), 8) : 3;
                  const isLatest = idx === trendPoints.length - 1;
                  const isHovered = hoveredMonth === key;
                  const shortLabel =
                    amount > 0
                      ? amount >= 1000000
                        ? `${(amount / 1000000).toFixed(1)}tr`
                        : `${Math.round(amount / 1000)}k`
                      : '0';

                  return (
                    <div
                      key={key}
                      onMouseEnter={() => setHoveredMonth(key)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="flex flex-col items-center justify-end h-full gap-2"
                    >
                      <div className="w-full flex-1 flex flex-col items-center justify-end gap-1.5">
                        <span
                          className={cn(
                            'font-outlier text-[11px] num leading-none transition-colors',
                            isLatest || isHovered ? 'font-semibold text-ink' : 'text-muted'
                          )}
                        >
                          {shortLabel}
                        </span>
                        <div
                          title={`${point.label}: ${formatCurrency(amount)}`}
                          className={cn(
                            'w-full max-w-[44px] rounded-t-input transition-colors',
                            isLatest
                              ? 'bg-accent'
                              : isHovered
                                ? 'bg-accent/60'
                                : 'bg-paper-3'
                          )}
                          style={{ height: `${barHeightPct}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          'font-outlier text-xs num',
                          isLatest ? 'font-semibold text-ink' : 'text-muted'
                        )}
                      >
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">
              Chưa có dữ liệu thống kê 6 tháng gần nhất.
            </p>
          )}
        </section>

        <section className="lg:col-span-4 ff-ink-panel p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-paper">
                  Trạng thái chốt sổ
                </h2>
                <p className="mt-1 text-xs text-ink-band-muted">
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
              <div className="rounded-input bg-ink-band-2 border border-ink-band-rule p-4">
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
                <p className="mt-2.5 font-display text-2xl font-bold text-paper num">
                  {formatCurrency(Math.abs(pendingSettlement.amount))}
                </p>
              </div>
            )}
          </div>

          <Link
            href="/settlement"
            className="inline-flex w-full items-center justify-center gap-2 min-h-[44px] rounded-input bg-paper px-4 py-2.5 text-sm font-semibold text-ink hover:bg-paper-2 whitespace-nowrap transition-colors"
          >
            <span>Chi tiết công nợ</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>

      {/* Row 3: Recent Expenses Ledger + Category Breakdown (aligned heights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 ff-surface shadow-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-rule">
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
            <div className="px-6 py-12 text-center my-auto">
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
                  className="flex items-center justify-between gap-4 px-6 py-3.5 hover:bg-paper-2/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink truncate">
                        {expense.title}
                      </p>
                      <span className="hidden sm:inline-flex shrink-0 items-center rounded-pill bg-accent-soft/70 text-accent px-2 py-0.5 text-[11px] font-medium">
                        {getCategoryLabel(expense.category)}
                      </span>
                    </div>
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
                  <p className="font-display text-sm sm:text-base font-bold text-ink num shrink-0">
                    {formatCurrency(expense.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-5 ff-surface shadow-card p-6 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-accent" aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-ink">
                  Cơ cấu theo danh mục
                </h2>
              </div>
              <span className="text-xs text-muted num">
                Tháng {currentMonth.slice(5)}/{currentMonth.slice(0, 4)}
              </span>
            </div>

            {categorySlices.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">
                Chưa có chi tiêu trong tháng hiện tại để phân tích danh mục.
              </p>
            ) : (
              <ul className="space-y-4">
                {categorySlices.map((slice: any) => (
                  <li key={slice.category} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-ink truncate">
                        {getCategoryLabel(slice.category)}
                      </span>
                      <span className="font-outlier text-xs text-ink-2 num shrink-0">
                        {formatCurrency(Number(slice.amount))} ({slice.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-pill bg-paper-2 overflow-hidden">
                      <div
                        className="h-full rounded-pill bg-accent origin-left"
                        style={{
                          transform: `scaleX(${Math.min(Number(slice.percentage || 0) / 100, 1)})`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-rule flex items-center justify-between text-xs text-muted">
            <span>Phân loại khi thêm hoặc sửa khoản chi</span>
            <Link
              href="/expenses"
              className="font-semibold text-accent hover:text-accent-deep hover:underline underline-offset-4 whitespace-nowrap"
            >
              Lọc theo danh mục
            </Link>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
