import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ArrowLeftRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';
import { formatCompactINR, formatINR } from '@/mock/overviewData';

interface CreditDebitChartProps {
  account: AccountInvestigationData;
}

export const CreditDebitChart: React.FC<CreditDebitChartProps> = ({ account }) => {
  const chartData = [
    {
      category: 'Total Flow',
      'Credit Volume (Inflow)': account.totalCreditVolume,
      'Debit Volume (Outflow)': account.totalDebitVolume,
    },
  ];

  const delta = Math.abs(account.totalCreditVolume - account.totalDebitVolume);
  const total = account.totalCreditVolume + account.totalDebitVolume;
  const symmetry = total > 0 ? (delta / total).toFixed(2) : '0.00';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-[#0D1527] p-3 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-white border-b border-white/10 pb-1 mb-2">
            Volume Comparison
          </p>
          <div className="space-y-1 text-xs">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}:
                </span>
                <span className="font-mono font-bold text-white">
                  {formatINR(item.value)}
                </span>
              </div>
            ))}
            <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
              <span>Pass-Through Delta:</span>
              <span className="font-mono text-slate-200">{formatINR(delta)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[#111C33] border-white/8 h-full flex flex-col shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-blue-400" />
              Credit vs Debit Analysis
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Comparison of incoming credits versus outgoing debits for this account.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 pb-4 flex flex-col justify-between">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
              barGap={12}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="category"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
                tickFormatter={(val) => formatCompactINR(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', color: '#94A3B8' }}
              />
              <Bar
                name="Credit Volume (Inflow)"
                dataKey="Credit Volume (Inflow)"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
              />
              <Bar
                name="Debit Volume (Outflow)"
                dataKey="Debit Volume (Outflow)"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Symmetry Insight Note */}
        <div className="mt-2 p-2.5 rounded-lg bg-[#0D1527] border border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>
            Pass-Through Symmetry: <strong className="font-mono text-white">{symmetry}</strong>
          </span>
          <span className="text-[11px] text-slate-400">
            {Number(symmetry) <= 0.33
              ? 'High-speed pass-through (Near zero resting balance)'
              : 'Asymmetric or holding pattern'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
