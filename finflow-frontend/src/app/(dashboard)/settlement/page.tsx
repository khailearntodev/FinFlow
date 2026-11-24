'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { settlementService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  Calendar,
  ExternalLink,
  Bell,
} from 'lucide-react';

export default function SettlementPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'info' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
  });
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchSettlements = async () => {
    if (!user?.family?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await settlementService.getSettlements(user.family.id);
      setSettlements(response.data);
    } catch (error) {
      console.error('Failed to fetch settlements', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [user]);

  const isHead = user?.role === 'HEAD';
  const targetMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const targetYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const handleCreateSettlement = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận chốt sổ',
      message: `Bạn có chắc chắn muốn chốt sổ cho tháng ${targetMonth}/${targetYear}? Toàn bộ các khoản chi tiêu đang chờ sẽ bị khóa.`,
      type: 'info',
      onConfirm: async () => {
        setIsConfirming(true);
        try {
          await settlementService.create({
            familyId: user.family.id,
            holdEmail: user.email,
            month: targetMonth,
            year: targetYear,
          });
          fetchSettlements();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast(
            `Đã chốt sổ thành công tháng ${targetMonth}/${targetYear}`,
            'success'
          );
        } catch (error: any) {
          showToast(
            error.response?.data?.message || 'Không thể chốt sổ',
            'error'
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsConfirming(false);
        }
      },
    });
  };

  const handleCancelSettlement = async (settlementId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hủy chốt sổ',
      message:
        'Bạn có chắc chắn muốn hủy kỳ chốt sổ này? Toàn bộ các khoản chi tiêu sẽ được mở khóa trở lại.',
      type: 'danger',
      onConfirm: async () => {
        setIsConfirming(true);
        try {
          await settlementService.cancel(settlementId, user.email);
          fetchSettlements();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          showToast('Đã hủy chốt sổ thành công', 'success');
        } catch (error: any) {
          showToast(
            error.response?.data?.message || 'Không thể hủy chốt sổ',
            'error'
          );
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } finally {
          setIsConfirming(false);
        }
      },
    });
  };

  const filteredSettlements = settlements.filter(
    (s) => s.month === targetMonth && s.year === targetYear
  );

  const currentSettlement =
    filteredSettlements.length > 0 ? filteredSettlements[0] : null;

  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Đang tải công nợ">
        <div className="h-10 w-64 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
        <div className="ff-surface h-72 animate-pulse motion-reduce:animate-none" />
      </div>
    );
  }

  if (!user?.family) {
    return (
      <div className="ff-surface p-10 sm:p-14 text-center max-w-xl mx-auto mt-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-input bg-warning-soft text-warning">
          <AlertCircle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Bạn chưa có gia đình
        </h1>
        <p className="mt-2 text-sm text-muted max-w-[40ch] mx-auto">
          Vui lòng tạo gia đình mới hoặc tham gia một gia đình để sử dụng tính năng chốt sổ và thanh toán.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/family" className="ff-btn-primary">
            Đến trang Gia đình
          </Link>
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
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Thanh toán và công nợ
          </h1>
          <p className="mt-1 text-sm text-muted">
            Theo dõi và tất toán các khoản chi tiêu định kỳ theo từng tháng.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex rounded-input bg-surface border border-rule-strong overflow-hidden">
            <select
              aria-label="Chọn tháng hiển thị"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 min-h-[44px] px-3.5 bg-transparent text-sm font-medium text-ink outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
            <select
              aria-label="Chọn năm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="flex-1 min-h-[44px] px-3.5 bg-transparent text-sm font-outlier font-medium text-ink outline-none border-l border-rule num"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {isHead && !currentSettlement && (
            <button
              type="button"
              onClick={handleCreateSettlement}
              className="ff-btn-primary w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Chốt sổ tháng {targetMonth}</span>
            </button>
          )}
        </div>
      </header>

      {currentSettlement ? (
        <div className="space-y-6">
          {/* Period Summary Band */}
          <section className="ff-ink-panel p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-ink-band-muted">
                Kỳ thanh toán
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-paper num">
                Tháng {currentSettlement.month}/{currentSettlement.year}
              </h2>
              <p className="mt-1 font-outlier text-xs text-ink-band-muted num">
                01/
                {currentSettlement.month < 10
                  ? `0${currentSettlement.month}`
                  : currentSettlement.month}{' '}
                đến{' '}
                {getLastDayOfMonth(
                  currentSettlement.year,
                  currentSettlement.month
                )}
                /
                {currentSettlement.month < 10
                  ? `0${currentSettlement.month}`
                  : currentSettlement.month}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isHead && currentSettlement.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() =>
                    handleCancelSettlement(currentSettlement.settlementId)
                  }
                  className="min-h-[40px] px-4 py-2 rounded-input bg-error-soft text-error-ink text-sm font-semibold hover:bg-error hover:text-accent-ink whitespace-nowrap transition-colors"
                >
                  Hủy chốt sổ
                </button>
              )}
              <span
                className={cn(
                  'inline-flex items-center rounded-pill px-3.5 py-1.5 text-xs font-semibold',
                  currentSettlement.status === 'COMPLETED'
                    ? 'bg-success-soft text-success-ink'
                    : 'bg-warning-soft text-warning-ink'
                )}
              >
                {currentSettlement.status === 'COMPLETED'
                  ? 'Đã hoàn tất'
                  : 'Đang xử lý'}
              </span>
            </div>
          </section>

          {/* Individual Bills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentSettlement.bills.map((bill: any) => (
              <BillCard
                key={bill.id}
                bill={bill}
                isHead={isHead}
                onUpdate={fetchSettlements}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="ff-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-input bg-paper-2 text-muted">
            <CreditCard className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">
            Chưa có dữ liệu chốt sổ
          </h2>
          <p className="mt-2 text-sm text-muted max-w-[44ch] mx-auto">
            Kỳ chốt sổ tháng {targetMonth}/{targetYear} chưa được thực hiện hoặc không phát sinh khoản chi nào.
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        isLoading={isConfirming}
      />
    </motion.div>
  );
}

const BillCard = ({ bill, isHead, onUpdate }: any) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const isMyBill = bill.userEmail === user.email;
  const isDebtor = bill.amount > 0;
  const isCreditor = bill.amount < 0;

  const [confirming, setConfirming] = useState(false);
  const [reminding, setReminding] = useState(false);

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await settlementService.submitProof(bill.id, user.email, file);
      showToast('Nộp minh chứng thành công', 'success');
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi tải biên lai', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await settlementService.confirmPayment(bill.id, user.email);
      showToast('Xác nhận thành công', 'success');
      onUpdate();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi xác nhận', 'error');
    } finally {
      setConfirming(false);
    }
  };

  const handleRemind = async () => {
    setReminding(true);
    try {
      await settlementService.remind(bill.id, user.email);
      showToast('Đã gửi email nhắc nhở!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Lỗi gửi nhắc nhở', 'error');
    } finally {
      setReminding(false);
    }
  };

  const statusConfig = {
    PENDING: {
      style: 'bg-warning-soft text-warning-ink',
      icon: Clock,
      label: 'Chờ thanh toán',
    },
    WAITING_FOR_CONFIRMATION: {
      style: 'bg-info-soft text-info-ink',
      icon: AlertCircle,
      label: 'Chờ xác nhận',
    },
    COMPLETED: {
      style: 'bg-success-soft text-success-ink',
      icon: CheckCircle2,
      label: 'Đã hoàn tất',
    },
  };

  const config = statusConfig[bill.status as keyof typeof statusConfig];

  return (
    <article
      className={cn(
        'ff-surface flex flex-col justify-between p-6 shadow-card',
        isMyBill && 'border-accent'
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-input bg-paper-2 border border-rule flex items-center justify-center font-display font-bold text-ink">
              {bill.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-base font-bold text-ink truncate">
                {bill.fullName}
              </h3>
              <p className="text-xs text-muted">
                {isMyBill
                  ? isHead
                    ? 'Chủ hộ (Hóa đơn của bạn)'
                    : 'Hóa đơn của bạn'
                  : 'Thành viên'}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium',
              config.style
            )}
          >
            <config.icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{config.label}</span>
          </span>
        </div>

        {/* Amount Ledger Row (No nested card, clean hairline separation) */}
        <div className="mt-5 pt-5 border-t border-rule">
          <p className="text-xs font-medium text-muted">Số tiền tất toán</p>
          <p
            className={cn(
              'mt-1.5 font-display text-2xl font-bold num',
              isDebtor ? 'text-error' : 'text-success'
            )}
          >
            {isDebtor ? '+' : ''}
            {formatCurrency(bill.amount)}
          </p>
          <p
            className={cn(
              'mt-1.5 text-xs font-medium flex items-center gap-1.5',
              isDebtor ? 'text-error-ink' : 'text-success-ink'
            )}
          >
            {isDebtor ? (
              <>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Cần đóng về quỹ (cho Chủ hộ)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>Nhận lại từ quỹ (từ Chủ hộ)</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-rule space-y-2.5">
        {bill.proofImageUrl && (
          <a
            href={bill.proofImageUrl}
            target="_blank"
            rel="noreferrer"
            className="ff-btn-secondary w-full"
          >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            <span>Xem minh chứng</span>
          </a>
        )}

        {isMyBill && !isHead && isDebtor && bill.status === 'PENDING' && (
          <div className="space-y-2.5">
            <p className="text-xs text-muted bg-paper-2 px-3 py-2 rounded-input">
              Vui lòng chuyển{' '}
              <strong className="font-semibold text-ink num">
                {formatCurrency(bill.amount)}
              </strong>{' '}
              cho Chủ hộ và tải biên lai.
            </p>
            <label className="ff-btn-primary w-full cursor-pointer">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{uploading ? 'Đang tải...' : 'Nộp minh chứng thanh toán'}</span>
              <input
                type="file"
                className="visually-hidden"
                onChange={handleUploadProof}
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {isMyBill && isCreditor && bill.status === 'PENDING' && (
          <p className="text-xs text-success-ink bg-success-soft px-3 py-2.5 rounded-input">
            Bạn sẽ nhận lại{' '}
            <strong className="font-semibold num">
              {formatCurrency(Math.abs(bill.amount))}
            </strong>{' '}
            từ Chủ hộ. Vui lòng đợi xác nhận.
          </p>
        )}

        {isHead && bill.status !== 'COMPLETED' && (
          <div className="space-y-2.5">
            {!isMyBill && isDebtor && bill.status === 'WAITING_FOR_CONFIRMATION' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="ff-btn-primary w-full"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{confirming ? 'Đang xử lý...' : 'Xác nhận đã nhận tiền'}</span>
              </button>
            )}

            {isMyBill && isDebtor && bill.status === 'PENDING' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="ff-btn-primary w-full"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{confirming ? 'Đang xử lý...' : 'Xác nhận đã nộp vào quỹ'}</span>
              </button>
            )}

            {isCreditor && bill.status === 'PENDING' && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="ff-btn-primary w-full"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                ) : (
                  <Check className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {confirming
                    ? 'Đang xử lý...'
                    : `Xác nhận đã trả ${bill.fullName.split(' ').pop()}`}
                </span>
              </button>
            )}

            {!isMyBill && isDebtor && bill.status === 'PENDING' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleRemind}
                  disabled={reminding}
                  className="ff-btn-secondary w-full"
                >
                  {reminding ? (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  ) : (
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{reminding ? 'Đang gửi...' : 'Nhắc đóng tiền qua Email'}</span>
                </button>
                <p className="text-xs text-muted text-center">
                  Đang chờ {bill.fullName.split(' ').pop()} nộp minh chứng.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
