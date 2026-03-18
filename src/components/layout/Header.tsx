'use client';

import { RefreshCw, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  lastRefreshed?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function Header({ lastRefreshed, isLoading, onRefresh }: HeaderProps) {
  const formattedTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900 text-white shadow-md">
      <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <Warehouse className="h-6 w-6 text-green-400" />
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              Wiom Warehouse
            </p>
            <h1 className="text-base font-bold leading-tight">
              Delhi-Saket · Inventory Dashboard
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {formattedTime && (
            <p className="hidden text-xs text-slate-400 sm:block">
              Last synced: <span className="text-slate-200">{formattedTime} IST</span>
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isLoading}
            className="border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            {isLoading ? 'Syncing…' : 'Refresh'}
          </Button>
        </div>
      </div>
    </header>
  );
}
