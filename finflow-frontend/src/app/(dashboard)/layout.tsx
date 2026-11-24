'use client';

import { Sidebar } from '@/components/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh bg-paper text-ink">
        <Sidebar />
        <main className="flex-1 min-w-0 lg:ml-64 px-4 pt-20 pb-12 sm:px-6 lg:px-10 lg:pt-10">
          <div className="mx-auto w-full max-w-[1160px]">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
