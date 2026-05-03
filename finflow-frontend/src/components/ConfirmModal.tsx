'use client';

import { X, AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'info' | 'success' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy'
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      btnBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
    },
    danger: {
      icon: AlertCircle,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      btnBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-100',
    },
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
    },
    info: {
      icon: HelpCircle,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100',
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md transform overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-2xl transition-all animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={cn("mb-6 h-20 w-20 rounded-3xl flex items-center justify-center", config.iconBg, config.iconColor)}>
            <Icon className="h-10 w-10" />
          </div>

          <h3 className="text-2xl font-black text-slate-900 leading-tight">
            {title}
          </h3>
          
          <p className="mt-4 text-slate-600 font-medium leading-relaxed">
            {message}
          </p>

          <div className="mt-10 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 font-bold text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "flex-[1.5] px-6 py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95",
                config.btnBg
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
