import React from 'react';
import { Network, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GraphLegend } from './GraphLegend';

export const NetworkAnalysisHeader: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/8">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Network Analysis
              </h1>
              <Badge variant="default" size="sm">
                Interactive Graph
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Explore financial connections between accounts and identify potentially suspicious transaction relationships.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <GraphLegend />

        <div className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111C33] border border-white/8 text-xs text-slate-400">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>Topology:</span>
          <span className="font-semibold text-slate-200">12 Nodes &bull; 12 Directed Flows</span>
        </div>
      </div>
    </div>
  );
};
