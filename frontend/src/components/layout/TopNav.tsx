import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Activity,
  X,
} from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { Avatar } from '@/components/ui/avatar';
import { navigationItems } from './Sidebar';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');

  // Find active nav item or default to Overview
  const currentItem =
    navigationItems.find((item) => item.path === location.pathname) ||
    navigationItems[0];

  const breadcrumbs = [
    { label: 'AML Intelligence', path: '/overview' },
    { label: currentItem.label },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;

    const term = globalSearch.trim();
    // If it looks like a specific account ID, navigate directly to investigation
    if (term.toUpperCase().startsWith('ACC-') || term.toUpperCase().includes('MULE')) {
      navigate(`/account-investigation?id=${encodeURIComponent(term.toUpperCase())}`);
    } else {
      // Otherwise search in Suspicious Accounts queue
      navigate(`/suspicious-accounts?search=${encodeURIComponent(term)}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/8 bg-[#0D1527]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle + Title + Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {currentItem.label}
            </h1>
          </div>
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>
      </div>

      {/* Right: Search + System Status + Notifications + Avatar */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-64 lg:w-80">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search account ID, counterparty..."
              className="h-9 w-full rounded-lg border border-white/10 bg-[#0F172A] pl-9 pr-14 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500/50"
            />
            {globalSearch ? (
              <button
                type="button"
                onClick={() => setGlobalSearch('')}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="absolute right-2.5 hidden sm:flex items-center pointer-events-none">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400">
                  Enter ↵
                </kbd>
              </div>
            )}
          </div>
        </form>

        {/* System Model Indicator Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#111C33] border border-white/8 text-xs text-slate-300">
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[11px] font-medium text-slate-400">Engine:</span>
          <span className="text-[11px] font-semibold text-slate-200">Balanced DT</span>
        </div>

        {/* Notification Bell with Risk Alert Indicator */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          title="3 high-priority mule alerts"
          aria-label="3 high-priority mule alerts"
          onClick={() => navigate('/suspicious-accounts')}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        </button>

        {/* Top bar user avatar */}
        <div className="pl-1 border-l border-white/8">
          <Avatar name="Sarah Chen" role="Investigator" size="sm" />
        </div>
      </div>
    </header>
  );
};
