'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { familyService, getErrorMessage } from '@/services/api';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

export default function CreateFamilyPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [billingDate, setBillingDate] = useState('25');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await familyService.create({
        name,
        billingDate: parseInt(billingDate),
        creatorEmail: user.email
      });
      await refreshUser();
      showToast('Tạo gia đình thành công!', 'success');
      router.push('/family');
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <div className="mx-auto h-20 w-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200">
            <Plus className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bắt đầu gia đình mới</h1>
          <p className="mt-4 text-slate-500 font-medium text-lg">Tạo không gian chung để quản lý chi tiêu cùng mọi người.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-8">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Tên gia đình</label>
            <input 
              required
              type="text" 
              placeholder="VD: Gia đình Hạnh Phúc, Căn hộ 402..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-8 py-5 rounded-[2rem] border-2 border-slate-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-center text-2xl font-black placeholder:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Ngày chốt sổ hàng tháng</label>
            <div className="grid grid-cols-7 gap-2">
              {[1, 5, 10, 15, 20, 25, 28].map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() => setBillingDate(date.toString())}
                  className={cn(
                    "py-4 rounded-2xl font-black text-lg transition-all",
                    billingDate === date.toString()
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                      : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  {date}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 font-medium italic">Vào ngày này, hệ thống sẽ tự động tổng hợp công nợ cho tất cả thành viên.</p>
          </div>

          <button 
            disabled={loading || !name}
            className="w-full flex items-center justify-center gap-3 rounded-[2rem] bg-indigo-600 py-6 text-xl font-black text-white shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Xác nhận tạo gia đình'}
          </button>
        </form>
      </div>
    </div>
  );
}
