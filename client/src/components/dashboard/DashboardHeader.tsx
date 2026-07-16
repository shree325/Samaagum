import React from 'react';
import { DashboardHeaderProps } from './types';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  className = ''
}) => {
  return (
    <div className={`dashboard-header ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginBottom: '8px' }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--ink-3)' }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink-2)', fontWeight: 500, outline: 'none' }}
                >
                  {crumb.label}
                </button>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {description && (
            <p style={{ margin: '4px 0 0', fontSize: '14.5px', color: 'var(--ink-2)' }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>{actions}</div>}
      </div>
    </div>
  );
};
