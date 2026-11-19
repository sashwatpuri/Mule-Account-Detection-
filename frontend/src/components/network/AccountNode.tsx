import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { AccountNodePayload } from '@/mock/networkGraphData';
import { cn } from '@/lib/utils';

interface ExtendedAccountNodeData extends AccountNodePayload {
  isSelected?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

export const AccountNode: React.FC<NodeProps> = memo(({ data }) => {
  const nodeData = data as unknown as ExtendedAccountNodeData;
  const {
    accountId,
    riskLevel,
    totalTransactions,
    isCentralHub,
    isSelected,
    isHighlighted,
    isDimmed,
  } = nodeData;

  const isHigh = riskLevel === 'High';
  const isMed = riskLevel === 'Medium';

  // Risk-based color palette
  const getTheme = () => {
    if (isHigh) {
      return {
        border: 'border-red-500/70',
        activeBorder: 'border-red-400 ring-2 ring-red-500/50',
        bg: 'bg-[#150d18]',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30',
        icon: <ShieldAlert className="h-3.5 w-3.5 text-red-400" />,
        dot: 'bg-red-400',
      };
    }
    if (isMed) {
      return {
        border: 'border-amber-500/70',
        activeBorder: 'border-amber-400 ring-2 ring-amber-500/50',
        bg: 'bg-[#18150d]',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
        dot: 'bg-amber-400',
      };
    }
    return {
      border: 'border-emerald-500/70',
      activeBorder: 'border-emerald-400 ring-2 ring-emerald-500/50',
      bg: 'bg-[#0d1814]',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />,
      dot: 'bg-emerald-400',
    };
  };

  const theme = getTheme();

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-3 text-slate-100 shadow-xl transition-all duration-200 select-none cursor-pointer',
        theme.bg,
        isSelected
          ? cn(theme.activeBorder, 'shadow-lg shadow-blue-500/20 scale-105 z-20')
          : isHighlighted
          ? cn(theme.border, 'ring-1 ring-blue-400/60 z-10 scale-[1.02]')
          : cn(theme.border, 'hover:scale-[1.02] hover:border-white/40'),
        isDimmed && 'opacity-25 blur-[0.2px] scale-95 pointer-events-none',
        isCentralHub ? 'min-w-[160px]' : 'min-w-[140px]'
      )}
    >
      {/* Target Handle on the left */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-[#0B111E] !bg-blue-400 hover:!scale-125 transition-transform"
      />

      {/* Target Handle on top for complex routing */}
      <Handle
        type="target"
        position={Position.Top}
        id="t-top"
        className="!h-2 !w-2 !border-2 !border-[#0B111E] !bg-slate-400 opacity-60"
      />

      {/* Node Header: Risk Icon + Risk Badge */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full shrink-0', theme.dot, isHigh && 'animate-pulse')} />
          {theme.icon}
        </div>
        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border', theme.badgeBg)}>
          {riskLevel}
        </span>
      </div>

      {/* Node Body: Account ID */}
      <div className="py-1.5">
        <span className="block font-mono text-xs font-bold text-white tracking-tight truncate">
          {accountId}
        </span>
      </div>

      {/* Node Footer: Transaction count pill */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3 text-slate-500" />
          <span>Txns:</span>
        </span>
        <span className="font-mono font-semibold text-slate-200">
          {totalTransactions}
        </span>
      </div>

      {/* Central Hub Badge (if marked) */}
      {isCentralHub && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-blue-600 border border-blue-400 text-[9px] font-bold uppercase text-white shadow-md">
          Mule Hub
        </div>
      )}

      {/* Source Handle on the right */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-[#0B111E] !bg-blue-400 hover:!scale-125 transition-transform"
      />

      {/* Source Handle on bottom for complex routing */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="s-bottom"
        className="!h-2 !w-2 !border-2 !border-[#0B111E] !bg-slate-400 opacity-60"
      />
    </div>
  );
});

AccountNode.displayName = 'AccountNode';
