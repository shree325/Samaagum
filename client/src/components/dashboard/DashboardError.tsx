import React from 'react';
import { DashboardErrorProps } from './types';
import { I } from '../../home-icons';

export const DashboardError: React.FC<DashboardErrorProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  className = ''
}) => {
  return (
    <div
      className={`dashboard-error ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        color: '#e5484d',
        gap: '12px',
        height: '100%',
        minHeight: '160px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <I.warning style={{ width: '32px', height: '32px', color: '#e5484d' }} />
      </div>
      <div style={{ fontSize: '15px', fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: '13px', color: 'var(--ink-3)', maxWidth: '320px', margin: '0 auto' }}>
        {message}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="hbtn hbtn--soft hbtn--sm"
          style={{
            marginTop: '8px',
            borderColor: '#e5484d',
            color: '#e5484d',
            background: 'rgba(229, 72, 77, 0.05)',
            outline: 'none'
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
