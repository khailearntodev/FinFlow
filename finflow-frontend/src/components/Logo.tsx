'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
}

export const Logo = ({ className, variant = 'full' }: LogoProps) => {
  if (variant === 'icon') {
    return (
      <div className={cn("relative h-14 w-14 overflow-hidden flex items-center justify-center bg-white rounded-2xl shadow-md border border-slate-100", className)}>
        <div className="relative h-full w-[250%]">
          <Image
            src="/finflow-logo.png"
            alt="FinFlow Icon"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-16 w-full max-w-[224px] flex items-center", className)}>
      <Image
        src="/finflow-logo.png"
        alt="FinFlow Logo"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  );
};
