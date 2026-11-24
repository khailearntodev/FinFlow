'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { familyService, getErrorMessage } from '@/services/api';
import { Plus, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

interface CreateFamilyFormProps {
  onSuccess?: () => void;
  redirectOnSuccess?: string;
}

export const CreateFamilyForm = ({ onSuccess, redirectOnSuccess }: CreateFamilyFormProps) => {
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
        creatorEmail: user.email,
      });
      await refreshUser();
      showToast('Tạo gia đình thành công!', 'success');

      if (onSuccess) onSuccess();
      if (redirectOnSuccess) router.push(redirectOnSuccess);
    } catch (error: any) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl mx-auto py-4 sm:py-8"
    >
      <div className="ff-surface p-6 sm:p-10 shadow-card">
        <header className="mb-8">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-input bg-accent-soft text-accent mb-4">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Bắt đầu gia đình mới
          </h1>
          <p className="mt-2 text-sm text-muted">
            Tạo không gian chung để quản lý chi tiêu và chốt sổ định kỳ cùng mọi người.
          </p>
        </header>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label htmlFor="family-name" className="block text-sm font-medium text-ink-2 mb-2">
              Tên gia đình
            </label>
            <input
              id="family-name"
              required
              type="text"
              placeholder="VD: Gia đình Hạnh Phúc, Căn hộ 402..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ff-input text-base font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-2">
                Ngày chốt sổ hàng tháng (1 đến 28)
              </label>
              <span className="font-outlier text-sm font-medium text-accent num">
                Ngày {billingDate}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2" role="radiogroup" aria-label="Ngày chốt sổ hàng tháng">
              {Array.from({ length: 28 }, (_, i) => i + 1).map((date) => {
                const isSelected = billingDate === date.toString();
                return (
                  <button
                    key={date}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setBillingDate(date.toString())}
                    className={cn(
                      'h-10 rounded-input font-outlier text-sm font-medium num transition-colors',
                      isSelected
                        ? 'bg-accent text-accent-ink border border-accent-deep'
                        : 'bg-paper-2 text-ink-2 border border-transparent hover:border-rule-strong hover:text-ink'
                    )}
                  >
                    {date}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted">
              Vào ngày này, hệ thống sẽ tự động tổng hợp công nợ cho tất cả thành viên.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="ff-btn-primary w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                <span>Đang khởi tạo…</span>
              </>
            ) : (
              'Xác nhận tạo gia đình'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
