import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { SuspiciousAccountsPage } from '@/pages/SuspiciousAccountsPage';
import { NetworkAnalysisPage } from '@/pages/NetworkAnalysisPage';
import { AccountInvestigationPage } from '@/pages/AccountInvestigationPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="suspicious-accounts" element={<SuspiciousAccountsPage />} />
          <Route path="network-analysis" element={<NetworkAnalysisPage />} />
          <Route path="account-investigation" element={<AccountInvestigationPage />} />
          {/* Fallback to Overview */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
