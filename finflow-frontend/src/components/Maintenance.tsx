'use client';

import { Construction, Timer, Settings2, Hammer } from 'lucide-react';

export function Maintenance() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-12">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl relative flex items-center justify-center">
              <Construction className="h-20 w-20 text-indigo-400 animate-bounce" />
              <div className="absolute -top-2 -right-2">
                <Settings2 className="h-10 w-10 text-emerald-400 animate-spin-slow" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
            Hệ thống đang <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
              Bảo trì định kỳ
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            FinFlow đang được nâng cấp để mang lại trải nghiệm quản lý tài chính gia đình tốt hơn. Chúng tôi sẽ quay lại sớm!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
            <Timer className="h-6 w-6 text-indigo-400 mb-3 mx-auto" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Thời gian dự kiến</p>
            <p className="text-white font-bold mt-1">30 Phút</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl group hover:border-emerald-500/50 transition-all">
            <Hammer className="h-6 w-6 text-emerald-400 mb-3 mx-auto" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nâng cấp</p>
            <p className="text-white font-bold mt-1">Tối ưu hóa DB</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-6 rounded-3xl group hover:border-indigo-500/50 transition-all">
            <Settings2 className="h-6 w-6 text-indigo-400 mb-3 mx-auto" />
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Phiên bản</p>
            <p className="text-white font-bold mt-1">v2.1.0-stable</p>
          </div>
        </div>

        <div className="pt-8">
          <p className="text-slate-500 text-sm font-bold flex items-center justify-center gap-2">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            Đội ngũ kỹ thuật đang làm việc hết công suất
          </p>
        </div>
      </div>
    </div>
  );
}
