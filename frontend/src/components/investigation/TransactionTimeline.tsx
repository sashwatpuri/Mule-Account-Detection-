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
import { Calendar, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';
import { formatCompactINR, formatINR } from '@/mock/overviewData';

interface TransactionTimelineProps {
  account: AccountInvestigationData;
}

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ account }) => {
  const { timeline, suspiciousStart, suspiciousEnd } = account;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="rounded-lg border border-white/10 bg-[#0D1527] p-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-2">
            <span className="font-semibold text-xs text-white">{label}</span>
            {point.isInSuspiciousWindow && (
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 font-bold">
                SUSPICIOUS WINDOW
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Volume Transacted:</span>
              <span className="font-mono font-bold text-white">
                {formatINR(point.volume)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Transactions:</span>
              <span className="font-mono text-slate-200">
                {point.transactionCount} txns
              </span>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Transaction Activity Timeline
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Timeline of transaction volume over dates with temporal window concentration.
            </CardDescription>
          </div>

          {suspiciousStart && suspiciousEnd && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/25 text-[11px] text-red-300 font-mono">
              <AlertCircle className="h-3 w-3 text-red-400" />
              <span>Flagged Window: {suspiciousStart} &rarr; {suspiciousEnd}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 pb-4 flex flex-col justify-between">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeline}
              margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
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
              <Bar
                name="Transaction Volume"
                dataKey="volume"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              >
                {timeline.map((entry, index) => (
                  <Cell
                    key={`timeline-bar-${index}`}
                    fill={entry.isInSuspiciousWindow ? '#EF4444' : '#3B82F6'}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Standard Baseline Volume
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Burst Spike in Suspicious Window
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Currency: INR (₹)</span>
        </div>
      </CardContent>
    </Card>
  );
};
