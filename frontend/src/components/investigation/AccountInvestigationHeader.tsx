import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSearch, ArrowLeft, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AccountInvestigationHeaderProps {
  accountId?: string | null;
}

export const AccountInvestigationHeader: React.FC<AccountInvestigationHeaderProps> = ({
  accountId,
}) => {
  const navigate = useNavigate();

  const handleBackToSuspicious = () => {
    navigate('/suspicious-accounts');
  };

  const handleViewInNetwork = () => {
    if (accountId) {
      navigate(`/network-analysis?id=${encodeURIComponent(accountId)}`, {
        state: { targetAccountId: accountId },
      });
    } else {
      navigate('/network-analysis');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <UserSearch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Account Investigation
              </h1>
              {accountId && (
                <Badge variant="default" size="sm" className="font-mono text-xs">
                  {accountId}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Examine account activity, transaction patterns and suspicious behaviour.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToSuspicious}
          className="gap-1.5 text-xs border-white/10 text-slate-300 hover:text-white hover:border-white/20"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Suspicious Accounts</span>
        </Button>

        {accountId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewInNetwork}
            className="gap-1.5 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
          >
            <Network className="h-3.5 w-3.5 text-blue-400" />
            <span>View in Network Analysis</span>
          </Button>
        )}
      </div>
    </div>
  );
};
