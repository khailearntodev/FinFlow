'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { settlementService, getErrorMessage } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { toVietQrPngUrl } from '@/lib/vietqr';
import { ConfirmModal } from '@/components/ConfirmModal';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  QrCode,
  FileText,
  X,
  Copy,
  Download,
} from 'lucide-react';

function SettlementContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [qrBill, setQrBill] = useState<any | null>(null);
  const [breakdownBillId, setBreakdownBillId] = useState<string | null>(null);
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

  // Support deep-link /settlement?month=10&year=2026 from emails
  useEffect(() => {
    const monthParam = parseInt(searchParams.get('month') || '', 10);
    const yearParam = parseInt(searchParams.get('year') || '', 10);
    if (!Number.isNaN(monthParam) && monthParam >= 1 && monthParam <= 12 && !Number.isNaN(yearParam) && yearParam >= 2020) {
      if (monthParam === 12) {
        setSelectedMonth(1);
        setSelectedYear(yearParam + 1);
      } else {
        setSelectedMonth(monthParam + 1);
        setSelectedYear(yearParam);
      }
    }
  }, [searchParams]);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Thanh toán và công nợ
          </h1>
          <p className="mt-1 text-sm text-muted">
            Theo dõi, xem giải trình chi tiết và quét VietQR để tất toán định kỳ.
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
              {(() => {
                const startYear = Math.min(2024, selectedYear);
                const endYear = Math.max(new Date().getFullYear() + 1, selectedYear);
                return Array.from(
                  { length: endYear - startYear + 1 },
                  (_, i) => startYear + i
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ));
              })()}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentSettlement.bills.map((bill: any) => (
              <BillCard
                key={bill.id}
                bill={bill}
                isHead={isHead}
                onUpdate={fetchSettlements}
                onOpenQr={() => setQrBill(bill)}
                onOpenBreakdown={() => setBreakdownBillId(bill.id)}
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

      <AnimatePresence>
        {qrBill && (
          <VietQrModal bill={qrBill} onClose={() => setQrBill(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {breakdownBillId && (
          <BillBreakdownModal
            billId={breakdownBillId}
            onClose={() => setBreakdownBillId(null)}
          />
        )}
      </AnimatePresence>

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

export default function SettlementPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6" aria-busy="true">
          <div className="h-10 w-64 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
          <div className="ff-surface h-72 animate-pulse motion-reduce:animate-none" />
        </div>
      }
    >
      <SettlementContent />
    </Suspense>
  );
}

const BillCard = ({ bill, isHead, onUpdate, onOpenQr, onOpenBreakdown }: any) => {
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
  const canShowQr =
    bill.status !== 'COMPLETED' &&
    bill.qrImageUrl &&
    ((isMyBill && isDebtor) || (isHead && isCreditor));

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

      <div className="mt-6 pt-4 border-t border-rule space-y-2.5">
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={onOpenBreakdown}
            className="ff-btn-secondary w-full"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Xem giải trình</span>
          </button>

          {canShowQr && (
            <button
              type="button"
              onClick={onOpenQr}
              className="ff-btn-secondary w-full"
            >
              <QrCode className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>Quét mã VietQR</span>
            </button>
          )}
        </div>

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
            {!bill.qrImageUrl && (
              <p className="text-xs text-muted bg-paper-2 px-3 py-2 rounded-input">
                Vui lòng chuyển{' '}
                <strong className="font-semibold text-ink num">
                  {formatCurrency(bill.amount)}
                </strong>{' '}
                cho Chủ hộ và tải biên lai.
              </p>
            )}
            <label className="ff-btn-primary w-full cursor-pointer">
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{uploading ? 'Đang tải…' : 'Nộp minh chứng thanh toán'}</span>
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
                <span>{confirming ? 'Đang xử lý…' : 'Xác nhận đã nhận tiền'}</span>
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
                <span>{confirming ? 'Đang xử lý…' : 'Xác nhận đã nộp vào quỹ'}</span>
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
                    ? 'Đang xử lý…'
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
                  <span>{reminding ? 'Đang gửi…' : 'Nhắc đóng tiền qua Email'}</span>
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

const VietQrModal = ({ bill, onClose }: { bill: any; onClose: () => void }) => {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label}`, 'success');
  };

  const pngQrUrl = toVietQrPngUrl(bill.qrImageUrl);

  const handleDownloadQr = async () => {
    if (!pngQrUrl) return;
    setDownloading(true);
    try {
      const response = await fetch(pngQrUrl);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `FinFlow_VietQR_${bill.recipientBankCode}_${bill.recipientAccountNumber}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
      showToast('Đã tải ảnh mã QR (PNG)!', 'success');
    } catch {
      window.open(pngQrUrl, '_blank', 'noopener,noreferrer');
      showToast('Đã mở ảnh mã QR trong tab mới để bạn lưu về máy.', 'info');
    } finally {
      setDownloading(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[450] flex items-center justify-center p-4 bg-ink/45"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vietqr-modal-title"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[92dvh] flex flex-col rounded-card bg-surface border border-rule shadow-lift overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-rule bg-paper-2/60 flex items-center justify-between shrink-0">
          <h2 id="vietqr-modal-title" className="font-display text-lg font-bold text-ink">
            Mã VietQR chuyển khoản
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng mã QR"
            className="flex h-9 w-9 items-center justify-center rounded-input text-muted hover:bg-paper-3 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="flex justify-center bg-paper p-4 rounded-input">
            <img
              src={bill.qrImageUrl}
              alt="Mã VietQR chuyển khoản"
              className="w-60 h-auto max-w-full rounded-input"
            />
          </div>

          {/* Save QR PNG for Mobile Gallery Scan */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={downloading || !pngQrUrl}
              onClick={handleDownloadQr}
              className="ff-btn-primary w-full"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{downloading ? 'Đang tải…' : 'Tải ảnh mã QR (PNG)'}</span>
            </button>
            <p className="text-xs text-muted text-center">
              Lưu ảnh rồi chọn trong mục Quét QR của app ngân hàng để tự điền sẵn số tiền và nội dung.
            </p>
          </div>

          <dl className="divide-y divide-rule text-sm border-t border-rule">
            <div className="py-2.5 flex items-center justify-between gap-2">
              <dt className="text-muted">Ngân hàng</dt>
              <dd className="font-semibold text-ink">{bill.recipientBankCode}</dd>
            </div>
            <div className="py-2.5 flex items-center justify-between gap-2">
              <dt className="text-muted">Số tài khoản</dt>
              <dd className="flex items-center gap-2">
                <span className="font-outlier font-medium text-ink num">
                  {bill.recipientAccountNumber}
                </span>
                <button
                  type="button"
                  aria-label="Sao chép số tài khoản"
                  onClick={() => copyText(bill.recipientAccountNumber, 'số tài khoản')}
                  className="p-1.5 rounded-input text-muted hover:text-accent hover:bg-accent-soft/50 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </dd>
            </div>
            {bill.recipientAccountName && (
              <div className="py-2.5 flex items-center justify-between gap-2">
                <dt className="text-muted">Chủ tài khoản</dt>
                <dd className="font-semibold text-ink">{bill.recipientAccountName}</dd>
              </div>
            )}
            <div className="py-2.5 flex items-center justify-between gap-2">
              <dt className="text-muted">Số tiền</dt>
              <dd className="font-display font-bold text-accent num">
                {formatCurrency(Math.abs(bill.amount))}
              </dd>
            </div>
            {bill.transferContent && (
              <div className="py-2.5 flex items-center justify-between gap-2">
                <dt className="text-muted shrink-0">Nội dung</dt>
                <dd className="flex items-center gap-2 min-w-0">
                  <span className="font-outlier text-xs text-ink truncate">
                    {bill.transferContent}
                  </span>
                  <button
                    type="button"
                    aria-label="Sao chép nội dung chuyển khoản"
                    onClick={() => copyText(bill.transferContent, 'nội dung chuyển khoản')}
                    className="p-1.5 rounded-input text-muted hover:text-accent hover:bg-accent-soft/50 transition-colors shrink-0"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

const BillBreakdownModal = ({
  billId,
  onClose,
}: {
  billId: string;
  onClose: () => void;
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await settlementService.getBillBreakdown(billId);
        if (active) setData(res.data);
      } catch (err) {
        showToast(getErrorMessage(err), 'error');
        onClose();
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [billId, onClose, showToast]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[450] overflow-y-auto bg-ink/45 p-4 flex items-start md:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="breakdown-modal-title"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-card bg-surface border border-rule shadow-lift overflow-hidden my-auto"
      >
        <div className="px-6 py-4 border-b border-rule bg-paper-2/60 flex items-center justify-between gap-4">
          <div>
            <h2 id="breakdown-modal-title" className="font-display text-lg font-bold text-ink">
              Bảng kê giải trình công nợ
            </h2>
            {data && (
              <p className="text-xs text-muted mt-0.5 num">
                {data.memberFullName} · Kỳ tháng {data.month}/{data.year}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng giải trình"
            className="flex h-9 w-9 items-center justify-center rounded-input text-muted hover:bg-paper-3 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto motion-reduce:animate-none" aria-hidden="true" />
              <p className="mt-3 text-sm text-muted">Đang tải bảng kê chi tiết…</p>
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-rule rounded-input bg-paper-2">
                <div className="p-4">
                  <p className="text-xs text-muted">Tổng đã ứng trước</p>
                  <p className="mt-1 font-display text-lg font-bold text-success num">
                    {formatCurrency(data.totalPaid)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted">Tổng phần phải chịu</p>
                  <p className="mt-1 font-display text-lg font-bold text-ink num">
                    {formatCurrency(data.totalOwed)}
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted">
                    {data.netAmount > 0 ? 'Cần đóng về quỹ' : 'Nhận lại từ quỹ'}
                  </p>
                  <p
                    className={cn(
                      'mt-1 font-display text-lg font-bold num',
                      data.netAmount > 0 ? 'text-error' : 'text-success'
                    )}
                  >
                    {data.netAmount > 0 ? '+' : ''}
                    {formatCurrency(data.netAmount)}
                  </p>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto border border-rule rounded-input">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead className="bg-paper-2/70 border-b border-rule sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold text-muted">Khoản chi</th>
                      <th className="px-4 py-2.5 font-semibold text-muted text-right">Đã ứng</th>
                      <th className="px-4 py-2.5 font-semibold text-muted text-right">Phần chia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {data.items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted">
                          Không có khoản chi nào phát sinh trong kỳ này.
                        </td>
                      </tr>
                    ) : (
                      data.items.map((item: any) => (
                        <tr key={item.expenseId}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{item.title}</p>
                            <p className="text-xs text-muted mt-0.5 num">
                              {item.expenseDate} ({item.paidByName} chi {formatCurrency(item.totalExpenseAmount)}, chia {item.participantCount})
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right font-outlier num text-success-ink">
                            {item.myPaidAmount > 0 ? formatCurrency(item.myPaidAmount) : '0 ₫'}
                          </td>
                          <td className="px-4 py-3 text-right font-outlier num text-ink">
                            {formatCurrency(item.myShareAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};
