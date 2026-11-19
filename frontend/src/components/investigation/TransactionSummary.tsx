import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Users,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatINR } from '@/mock/overviewData';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';

interface TransactionSummaryProps {
  account: AccountInvestigationData;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({ account }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Transactions */}
      <Card className="bg-[#111C33] border-white/8 shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Transactions</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-mono text-white mt-2">
            {account.totalTransactions.toLocaleString('en-IN')}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Recorded in active window
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 2. Total Credit Volume (Incoming) */}
      <Card className="bg-[#111C33] border-white/8 shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Credit Volume (Inflow)</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-mono text-blue-300 mt-2">
            {formatINR(account.totalCreditVolume)}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Deposits &amp; incoming transfers
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 3. Total Debit Volume (Outgoing) */}
      <Card className="bg-[#111C33] border-white/8 shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Debit Volume (Outflow)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-mono text-amber-300 mt-2">
            {formatINR(account.totalDebitVolume)}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Disbursements &amp; withdrawals
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 4. Unique Counterparties */}
      <Card className="bg-[#111C33] border-white/8 shadow-sm">
        <CardHeader className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Unique Counterparties</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-mono text-white mt-2">
            {account.uniqueCounterparties}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 mt-1">
            Distinct accounts interacted with
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
