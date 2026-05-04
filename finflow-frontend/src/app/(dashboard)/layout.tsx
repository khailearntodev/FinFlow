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
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 lg:ml-72 p-4 pt-20 lg:p-10 transition-all duration-300">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
