// @ts-nocheck
import React from 'react';

export function EligibilityOption({ active, title, desc, onClick }: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '18px', borderRadius: '16px',
        border: active ? '1.5px solid var(--accent-2)' : '1px solid var(--border)',
        background: active ? 'var(--accent-soft)' : 'var(--field)',
        cursor: 'pointer', transition: 'all .15s', outline: 'none', fontFamily: 'inherit',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: active ? 'var(--accent-2)' : 'var(--ink)' }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: '1.4' }}>{desc}</div>
    </button>
  );
}

export function SummaryChip({ icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', background: 'var(--field)', border: '1px solid var(--border)',
        borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--ink)',
        cursor: 'pointer', transition: 'border-color 0.15s, background-color 0.15s',
      }}
      className="summary-chip"
    >
      <span>{icon} {label}</span>
      <span style={{ color: 'var(--accent-2)', fontSize: 11, marginLeft: 2 }}>⚙️</span>
    </span>
  );
}

export function CategorySummaryChip({ type, items, onEditClick }: { type?: string; items: string[]; onEditClick: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', background: 'var(--field)', border: '1px solid var(--border)',
        borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--ink)',
      }}
    >
      <span>🏛️ {items.join(', ')}</span>
      <span style={{ cursor: 'pointer', color: 'var(--accent-2)', fontSize: 12, marginLeft: 4 }} onClick={onEditClick}>✏️</span>
    </span>
  );
}

export function RuleSummaryChip({ rule, onEditClick }: { rule: { community: string; groups: string[] }; onEditClick: () => void }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 12px', background: 'var(--field)', border: '1px solid var(--border)',
        borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--ink)',
      }}
    >
      <span>🏛️ {rule.community} → 👥 {rule.groups.join(', ')}</span>
      <span style={{ cursor: 'pointer', color: 'var(--accent-2)', fontSize: 12, marginLeft: 4 }} onClick={onEditClick}>✏️</span>
    </span>
  );
}
