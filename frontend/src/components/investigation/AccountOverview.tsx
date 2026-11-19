import React from 'react';
import {
  CreditCard,
  Layers,
  Users,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Building,
  FileText,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/suspicious/RiskBadge';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';
import { formatINR } from '@/mock/overviewData';

interface AccountOverviewProps {
  account: AccountInvestigationData;
}

export const AccountOverview: React.FC<AccountOverviewProps> = ({ account }) => {
  const isMule = account.predictionStatus === 'Mule';

  return (
    <Card className="bg-[#111C33] border-white/8 shadow-sm">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Top Entity Bar: ID + Prediction Status + Risk Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/8">
          <div className="flex items-start gap-3.5">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl font-bold font-mono ${
                isMule
                  ? 'bg-red-500/15 border-red-500/30 text-red-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
            >
              {isMule ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold font-mono text-white tracking-tight">
                  {account.accountId}
                </h2>
                <RiskBadge level={account.riskLevel} />
                <Badge
                  variant={isMule ? 'high' : 'low'}
                  size="sm"
                  className="font-mono text-[11px]"
                >
                  Prediction: {account.predictionStatus}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-slate-500" />
                  PAN: {account.panNumber}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3 text-slate-500" />
                  Branch: {account.branchCode}
                </span>
              </div>
            </div>
          </div>

          {/* Model Output vs Mock Value Disclosure Tag */}
          <div className="flex flex-col sm:items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Risk Score:</span>
              {account.riskScore !== null ? (
                <span
                  className={`font-mono text-lg font-bold ${
                    account.riskScore >= 75
                      ? 'text-red-400'
                      : account.riskScore >= 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {account.riskScore.toFixed(2)}%
                </span>
              ) : (
                <span className="text-xs text-slate-500 font-mono">
                  Probability N/A (Binary Class Only)
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">
              *Illustrative probability placeholder &bull; Actual model: Balanced DT
            </span>
          </div>
        </div>

        {/* Compact Grid of Primary Account Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Account Status */}
          <div className="p-3 rounded-lg bg-[#0D1527] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="h-3.5 w-3.5 text-blue-400" />
              <span>Account Status</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  account.accountStatus === 'Frozen'
                    ? 'bg-red-400 animate-pulse'
                    : 'bg-emerald-400'
                }`}
              />
              <span className="font-semibold text-xs text-white">
                {account.accountStatus}
              </span>
            </div>
          </div>

          {/* Total Transactions */}
          <div className="p-3 rounded-lg bg-[#0D1527] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              <span>Total Txns</span>
            </div>
            <div className="font-mono font-bold text-sm text-white">
              {account.totalTransactions.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Total Volume */}
          <div className="p-3 rounded-lg bg-[#0D1527] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
              <span>Total Volume</span>
            </div>
            <div className="font-mono font-bold text-sm text-emerald-300">
              {formatINR(account.totalVolume)}
            </div>
          </div>

          {/* Unique Counterparties */}
          <div className="p-3 rounded-lg bg-[#0D1527] border border-white/5 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Users className="h-3.5 w-3.5 text-amber-400" />
              <span>Unique CP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-white">
                {account.uniqueCounterparties}
              </span>
              {account.uniqueCounterparties > 30.5 && (
                <span className="text-[10px] text-red-400 font-semibold">
                  (&gt;30.5 cut)
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
