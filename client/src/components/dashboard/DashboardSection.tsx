import React, { useState } from 'react';
import { DashboardSectionProps } from './types';

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  subtitle,
  actions,
  collapse = false,
  loading = false,
  children,
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`dashboard-section ${className}`}
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
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-2)',
          paddingBottom: isCollapsed ? '0' : '12px'
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {collapse && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--ink-3)',
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none',
                  fontSize: '12px'
                }}
              >
                <span style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s ease', display: 'inline-block' }}>
                  ▼
                </span>
              </button>
            )}
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-3)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>{actions}</div>}
      </div>
      
      {!isCollapsed && (
        <div style={{ position: 'relative', minHeight: loading ? '100px' : 'auto' }}>
          {loading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(4px)',
                borderRadius: 'inherit',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div className="spinner" />
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
};
