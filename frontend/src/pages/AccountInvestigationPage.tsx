import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { UserSearch, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountInvestigationHeader } from '@/components/investigation/AccountInvestigationHeader';
import { AccountOverview } from '@/components/investigation/AccountOverview';
import { TransactionSummary } from '@/components/investigation/TransactionSummary';
import { CreditDebitChart } from '@/components/investigation/CreditDebitChart';
import { TransactionTimeline } from '@/components/investigation/TransactionTimeline';
import { BehaviourIndicators } from '@/components/investigation/BehaviourIndicators';
import { SuspiciousActivityPeriod } from '@/components/investigation/SuspiciousActivityPeriod';
import { TransactionHistory } from '@/components/investigation/TransactionHistory';
import { DataSourceIndicator } from '@/components/common/DataSourceIndicator';
import { InvestigationApi } from '@/api/investigationApi';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';

export const AccountInvestigationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract selected Account ID passed from Suspicious Accounts, Network, or URL
  const queryAccountId = searchParams.get('id');
  const stateAccountId = location.state?.selectedAccountId || location.state?.targetAccountId;
  const activeAccountId = queryAccountId || stateAccountId || null;

  const [accountData, setAccountData] = useState<AccountInvestigationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  useEffect(() => {
    let isCancelled = false;

    if (!activeAccountId) {
      setAccountData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const res = await InvestigationApi.getAccountDetail(activeAccountId);
        if (!isCancelled) {
          if (res.data) {
            setAccountData(res.data);
            setIsLiveBackend(!res.isMockFallback);
          } else {
            setAccountData(null);
          }
          if (res.error) {
            setApiError(res.error);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setApiError(err instanceof Error ? err.message : 'Error fetching account');
          setAccountData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [activeAccountId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 pb-6">
        <AccountInvestigationHeader accountId={activeAccountId} />
        <div className="flex flex-col items-center justify-center min-h-[460px] p-8 rounded-2xl border border-white/8 bg-[#111C33] text-center shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-3" />
          <h2 className="text-base font-semibold text-white">Loading Account Dossier...</h2>
          <p className="text-xs text-slate-400 mt-1">Retrieving entity records and ML indicators for {activeAccountId}</p>
        </div>
      </div>
    );
  }

  // If no account is selected, show explicit empty selection guidance
  if (!accountData) {
    return (
      <div className="space-y-6 pb-6">
        <AccountInvestigationHeader accountId={null} />

        <div className="flex flex-col items-center justify-center min-h-[460px] p-8 rounded-2xl border border-white/8 bg-[#111C33] text-center shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/15 border border-blue-500/25 text-blue-400 mb-4">
            <UserSearch className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {activeAccountId ? `Account "${activeAccountId}" Not Found` : 'No Account Selected for Investigation'}
          </h2>
          <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
            {activeAccountId
              ? 'The requested account was not found in the loaded dataset or offline development cohort. Please select another target.'
              : 'Please select an account from the Suspicious Accounts triage queue or Network Analysis to examine its entity dossier, credit/debit analysis, and behavioral indicators.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/suspicious-accounts')}
              className="gap-2 text-xs bg-blue-600 hover:bg-blue-500"
            >
              <span>Go to Suspicious Accounts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/account-investigation?id=ACCT_000038')}
              className="gap-1.5 text-xs border-white/10 text-slate-300 hover:text-white"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              <span>Inspect Sample Target (ACCT_000038)</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Page Header with Selected Account ID and Navigation Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <AccountInvestigationHeader accountId={accountData.accountId} />
        <div className="shrink-0 self-start sm:self-auto">
          <DataSourceIndicator isLive={isLiveBackend} error={apiError} />
        </div>
      </div>

      {/* 2. Prominent Account Overview Section */}
      <section aria-label="Account Overview">
        <AccountOverview account={accountData} />
      </section>

      {/* 3. Transaction Summary Cards (4 KPIs) */}
      <section aria-label="Transaction Summary Cards">
        <TransactionSummary account={accountData} />
      </section>

      {/* 4 & 5. Credit vs Debit Analysis & Transaction Activity Timeline */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Transaction Volume and Timeline">
        <CreditDebitChart account={accountData} />
        <TransactionTimeline account={accountData} />
      </section>

      {/* 7. Suspicious Activity Period Window */}
      <section aria-label="Suspicious Activity Window">
        <SuspiciousActivityPeriod account={accountData} />
      </section>

      {/* 6. Extracted Behavioural Features & ML Indicators */}
      <section aria-label="Account Behaviour Indicators">
        <BehaviourIndicators account={accountData} />
      </section>

      {/* 8. Detailed Granular Transaction History Table */}
      <section aria-label="Granular Transaction Ledger">
        <TransactionHistory transactions={accountData.transactions} accountId={accountData.accountId} />
      </section>
    </div>
  );
};

export default AccountInvestigationPage;
