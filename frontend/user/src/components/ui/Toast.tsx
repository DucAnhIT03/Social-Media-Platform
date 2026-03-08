'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToastStore } from '@/store/useToastStore';

export function Toast() {
  const { open, message, type, hide } = useToastStore();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => hide(), 2500);
    return () => clearTimeout(t);
  }, [open, hide]);

  if (!open) return null;

  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div
        className={cn(
          'px-4 py-3 rounded-lg shadow-lg text-sm font-medium border backdrop-blur',
          type === 'success' &&
            'bg-green-50/90 dark:bg-green-900/30 text-green-700 dark:text-green-200 border-green-200 dark:border-green-800',
          type === 'error' &&
            'bg-red-50/90 dark:bg-red-900/30 text-red-700 dark:text-red-200 border-red-200 dark:border-red-800',
          type === 'info' &&
            'bg-white/90 dark:bg-[#242526]/90 text-[#050505] dark:text-[#E4E6EB] border-[#E4E6EB] dark:border-[#3E4042]',
        )}
      >
        {message}
      </div>
    </div>
  );
}

