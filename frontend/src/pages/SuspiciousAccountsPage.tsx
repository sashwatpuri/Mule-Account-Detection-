import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SuspiciousAccountsHeader } from '@/components/suspicious/SuspiciousAccountsHeader';
import { AccountSummaryCards } from '@/components/suspicious/AccountSummaryCards';
import { AccountFilters } from '@/components/suspicious/AccountFilters';
import { SuspiciousAccountsTable } from '@/components/suspicious/SuspiciousAccountsTable';
import { DataSourceIndicator } from '@/components/common/DataSourceIndicator';
import { AccountsApi, AccountsQueryResult } from '@/api/accountsApi';
import {
  SuspiciousAccountsFilterState,
  MOCK_SUSPICIOUS_SUMMARY,
} from '@/mock/suspiciousAccountsData';

const INITIAL_FILTERS: SuspiciousAccountsFilterState = {
  searchQuery: '',
  riskLevel: 'all',
  riskScoreRange: 'all',
  volumeRange: 'all',
};

export const SuspiciousAccountsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search');

  const [filters, setFilters] = useState<SuspiciousAccountsFilterState>(() => ({
    ...INITIAL_FILTERS,
    searchQuery: urlSearch || '',
  }));
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);

  const [queryResult, setQueryResult] = useState<AccountsQueryResult>({
    accounts: [],
    totalFlaggedCount: MOCK_SUSPICIOUS_SUMMARY.totalFlagged,
    highRiskCount: MOCK_SUSPICIOUS_SUMMARY.highRisk,
    mediumRiskCount: MOCK_SUSPICIOUS_SUMMARY.mediumRisk,
    isLiveBackend: false,
  });

  // Fetch accounts from API service layer
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await AccountsApi.getSuspiciousAccounts(filters, currentPage, rowsPerPage);
      if (res.data) {
        setQueryResult(res.data);
        setIsLiveBackend(res.data.isLiveBackend);
      }
      if (res.error) {
        setApiError(res.error);
      }
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage, rowsPerPage]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (urlSearch !== null && urlSearch !== undefined) {
      setFilters((prev) => ({ ...prev, searchQuery: urlSearch }));
      setCurrentPage(1);
    }
  }, [urlSearch]);

  const handleFilterChange = (newFilters: Partial<SuspiciousAccountsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    loadAccounts();
  };

  const isFiltered = Boolean(
    filters.searchQuery.trim() !== '' ||
    filters.riskLevel !== 'all' ||
    filters.riskScoreRange !== 'all' ||
    filters.volumeRange !== 'all'
  );

  const totalFilteredCount = queryResult.accounts.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / rowsPerPage));
  const paginatedAccounts = queryResult.accounts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Page Header with Data Source Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SuspiciousAccountsHeader
          totalFlaggedCount={queryResult.totalFlaggedCount}
          filteredCount={totalFilteredCount}
          totalLoaded={queryResult.accounts.length}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />
        <div className="shrink-0 self-start sm:self-auto">
          <DataSourceIndicator isLive={isLiveBackend} error={apiError} />
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <section aria-label="Suspicious Accounts Summary">
        <AccountSummaryCards
          totalFlaggedCount={queryResult.totalFlaggedCount}
          highRiskCount={queryResult.highRiskCount}
          mediumRiskCount={queryResult.mediumRiskCount}
        />
      </section>

      {/* 3. Search Bar & Active Filters */}
      <section aria-label="Account Search and Filters">
        <AccountFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isFiltered={isFiltered}
          resultCount={totalFilteredCount}
          totalCount={queryResult.totalFlaggedCount}
        />
      </section>

      {/* 4. Suspicious Accounts Data Table with Pagination & Action Button */}
      <section aria-label="Suspicious Accounts Table">
        <SuspiciousAccountsTable
          accounts={paginatedAccounts}
          isLoading={isLoading}
          searchQuery={filters.searchQuery}
          onResetFilters={handleResetFilters}
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          totalFilteredCount={totalFilteredCount}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={(rows) => {
            setRowsPerPage(rows);
            setCurrentPage(1);
          }}
        />
      </section>
    </div>
  );
};

export default SuspiciousAccountsPage;
