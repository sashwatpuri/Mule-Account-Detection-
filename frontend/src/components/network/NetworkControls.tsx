import React from 'react';
import { Search, X, Maximize2, RotateCcw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NetworkControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRiskFilter: string; // 'all' | 'high' | 'medium' | 'low'
  onRiskFilterChange: (level: string) => void;
  onResetGraph: () => void;
  onFitView: () => void;
  nodeCount: number;
  edgeCount: number;
}

export const NetworkControls: React.FC<NetworkControlsProps> = ({
  searchQuery,
  onSearchChange,
  selectedRiskFilter,
  onRiskFilterChange,
  onResetGraph,
  onFitView,
  nodeCount,
  edgeCount,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111C33] border border-white/8 shadow-sm">
      {/* Left: Search input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search node by Account ID (e.g. 7842)..."
          className="h-9 w-full rounded-lg border border-white/10 bg-[#0D1527] pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Center & Right: Risk Filters & Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Risk Level Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0D1527] border border-white/5 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5 mr-0.5" />
          <button
            onClick={() => onRiskFilterChange('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedRiskFilter === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onRiskFilterChange('high')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedRiskFilter === 'high'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Risk
          </button>
          <button
            onClick={() => onRiskFilterChange('medium')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedRiskFilter === 'medium'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Medium Risk
          </button>
          <button
            onClick={() => onRiskFilterChange('low')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              selectedRiskFilter === 'low'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Low Risk
          </button>
        </div>

        {/* View Controls: Fit View & Reset Graph */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onFitView}
          className="h-9 gap-1.5 text-xs text-slate-300 hover:text-white"
          title="Fit graph to view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Fit View</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onResetGraph}
          className="h-9 gap-1.5 text-xs border-white/10 text-slate-300 hover:text-white"
          title="Reset graph zoom and selection"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Graph</span>
        </Button>

        {/* Node & Edge Counts Badge */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 text-xs text-slate-500 font-mono">
          <span>{nodeCount} Nodes</span>
          <span>&bull;</span>
          <span>{edgeCount} Edges</span>
        </div>
      </div>
    </div>
  );
};
