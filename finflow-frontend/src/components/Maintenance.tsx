'use client';

import { Construction, Timer, Settings2, Wrench } from 'lucide-react';

export function Maintenance() {
  return (
    <div className="min-h-dvh bg-ink-band text-paper flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-10">
        <div className="space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-input bg-ink-band-2 border border-ink-band-rule text-accent-soft">
            <Construction className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-paper">
            Hệ thống đang bảo trì định kỳ
          </h1>
          <p className="text-base text-ink-band-muted leading-relaxed max-w-[54ch]">
            FinFlow đang được nâng cấp để mang lại trải nghiệm quản lý tài chính gia đình ổn định hơn. Chúng tôi sẽ quay lại sớm.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-ink-band-rule pt-8">
          <div className="rounded-card bg-ink-band-2 border border-ink-band-rule p-5">
            <Timer className="h-5 w-5 text-accent-soft mb-3" aria-hidden="true" />
            <p className="text-xs text-ink-band-muted">Thời gian dự kiến</p>
            <p className="text-sm font-semibold text-paper mt-1">Liên hệ anh Khải nhóe</p>
          </div>
          <div className="rounded-card bg-ink-band-2 border border-ink-band-rule p-5">
            <Wrench className="h-5 w-5 text-accent-soft mb-3" aria-hidden="true" />
            <p className="text-xs text-ink-band-muted">Nội dung nâng cấp</p>
            <p className="text-sm font-semibold text-paper mt-1">Bảo trì định kỳ</p>
          </div>
          <div className="rounded-card bg-ink-band-2 border border-ink-band-rule p-5">
            <Settings2 className="h-5 w-5 text-accent-soft mb-3" aria-hidden="true" />
            <p className="text-xs text-ink-band-muted">Phiên bản</p>
            <p className="font-outlier text-sm font-medium text-paper mt-1">v2.1.0-stable</p>
          </div>
        </div>

        <p className="text-sm text-ink-band-muted">
          Liên hệ anh Khải để biết thêm thông tin chi tiết nhóe.
        </p>
      </div>
    </div>
  );
}
