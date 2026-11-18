import React from 'react';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SuspiciousAccountsFilterState } from '@/mock/suspiciousAccountsData';

interface AccountFiltersProps {
  filters: SuspiciousAccountsFilterState;
  onFilterChange: (newFilters: Partial<SuspiciousAccountsFilterState>) => void;
  onResetFilters: () => void;
  isFiltered: boolean;
  resultCount: number;
  totalCount: number;
}

export const AccountFilters: React.FC<AccountFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  isFiltered,
  resultCount,
  totalCount,
}) => {
  return (
    <div className="rounded-xl bg-[#111C33] border border-white/8 p-4 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search by Account ID */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="Search by Account ID (e.g. ACC-MULE-7842)..."
            className="h-9 w-full rounded-lg border border-white/10 bg-[#0D1527] pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              Risk Level:
            </label>
            <select
              value={filters.riskLevel}
              onChange={(e) => onFilterChange({ riskLevel: e.target.value })}
              className="h-9 rounded-lg border border-white/10 bg-[#0D1527] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          {/* Risk Score Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              Risk Score:
            </label>
            <select
              value={filters.riskScoreRange}
              onChange={(e) => onFilterChange({ riskScoreRange: e.target.value })}
              className="h-9 rounded-lg border border-white/10 bg-[#0D1527] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Scores</option>
              <option value="75-100">75% – 100% (Critical)</option>
              <option value="50-75">50% – 75% (Elevated)</option>
              <option value="0-50">0% – 50% (Baseline)</option>
            </select>
          </div>

          {/* Transaction Volume Filter */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
              Volume:
            </label>
            <select
              value={filters.volumeRange}
              onChange={(e) => onFilterChange({ volumeRange: e.target.value })}
              className="h-9 rounded-lg border border-white/10 bg-[#0D1527] px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Volumes</option>
              <option value="high">High (&gt; ₹50 Lakhs)</option>
              <option value="medium">Medium (₹10L – ₹50L)</option>
              <option value="low">Low (&lt; ₹10 Lakhs)</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-9 gap-1.5 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:border-amber-500/50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active filters summary bar */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3 w-3 text-slate-500" />
          <span>
            Showing <strong className="text-white font-mono">{resultCount}</strong> of{' '}
            <span className="font-mono">{totalCount}</span> loaded sample accounts
          </span>
          {isFiltered && (
            <span className="text-amber-400 font-medium">
              (Filtered results active)
            </span>
          )}
        </div>
        <span className="hidden sm:inline text-slate-500">
          Search matches Account ID prefixes or full ID
        </span>
      </div>
    </div>
  );
};
