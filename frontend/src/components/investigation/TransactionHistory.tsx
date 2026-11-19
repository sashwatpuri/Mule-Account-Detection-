import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  History,
  FileQuestion,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccountTransactionRecord } from '@/mock/accountInvestigationData';
import { formatINR } from '@/mock/overviewData';

interface TransactionHistoryProps {
  transactions: AccountTransactionRecord[];
  accountId: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  accountId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'timestamp' | 'amount'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleToggleSort = (field: 'timestamp' | 'amount') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    let list = [...transactions];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.sourceAccount.toLowerCase().includes(q) ||
          t.targetAccount.toLowerCase().includes(q) ||
          t.timestamp.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortField === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      return sortOrder === 'desc'
        ? b.timestamp.localeCompare(a.timestamp)
        : a.timestamp.localeCompare(b.timestamp);
    });

    return list;
  }, [transactions, searchQuery, sortField, sortOrder]);

  return (
    <Card className="bg-[#111C33] border-white/8 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-blue-400" />
              Granular Transaction History
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Sample transaction records associated with {accountId}.
            </CardDescription>
          </div>

          {/* Search bar inside transaction table */}
          {transactions.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search counterparty or date..."
                className="h-8 w-full rounded-lg border border-white/10 bg-[#0D1527] pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {/* Empty State: No transaction records available */}
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-white/10 bg-[#0B111E]/40 text-center">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 mb-3">
              <FileQuestion className="h-6 w-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-semibold text-white">
              No Granular Transaction Records Available
            </h4>
            <p className="mt-1 max-w-md text-xs text-slate-400 leading-relaxed">
              Granular transaction-level rows for this account are not included in the offline sample. In full integration, live database queries will populate exact line-item records.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0D1527] text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-white/5 select-none">
                  <tr>
                    <th
                      className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleToggleSort('timestamp')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Timestamp</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="px-4 py-3">Source Account</th>
                    <th className="px-4 py-3">Destination Account</th>
                    <th
                      className="px-4 py-3 text-right cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleToggleSort('amount')}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Amount (₹)</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-500" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredAndSortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400">
                        No transactions match search &quot;{searchQuery}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedTransactions.map((txn) => {
                      const isInflow = txn.direction === 'Inflow';

                      return (
                        <tr
                          key={txn.id}
                          className="hover:bg-white/[0.025] transition-colors"
                        >
                          {/* Timestamp */}
                          <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                            {txn.timestamp}
                          </td>

                          {/* Source Account */}
                          <td className="px-4 py-3 font-mono whitespace-nowrap">
                            <span
                              className={
                                txn.sourceAccount === accountId
                                  ? 'font-bold text-white'
                                  : 'text-slate-300'
                              }
                            >
                              {txn.sourceAccount}
                            </span>
                          </td>

                          {/* Destination Account */}
                          <td className="px-4 py-3 font-mono whitespace-nowrap">
                            <span
                              className={
                                txn.targetAccount === accountId
                                  ? 'font-bold text-white'
                                  : 'text-slate-300'
                              }
                            >
                              {txn.targetAccount}
                            </span>
                          </td>

                          {/* Amount in INR */}
                          <td className="px-4 py-3 text-right font-mono font-semibold whitespace-nowrap text-white">
                            {formatINR(txn.amount)}
                          </td>

                          {/* Direction Badge */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {isInflow ? (
                              <Badge
                                variant="default"
                                size="sm"
                                className="bg-blue-500/10 text-blue-300 border-blue-500/30 gap-1"
                              >
                                <ArrowDownLeft className="h-3 w-3" />
                                Inflow
                              </Badge>
                            ) : (
                              <Badge
                                variant="medium"
                                size="sm"
                                className="bg-amber-500/10 text-amber-300 border-amber-500/30 gap-1"
                              >
                                <ArrowUpRight className="h-3 w-3" />
                                Outflow
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer info */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0D1527] border-t border-white/5 text-[11px] text-slate-500">
              <span>Showing {filteredAndSortedTransactions.length} of {transactions.length} records</span>
              <span className="font-mono">Sort: {sortField} ({sortOrder.toUpperCase()})</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
