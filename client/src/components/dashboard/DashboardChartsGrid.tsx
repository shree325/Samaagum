import React from 'react';
import { DashboardChartsGridProps } from './types';

export const DashboardChartsGrid: React.FC<DashboardChartsGridProps> = ({
  children,
  className = ''
}) => {
  return (
    <div
      className={`dashboard-charts-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
        gap: '24px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {children}
    </div>
  );
};
