'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StyledContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function StyledContainer({ children, className }: StyledContainerProps) {
  return (
    <div className={cn('fo-container', className)}>
      {children}
    </div>
  );
}