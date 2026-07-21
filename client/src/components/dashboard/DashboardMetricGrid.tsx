import React from 'react';
import { DashboardMetricGridProps } from './types';

export const DashboardMetricGrid: React.FC<DashboardMetricGridProps> = ({
  children,
  cols = 4,
  className = ''
}) => {
  return (
    <div
      className={`dashboard-metric-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
        gap: '16px',
        width: '100%'
      }}
    >
      {children}
    </div>
  );
};
