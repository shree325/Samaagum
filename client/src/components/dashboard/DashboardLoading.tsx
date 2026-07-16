import React from 'react';
import { DashboardLoadingProps } from './types';

export const DashboardLoading: React.FC<DashboardLoadingProps> = ({
  variant = 'metrics',
  count = 4,
  className = ''
}) => {
  const PulseItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <div
      style={{
        background: 'linear-gradient(90deg, var(--border-2) 25%, var(--field) 50%, var(--border-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulse 1.5s infinite linear',
        borderRadius: '4px',
        ...style
      }}
    />
  );

  const animStyle = `
    @keyframes pulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  if (variant === 'metrics') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`, gap: '16px', width: '100%' }}>
        <style>{animStyle}</style>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className={`dashboard-loading-card ${className}`}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '18px 20px',
              boxShadow: 'var(--sh-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxSizing: 'border-box'
            }}
          >
            <PulseItem style={{ width: '40%', height: '14px' }} />
            <PulseItem style={{ width: '60%', height: '28px' }} />
            <PulseItem style={{ width: '30%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chart') {
    return (
      <div
        className={`dashboard-loading-chart ${className}`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '20px',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <style>{animStyle}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <PulseItem style={{ width: '20%', height: '16px' }} />
          <PulseItem style={{ width: '10%', height: '16px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0' }}>
          <PulseItem style={{ flex: 1, height: '40%' }} />
          <PulseItem style={{ flex: 1, height: '70%' }} />
          <PulseItem style={{ flex: 1, height: '55%' }} />
          <PulseItem style={{ flex: 1, height: '90%' }} />
          <PulseItem style={{ flex: 1, height: '30%' }} />
          <PulseItem style={{ flex: 1, height: '80%' }} />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        className={`dashboard-loading-list ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
          background: 'var(--border-2)',
          boxSizing: 'border-box',
          width: '100%'
        }}
      >
        <style>{animStyle}</style>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--surface)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <PulseItem style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <PulseItem style={{ width: '40%', height: '14px' }} />
              <PulseItem style={{ width: '20%', height: '11px' }} />
            </div>
            <PulseItem style={{ width: '50px', height: '14px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <style>{animStyle}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '40%' }}>
          <PulseItem style={{ width: '30%', height: '24px' }} />
          <PulseItem style={{ width: '70%', height: '14px' }} />
        </div>
        <PulseItem style={{ width: '100px', height: '36px', borderRadius: '20px' }} />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <PulseItem style={{ width: '40%', height: '14px' }} />
            <PulseItem style={{ width: '60%', height: '24px' }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', height: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PulseItem style={{ width: '30%', height: '16px' }} />
          <PulseItem style={{ flex: 1 }} />
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '20px', height: '240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <PulseItem style={{ width: '30%', height: '16px' }} />
          <PulseItem style={{ flex: 1 }} />
        </div>
      </div>
    </div>
  );
};
