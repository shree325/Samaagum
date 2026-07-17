import React, { ReactNode } from 'react';

export interface DashboardPageProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface DashboardHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  actions?: ReactNode;
  className?: string;
}

export interface DashboardMetricCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string | number;
  trendDirection?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
  variant?: 'simple' | 'progress' | 'comparison' | 'stat';
  colorTheme?: 'blue' | 'green' | 'orange' | 'purple' | 'emerald' | 'gray';
  tooltip?: string;
  footer?: ReactNode;
  isActive?: boolean;
  className?: string;
}

export interface DashboardMetricGridProps {
  children: ReactNode;
  cols?: number; // Target columns on desktop (defaults to 4)
  className?: string;
}

export interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  collapse?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

export interface DashboardChartsGridProps {
  children: ReactNode;
  className?: string;
}

export interface DashboardListCardProps {
  title: string;
  actions?: ReactNode;
  loading?: boolean;
  children: ReactNode;
  className?: string;
  empty?: boolean;
  emptyMessage?: string;
}

export interface DashboardChartWrapperProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
  height?: number | string;
}

export interface DashboardEmptyStateProps {
  title: string;
  message: string;
  icon?: ReactNode;
  className?: string;
}

export interface DashboardLoadingProps {
  variant?: 'metrics' | 'chart' | 'list' | 'page';
  count?: number;
  className?: string;
}

export interface DashboardErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}
