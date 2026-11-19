import React from 'react';
import { ArrowRight } from 'lucide-react';

export const GraphLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4 px-3 py-2 rounded-lg bg-[#111C33] border border-white/8 text-xs text-slate-300">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Legend:
      </span>

      {/* High-Risk */}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 border border-red-400 shadow-sm shadow-red-500/50" />
        <span className="text-slate-300">High-Risk Mule</span>
      </div>

      {/* Medium-Risk */}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-amber-400 shadow-sm shadow-amber-500/50" />
        <span className="text-slate-300">Medium-Risk Account</span>
      </div>

      {/* Low-Risk */}
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-emerald-400 shadow-sm shadow-emerald-500/50" />
        <span className="text-slate-300">Low-Risk (Normal)</span>
      </div>

      {/* Directed Arrow */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 text-slate-400">
        <ArrowRight className="h-3.5 w-3.5 text-blue-400" />
        <span>Money Flow Direction</span>
      </div>
    </div>
  );
};
