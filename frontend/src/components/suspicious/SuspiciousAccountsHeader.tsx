import React from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SuspiciousAccountsHeaderProps {
  totalFlaggedCount: number;
  filteredCount: number;
  totalLoaded: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const SuspiciousAccountsHeader: React.FC<SuspiciousAccountsHeaderProps> = ({
  totalFlaggedCount,
  filteredCount,
  totalLoaded,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Suspicious Accounts
          </h1>
          <Badge variant="high" size="sm" dot>
            {totalFlaggedCount.toLocaleString('en-IN')} Accounts Flagged
          </Badge>
          {filteredCount !== totalLoaded && (
            <Badge variant="secondary" size="sm" className="text-slate-300">
              Showing {filteredCount} matching
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Review and investigate accounts flagged by the mule account detection model.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111C33] border border-white/8 text-xs text-slate-400">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>Decision Tree Queue:</span>
          <span className="font-semibold text-slate-200">Stratified Test Baseline</span>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-1.5 text-xs border-white/10 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Queue'}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
