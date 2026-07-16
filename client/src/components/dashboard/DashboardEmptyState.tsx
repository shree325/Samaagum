import React from 'react';
import { DashboardEmptyStateProps } from './types';
import { I } from '../../home-icons';

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  title,
  message,
  icon,
  className = ''
}) => {
  return (
    <div
      className={`dashboard-empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        color: 'var(--ink-3)',
        gap: '8px',
        height: '100%',
        minHeight: '160px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ opacity: 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon || <I.warning style={{ width: '32px', height: '32px' }} />}
      </div>
      <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--ink-2)' }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--ink-3)', maxWidth: '280px', margin: '0 auto' }}>
        {message}
      </div>
    </div>
  );
};
