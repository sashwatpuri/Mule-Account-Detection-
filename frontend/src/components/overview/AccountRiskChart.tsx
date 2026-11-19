import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { MOCK_ACCOUNT_RISK_DISTRIBUTION, RiskScoreBucket } from '@/mock/overviewData';

interface AccountRiskChartProps {
  /** Live backend risk-score buckets; falls back to mock when undefined */
  accountRiskDistribution?: RiskScoreBucket[];
  /** Total accounts count — used in the tooltip percentage label */
  totalCount?: number;
}

export const AccountRiskChart: React.FC<AccountRiskChartProps> = ({
  accountRiskDistribution,
  totalCount,
}) => {
  const data =
    accountRiskDistribution && accountRiskDistribution.length > 0
      ? accountRiskDistribution
      : MOCK_ACCOUNT_RISK_DISTRIBUTION;

  const total =
    totalCount ??
    data.reduce((sum, b) => sum + (b.count ?? 0), 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0.0';
      return (
        <div className="rounded-lg border border-white/10 bg-[#0D1527] p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-white/10">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-xs font-semibold text-white">
              {d.label ?? label} ({label})
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Account Volume:</span>
              <span className="font-mono font-bold text-white">
                {d.count.toLocaleString('en-IN')} accounts
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Dataset Share:</span>
              <span className="font-mono text-slate-300">{pct}%</span>
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
              <BarChart3 className="h-4 w-4 text-blue-400" />
              Account Risk Stratification
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Distribution of accounts across machine learning risk score brackets.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-4 pb-2">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
                tickFormatter={(val) => `${val.toLocaleString('en-IN')}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                name="Accounts"
                dataKey="count"
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`risk-bar-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
