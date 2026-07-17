import React from 'react';
import { DashboardPageProps } from './types';

export const DashboardPage: React.FC<DashboardPageProps> = ({ children, className = '', style }) => {
  return (
    <div
      className={`scroll view-enter dashboard-page ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '24px',
        maxWidth: '1280px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {children}
    </div>
  );
};
