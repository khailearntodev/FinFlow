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
      <div
        className={cn(
          'relative h-12 w-12 overflow-hidden flex items-center justify-center bg-surface rounded-input border border-rule',
          className
        )}
      >
        <div className="relative h-full w-[250%]">
          <Image
            src="/finflow-logo.png"
            alt="Biểu tượng FinFlow"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-12 w-full max-w-[180px] flex items-center', className)}>
      <Image
        src="/finflow-logo.png"
        alt="FinFlow"
        fill
        className="object-contain object-left"
        priority
      />
    </div>
  );
};
