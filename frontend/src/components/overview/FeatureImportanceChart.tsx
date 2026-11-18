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
import { GitBranch, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOCK_FEATURE_IMPORTANCE, FeatureImportanceItem } from '@/mock/overviewData';

interface FeatureImportanceChartProps {
  /** Live backend feature importance items; falls back to mock when undefined */
  featureImportance?: FeatureImportanceItem[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  featureImportance,
}) => {
  const rawData =
    featureImportance && featureImportance.length > 0
      ? featureImportance
      : MOCK_FEATURE_IMPORTANCE;

  /**
   * Normalise backend shape {feature, importance (0-1 or 0-100)} and
   * mock shape {featureKey, importance (0-100)} into a single consistent array.
   */
  const data = rawData.map((item: any) => {
    const featureKey = item.featureKey ?? item.feature ?? 'feature';
    const rawImp = item.importance ?? 0;
    // Backend sends 0-100 (already converted in main.py); mock also uses 0-100
    const importance = rawImp <= 1.0 ? parseFloat((rawImp * 100).toFixed(2)) : rawImp;
    return {
      featureKey,
      featureName: item.featureName ?? featureKey.replace(/_/g, ' '),
      importance,
      category: item.category ?? 'Feature',
      interpretation: item.interpretation ?? '',
    };
  });

  // Dynamic XAxis domain based on max importance value
  const maxImp = Math.max(...data.map((d) => d.importance));
  const xDomainMax = Math.ceil(Math.min(maxImp * 1.25, 100));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-lg border border-white/10 bg-[#0D1527] p-3 shadow-xl backdrop-blur-md max-w-xs">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-2">
            <span className="font-mono text-xs font-semibold text-white">
              {d.featureKey}
            </span>
            <span className="font-mono font-bold text-blue-400 text-xs">
              {d.importance}%
            </span>
          </div>
          <p className="text-xs font-medium text-slate-200">{d.featureName}</p>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {d.interpretation}
          </p>
          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
            <span>Category:</span>
            <span className="text-slate-400 font-medium">{d.category}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-[#111C33] border-white/8 h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-400" />
              Decision Tree Feature Importance
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Relative predictive weight derived from the stratified baseline decision tree.
            </CardDescription>
          </div>
          <Badge variant="secondary" size="sm" className="font-mono text-[10px] self-start sm:self-auto">
            max_depth: 6 &bull; balanced
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-2 pb-4 flex flex-col justify-between">
        {/* Horizontal Bar Chart */}
        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255, 255, 255, 0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, xDomainMax]}
                tick={{ fill: '#94A3B8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="featureKey"
                tick={{ fill: '#CBD5E1', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                tickLine={false}
                width={140}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="importance"
                fill="#3B82F6"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                label={{
                  position: 'right',
                  fill: '#94A3B8',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  formatter: (v: number) => `${v.toFixed(2)}%`,
                }}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`feat-cell-${index}`}
                    fill={index === 0 ? '#3B82F6' : index === 1 ? '#60A5FA' : '#93C5FD'}
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Global Feature Note */}
        <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-[#0D1527] border border-white/5 text-xs text-slate-400">
          <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-slate-400">
            <span className="font-medium text-slate-300">Model Notice:</span> Global feature importance indicates which features contributed most to the Decision Tree model's predictions. These metrics reflect overall node split purity across all evaluated branches, not individual account explanations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
