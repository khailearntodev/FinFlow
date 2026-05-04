'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { 
  History, 
  Search, 
  Filter, 
  Activity,
  User,
  Clock,
  ArrowRight,
  Database,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      if (!user?.family?.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await auditService.getLogs(user.family.id);
        setLogs(response.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error('Failed to fetch audit logs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [user]);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.userFullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderValues = (jsonStr: string) => {
    if (!jsonStr) return null;
    try {
      const data = JSON.parse(jsonStr);
      return (
        <div className="space-y-1 mt-1">
          {Object.entries(data).map(([key, value]: [string, any]) => {
            // Format labels for common keys
            const labelMap: Record<string, string> = {
              title: 'Tiêu đề',
              amount: 'Số tiền',
              expenseDate: 'Ngày chi',
              paidByEmail: 'Người trả',
              participantIDs: 'Người hưởng lợi'
            };
            const label = labelMap[key] || key;
            
            return (
              <div key={key} className="flex items-start gap-2 text-[11px]">
                <span className="font-black text-slate-400 min-w-[80px]">{label}:</span>
                <span className="font-bold break-all">{Array.isArray(value) ? `${value.length} người` : value}</span>
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return <pre className="text-[10px] opacity-50">{jsonStr}</pre>;
    }
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Lịch sử hoạt động</h1>
        <p className="mt-2 text-slate-500 font-medium">Theo dõi mọi thay đổi liên quan đến dữ liệu tài chính.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Nhật ký hệ thống</h2>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 font-medium">
              Không tìm thấy hoạt động nào khớp với tìm kiếm.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors flex items-start gap-6 group">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                  log.action === 'CREATE' ? "bg-emerald-100 text-emerald-600" :
                  log.action === 'UPDATE' ? "bg-amber-100 text-amber-600" :
                  "bg-rose-100 text-rose-600"
                )}>
                  <Database className="h-6 w-6" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">
                      <span className={cn(
                        "font-black mr-2",
                        log.action === 'CREATE' ? "text-emerald-600" :
                        log.action === 'UPDATE' ? "text-amber-600" :
                        "text-rose-600"
                      )}>
                        {log.action}
                      </span>
                      {log.entityName === 'expenses' ? 'Khoản chi' : log.entityName}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <User className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="font-bold text-slate-900">{log.userFullName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({log.userEmail})</span>
                      </div>
                    </div>

                  {(log.oldValues || log.newValues) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {log.oldValues && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {log.action === 'CREATE' ? 'Thông tin ban đầu' : 
                             log.action === 'DELETE' ? 'Dữ liệu trước khi xóa' : 
                             'Giá trị cũ'}
                          </p>
                          {renderValues(log.oldValues)}
                        </div>
                      )}
                      {log.newValues && (
                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                            {log.action === 'CREATE' ? 'Dữ liệu đã tạo' : 'Giá trị mới'}
                          </p>
                          {renderValues(log.newValues)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
