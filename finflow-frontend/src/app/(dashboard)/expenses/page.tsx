'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService, getErrorMessage } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit3,
  ChevronDown,
  X,
  Loader2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Confirmation states
  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
  const [confirmEdit, setConfirmEdit] = useState<{ formData: any } | null>(null);

  const fetchExpenses = async () => {
    if (!user?.family?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await expenseService.getAll(user.family.id);
      setExpenses(response.data);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsModalOpen(true);
      router.replace('/expenses');
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await expenseService.delete(user.family.id, confirmDelete.id, user.id);
      setExpenses(expenses.filter(e => e.id !== confirmDelete.id));
      showToast('Đã xóa khoản chi thành công!', 'success');
      setConfirmDelete(null);
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses
    .filter(e => {
      const expenseMonth = e.expenseDate.slice(0, 7);
      const matchesMonth = !selectedMonth || expenseMonth === selectedMonth;
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.paidByEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesMonth && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime();
      if (sortBy === 'oldest') return new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
    });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Chi tiêu chung</h1>
          <p className="mt-2 text-slate-500 font-medium">Danh sách tất cả các khoản chi tiêu của gia đình.</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus className="h-5 w-5" />
          Thêm khoản chi
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm chi tiêu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            />
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-slate-600"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 lg:flex-none">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full appearance-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors outline-none pr-10"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="amount">Số tiền lớn nhất</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Khoản chi</th>
                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Người chi</th>
                <th className="hidden sm:table-cell px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Ngày chi</th>
                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                <th className="px-4 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-slate-500 font-bold">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500">
                    Không tìm thấy khoản chi nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="hidden sm:flex h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-slate-100 items-center justify-center text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <Receipt className="h-5 w-5 md:h-6 md:w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm md:text-lg">{expense.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {expense.status === 'SETTLED' && (
                              <span className="text-[10px] px-2 py-0.5 bg-slate-900 text-white rounded-md font-black uppercase tracking-tighter flex items-center gap-1">
                                <Lock className="h-2.5 w-2.5" />
                                Đã chốt
                              </span>
                            )}
                            <div className="flex gap-1">
                              {expense.participants.map((p: string) => (
                                <span key={p} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold uppercase tracking-tighter">
                                  {p.split('@')[0]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-indigo-50 flex items-center justify-center text-[8px] md:text-[10px] font-black text-indigo-600 ring-2 ring-white">
                          {expense.paidByEmail.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] md:text-sm font-bold text-slate-700 truncate max-w-[60px] md:max-w-none">{expense.paidByEmail}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 md:px-8 py-4 md:py-6">
                      <span className="text-[10px] md:text-sm font-bold text-slate-500">{formatDate(expense.expenseDate)}</span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                      <span className="text-sm md:text-xl font-black text-slate-900 tracking-tight">{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6">
                      <div className="flex items-center justify-center gap-2">
                        {expense.status === 'PENDING' && (user?.email === expense.paidByEmail || user?.role === 'HEAD') ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setIsModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            >
                              <Edit3 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: expense.id })}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <div className="p-2 text-slate-300">
                            <Lock className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ExpenseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchExpenses();
          }}
          expense={editingExpense}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa khoản chi?"
        message="Bạn có chắc chắn muốn xóa khoản chi này khỏi hệ thống? Dữ liệu thanh toán liên quan sẽ bị ảnh hưởng."
        confirmText="Xóa ngay"
        isLoading={loading}
      />
    </div>
  );
}

const ExpenseModal = ({ isOpen, onClose, onSuccess, expense }: any) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    amount: expense?.amount || '',
    expenseDate: expense?.expenseDate || new Date().toISOString().split('T')[0],
    paidByEmail: expense?.paidByEmail || user.email,
    participantIDs: expense?.participants ?
      user.family?.members?.filter((m: any) => expense.participants.includes(m.email)).map((m: any) => m.id) || [] :
      user.family?.members?.map((m: any) => m.id) || [],
  });

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      if (expense) {
        await expenseService.update(user.family.id, expense.id, formData, user.id);
        showToast('Đã cập nhật khoản chi!', 'success');
      } else {
        await expenseService.create(formData);
        showToast('Đã ghi nhận khoản chi mới!', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (id: string) => {
    const newParticipants = formData.participantIDs.includes(id)
      ? formData.participantIDs.filter((pId: string) => pId !== id)
      : [...formData.participantIDs, id];
    setFormData({ ...formData, participantIDs: newParticipants });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-600 px-8 py-6 flex items-center justify-between text-white">
          <h2 className="text-2xl font-black">{expense ? 'Cập nhật chi tiêu' : 'Ghi nhận chi tiêu'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handlePreSubmit} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Tiêu đề khoản chi</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="VD: Đi siêu thị Winmart, Tiền điện..."
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-lg"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Số tiền (VND)</label>
              <input
                required
                type="number"
                min="1000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Ngày chi (tháng/ngày/năm)</label>
              <input
                required
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Ai đã trả tiền?</label>
              <div className="relative">
                <select
                  value={formData.paidByEmail}
                  onChange={(e) => setFormData({ ...formData, paidByEmail: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 appearance-none bg-white"
                >
                  {user.family?.members?.map((member: any) => (
                    <option key={member.id} value={member.email}>
                      {member.fullName} ({member.email})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Người tham gia hưởng lợi</label>
            <div className="flex flex-wrap gap-3">
              {user.family?.members?.map((member: any) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleParticipant(member.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all font-bold text-sm",
                    formData.participantIDs.includes(member.id)
                      ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                    formData.participantIDs.includes(member.id) ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                  )}>
                    {formData.participantIDs.includes(member.id) && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
                  </div>
                  {member.fullName}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400 font-medium">* Số tiền sẽ được chia đều cho những người được chọn.</p>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-all"
            >
              Hủy
            </button>
            <button
              disabled={loading || formData.participantIDs.length < 2}
              type="submit"
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 font-bold text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (expense ? 'Lưu thay đổi' : 'Tạo khoản chi')}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title={expense ? 'Cập nhật khoản chi?' : 'Tạo khoản chi mới?'}
        message={expense ? 'Bạn có chắc muốn lưu các thay đổi cho khoản chi này?' : 'Hệ thống sẽ ghi nhận khoản chi mới và chia đều cho các thành viên được chọn.'}
        confirmText="Xác nhận"
        type="info"
        isLoading={loading}
      />
    </div>
  );
}
