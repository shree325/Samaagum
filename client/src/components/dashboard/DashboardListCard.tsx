import React from 'react';
import { DashboardListCardProps } from './types';
import { DashboardLoading } from './DashboardLoading';
import { DashboardEmptyState } from './DashboardEmptyState';

export const DashboardListCard: React.FC<DashboardListCardProps> = ({
  title,
  actions,
  loading = false,
  children,
  className = '',
  empty = false,
  emptyMessage = 'No data available yet'
}) => {
  return (
    <div
      className={`dashboard-list-card ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--sh-sm)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-2)',
          background: 'var(--surface)'
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--ink)'
          }}
        >
          {title}
        </h3>
        {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
      </div>

      <div style={{ position: 'relative', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <DashboardLoading variant="list" count={5} />
        ) : empty ? (
          <DashboardEmptyState title="No items found" message={emptyMessage} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        )}
      </div>
    </div>
  );
};
