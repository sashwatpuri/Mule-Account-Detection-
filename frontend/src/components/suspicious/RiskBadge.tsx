import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/mock/suspiciousAccountsData';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, className }) => {
  switch (level) {
    case 'High':
      return (
        <Badge variant="high" size="sm" dot className={className}>
          HIGH RISK{score !== undefined ? ` • ${score.toFixed(1)}%` : ''}
        </Badge>
      );
    case 'Medium':
      return (
        <Badge variant="medium" size="sm" dot className={className}>
          MEDIUM RISK{score !== undefined ? ` • ${score.toFixed(1)}%` : ''}
        </Badge>
      );
    case 'Low':
    default:
      return (
        <Badge variant="low" size="sm" dot className={className}>
          LOW RISK{score !== undefined ? ` • ${score.toFixed(1)}%` : ''}
        </Badge>
      );
  }
};
