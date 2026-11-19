import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MOCK_RISK_DISTRIBUTION, RiskCategory } from '@/mock/overviewData';

interface RiskDistributionProps {
  /** Live backend risk distribution data; falls back to mock when undefined */
  riskDistribution?: RiskCategory[];
  /** Total accounts count for the donut centre label */
  totalCount?: number;
}

export const RiskDistribution: React.FC<RiskDistributionProps> = ({
  riskDistribution,
  totalCount,
}) => {
  const data =
    riskDistribution && riskDistribution.length > 0
      ? riskDistribution
      : MOCK_RISK_DISTRIBUTION;

  // Ensure each item has both `count` and `hex` fields regardless of source
  const normalised = data.map((item) => ({
    ...item,
    count: (item as any).count ?? (item as any).value ?? 0,
    hex: (item as any).hex ?? (item as any).color ?? '#10B981',
  }));

  const displayTotal =
    totalCount ??
    normalised.reduce((sum, item) => sum + item.count, 0);

  const displayTotalLabel =
    displayTotal >= 90000
      ? `${(displayTotal / 1000).toFixed(0)}k`
      : displayTotal.toLocaleString('en-IN');

  // Custom clean tooltip for banking dashboard
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-lg border border-white/10 bg-[#0D1527] p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: d.hex }}
            />
            <span className="text-xs font-semibold text-white">{d.name}</span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-slate-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Account Count:</span>
              <span className="font-mono font-medium text-white">
                {d.count.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Distribution:</span>
              <span className="font-mono font-semibold" style={{ color: d.hex }}>
                {d.percentage}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[#111C33] border-white/8 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-blue-400" />
              Risk Distribution
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Account stratification across High, Medium, and Low risk thresholds.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between pt-2">
        {/* Donut Chart Container */}
        <div className="relative h-[220px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={normalised}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={88}
                paddingAngle={4}
                dataKey="count"
                stroke="rgba(11, 17, 30, 0.8)"
                strokeWidth={3}
              >
                {normalised.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.hex}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Inner Label — dynamic total from live backend or mock sum */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-white">
              {displayTotalLabel}
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Total Evaluated
            </span>
          </div>
        </div>

        {/* Detailed Legend with Counts and Percentages */}
        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
          {normalised.map((item) => (
            <div
              key={item.name}
              className="flex flex-col p-2 rounded-lg bg-[#0D1527]/60 border border-white/5"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.hex }}
                />
                <span className="text-[11px] font-medium text-slate-300 truncate">
                  {item.name}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xs font-bold font-mono text-white">
                  {item.count.toLocaleString('en-IN')}
                </span>
                <span
                  className="text-[11px] font-semibold font-mono"
                  style={{ color: item.hex }}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
