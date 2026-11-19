import React, { useState, useEffect } from 'react';
import { Database, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/components/overview/DashboardStats';
import { RiskDistribution } from '@/components/overview/RiskDistribution';
import { TransactionVolumeChart } from '@/components/overview/TransactionVolumeChart';
import { AccountRiskChart } from '@/components/overview/AccountRiskChart';
import { FeatureImportanceChart } from '@/components/overview/FeatureImportanceChart';
import { RecentAccountsTable } from '@/components/overview/RecentAccountsTable';
import { DataSourceIndicator } from '@/components/common/DataSourceIndicator';
import { DashboardApi, DashboardOverviewPayload } from '@/api/dashboardApi';

export const OverviewPage: React.FC = () => {
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<DashboardOverviewPayload | null>(null);

  useEffect(() => {
    let isMounted = true;
    DashboardApi.getOverviewData().then((res) => {
      if (isMounted) {
        setOverviewData(res.data);
        setIsLiveBackend(res.data?.isLiveBackend ?? false);
        if (res.error) setApiError(res.error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive total account count from live stats for donut label
  const totalAccountsCount =
    overviewData?.stats?.find((s) => s.id === 'total-accounts')
      ?.rawCount as number | undefined;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Overview Dashboard
            </h1>
            <Badge variant="default" size="sm" className="hidden sm:inline-flex">
              AML Analytics
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Monitor mule account detection results and suspicious financial activity.
          </p>
        </div>

        {/* Dataset / Model Status Indicator */}
        <div className="flex flex-wrap items-center gap-2">
          <DataSourceIndicator isLive={isLiveBackend} error={apiError} />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111C33] border border-white/8 text-xs text-slate-300 shadow-sm">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-400">Model:</span>
            <span className="font-semibold text-slate-200">Balanced Decision Tree (Depth 6)</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111C33] border border-white/8 text-xs text-slate-300 shadow-sm">
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Dataset:</span>
            <span className="font-semibold text-slate-200">
              {isLiveBackend ? 'Full RBIH Dataset (96,091 Accounts)' : 'RBIH Stratified Baseline (10k)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Four Key Statistics Cards */}
      <section aria-label="Key Performance Indicators">
        <DashboardStats stats={overviewData?.stats} />
      </section>

      {/* 3 & 4. Risk Distribution & Account Stratification */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Risk Distribution & Stratification">
        <RiskDistribution
          riskDistribution={overviewData?.riskDistribution}
          totalCount={totalAccountsCount}
        />
        <AccountRiskChart
          accountRiskDistribution={overviewData?.accountRiskDistribution}
          totalCount={totalAccountsCount}
        />
      </section>

      {/* 5 & 6. Transaction Volume & Feature Importance */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Financial Volume & Model Importance">
        <TransactionVolumeChart volumeComparison={overviewData?.volumeComparison} />
        <FeatureImportanceChart featureImportance={overviewData?.featureImportance} />
      </section>

      {/* 7. Recent Suspicious Accounts Table */}
      <section aria-label="Recent Suspicious Accounts">
        <RecentAccountsTable />
      </section>
    </div>
  );
};

export default OverviewPage;
