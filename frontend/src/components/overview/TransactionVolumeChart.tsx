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
import { MOCK_VOLUME_COMPARISON, formatCompactINR, VolumeComparison } from '@/mock/overviewData';

interface TransactionVolumeChartProps {
  /** Live backend volume comparison data; falls back to mock when undefined */
  volumeComparison?: VolumeComparison[];
}

export const TransactionVolumeChart: React.FC<TransactionVolumeChartProps> = ({
  volumeComparison,
}) => {
  const rawData =
    volumeComparison && volumeComparison.length > 0
      ? volumeComparison
      : MOCK_VOLUME_COMPARISON;

  /**
   * Normalise backend data shape (category / credits / debits)
   * and mock shape (category / credits / debits) so both work in the chart.
   * Backend also sends `credit` / `debit` as aliases.
   */
  const data = rawData.map((item: any) => ({
    category: item.category ?? item.month ?? 'Period',
    credits: item.credits ?? item.credit ?? 0,
    debits: item.debits ?? item.debit ?? 0,
  }));

  // Custom banking tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-white/10 bg-[#0D1527] p-3 shadow-xl backdrop-blur-md">
          <p className="text-xs font-semibold text-white border-b border-white/10 pb-1.5 mb-2">
            {label}
          </p>
          <div className="space-y-1.5 text-xs">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}:
                </span>
                <span className="font-mono font-semibold text-white">
                  {formatCompactINR(item.value)}
                </span>
              </div>
            ))}
            {payload.length === 2 && (
              <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Pass-Through Delta:</span>
                <span className="font-mono text-slate-200">
                  {formatCompactINR(Math.abs(payload[0].value - payload[1].value))}
                </span>
              </div>
            )}
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
              <ArrowLeftRight className="h-4 w-4 text-blue-400" />
              Credit vs Debit Volume
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Comparison of incoming credits versus outgoing debits across account risk groups (in ₹ INR).
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
              barGap={6}
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
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', color: '#94A3B8' }}
              />
              <Bar
                name="Incoming Credit (Inflow)"
                dataKey="credits"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Bar
                name="Outgoing Debit (Outflow)"
                dataKey="debits"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
