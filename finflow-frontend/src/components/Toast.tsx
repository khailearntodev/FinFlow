'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  onClose: (id: string) => void;
  duration?: number;
}

export const Toast = ({ id, message, type = 'info', onClose, duration = 5000 }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (type === 'loading') return;
    
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-emerald-500" />,
    error: <AlertCircle className="h-6 w-6 text-rose-500" />,
    info: <Info className="h-6 w-6 text-indigo-500" />,
    loading: <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-100',
    error: 'bg-rose-50 border-rose-100',
    info: 'bg-indigo-50 border-indigo-100',
    loading: 'bg-white border-slate-100',
  };

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 min-w-[320px] max-w-md rounded-2xl border shadow-2xl transition-all duration-300 transform",
        bgColors[type],
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100",
        "animate-in slide-in-from-right duration-300"
      )}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1">
        <p className={cn(
          "text-sm font-bold",
          type === 'error' ? "text-rose-900" : 
          type === 'success' ? "text-emerald-900" : 
          type === 'info' ? "text-indigo-900" : "text-slate-900"
        )}>
          {message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X className="h-5 w-5 text-slate-400" />
      </button>
    </div>
  );
};
