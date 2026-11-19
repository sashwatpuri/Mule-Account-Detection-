import React from 'react';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MOCK_OVERVIEW_STATS, StatMetric } from '@/mock/overviewData';
import { cn } from '@/lib/utils';

interface DashboardStatsProps {
  /** Live backend stat cards; falls back to mock data when undefined */
  stats?: StatMetric[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const data = stats && stats.length > 0 ? stats : MOCK_OVERVIEW_STATS;
  const getIcon = (id: string) => {
    switch (id) {
      case 'total-accounts':
        return <Users className="h-5 w-5 text-blue-400" />;
      case 'suspicious-accounts':
        return <ShieldAlert className="h-5 w-5 text-amber-400" />;
      case 'legitimate-accounts':
        return <ShieldCheck className="h-5 w-5 text-emerald-400" />;
      case 'high-risk-accounts':
        return <AlertOctagon className="h-5 w-5 text-red-400" />;
      default:
        return <Users className="h-5 w-5 text-blue-400" />;
    }
  };

  const getCardBorder = (color: StatMetric['color']) => {
    switch (color) {
      case 'red':
        return 'hover:border-red-500/40 border-white/8';
      case 'amber':
        return 'hover:border-amber-500/40 border-white/8';
      case 'green':
        return 'hover:border-emerald-500/40 border-white/8';
      case 'blue':
      default:
        return 'hover:border-blue-500/40 border-white/8';
    }
  };

  const getBadgeStyle = (color: StatMetric['color']) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'green':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'blue':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((stat) => (
        <Card
          key={stat.id}
          className={cn(
            'bg-[#111C33] shadow-sm transition-all duration-200',
            getCardBorder(stat.color)
          )}
        >
          <CardHeader className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 tracking-wide">
                {stat.title}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0D1527] border border-white/5 shadow-inner">
                {getIcon(stat.id)}
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <CardTitle className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-mono">
                {stat.value}
              </CardTitle>
              {stat.changeLabel && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                    getBadgeStyle(stat.color)
                  )}
                >
                  {stat.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                  {stat.changeLabel}
                </span>
              )}
            </div>

            <CardDescription className="text-xs text-slate-400 mt-2 font-normal">
              {stat.description}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
