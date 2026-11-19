import React from 'react';
import {
  Users,
  ArrowLeftRight,
  Split,
  CircleDot,
  Snowflake,
  ShieldCheck,
  Hourglass,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';
import { formatINR } from '@/mock/overviewData';

interface BehaviourIndicatorsProps {
  account: AccountInvestigationData;
}

export const BehaviourIndicators: React.FC<BehaviourIndicatorsProps> = ({ account }) => {
  const f = account.features;

  const indicators = [
    {
      id: 'total_unique_cp',
      name: 'Unique Counterparties',
      technicalName: 'total_unique_cp',
      value: `${f.total_unique_cp} Counterparties`,
      explanation: 'Represents the number of distinct counterparties interacting with this account.',
      icon: Users,
      highlight: f.total_unique_cp > 30.5,
      highlightNote: '> 30.5 Node 0 trigger',
    },
    {
      id: 'pass_through_symmetry',
      name: 'Pass-Through Behaviour',
      technicalName: 'pass_through_symmetry',
      value: f.pass_through_symmetry.toFixed(2),
      explanation: 'Compares incoming and outgoing transaction volumes (|Credits - Debits| / (Credits + Debits)).',
      icon: ArrowLeftRight,
      highlight: f.pass_through_symmetry <= 0.33,
      highlightNote: '\u2264 0.33 Rapid pass-through',
    },
    {
      id: 'structuring_50k_count',
      name: 'Structuring Activity',
      technicalName: 'structuring_50k_count',
      value: `${f.structuring_50k_count} Transactions`,
      explanation: 'Counts transactions just below mandatory reporting thresholds between \u20B945,000 and \u20B949,999.',
      icon: Split,
      highlight: f.structuring_50k_count >= 5,
      highlightNote: f.structuring_50k_count >= 5 ? 'Elevated structuring' : undefined,
    },
    {
      id: 'round_5k_count',
      name: 'Round Amount Activity',
      technicalName: 'round_5k_count',
      value: `${f.round_5k_count} Transactions`,
      explanation: 'Counts transactions processed in exact round multiples of \u20B95,000.',
      icon: CircleDot,
      highlight: f.round_5k_count >= 15,
      highlightNote: f.round_5k_count >= 15 ? 'High frequency round sums' : undefined,
    },
    {
      id: 'freeze_info',
      name: 'Account Freeze Information',
      technicalName: 'is_frozen_flag & days_since_freeze',
      value: f.is_frozen_flag === 1
        ? `Frozen (${f.days_since_freeze !== null ? `${f.days_since_freeze} days ago` : 'Recorded'})`
        : 'Active (Not Frozen)',
      explanation: 'Shows regulatory account freeze status and freeze recency in days.',
      icon: Snowflake,
      highlight: f.is_frozen_flag === 1 && (f.days_since_freeze ?? 999) <= 360,
      highlightNote: f.is_frozen_flag === 1 ? 'Active AML freeze recency' : undefined,
    },
    {
      id: 'kyc_info',
      name: 'KYC Information',
      technicalName: 'days_since_last_kyc',
      value: f.days_since_last_kyc !== null ? `${f.days_since_last_kyc} Days Ago` : 'Not recorded',
      explanation: 'Measures days elapsed since customer profile details or credentials were last updated.',
      icon: ShieldCheck,
      highlight: (f.days_since_last_kyc ?? 999) <= 41.5,
      highlightNote: (f.days_since_last_kyc ?? 999) <= 41.5 ? '\u2264 41.5d Recent update spike' : undefined,
    },
    {
      id: 'active_lifespan_days',
      name: 'Account Activity Duration',
      technicalName: 'active_lifespan_days',
      value: `${f.active_lifespan_days} Days`,
      explanation: 'Total calendar lifespan from initial registration to latest observed activity.',
      icon: Hourglass,
      highlight: f.active_lifespan_days < 90,
      highlightNote: f.active_lifespan_days < 90 ? 'Young account lifespan' : undefined,
    },
    {
      id: 'peak_month_volume',
      name: 'Peak Transaction Activity',
      technicalName: 'peak_month_volume',
      value: formatINR(f.peak_month_volume),
      explanation: 'Highest cumulative transaction volume recorded within a single calendar month.',
      icon: TrendingUp,
      highlight: f.peak_month_volume > 2500000,
      highlightNote: f.peak_month_volume > 2500000 ? 'Volume concentration peak' : undefined,
    },
  ];

  return (
    <Card className="bg-[#111C33] border-white/8 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              Account Behaviour Indicators
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1">
              Extracted machine learning behavioral features and quantitative thresholds evaluated for this entity.
            </CardDescription>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-[#0D1527] px-2.5 py-1 rounded border border-white/5">
            Feature Extraction Pipeline v1.0
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {indicators.map((ind) => {
            const Icon = ind.icon;
            return (
              <div
                key={ind.id}
                className="flex flex-col justify-between p-3.5 rounded-xl bg-[#0D1527] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                      <Icon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      {ind.name}
                    </span>
                    {ind.highlightNote && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30">
                        Trigger
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5">
                    <span className="font-mono text-sm font-bold text-white block">
                      {ind.value}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      Feature: {ind.technicalName}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-400 leading-relaxed border-t border-white/5 pt-2">
                  {ind.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
