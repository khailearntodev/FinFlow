'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { expenseService, getErrorMessage } from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { EXPENSE_CATEGORIES, getCategoryLabel } from '@/lib/categories';
import {
  Receipt,
  Plus,
  Search,
  Trash2,
  Edit3,
  ChevronDown,
  X,
  Loader2,
  Lock,
  Download,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/contexts/ToastContext';

function ExpensesContent() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount'>('newest');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);

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
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/expenses');
      }
    }
  }, [searchParams]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await expenseService.delete(user.family.id, confirmDelete.id, user.id);
      setExpenses(expenses.filter((e) => e.id !== confirmDelete.id));
      showToast('Đã xóa khoản chi thành công!', 'success');
      setConfirmDelete(null);
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!user?.family?.id || !selectedMonth) return;

    setExporting(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const response = await expenseService.exportExcel(
        user.family.id,
        month,
        year
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Chi_Tieu_Thang_${month}_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Đã tải xuống file Excel thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi xuất file Excel: ' + getErrorMessage(error), 'error');
    } finally {
      setExporting(false);
    }
  };

  const filteredExpenses = expenses
    .filter((e) => {
      const expenseMonth = e.expenseDate.slice(0, 7);
      const matchesMonth = !selectedMonth || expenseMonth === selectedMonth;
      const matchesSearch =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.paidByEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || (e.category || 'OTHER') === selectedCategory;
      return matchesMonth && matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest')
        return (
          new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
        );
      if (sortBy === 'oldest')
        return (
          new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()
        );
      if (sortBy === 'amount') return b.amount - a.amount;
      return 0;
    });

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Chi tiêu chung
          </h1>
          <p className="mt-1 text-sm text-muted">
            Danh sách các khoản chi tiêu của gia đình và trạng thái khóa sổ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || exporting || !user?.family?.id}
            className="ff-btn-secondary flex-1 sm:flex-none"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Download className="h-4 w-4" aria-hidden="true" />
            )}
            <span>Xuất Excel</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="ff-btn-primary flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Thêm khoản chi</span>
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              aria-label="Tìm kiếm chi tiêu"
              placeholder="Tìm theo tên khoản chi hoặc email người trả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ff-input pl-10"
            />
          </div>
          <input
            type="month"
            aria-label="Chọn tháng"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="ff-input w-full sm:w-auto font-outlier num"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative sm:w-48">
            <select
              aria-label="Lọc theo danh mục"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="ff-input appearance-none pr-10 font-medium"
            >
              <option value="ALL">Tất cả danh mục</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
              aria-hidden="true"
            />
          </div>

          <div className="relative sm:w-48">
            <select
              aria-label="Sắp xếp chi tiêu"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'amount')}
              className="ff-input appearance-none pr-10 font-medium"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="amount">Số tiền lớn nhất</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <section className="ff-surface shadow-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3.5 bg-paper-2/70 border-b border-rule text-xs text-muted">
          <span className="num">
            Hiển thị <strong className="font-semibold text-ink">{filteredExpenses.length}</strong> khoản chi
          </span>
          <span className="num">
            Tổng cộng:{' '}
            <strong className="font-display text-sm font-bold text-ink">
              {formatCurrency(filteredTotal)}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-rule bg-surface">
                <th className="px-5 py-3.5 text-xs font-semibold text-muted">Khoản chi</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-muted">Người chi</th>
                <th className="hidden sm:table-cell px-5 py-3.5 text-xs font-semibold text-muted">
                  Ngày chi
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-muted text-right">
                  Số tiền
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold text-muted text-center">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2
                      className="h-6 w-6 animate-spin text-accent mx-auto motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                    <p className="mt-3 text-sm text-muted">Đang tải dữ liệu chi tiêu…</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center px-6">
                    <Receipt className="h-8 w-8 text-muted mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm font-medium text-ink-2">
                      Không tìm thấy khoản chi nào khớp với bộ lọc
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Thử chọn tháng khác hoặc thêm khoản chi mới cho gia đình.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-paper-2/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink text-sm sm:text-base">
                        {expense.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {expense.status === 'SETTLED' && (
                          <span className="inline-flex items-center gap-1 rounded-pill bg-ink-band text-paper px-2 py-0.5 text-xs font-medium">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            <span>Đã chốt</span>
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-pill bg-accent-soft/70 text-accent px-2 py-0.5 text-xs font-medium">
                          {getCategoryLabel(expense.category)}
                        </span>
                        {expense.participants.map((p: string) => (
                          <span
                            key={p}
                            className="inline-flex items-center rounded-pill bg-paper-2 border border-rule px-2 py-0.5 text-xs text-ink-2"
                          >
                            {p.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 shrink-0 rounded-pill bg-accent-soft text-accent font-display font-bold text-xs flex items-center justify-center">
                          {expense.paidByEmail.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-ink-2 truncate max-w-[110px] md:max-w-[200px]">
                          {expense.paidByEmail}
                        </span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-4">
                      <span className="text-sm text-muted num">
                        {formatDate(expense.expenseDate)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display text-sm sm:text-base font-bold text-ink num">
                        {formatCurrency(expense.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {expense.status === 'PENDING' ? (
                          <>
                            <button
                              type="button"
                              aria-label={`Chỉnh sửa ${expense.title}`}
                              onClick={() => {
                                setEditingExpense(expense);
                                setIsModalOpen(true);
                              }}
                              className="flex h-10 w-10 items-center justify-center rounded-input text-muted hover:text-accent hover:bg-accent-soft/60 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Xóa ${expense.title}`}
                              onClick={() => setConfirmDelete({ id: expense.id })}
                              className="flex h-10 w-10 items-center justify-center rounded-input text-muted hover:text-error hover:bg-error-soft transition-colors"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        ) : (
                          <span
                            title="Khoản chi đã chốt sổ"
                            className="flex h-10 w-10 items-center justify-center text-muted"
                          >
                            <Lock className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
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
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Xóa khoản chi?"
        message="Bạn có chắc chắn muốn xóa khoản chi này khỏi hệ thống? Dữ liệu thanh toán liên quan sẽ được tính lại."
        confirmText="Xóa ngay"
        isLoading={loading}
      />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6" aria-busy="true">
          <div className="h-10 w-56 rounded-input bg-paper-3/70 animate-pulse motion-reduce:animate-none" />
          <div className="ff-surface h-72 animate-pulse motion-reduce:animate-none" />
        </div>
      }
    >
      <ExpensesContent />
    </Suspense>
  );
}

const ExpenseModal = ({ onClose, onSuccess, expense }: any) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: expense?.title || '',
    amount: expense?.amount || '',
    expenseDate: expense?.expenseDate || new Date().toISOString().split('T')[0],
    paidByEmail: expense?.paidByEmail || user.email,
    category: expense?.category || 'OTHER',
    participantIDs: expense?.participants
      ? user.family?.members
          ?.filter((m: any) => expense.participants.includes(m.email))
          .map((m: any) => m.id) || []
      : user.family?.members?.map((m: any) => m.id) || [],
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
        await expenseService.update(
          user.family.id,
          expense.id,
          formData,
          user.id
        );
        showToast('Đã cập nhật khoản chi!', 'success');
      } else {
        await expenseService.create(formData, user.id);
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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
      className="fixed inset-0 z-[400] overflow-y-auto bg-ink/45 p-4 flex items-start md:items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="w-full max-w-xl rounded-card bg-surface border border-rule shadow-lift overflow-hidden my-auto"
      >
        <div className="px-6 py-5 border-b border-rule flex items-center justify-between gap-4 bg-paper-2/60">
          <h2 id="expense-modal-title" className="font-display text-xl font-bold text-ink">
            {expense ? 'Cập nhật chi tiêu' : 'Ghi nhận chi tiêu'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="flex h-9 w-9 items-center justify-center rounded-input text-muted hover:bg-paper-3 hover:text-ink transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handlePreSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="exp-title" className="block text-sm font-medium text-ink-2 mb-1.5">
                Tiêu đề khoản chi
              </label>
              <input
                id="exp-title"
                required
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="VD: Đi siêu thị Winmart, Tiền điện..."
                className="ff-input font-medium"
              />
            </div>

            <div>
              <label htmlFor="exp-amount" className="block text-sm font-medium text-ink-2 mb-1.5">
                Số tiền (VND)
              </label>
              <input
                id="exp-amount"
                required
                type="number"
                min="1000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0"
                className="ff-input font-outlier font-medium num [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label htmlFor="exp-date" className="block text-sm font-medium text-ink-2 mb-1.5">
                Ngày chi
              </label>
              <input
                id="exp-date"
                required
                type="date"
                value={formData.expenseDate}
                onChange={(e) =>
                  setFormData({ ...formData, expenseDate: e.target.value })
                }
                className="ff-input font-outlier num"
              />
            </div>

            <div>
              <label htmlFor="exp-payer" className="block text-sm font-medium text-ink-2 mb-1.5">
                Người trả tiền
              </label>
              <div className="relative">
                <select
                  id="exp-payer"
                  value={formData.paidByEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, paidByEmail: e.target.value })
                  }
                  className="ff-input appearance-none pr-10 font-medium"
                >
                  {user.family?.members?.map((member: any) => (
                    <option key={member.id} value={member.email}>
                      {member.fullName} ({member.email})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="exp-category" className="block text-sm font-medium text-ink-2 mb-1.5">
                Danh mục chi tiêu
              </label>
              <div className="relative">
                <select
                  id="exp-category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="ff-input appearance-none pr-10 font-medium"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-2 mb-2.5">
              Người tham gia hưởng lợi
            </p>
            <div className="flex flex-wrap gap-2">
              {user.family?.members?.map((member: any) => {
                const selected = formData.participantIDs.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleParticipant(member.id)}
                    className={cn(
                      'inline-flex items-center gap-2 min-h-[40px] px-3.5 py-2 rounded-input border text-sm font-medium transition-colors',
                      selected
                        ? 'bg-accent-soft border-accent text-ink'
                        : 'bg-surface border-rule text-muted hover:border-rule-strong hover:text-ink'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border',
                        selected
                          ? 'border-accent bg-accent text-accent-ink'
                          : 'border-rule-strong'
                      )}
                      aria-hidden="true"
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                    <span>{member.fullName}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">
              Số tiền sẽ được chia đều cho ít nhất 2 thành viên được chọn.
            </p>
          </div>

          <div className="pt-3 border-t border-rule flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button type="button" onClick={onClose} className="ff-btn-secondary w-full sm:w-auto">
              Hủy
            </button>
            <button
              disabled={loading || formData.participantIDs.length < 2}
              type="submit"
              className="ff-btn-primary w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  <span>Đang lưu…</span>
                </>
              ) : expense ? (
                'Lưu thay đổi'
              ) : (
                'Tạo khoản chi'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmit}
        title={expense ? 'Cập nhật khoản chi?' : 'Tạo khoản chi mới?'}
        message={
          expense
            ? 'Bạn có chắc muốn lưu các thay đổi cho khoản chi này?'
            : 'Hệ thống sẽ ghi nhận khoản chi mới và chia đều cho các thành viên được chọn.'
        }
        confirmText="Xác nhận"
        type="info"
        isLoading={loading}
      />
    </motion.div>,
    document.body
  );
};
