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
    if (!user?.family?.id) return;
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
            month: selectedMonth,
            year: selectedYear
          });
          fetchSettlements();
        } catch (error: any) {
          alert(error.response?.data?.message || 'Không thể chốt sổ');
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
        } catch (error: any) {
          alert(error.response?.data?.message || 'Không thể hủy chốt sổ');
        }
      }
    });
  };

  const isHead = user?.role === 'HEAD';
  
  const filteredSettlements = settlements.filter(s => 
    s.month === selectedMonth && s.year === selectedYear
  );
  
  const currentSettlement = filteredSettlements.length > 0 ? filteredSettlements[0] : null;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Thanh toán & Công nợ</h1>
          <p className="mt-2 text-slate-500 font-medium">Theo dõi và tất toán các khoản chi tiêu định kỳ.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-2xl border border-slate-200 p-1">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-4 py-2 bg-transparent font-bold text-slate-600 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-transparent font-bold text-slate-600 outline-none border-l border-slate-100"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {isHead && !currentSettlement && (
            <button 
              onClick={handleCreateSettlement}
              className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
            >
              <Calendar className="h-5 w-5" />
              Chốt sổ tháng {selectedMonth}
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
            Tháng {selectedMonth}/{selectedYear} chưa thực hiện chốt sổ hoặc không có chi tiêu nào.
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
    <div className="relative p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 shadow-sm">
          {bill.fullName.charAt(0)}
        </div>
        <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", config.bg, config.color)}>
          <config.icon className="h-3.5 w-3.5" />
          {config.label}
        </div>
      </div>

      <h4 className="font-bold text-slate-900">{bill.fullName}</h4>
      <p className="text-xs text-slate-500 mb-4">{bill.userEmail}</p>

      <div className="mb-6">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Số tiền</p>
        <p className={cn(
          "text-2xl font-black tracking-tight",
          bill.amount > 0 ? "text-rose-600" : "text-emerald-600"
        )}>
          {bill.amount > 0 ? '+' : ''}{formatCurrency(bill.amount)}
        </p>
        <p className="text-[10px] font-bold text-slate-400 mt-1">
          {bill.amount > 0 ? 'Cần đóng về quỹ' : 'Nhận lại từ quỹ'}
        </p>
      </div>

      <div className="space-y-3">
        {bill.proofImageUrl && (
          <a 
            href={bill.proofImageUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ImageIcon className="h-4 w-4" />
            Xem minh chứng
          </a>
        )}

        {isMyBill && bill.status === 'PENDING' && bill.amount > 0 && (
          <label className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer">
            <Upload className="h-4 w-4" />
            {uploading ? 'Đang tải...' : 'Nộp minh chứng'}
            <input type="file" className="hidden" onChange={handleUploadProof} disabled={uploading} />
          </label>
        )}

        {(isHead && (
          (bill.status === 'WAITING_FOR_CONFIRMATION') || 
          (bill.status === 'PENDING' && bill.amount < 0)
        )) && (
          <button 
            onClick={handleConfirm}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
          >
            <Check className="h-4 w-4" />
            {bill.amount < 0 ? 'Xác nhận đã trả tiền' : 'Xác nhận nhận tiền'}
          </button>
        )}
      </div>
      
      {isMyBill && <div className="absolute top-2 right-2 h-2 w-2 bg-indigo-600 rounded-full animate-pulse"></div>}
    </div>
  );
}
