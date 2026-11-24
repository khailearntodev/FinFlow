'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Search,
  Activity,
  User,
  Clock,
  Database,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 10;

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [jumpInput, setJumpInput] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const items: (number | 'ellipsis')[] = [0];
    const start = Math.max(1, page - 1);
    const end = Math.min(totalPages - 2, page + 1);
    if (start > 1) items.push('ellipsis');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < totalPages - 2) items.push('ellipsis');
    items.push(totalPages - 1);
    return items;
  }, [page, totalPages]);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(jumpInput, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.min(Math.max(parsed, 1), Math.max(totalPages, 1));
    setPage(clamped - 1);
    setJumpInput('');
  };

  // Map member UUID -> display name so we never expose raw UUIDs
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    user?.family?.members?.forEach((m: any) => {
      if (m.id) {
        map.set(String(m.id).toLowerCase(), m.fullName || m.email);
      }
    });
    return map;
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.family?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await auditService.getLogs(
          user.family.id,
          page,
          PAGE_SIZE,
          debouncedSearch
        );
        const data = response.data;
        if (Array.isArray(data)) {
          setLogs(data);
          setTotalElements(data.length);
          setTotalPages(data.length > 0 ? 1 : 0);
        } else {
          setLogs(data.content || []);
          setTotalElements(data.totalElements ?? 0);
          setTotalPages(data.totalPages ?? 0);
        }
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user, page, debouncedSearch]);

  const actionLabel = (action: string) => {
    if (action === 'CREATE') return 'Tạo mới';
    if (action === 'UPDATE') return 'Cập nhật';
    if (action === 'DELETE') return 'Xóa';
    return action;
  };

  const statusLabel = (status: string) => {
    if (status === 'PENDING') return 'Chờ chốt sổ';
    if (status === 'SETTLED') return 'Đã chốt sổ';
    return status;
  };

  const renderValues = (jsonStr: string) => {
    if (!jsonStr) return null;
    try {
      const data = JSON.parse(jsonStr);
      const labelMap: Record<string, string> = {
        title: 'Tiêu đề',
        amount: 'Số tiền',
        status: 'Trạng thái',
        expenseDate: 'Ngày chi',
        paidByEmail: 'Người trả',
        paidByUserId: 'Người trả',
        participants: 'Người hưởng lợi',
        participantIDs: 'Người hưởng lợi',
      };

      const entries = Object.entries(data)
        .map(([key, value]: [string, any]) => {
          // Never show internal ID fields unless resolvable to a human name
          if (key === 'id' || key === 'familyId' || key === 'expenseId') {
            return null;
          }

          let formattedValue: string | null = null;

          if (key === 'paidByUserId') {
            const resolved = memberNameById.get(String(value).toLowerCase());
            if (!resolved) return null;
            formattedValue = resolved;
          } else if (key === 'amount' && !Number.isNaN(Number(value))) {
            formattedValue = formatCurrency(Number(value));
          } else if (key === 'status' && typeof value === 'string') {
            formattedValue = statusLabel(value);
          } else if (Array.isArray(value)) {
            const names = value
              .map((item) => {
                if (typeof item === 'string' && UUID_REGEX.test(item)) {
                  return memberNameById.get(item.toLowerCase()) || null;
                }
                return typeof item === 'string' ? item : null;
              })
              .filter(Boolean);
            formattedValue =
              names.length > 0 && names.length === value.length
                ? `${value.length} người (${names.join(', ')})`
                : `${value.length} người`;
          } else if (typeof value === 'string' && UUID_REGEX.test(value)) {
            const resolved = memberNameById.get(value.toLowerCase());
            if (!resolved) return null;
            formattedValue = resolved;
          } else if (value !== null && value !== undefined) {
            formattedValue = String(value);
          }

          if (!formattedValue) return null;
          return { key, label: labelMap[key] || key, value: formattedValue };
        })
        .filter(Boolean) as { key: string; label: string; value: string }[];

      if (entries.length === 0) return null;

      return (
        <dl className="space-y-1.5 mt-2">
          {entries.map((entry) => (
            <div key={entry.key} className="flex items-start gap-2 text-xs">
              <dt className="font-medium text-muted min-w-[104px] shrink-0">
                {entry.label}:
              </dt>
              <dd className="font-medium text-ink break-words num">
                {entry.value}
              </dd>
            </div>
          ))}
        </dl>
      );
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
          Lịch sử hoạt động
        </h1>
        <p className="mt-1 text-sm text-muted">
          Theo dõi toàn bộ thao tác tạo, chỉnh sửa và xóa dữ liệu tài chính trong gia đình.
        </p>
      </header>

      <section className="ff-surface shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-rule bg-paper-2/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent" aria-hidden="true" />
            <h2 className="font-display text-base font-bold text-ink num">
              Nhật ký đối soát ({totalElements})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
              aria-hidden="true"
            />
            <input
              type="text"
              aria-label="Tìm kiếm nhật ký"
              placeholder="Tìm theo thao tác, người thực hiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ff-input pl-10"
            />
          </div>
        </div>

        <div className="divide-y divide-rule">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2
                className="h-6 w-6 animate-spin text-accent mx-auto motion-reduce:animate-none"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm text-muted">Đang tải nhật ký hoạt động…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center px-6">
              <Database className="h-8 w-8 text-muted mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-ink-2">
                Không tìm thấy hoạt động nào khớp với từ khóa
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <article
                key={log.id}
                className="px-6 py-5 hover:bg-paper-2/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold',
                        log.action === 'CREATE'
                          ? 'bg-success-soft text-success-ink'
                          : log.action === 'UPDATE'
                            ? 'bg-warning-soft text-warning-ink'
                            : 'bg-error-soft text-error-ink'
                      )}
                    >
                      {actionLabel(log.action)}
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {log.entityName === 'expenses' ? 'Khoản chi' : log.entityName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-outlier text-xs text-muted num">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <time dateTime={log.createdAt}>
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </time>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-2 text-xs text-muted">
                  <User className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-ink-2">{log.userFullName}</span>
                  <span>({log.userEmail})</span>
                </div>

                {(log.oldValues || log.newValues) && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {log.oldValues && (
                      <div className="p-4 rounded-input bg-paper-2">
                        <p className="text-xs font-semibold text-muted">
                          {log.action === 'CREATE'
                            ? 'Thông tin ban đầu'
                            : log.action === 'DELETE'
                              ? 'Dữ liệu trước khi xóa'
                              : 'Giá trị cũ'}
                        </p>
                        {renderValues(log.oldValues)}
                      </div>
                    )}
                    {log.newValues && (
                      <div className="p-4 rounded-input bg-accent-soft/55">
                        <p className="text-xs font-semibold text-accent">
                          {log.action === 'CREATE'
                            ? 'Dữ liệu đã tạo'
                            : 'Giá trị mới'}
                        </p>
                        {renderValues(log.newValues)}
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <nav
            aria-label="Phân trang lịch sử"
            className="px-6 py-4 border-t border-rule bg-paper-2/40 flex flex-col lg:flex-row items-center justify-between gap-4"
          >
            <p className="text-xs text-muted num">
              Trang <strong className="font-semibold text-ink">{page + 1}</strong> / {totalPages} ({totalElements} hoạt động)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="ff-btn-secondary px-3"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Trước</span>
              </button>

              <div className="flex items-center gap-1">
                {visiblePages.map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 text-xs text-muted select-none"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      disabled={loading}
                      aria-current={page === item ? 'page' : undefined}
                      onClick={() => setPage(item)}
                      className={cn(
                        'min-w-[38px] min-h-[38px] px-2.5 rounded-input font-outlier text-xs font-medium num transition-colors',
                        page === item
                          ? 'bg-accent text-accent-ink border border-accent-deep'
                          : 'bg-surface text-ink-2 border border-rule hover:border-rule-strong hover:text-ink'
                      )}
                    >
                      {item + 1}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                disabled={page + 1 >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="ff-btn-secondary px-3"
              >
                <span>Sau</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 sm:ml-2 sm:pl-3 sm:border-l sm:border-rule">
                <label htmlFor="audit-jump-page" className="text-xs text-muted whitespace-nowrap">
                  Đến trang
                </label>
                <input
                  id="audit-jump-page"
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder={String(page + 1)}
                  className="ff-input w-16 min-h-[38px] px-2.5 py-1 text-center font-outlier text-xs num [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="submit"
                  disabled={loading || !jumpInput.trim()}
                  className="ff-btn-secondary min-h-[38px] px-3 text-xs"
                >
                  Đi
                </button>
              </form>
            </div>
          </nav>
        )}
      </section>
    </motion.div>
  );
}
