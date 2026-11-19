import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldAlert,
  ExternalLink,
  Network,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MOCK_RECENT_SUSPICIOUS_ACCOUNTS,
  formatINR,
  RecentSuspiciousAccount,
} from '@/mock/overviewData';
import { AccountsApi } from '@/api/accountsApi';
import { SuspiciousAccountItem } from '@/mock/suspiciousAccountsData';
import { API_CONFIG } from '@/config/apiConfig';

/** Convert a SuspiciousAccountItem (from live API) to RecentSuspiciousAccount shape */
function mapApiItemToRecent(item: SuspiciousAccountItem): RecentSuspiciousAccount {
  return {
    accountId: item.accountId,
    riskScore: item.riskScore,
    riskLevel: item.riskLevel,
    totalTransactions: item.totalTransactions,
    totalVolume: item.totalVolume,
    primaryTrigger: item.primaryTrigger,
    flagDate: item.suspiciousStart || '—',
  };
}

export const RecentAccountsTable: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<RecentSuspiciousAccount[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    AccountsApi.getSuspiciousAccounts({ riskLevel: 'High' }, 1, 5).then((res) => {
      if (cancelled) return;
      if (res.success && res.data && res.data.accounts.length > 0) {
        setAccounts(res.data.accounts.slice(0, 5).map(mapApiItemToRecent));
        setIsLive(res.data.isLiveBackend);
      } else {
        setAccounts(MOCK_RECENT_SUSPICIOUS_ACCOUNTS);
        setIsLive(false);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const displayAccounts =
    accounts.length > 0 ? accounts : MOCK_RECENT_SUSPICIOUS_ACCOUNTS;

  const getRiskBadge = (level: RecentSuspiciousAccount['riskLevel']) => {
    switch (level) {
      case 'High':
        return <Badge variant="high" size="sm" dot>HIGH</Badge>;
      case 'Medium':
        return <Badge variant="medium" size="sm" dot>MEDIUM</Badge>;
      case 'Low':
      default:
        return <Badge variant="low" size="sm" dot>LOW</Badge>;
    }
  };

  return (
    <Card className="bg-[#111C33] border-white/8 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                Recent Suspicious Accounts
              </CardTitle>
              {isLive ? (
                <Badge variant="default" size="sm" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                  Live Data
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm">
                  {API_CONFIG.isConfigured() ? 'Offline Fallback' : 'Mock Sample'}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Top prioritized accounts recently flagged by Decision Tree decision node triggers.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/suspicious-accounts')}
            className="self-start sm:self-auto gap-1.5 text-xs border-white/10 hover:border-blue-500/40 hover:text-blue-300"
          >
            <span>View All Suspicious Accounts</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="rounded-lg border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0D1527] text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-white/5 select-none">
                <tr>
                  <th className="px-4 py-3">Account ID</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Primary Rule Trigger</th>
                  <th className="px-4 py-3 text-right">Total Txns</th>
                  <th className="px-4 py-3 text-right">Total Volume (₹)</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        <span>Loading recent accounts…</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayAccounts.map((account) => (
                    <tr
                      key={account.accountId}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Account ID */}
                      <td className="px-4 py-3.5 font-mono font-medium text-slate-200 whitespace-nowrap">
                        {account.accountId}
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                account.riskScore >= 80
                                  ? 'bg-red-500'
                                  : account.riskScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${account.riskScore}%` }}
                            />
                          </div>
                          <span
                            className={`font-mono font-semibold text-xs ${
                              account.riskScore >= 80
                                ? 'text-red-400'
                                : account.riskScore >= 50
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {account.riskScore.toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getRiskBadge(account.riskLevel)}
                      </td>

                      {/* Primary Rule Trigger */}
                      <td className="px-4 py-3.5 text-slate-400 text-xs truncate max-w-xs">
                        {account.primaryTrigger}
                      </td>

                      {/* Total Transactions */}
                      <td className="px-4 py-3.5 text-right font-mono text-slate-300 whitespace-nowrap">
                        {account.totalTransactions.toLocaleString('en-IN')}
                      </td>

                      {/* Total Volume */}
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-100 whitespace-nowrap">
                        {formatINR(account.totalVolume)}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/account-investigation?id=${encodeURIComponent(account.accountId)}`, {
                                state: { selectedAccountId: account.accountId },
                              })
                            }
                            className="h-7 px-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 font-medium"
                            title={`Investigate ${account.accountId}`}
                          >
                            <span>Investigate</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              navigate(`/network-analysis?id=${encodeURIComponent(account.accountId)}`, {
                                state: { targetAccountId: account.accountId },
                              })
                            }
                            className="h-7 px-2 text-xs text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 font-medium"
                            title={`View ${account.accountId} in Network Graph`}
                          >
                            <Network className="h-3 w-3 text-blue-400" />
                            <span className="hidden sm:inline">Graph</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {isLive
              ? 'Displaying 5 most recent high-risk accounts from the live backend dataset.'
              : 'Displaying 5 illustrative accounts from the offline evaluation sample.'}
          </span>
          <span className="font-mono text-slate-400">Currency: INR (₹)</span>
        </div>
      </CardContent>
    </Card>
  );
};


