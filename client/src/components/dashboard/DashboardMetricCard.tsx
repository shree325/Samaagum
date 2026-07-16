import React from 'react';
import { DashboardMetricCardProps } from './types';
import { DashboardLoading } from './DashboardLoading';

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection,
  loading = false,
  onClick,
  variant = 'simple',
  colorTheme = 'gray',
  tooltip,
  footer,
  isActive = false,
  className = ''
}) => {
  if (loading) {
    return <DashboardLoading variant="metrics" count={1} className={className} />;
  }

  // Map theme to CSS colors
  const themeStyles = {
    blue: {
      bg: 'rgba(37, 99, 235, 0.05)',
      border: 'rgba(37, 99, 235, 0.15)',
      text: '#2563eb',
      lightText: '#60a5fa'
    },
    green: {
      bg: 'rgba(31, 157, 87, 0.05)',
      border: 'rgba(31, 157, 87, 0.15)',
      text: '#1f9d57',
      lightText: '#34d399'
    },
    orange: {
      bg: 'rgba(234, 88, 12, 0.05)',
      border: 'rgba(234, 88, 12, 0.15)',
      text: '#ea580c',
      lightText: '#fb923c'
    },
    purple: {
      bg: 'rgba(139, 92, 246, 0.05)',
      border: 'rgba(139, 92, 246, 0.15)',
      text: 'var(--accent-2)',
      lightText: '#a78bfa'
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.05)',
      border: 'rgba(16, 185, 129, 0.15)',
      text: '#10b981',
      lightText: '#34d399'
    },
    gray: {
      bg: 'var(--field)',
      border: 'var(--border)',
      text: 'var(--ink-2)',
      lightText: 'var(--ink-3)'
    }
  }[colorTheme];

  const cardStyle: React.CSSProperties = {
    background: isActive
      ? `color-mix(in srgb, ${themeStyles.text} 5%, var(--surface))`
      : 'var(--surface)',
    border: isActive
      ? `2px solid ${themeStyles.text}`
      : `1px solid ${themeStyles.border}`,
    borderRadius: 'var(--r-lg)',
    padding: isActive ? '17px 19px' : '18px 20px',
    boxShadow: isActive ? 'var(--sh-md)' : 'var(--sh-sm)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    boxSizing: 'border-box'
  };

  const onCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick && !isActive) {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--sh-md)';
      e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent-2) 40%, ' + themeStyles.border + ')';
    }
  };

  const onCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = isActive ? 'var(--sh-md)' : 'var(--sh-sm)';
      e.currentTarget.style.borderColor = isActive ? themeStyles.text : themeStyles.border;
    }
  };

  // Render Stat variant (matching the reference StatCard layout)
  if (variant === 'stat') {
    return (
      <div
        className={`dashboard-metric-card stat-variant ${className}`}
        style={{
          ...cardStyle,
          flexDirection: 'column',
          gap: '6px'
        }}
        onClick={onClick}
        onMouseEnter={onCardHover}
        onMouseLeave={onCardLeave}
        title={tooltip}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
          <span style={{ fontSize: '12.5px', color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '-0.01em', display: 'block' }}>
            {title}
          </span>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: themeStyles.bg,
            color: themeStyles.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {icon}
          </div>
        </div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.02em', marginTop: '4px' }}>
          {value}
        </div>
      </div>
    );
  }

  // Render radial progress card
  if (variant === 'progress') {
    const percentVal = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
    const boundedPercent = Math.min(100, Math.max(0, percentVal));
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (boundedPercent / 100) * circumference;

    return (
      <div
        className={`dashboard-metric-card progress-variant ${className}`}
        style={cardStyle}
        onClick={onClick}
        onMouseEnter={onCardHover}
        onMouseLeave={onCardLeave}
        title={tooltip}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{title}</span>
            <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
              {percentVal}%
            </div>
          </div>
          <div style={{ position: 'relative', width: '48px', height: '48px' }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="transparent"
                stroke="var(--border)"
                strokeWidth="3.5"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                fill="transparent"
                stroke={themeStyles.text}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeStyles.text }}>
              {icon}
            </div>
          </div>
        </div>
        {subtitle && (
          <div style={{ fontSize: '12.5px', color: 'var(--ink-2)', marginTop: '8px' }}>
            {subtitle}
          </div>
        )}
        {footer}
      </div>
    );
  }

  // Default Simple or Comparison layout
  return (
    <div
      className={`dashboard-metric-card ${className}`}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={onCardHover}
      onMouseLeave={onCardLeave}
      title={tooltip}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--ink-3)', fontWeight: 500 }}>{title}</span>
        {icon && <span style={{ color: themeStyles.text, opacity: 0.85 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--ink)', marginTop: '6px', letterSpacing: '-0.01em' }}>
        {value}
      </div>
      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {trend && (
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: trendDirection === 'up' ? '#1f9d57' : trendDirection === 'down' ? '#e5484d' : 'var(--ink-3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              {trendDirection === 'up' && '↑'}
              {trendDirection === 'down' && '↓'}
              {trend}
            </span>
          )}
          {subtitle && (
            <span style={{ fontSize: '12.5px', color: 'var(--ink-3)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
      {footer}
    </div>
  );
};
