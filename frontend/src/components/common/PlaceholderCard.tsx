import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlaceholderCardProps {
  icon: LucideIcon;
  title: string;
  category: string;
  statusText?: string;
  description: string;
  plannedFeatures?: string[];
}

export const PlaceholderCard: React.FC<PlaceholderCardProps> = ({
  icon: Icon,
  title,
  category,
  statusText = 'Ready for Stage 2 Implementation',
  description,
  plannedFeatures = [],
}) => {
  return (
    <Card className="border-white/8 hover:border-white/15 transition-all bg-[#111C33]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-400">
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {category}
            </span>
          </div>
          <Badge variant="neutral" size="sm" dot>
            {statusText}
          </Badge>
        </div>
        <CardTitle className="mt-3 text-base font-semibold text-white">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      {plannedFeatures.length > 0 && (
        <CardContent className="pt-2">
          <div className="rounded-lg bg-[#0D1527]/70 p-3 border border-white/5 space-y-2">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Module Scope & Features:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {plannedFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
