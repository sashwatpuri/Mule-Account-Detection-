import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'danger' | 'warning' | 'info';
  description?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}
