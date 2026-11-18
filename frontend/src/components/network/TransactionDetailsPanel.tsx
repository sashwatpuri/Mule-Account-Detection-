import React from 'react';
import { X, ArrowRight, Clock, IndianRupee } from 'lucide-react';
import { TransactionEdgePayload } from '@/mock/networkGraphData';
import { formatINR } from '@/mock/overviewData';

interface TransactionDetailsPanelProps {
  transaction: TransactionEdgePayload | null;
  onClose: () => void;
}

export const TransactionDetailsPanel: React.FC<TransactionDetailsPanelProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  return (
    <div className="absolute left-4 bottom-4 z-20 w-80 sm:w-84 rounded-xl border border-white/10 bg-[#0D1527]/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span className="text-xs font-semibold text-white">
            Transaction Connection
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Close details"
          aria-label="Close details"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Source to Target Flow */}
      <div className="py-2.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex-1 p-2 rounded-lg bg-[#111C33] border border-white/5 truncate">
          <span className="text-[10px] text-slate-400 block uppercase">Source Account</span>
          <span className="font-mono font-bold text-slate-200 truncate block">
            {transaction.sourceAccount}
          </span>
        </div>

        <ArrowRight className="h-4 w-4 text-blue-400 shrink-0" />

        <div className="flex-1 p-2 rounded-lg bg-[#111C33] border border-white/5 truncate">
          <span className="text-[10px] text-slate-400 block uppercase">Destination Account</span>
          <span className="font-mono font-bold text-slate-200 truncate block">
            {transaction.targetAccount}
          </span>
        </div>
      </div>

      {/* Transaction Amount & Timestamp */}
      <div className="space-y-1.5 pt-1 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#111C33]/60">
          <span className="flex items-center gap-1.5 text-slate-400">
            <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
            Transfer Amount:
          </span>
          <span className="font-mono font-bold text-emerald-300">
            {formatINR(transaction.amount)}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#111C33]/60">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-3.5 w-3.5 text-blue-400" />
            Timestamp:
          </span>
          <span className="font-mono text-slate-300 text-[11px]">
            {transaction.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};
