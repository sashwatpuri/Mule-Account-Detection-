import React from 'react';
import { ShieldAlert, AlertOctagon, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_SUSPICIOUS_SUMMARY } from '@/mock/suspiciousAccountsData';

interface AccountSummaryCardsProps {
  highRiskCount?: number;
  mediumRiskCount?: number;
  totalFlaggedCount?: number;
}

export const AccountSummaryCards: React.FC<AccountSummaryCardsProps> = ({
  highRiskCount = MOCK_SUSPICIOUS_SUMMARY.highRisk,
  mediumRiskCount = MOCK_SUSPICIOUS_SUMMARY.mediumRisk,
  totalFlaggedCount = MOCK_SUSPICIOUS_SUMMARY.totalFlagged,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Total Flagged Accounts */}
      <Card className="bg-[#111C33] border-white/8 hover:border-blue-500/30 transition-all shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 tracking-wide">
              Total Flagged Accounts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {totalFlaggedCount.toLocaleString('en-IN')}
            </CardTitle>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
              <ArrowUpRight className="h-3 w-3" />
              26.8% flagged
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Accounts breaching decision tree thresholds
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 2. High Risk Accounts */}
      <Card className="bg-[#111C33] border-white/8 hover:border-red-500/30 transition-all shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 tracking-wide">
              High-Risk Accounts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono text-red-400 tracking-tight">
              {highRiskCount.toLocaleString('en-IN')}
            </CardTitle>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">
              Prob &ge; 80%
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Immediate freeze &amp; STR escalation priority
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 3. Medium Risk Accounts */}
      <Card className="bg-[#111C33] border-white/8 hover:border-amber-500/30 transition-all shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 tracking-wide">
              Medium-Risk Accounts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 tracking-tight">
              {mediumRiskCount.toLocaleString('en-IN')}
            </CardTitle>
            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Prob 50% - 79%
            </span>
          </div>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Manual KYC &amp; counterparty check required
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
