'use client';

import { X } from 'lucide-react';
import { useApp } from '@/lib/store';

export function ErrorBanner() {
  const { error, setError } = useApp();
  if (!error) return null;
  return (
    <div role="alert" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div className="flex items-center justify-between p-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold">
        <span>{error}</span>
        <button onClick={() => setError(null)} aria-label="إغلاق">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
