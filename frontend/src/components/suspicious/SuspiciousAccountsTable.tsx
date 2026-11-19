import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, SearchX, RotateCcw, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RiskBadge } from './RiskBadge';
import { Pagination } from './Pagination';
import { SuspiciousAccountItem, formatDate } from '@/mock/suspiciousAccountsData';
import { formatINR } from '@/mock/overviewData';

interface SuspiciousAccountsTableProps {
  accounts: SuspiciousAccountItem[];
  isLoading?: boolean;
  searchQuery?: string;
  onResetFilters: () => void;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalFilteredCount: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

export const SuspiciousAccountsTable: React.FC<SuspiciousAccountsTableProps> = ({
  accounts,
  isLoading = false,
  searchQuery = '',
  onResetFilters,
  currentPage,
  totalPages,
  rowsPerPage,
  totalFilteredCount,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const navigate = useNavigate();

  const handleViewDetails = (account: SuspiciousAccountItem) => {
    // Navigate with both query parameter and navigation state
    navigate(`/account-investigation?id=${encodeURIComponent(account.accountId)}`, {
      state: {
        selectedAccountId: account.accountId,
        accountData: account,
      },
    });
  };

  const handleViewNetwork = (account: SuspiciousAccountItem) => {
    navigate(`/network-analysis?id=${encodeURIComponent(account.accountId)}`, {
      state: {
        targetAccountId: account.accountId,
      },
    });
  };

  return (
    <div className="rounded-xl border border-white/8 bg-[#111C33] overflow-hidden shadow-sm">
      {/* Table Scrollable Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-[#0D1527] text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-white/8 select-none">
            <tr>
              <th className="px-4 py-3.5 whitespace-nowrap">Account ID</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Risk Score</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Risk Level</th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap">Total Txns</th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap">Total Volume (₹)</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Unique CP</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Suspicious Start</th>
              <th className="px-4 py-3.5 whitespace-nowrap">Suspicious End</th>
              <th className="px-4 py-3.5 text-center whitespace-nowrap">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/5 text-slate-300">
            {/* Loading State Skeleton */}
            {isLoading && (
              <>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-5 w-16 bg-white/5 rounded-full" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-4 w-12 bg-white/5 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-4 w-24 bg-white/5 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 w-10 bg-white/5 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-7 w-20 bg-white/5 rounded mx-auto" />
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Empty State: No Accounts Found */}
            {!isLoading && accounts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400 mb-3">
                      <SearchX className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {searchQuery
                        ? `No accounts found matching "${searchQuery}"`
                        : 'No accounts match the selected filters'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      Try adjusting your search criteria, clearing the risk score or volume filter, or resetting all filters.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onResetFilters}
                      className="mt-4 gap-1.5 text-xs border-white/10 text-blue-400 hover:text-blue-300"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset All Filters</span>
                    </Button>
                  </div>
                </td>
              </tr>
            )}

            {/* Populated Data Rows */}
            {!isLoading &&
              accounts.map((account) => {
                const isHighRisk = account.riskLevel === 'High';
                const isMedRisk = account.riskLevel === 'Medium';

                return (
                  <tr
                    key={account.accountId}
                    className="hover:bg-white/[0.025] transition-colors group"
                  >
                    {/* Account ID */}
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isHighRisk && (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"
                            title="Critical High Risk"
                          />
                        )}
                        <span>{account.accountId}</span>
                      </div>
                    </td>

                    {/* Risk Score */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isHighRisk
                                ? 'bg-red-500'
                                : isMedRisk
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${account.riskScore}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-bold text-xs ${
                            isHighRisk
                              ? 'text-red-400'
                              : isMedRisk
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {account.riskScore.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <RiskBadge level={account.riskLevel} />
                    </td>

                    {/* Total Transactions */}
                    <td className="px-4 py-3.5 text-right font-mono text-slate-300 whitespace-nowrap">
                      {account.totalTransactions.toLocaleString('en-IN')}
                    </td>

                    {/* Total Volume */}
                    <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-100 whitespace-nowrap">
                      {formatINR(account.totalVolume)}
                    </td>

                    {/* Unique Counterparties (total_unique_cp) */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          account.uniqueCounterparties > 30.5
                            ? 'bg-red-500/10 text-red-300 border border-red-500/20 font-bold'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                        title={
                          account.uniqueCounterparties > 30.5
                            ? 'Breaches root decision tree split (CP > 30.5)'
                            : 'Within moderate counterparty volume'
                        }
                      >
                        {account.uniqueCounterparties}
                      </span>
                    </td>

                    {/* Suspicious Start */}
                    <td className="px-4 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {formatDate(account.suspiciousStart)}
                    </td>

                    {/* Suspicious End */}
                    <td className="px-4 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {formatDate(account.suspiciousEnd)}
                    </td>

                    {/* Action: View Details & View Network */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(account)}
                          className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 font-medium"
                          title={`Investigate ${account.accountId}`}
                        >
                          <span>Details</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewNetwork(account)}
                          className="h-7 px-2 text-xs text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 font-medium"
                          title={`View ${account.accountId} in Network Graph`}
                        >
                          <Network className="h-3 w-3 text-blue-400" />
                          <span className="hidden sm:inline">Graph</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        totalItems={totalFilteredCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </div>
  );
};
