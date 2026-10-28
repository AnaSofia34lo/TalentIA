'use client';

import React from 'react';
import { TalentIAMark } from './TalentIAMark';

interface TalentIALogoProps {
  variant?: 'full' | 'mark' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  subtitle?: string;
}

export function TalentIALogo({
  variant = 'full',
  size = 'md',
  className = '',
  subtitle,
}: TalentIALogoProps) {
  const sizeMap = {
    sm: { img: 28, text: 'text-lg', sub: 'text-[9.5px]' },
    md: { img: 36, text: 'text-xl', sub: 'text-[10.5px]' },
    lg: { img: 44, text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 56, text: 'text-3xl', sub: 'text-sm' },
  }[size];

  if (variant === 'mark' || variant === 'badge') {
    return (
      <div
        className={`relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden rounded-[10px] shadow-sm select-none ${className}`}
        style={{ width: `${sizeMap.img}px`, height: `${sizeMap.img}px` }}
      >
        <TalentIAMark className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className="relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden rounded-[10px] shadow-sm"
        style={{ width: `${sizeMap.img}px`, height: `${sizeMap.img}px` }}
      >
        <TalentIAMark className="w-full h-full" />
      </div>

      <div className="flex flex-col">
        <div
          className={`brand-name font-black tracking-tight leading-none ${sizeMap.text}`}
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          <span style={{ color: 'var(--ink)' }}>Talent</span>
          <span style={{ color: 'var(--purple)' }}>IA</span>
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'var(--ink-faint)',
              letterSpacing: '0.03em',
              marginTop: '1px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
