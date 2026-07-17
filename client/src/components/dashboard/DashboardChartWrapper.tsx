import React from 'react';
import { DashboardChartWrapperProps } from './types';
import { DashboardEmptyState } from './DashboardEmptyState';
import { DashboardError } from './DashboardError';

export const DashboardChartWrapper: React.FC<DashboardChartWrapperProps> = ({
  title,
  subtitle,
  actions,
  loading = false,
  error = false,
  errorMessage = 'Unable to load dashboard',
  empty = false,
  emptyMessage = 'No data available yet',
  children,
  className = '',
  height = 320
}) => {
  return (
    <div
      className={`dashboard-chart-wrapper ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '20px',
        boxShadow: 'var(--sh-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        boxSizing: 'border-box',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height
      }}
    >
      {(title || subtitle || actions) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            {title && (
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '15.5px', fontWeight: 600, color: 'var(--ink)' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--ink-3)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 0, width: '100%' }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
          </div>
        ) : error ? (
          <DashboardError title="Error Loading Chart" message={errorMessage} />
        ) : empty ? (
          <DashboardEmptyState title="Chart Unavailable" message={emptyMessage} />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
