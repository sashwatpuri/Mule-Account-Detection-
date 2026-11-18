import React from 'react';
import { Database, Wifi, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_CONFIG } from '@/config/apiConfig';

interface DataSourceIndicatorProps {
  isLive?: boolean;
  error?: string | null;
  className?: string;
  showDetails?: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  isLive = false,
  error = null,
  className,
  showDetails = false,
}) => {
  const isConfigured = API_CONFIG.isConfigured();

  if (isLive) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400',
          className
        )}
        title={`Connected to backend API at ${API_CONFIG.BASE_URL}`}
      >
        <Wifi className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-medium text-emerald-300">Live Backend Connected</span>
        {showDetails && (
          <span className="text-[10px] text-emerald-500/80 font-mono hidden sm:inline">
            ({API_CONFIG.BASE_URL})
          </span>
        )}
      </div>
    );
  }

  if (isConfigured && error) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300',
          className
        )}
        title={error}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span className="font-medium">Backend Offline</span>
          <span className="text-[10px] text-amber-400/80 hidden sm:inline">
            (Using baseline development cohort)
          </span>
        </div>
      </div>
    );
  }

  // Offline development mock mode
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111C33] border border-white/8 text-xs text-slate-300',
        className
      )}
      title="Development mode using RBIH stratified evaluation cohort mock data"
    >
      <Database className="h-3.5 w-3.5 text-blue-400" />
      <span className="text-slate-400">Data Source:</span>
      <span className="font-semibold text-slate-200">Offline Development Mock</span>
      <span className="hidden md:inline-flex items-center px-1.5 py-0.2 text-[10px] rounded bg-white/5 text-slate-400 border border-white/5">
        RBIH Cohort
      </span>
    </div>
  );
};
