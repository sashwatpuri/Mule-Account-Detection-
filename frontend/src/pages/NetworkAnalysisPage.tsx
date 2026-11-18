import React, { useState, useEffect } from 'react';
import { NetworkAnalysisHeader } from '@/components/network/NetworkAnalysisHeader';
import { NetworkGraph } from '@/components/network/NetworkGraph';
import { DataSourceIndicator } from '@/components/common/DataSourceIndicator';
import { NetworkApi } from '@/api/networkApi';
import { Info } from 'lucide-react';

export const NetworkAnalysisPage: React.FC = () => {
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    NetworkApi.getNetworkTopology().then((res) => {
      if (isMounted) {
        setIsLiveBackend(res.data?.isLiveBackend ?? false);
        if (res.error) setApiError(res.error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Page Header with Title, Subtitle, Color Legend & Status */}
      <div className="space-y-3">
        <div className="flex justify-end">
          <DataSourceIndicator isLive={isLiveBackend} error={apiError} />
        </div>
        <NetworkAnalysisHeader />
      </div>

      {/* 2. Interactive Network Graph Canvas with Controls & Side Overlays */}
      <section aria-label="Transaction Network Graph">
        <NetworkGraph />
      </section>

      {/* 3. Transaction-Level Backend Integration Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#111C33] border border-white/8 text-xs text-slate-400">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-200 block text-xs">
            Data Architecture &amp; Counterparty Mapping Notice:
          </span>
          <p className="leading-relaxed text-[11px] text-slate-400">
            The machine learning feature extraction pipeline calculates aggregate counterparty metrics (<code className="text-blue-300 font-mono">total_unique_cp</code>, fan-in / fan-out ratios). This interactive graph topology visualizes the reconstructed transactional fund movements between suspect accounts and their counterparties, highlighting pure pass-through hubs and smurfing dispersion loops.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkAnalysisPage;
