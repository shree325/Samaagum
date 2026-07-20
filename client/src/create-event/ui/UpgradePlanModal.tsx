// @ts-nocheck
import React from 'react';

export function UpgradePlanModal({
  open,
  onClose,
  feature,
  go,
  currentPlanName,
}: {
  open: boolean;
  onClose: () => void;
  feature: string;
  go: (page: string) => void;
  currentPlanName?: string;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: 'var(--surface)', width: 440, borderRadius: 'var(--r-xl)', padding: 32, boxShadow: 'var(--sh-xl)', border: '1px solid var(--border)', position: 'relative', textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px 0', color: 'var(--ink)' }}>Upgrade Required</h2>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 24px 0', lineHeight: 1.6 }}>
          The feature <strong>{feature}</strong> is locked under your current plan ({currentPlanName || 'Free Plan'}).
          Please upgrade your plan to unlock premium options, unlimited capacity, and advanced event features!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            className="hbtn hbtn--primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, fontWeight: 600 }}
            onClick={() => { onClose(); go('upgrade'); }}
          >
            Upgrade Plan
          </button>
          <button
            className="hbtn hbtn--ghost"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
