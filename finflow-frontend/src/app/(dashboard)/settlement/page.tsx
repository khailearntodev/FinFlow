'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { settlementService } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ConfirmModal } from '@/components/ConfirmModal';
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettlementPage() {
  const { user } = useAuth();
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
    type: 'info'
  });

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

  const handleCreateSettlement = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận chốt sổ',
      message: `Bạn có chắc chắn muốn chốt sổ cho tháng ${selectedMonth}/${selectedYear}? Toàn bộ các khoản chi tiêu PENDING sẽ bị khóa.`,
      type: 'info',
      onConfirm: async () => {
        try {
          await settlementService.create({
            familyId: user.family.id,
            holdEmail: user.email,
            month: targetMonth,
            year: targetYear
          });
          fetchSettlements();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          alert(error.response?.data?.message || 'Không thể chốt sổ');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleCancelSettlement = async (settlementId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hủy chốt sổ',
      message: 'Bạn có chắc chắn muốn hủy kỳ chốt sổ này? Toàn bộ các khoản chi tiêu sẽ được mở khóa (PENDING).',
      type: 'danger',
      onConfirm: async () => {
        try {
          await settlementService.cancel(settlementId, user.email);
          fetchSettlements();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          alert(error.response?.data?.message || 'Không thể hủy chốt sổ');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const isHead = user?.role === 'HEAD';
  
  const targetMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const targetYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
  
  const filteredSettlements = settlements.filter(s => 
    s.month === targetMonth && s.year === targetYear
  );
  
  const currentSettlement = filteredSettlements.length > 0 ? filteredSettlements[0] : null;

  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user?.family) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
        <div className="h-20 w-20 rounded-3xl bg-amber-100 flex items-center justify-center text-amber-600 mb-6">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Bạn chưa có gia đình</h3>
        <p className="mt-2 text-slate-500 font-medium max-w-sm text-center">
          Vui lòng tạo gia đình mới hoặc tham gia một gia đình để sử dụng tính năng chốt sổ và thanh toán.
        </p>
        <a 
          href="/family"
          className="mt-8 flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
        >
          Đến trang Gia đình
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Thanh toán & Công nợ</h1>
          <p className="mt-2 text-slate-500 font-medium">Theo dõi và tất toán các khoản chi tiêu định kỳ.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="flex-1 px-4 py-2 bg-transparent font-bold text-slate-600 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="flex-1 px-4 py-2 bg-transparent font-bold text-slate-600 outline-none border-l border-slate-100"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

            {isHead && !currentSettlement && (
            <button 
              onClick={handleCreateSettlement}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 w-full sm:w-auto"
            >
              <Calendar className="h-5 w-5" />
              Chốt sổ tháng {targetMonth}
            </button>
          )}
        </div>
      </header>

      {currentSettlement ? (
        <div className="space-y-8">
          <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Kỳ thanh toán</p>
                <h2 className="text-3xl font-black">Tháng {currentSettlement.month}, {currentSettlement.year}</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  Thời gian: 01/{currentSettlement.month < 10 ? `0${currentSettlement.month}` : currentSettlement.month} - {getLastDayOfMonth(currentSettlement.year, currentSettlement.month)}/{currentSettlement.month < 10 ? `0${currentSettlement.month}` : currentSettlement.month}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isHead && currentSettlement.status !== 'COMPLETED' && (
                  <button 
                    onClick={() => handleCancelSettlement(currentSettlement.settlementId)}
                    className="px-4 py-2 bg-rose-500/20 text-rose-400 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-500/30 transition-all"
                  >
                    Hủy chốt sổ
                  </button>
                )}
                <div className={cn(
                  "px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest backdrop-blur-md",
                  currentSettlement.status === 'COMPLETED' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                )}>
                  {currentSettlement.status === 'COMPLETED' ? 'Hoàn tất' : 'Đang xử lý'}
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSettlement.bills.map((bill: any) => (
                  <BillCard key={bill.id} bill={bill} isHead={isHead} onUpdate={fetchSettlements} />
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-6">
            <CreditCard className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Không có dữ liệu chốt sổ</h3>
          <p className="mt-2 text-slate-500 font-medium max-w-sm text-center">
            Kỳ chốt sổ tháng {targetMonth}/{targetYear} chưa thực hiện hoặc không có chi tiêu nào.
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </div>
  );
}

const BillCard = ({ bill, isHead, onUpdate }: any) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const isMyBill = bill.userEmail === user.email;
  const isDebtor = bill.amount > 0; // Member owes money to Head
  const isCreditor = bill.amount < 0; // Head owes money to Member

  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await settlementService.submitProof(bill.id, user.email, file);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi upload');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      await settlementService.confirmPayment(bill.id, user.email);
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi xác nhận');
    }
  };

  const statusConfig = {
    PENDING: { color: 'text-amber-500', bg: 'bg-amber-50', icon: Clock, label: 'Chờ thanh toán' },
    WAITING_FOR_CONFIRMATION: { color: 'text-blue-500', bg: 'bg-blue-50', icon: AlertCircle, label: 'Chờ xác nhận' },
    COMPLETED: { color: 'text-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2, label: 'Đã hoàn tất' },
  };

  const config = statusConfig[bill.status as keyof typeof statusConfig];

  return (
    <div className={cn(
      "relative p-8 rounded-[2.5rem] border transition-all duration-300",
      isMyBill ? "bg-white border-indigo-100 shadow-xl shadow-indigo-100/50 ring-2 ring-indigo-500/10" : "bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50"
    )}>
      {isMyBill && (
        <div className="absolute -top-3 left-8 px-4 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
          Hóa đơn của bạn
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-900 shadow-sm text-xl">
            {bill.fullName.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 leading-none">{bill.fullName}</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{isHead && bill.userEmail === user.email ? 'Chủ hộ' : 'Thành viên'}</p>
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", config.bg, config.color)}>
          <config.icon className="h-3.5 w-3.5" />
          {config.label}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-100 mb-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số tiền tất toán</p>
        <div className="flex items-baseline gap-1">
          <p className={cn(
            "text-3xl font-black tracking-tighter",
            isDebtor ? "text-rose-600" : "text-emerald-600"
          )}>
            {isDebtor ? '+' : ''}{formatCurrency(bill.amount)}
          </p>
        </div>
        <p className={cn(
          "text-[10px] font-bold mt-2 flex items-center gap-1.5",
          isDebtor ? "text-rose-500" : "text-emerald-500"
        )}>
          {isDebtor ? (
            <><ExternalLink className="h-3 w-3" /> Cần đóng về quỹ (cho Chủ hộ)</>
          ) : (
            <><CheckCircle2 className="h-3 w-3" /> Nhận lại từ quỹ (từ Chủ hộ)</>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {/* Xem minh chứng (Dành cho tất cả nếu đã có) */}
        {bill.proofImageUrl && (
          <a 
            href={bill.proofImageUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ImageIcon className="h-4 w-4" />
            Xem minh chứng
          </a>
        )}

        {/* Nộp minh chứng (Dành cho Thành viên nợ tiền - Không phải Chủ hộ) */}
        {isMyBill && !isHead && isDebtor && bill.status === 'PENDING' && (
          <div className="space-y-3">
            <p className="text-[10px] text-slate-400 font-bold text-center bg-slate-100 py-2 rounded-xl">
              Vui lòng chuyển {formatCurrency(bill.amount)} cho Chủ hộ và tải biên lai.
            </p>
            <label className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 rounded-2xl text-xs font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer">
              <Upload className="h-4 w-4" />
              {uploading ? 'Đang tải...' : 'Nộp minh chứng thanh toán'}
              <input type="file" className="hidden" onChange={handleUploadProof} disabled={uploading} />
            </label>
          </div>
        )}

        {/* Chế độ hiển thị cho Thành viên được nhận tiền (Creditor) */}
        {isMyBill && isCreditor && bill.status === 'PENDING' && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-[10px] text-emerald-700 font-bold text-center italic">
              Bạn sẽ nhận lại {formatCurrency(Math.abs(bill.amount))} từ Chủ hộ. Vui lòng đợi xác nhận.
            </p>
          </div>
        )}

        {/* CÁC THAO TÁC CỦA CHỦ HỘ (HEAD) */}
        {isHead && bill.status !== 'COMPLETED' && (
          <div className="pt-2">
            {/* 1. Duyệt minh chứng của thành viên khác đóng tiền */}
            {!isMyBill && isDebtor && bill.status === 'WAITING_FOR_CONFIRMATION' && (
              <button 
                onClick={handleConfirm}
                className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 rounded-2xl text-xs font-black text-white shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all"
              >
                <Check className="h-4 w-4" />
                Xác nhận đã nhận tiền
              </button>
            )}

            {/* 2. Chủ hộ tự xác nhận nợ của chính mình (Vì A thu tiền của chính A) */}
            {isMyBill && isDebtor && bill.status === 'PENDING' && (
              <button 
                onClick={handleConfirm}
                className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 rounded-2xl text-xs font-black text-white shadow-xl shadow-slate-200 hover:bg-black transition-all"
              >
                <Check className="h-4 w-4" />
                Xác nhận đã nộp vào quỹ
              </button>
            )}

            {/* 3. Chủ hộ xác nhận đã trả tiền cho thành viên chi lố (Creditor) */}
            {isCreditor && bill.status === 'PENDING' && (
              <button 
                onClick={handleConfirm}
                className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 rounded-2xl text-xs font-black text-white shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <Check className="h-4 w-4" />
                Xác nhận đã trả tiền cho {bill.fullName.split(' ').pop()}
              </button>
            )}
            
            {/* Cảnh báo nếu chưa có minh chứng nhưng ông A muốn duyệt sớm (Optionally) */}
            {!isMyBill && isDebtor && bill.status === 'PENDING' && (
              <p className="text-[10px] text-slate-400 font-bold text-center mt-2 italic">
                Chờ {bill.fullName.split(' ').pop()} nộp minh chứng...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
