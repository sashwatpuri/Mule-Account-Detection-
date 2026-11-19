import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  UserSearch,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { NavItem } from '@/types/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/overview',
    icon: LayoutDashboard,
    description: 'Model metrics & risk distribution',
  },
  {
    id: 'suspicious-accounts',
    label: 'Suspicious Accounts',
    path: '/suspicious-accounts',
    icon: ShieldAlert,
    badge: '2,683',
    badgeVariant: 'danger',
    description: 'High & medium risk flagged accounts',
  },
  {
    id: 'network-analysis',
    label: 'Network Analysis',
    path: '/network-analysis',
    icon: Network,
    description: 'Counterparty fan-in & fan-out graphs',
  },
  {
    id: 'account-investigation',
    label: 'Account Investigation',
    path: '/account-investigation',
    icon: UserSearch,
    description: 'Deep-dive entity & rule audit path',
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/8 bg-[#0D1527] transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand / Logo Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/8">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shadow-inner shadow-blue-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-white">
                    MuleShield
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    AML
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium truncate">
                  Account Intelligence
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md border border-white/8 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Dataset & Engine Status Badge (when expanded) */}
        {!collapsed && (
          <div className="px-4 py-3 mx-3 my-2 rounded-lg bg-[#111C33] border border-white/5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="h-3 w-3 text-blue-400" />
                RBIH Baseline Model
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className={cn('px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500', collapsed && 'text-center')}>
            {!collapsed ? 'Investigation Modules' : '•'}
          </div>

          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all select-none',
                      isActive
                        ? 'bg-blue-600/15 text-white shadow-sm border border-blue-500/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent',
                      collapsed && 'justify-center px-2'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-blue-500" />
                      )}

                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-blue-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />

                      {!collapsed && (
                        <div className="flex flex-1 items-center justify-between truncate">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant="high"
                              size="sm"
                              className="ml-auto text-[10px] py-0 px-1.5 font-mono"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Compact User / Profile Section at Bottom */}
        <div className="p-3 border-t border-white/8 bg-[#0B111E]/40">
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg bg-[#111C33]/60 border border-white/5',
              collapsed && 'justify-center p-1.5'
            )}
          >
            <Avatar name="Sarah Chen" role="Senior Investigator" size="sm" />
            {!collapsed && (
              <div className="flex flex-col truncate flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-200 truncate">
                  Sarah Chen
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-slate-400 truncate">
                    Senior AML Investigator
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
