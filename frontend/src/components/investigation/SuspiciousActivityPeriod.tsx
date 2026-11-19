import React from 'react';
import { CalendarRange, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AccountInvestigationData } from '@/mock/accountInvestigationData';
import { formatDate } from '@/mock/suspiciousAccountsData';

interface SuspiciousActivityPeriodProps {
  account: AccountInvestigationData;
}

export const SuspiciousActivityPeriod: React.FC<SuspiciousActivityPeriodProps> = ({ account }) => {
  const { suspiciousStart, suspiciousEnd, activityDurationDays } = account;
  const hasWindow = Boolean(suspiciousStart && suspiciousEnd);

  return (
    <Card className={`border shadow-sm ${
      hasWindow
        ? 'bg-gradient-to-r from-[#180f1d] via-[#111C33] to-[#0D1527] border-red-500/30'
        : 'bg-[#111C33] border-white/8'
    }`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Window Headline */}
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              hasWindow
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              {hasWindow ? <AlertTriangle className="h-5 w-5" /> : <CalendarRange className="h-5 w-5" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Suspicious Activity Window (Temporal IoU Interval)
                </h3>
                {hasWindow ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/35 animate-pulse">
                    Detected Burst Interval
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-white/10">
                    Baseline Retail Profile
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                Identifies the tightest calendar interval exhibiting maximum concentration of high-velocity pass-through flows, structuring, and counterparty funneling.
              </p>
            </div>
          </div>

          {/* Right: Dates & Duration Grid */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {/* Start Date */}
            <div className="px-3.5 py-2 rounded-lg bg-[#0D1527] border border-white/10 text-xs min-w-[130px]">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Suspicious Start Date
              </span>
              <span className="font-mono font-bold text-slate-100 text-xs mt-0.5 block">
                {suspiciousStart ? formatDate(suspiciousStart) : 'Not available'}
              </span>
            </div>

            {/* End Date */}
            <div className="px-3.5 py-2 rounded-lg bg-[#0D1527] border border-white/10 text-xs min-w-[130px]">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Suspicious End Date
              </span>
              <span className="font-mono font-bold text-slate-100 text-xs mt-0.5 block">
                {suspiciousEnd ? formatDate(suspiciousEnd) : 'Not available'}
              </span>
            </div>

            {/* Duration */}
            <div className="px-3.5 py-2 rounded-lg bg-[#0D1527] border border-white/10 text-xs min-w-[110px]">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-400" />
                Active Duration
              </span>
              <span className="font-mono font-bold text-blue-300 text-xs mt-0.5 block">
                {activityDurationDays !== null ? `${activityDurationDays} Days` : 'Not available'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
