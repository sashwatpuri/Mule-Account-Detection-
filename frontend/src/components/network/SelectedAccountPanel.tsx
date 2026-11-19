import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Users,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountNodePayload } from '@/mock/networkGraphData';
import { formatINR } from '@/mock/overviewData';
import { RiskBadge } from '@/components/suspicious/RiskBadge';

interface SelectedAccountPanelProps {
  account: AccountNodePayload | null;
  onClose: () => void;
}

export const SelectedAccountPanel: React.FC<SelectedAccountPanelProps> = ({
  account,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!account) return null;

  const handleInvestigate = () => {
    navigate(`/account-investigation?id=${encodeURIComponent(account.accountId)}`, {
      state: {
        selectedAccountId: account.accountId,
      },
    });
  };

  return (
    <div className="absolute right-4 top-4 z-20 w-80 sm:w-88 rounded-xl border border-white/10 bg-[#0D1527]/95 p-5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Panel Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/10">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Selected Entity Dossier
          </span>
          <h3 className="font-mono text-base font-bold text-white mt-0.5">
            {account.accountId}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          title="Deselect Account"
          aria-label="Deselect Account"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Risk & Prediction Status */}
      <div className="py-3 space-y-2 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Risk Assessment:</span>
          <RiskBadge level={account.riskLevel} />
        </div>

        <div className="rounded-lg bg-[#111C33] p-2.5 border border-white/5">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide block">
            ML Decision Prediction:
          </span>
          <p className="text-xs font-medium text-slate-200 mt-1 leading-snug">
            {account.predictionStatus}
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="py-3 space-y-2.5 text-xs border-b border-white/5">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#111C33]/60">
          <span className="flex items-center gap-2 text-slate-400">
            <CreditCard className="h-3.5 w-3.5 text-blue-400" />
            Total Volume:
          </span>
          <span className="font-mono font-bold text-white">
            {formatINR(account.totalVolume)}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#111C33]/60">
          <span className="flex items-center gap-2 text-slate-400">
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            Total Transactions:
          </span>
          <span className="font-mono font-semibold text-slate-200">
            {account.totalTransactions.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-[#111C33]/60">
          <span className="flex items-center gap-2 text-slate-400">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            Unique Counterparties:
          </span>
          <span
            className={`font-mono font-bold ${
              account.uniqueCounterparties > 30.5
                ? 'text-red-400'
                : 'text-slate-200'
            }`}
          >
            {account.uniqueCounterparties}{' '}
            {account.uniqueCounterparties > 30.5 && '(> 30.5 threshold)'}
          </span>
        </div>
      </div>

      {/* Action: Quick Jump to Investigation */}
      <div className="pt-3 flex items-center gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={handleInvestigate}
          className="w-full gap-2 text-xs bg-blue-600 hover:bg-blue-500 font-medium"
        >
          <span>Investigate in Audit Dossier</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
