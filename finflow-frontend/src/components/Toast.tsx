'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
    setTimeout(() => onClose(id), 220);
  };

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />,
    error: <AlertCircle className="h-5 w-5 text-error" aria-hidden="true" />,
    info: <Info className="h-5 w-5 text-info" aria-hidden="true" />,
    loading: <Loader2 className="h-5 w-5 text-accent animate-spin motion-reduce:animate-none" aria-hidden="true" />,
  };

  const surfaceStyles = {
    success: 'bg-surface border-success/40 text-ink',
    error: 'bg-surface border-error/40 text-ink',
    info: 'bg-surface border-info/40 text-ink',
    loading: 'bg-surface border-rule-strong text-ink',
  };

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={isExiting ? { opacity: 0, x: 24, scale: 0.98 } : { opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 min-w-[300px] max-w-md rounded-card border shadow-lift',
        surfaceStyles[type]
      )}
    >
      <div className="shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink leading-snug">{message}</p>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Đóng thông báo"
        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-input text-muted hover:bg-paper-2 hover:text-ink transition-colors"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
};
