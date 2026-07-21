// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { MONTH_NAMES, WEEKDAY_LABELS } from '../constants';

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`;
}

export function DatePicker({ label = undefined, value, onChange, mobile = false, compact = false }: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  mobile?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewYear,  setViewYear]  = useState<number | null>(null);
  const [viewMonth, setViewMonth] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      const [y, m] = value ? value.split('-').map(Number) : [null, null];
      const now = new Date();
      setViewYear(y || now.getFullYear());
      setViewMonth(y ? m - 1 : now.getMonth());
    }
  }, [open, value]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const goMonth = (delta: number) => {
    let m = viewMonth + delta; let y = viewYear;
    if (m < 0)  { m = 11; y -= 1; }
    if (m > 11) { m = 0;  y += 1; }
    setViewMonth(m); setViewYear(y);
  };

  const selectDay = (day: number) => {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    setOpen(false);
  };

  const renderCalendarGrid = () => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
    const selected = value ? value.split('-').map(Number) : null;
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', width: '100%' }}>
        {WEEKDAY_LABELS.map(w => (
          <div key={w} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--ink-3)', padding: '4px 0' }}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={'e' + i} />;
          const isSelected = selected && selected[0] === viewYear && selected[1] === viewMonth + 1 && selected[2] === day;
          const isPast = new Date(viewYear, viewMonth, day) < today;
          return (
            <button key={day} type="button" disabled={isPast} onClick={() => selectDay(day)}
              style={{ width: '100%', aspectRatio: '1', border: 'none', borderRadius: '50%', cursor: isPast ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: isSelected ? 700 : 500, background: isSelected ? 'var(--accent-2)' : 'transparent', color: isPast ? 'var(--ink-3)' : (isSelected ? '#fff' : 'var(--ink)'), opacity: isPast ? 0.35 : 1, fontFamily: 'inherit' }}>
              {day}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: open ? 50 : 1, width: '100%', maxWidth: compact ? 'none' : (mobile ? '160px' : '150px'), height: compact ? '100%' : 'auto', borderLeft: compact ? '1px solid var(--border)' : 'none', display: compact ? 'flex' : 'block', alignItems: 'center' }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{label}</label>}
      <div style={{ position: 'relative', height: compact ? '100%' : 'auto', width: compact ? '100%' : 'auto' }}>
        <input
          className={compact ? '' : 'cinput'}
          type="text" readOnly
          value={formatDateDisplay(value)}
          onClick={() => setOpen(true)}
          placeholder="Select date"
          style={compact
            ? { width: '100%', height: '100%', cursor: 'pointer', border: 'none', background: 'transparent', padding: '16px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: 'var(--ink)' }
            : { width: '100%', cursor: 'pointer', paddingRight: '30px', background: 'var(--field)', border: '1px solid var(--border)' }}
        />
        {!compact && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-3)', fontSize: '12px' }}>📅</span>}
      </div>
      {open && viewYear !== null && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-xl)', padding: '16px', zIndex: 1000, width: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
            <button type="button" onClick={() => goMonth(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', color: 'var(--ink-2)', padding: '4px 8px' }}>‹</button>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => goMonth(1)}  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', color: 'var(--ink-2)', padding: '4px 8px' }}>›</button>
          </div>
          {renderCalendarGrid()}
        </div>
      )}
    </div>
  );
}
