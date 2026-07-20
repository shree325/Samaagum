// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { format24to12, parse12to24 } from '../utils/time';

export function TimePicker({ label = undefined, value, onChange, mobile = false, compact = false }: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  mobile?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const clockRef     = useRef<HTMLDivElement>(null);

  const [mode, setMode]     = useState<'hours' | 'minutes'>('hours');
  const [tempHour, setTempHour]   = useState(12);
  const [tempMin,  setTempMin]    = useState(0);
  const [tempAmPm, setTempAmPm]   = useState<'AM' | 'PM'>('PM');
  const [isDragging, setIsDragging] = useState(false);

  const getTouchCoords = (e: any) => {
    if (e.touches && e.touches[0]) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    return null;
  };

  useEffect(() => { setInputValue(format24to12(value)); }, [value]);

  useEffect(() => {
    if (open) {
      const now  = new Date();
      let h = now.getHours();
      let m = Math.round(now.getMinutes() / 5) * 5;
      if (m === 60) { m = 0; h = (h + 1) % 24; }
      const defaultVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const [hStr, mStr] = (value || defaultVal).split(':');
      let h24 = parseInt(hStr, 10); let m0 = parseInt(mStr, 10);
      if (isNaN(h24)) h24 = 12; if (isNaN(m0)) m0 = 0;
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12; if (h12 === 0) h12 = 12;
      setTempHour(h12); setTempMin(m0); setTempAmPm(ampm as any); setMode('hours');
    }
  }, [open]);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as any)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const updateTime = (h: number, m: number, ampm: string) => {
    let h24 = h;
    if (ampm === 'PM' && h < 12) h24 += 12;
    if (ampm === 'AM' && h === 12) h24 = 0;
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };
  const selectHour = (h: number) => { setTempHour(h); setTimeout(() => setMode('minutes'), 200); updateTime(h, tempMin, tempAmPm); };
  const selectMin  = (m: number) => { setTempMin(m); updateTime(tempHour, m, tempAmPm); setTimeout(() => setOpen(false), 300); };
  const selectAmPm = (ampm: string) => { setTempAmPm(ampm as any); updateTime(tempHour, tempMin, ampm); };

  const handleInputChange = (e: any) => {
    const val = e.target.value; setInputValue(val);
    const parsed = parse12to24(val); if (parsed) onChange(parsed);
  };
  const handleInputBlur = () => { if (!parse12to24(inputValue)) setInputValue(format24to12(value)); };

  const calculateValFromCoords = useCallback((clientX: number, clientY: number) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const cx = rect.width / 2; const cy = rect.height / 2;
    const x = clientX - rect.left - cx; const y = clientY - rect.top - cy;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    if (mode === 'hours') { let h = Math.round(angle / 30); if (h === 0) h = 12; return h; }
    else { let m = Math.round(angle / 6); if (m === 60) m = 0; m = Math.round(m / 5) * 5; if (m === 60) m = 0; return m; }
  }, [mode]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const val = calculateValFromCoords(e.clientX, e.clientY);
      if (val !== undefined) { if (mode === 'hours') { setTempHour(val); updateTime(val, tempMin, tempAmPm); } else { setTempMin(val); updateTime(tempHour, val, tempAmPm); } }
    };
    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      const val = calculateValFromCoords(e.clientX, e.clientY);
      if (val !== undefined) { if (mode === 'hours') selectHour(val); else selectMin(val); }
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, mode, calculateValFromCoords, tempHour, tempMin, tempAmPm]);

  const angle = mode === 'hours' ? (tempHour % 12) * 30 : tempMin * 6;
  const numbers = mode === 'hours' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div ref={containerRef} style={{ position: 'relative', zIndex: open ? 50 : 1, width: '100%', maxWidth: compact ? 'none' : (mobile ? '140px' : '130px'), height: compact ? '100%' : 'auto', borderLeft: compact ? '1px solid var(--border)' : 'none', display: compact ? 'flex' : 'block', alignItems: 'center' }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{label}</label>}
      <div style={{ position: 'relative', height: compact ? '100%' : 'auto', width: compact ? '100%' : 'auto' }}>
        <input
          className={compact ? '' : 'cinput'}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={() => setOpen(true)}
          placeholder="09:00 AM"
          style={compact ? { width: '100%', height: '100%', cursor: 'pointer', border: 'none', background: 'transparent', padding: '16px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: 'var(--ink)' }
            : { width: '100%', cursor: 'pointer', paddingRight: '30px', background: 'var(--field)', border: '1px solid var(--border)' }}
        />
        {!compact && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-3)', fontSize: '12px' }}>⏰</span>}
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-xl)', padding: '16px', zIndex: 1000, width: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'popUp 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}>
          {/* Time display + AM/PM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center', fontSize: '18px', fontWeight: '600' }}>
            <span onClick={() => setMode('hours')} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--r-sm)', background: mode === 'hours' ? 'var(--accent-soft)' : 'transparent', color: mode === 'hours' ? 'var(--accent-2)' : 'var(--ink)', border: mode === 'hours' ? '1px solid var(--border)' : '1px solid transparent' }}>{String(tempHour).padStart(2,'0')}</span>
            <span>:</span>
            <span onClick={() => setMode('minutes')} style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--r-sm)', background: mode === 'minutes' ? 'var(--accent-soft)' : 'transparent', color: mode === 'minutes' ? 'var(--accent-2)' : 'var(--ink)', border: mode === 'minutes' ? '1px solid var(--border)' : '1px solid transparent' }}>{String(tempMin).padStart(2,'0')}</span>
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-2)', padding: '2px', borderRadius: 'var(--r-sm)', marginLeft: '8px', border: '1px solid var(--border)' }}>
              {(['AM', 'PM'] as const).map(ap => (
                <button key={ap} onClick={() => selectAmPm(ap)} style={{ border: 'none', padding: '4px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', cursor: 'pointer', background: tempAmPm === ap ? 'var(--surface)' : 'transparent', color: tempAmPm === ap ? 'var(--accent-2)' : 'var(--ink-3)', boxShadow: tempAmPm === ap ? 'var(--sh-sm)' : 'none' }}>{ap}</button>
              ))}
            </div>
          </div>
          {/* Clock face */}
          <div ref={clockRef} onMouseDown={e => { e.preventDefault(); setIsDragging(true); const v = calculateValFromCoords(e.clientX, e.clientY); if (v !== undefined) { if (mode === 'hours') { setTempHour(v); updateTime(v, tempMin, tempAmPm); } else { setTempMin(v); updateTime(tempHour, v, tempAmPm); } } }} style={{ position: 'relative', width: '200px', height: '200px', background: 'var(--field)', borderRadius: '50%', margin: '16px auto', cursor: 'pointer', border: '1px solid var(--border)', userSelect: 'none' }}>
            <div style={{ position: 'absolute', left: 'calc(50% - 3px)', top: 'calc(50% - 3px)', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-2)', zIndex: 3, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '50%', left: 'calc(50% - 1px)', width: '2px', height: '75px', background: 'var(--accent-2)', transformOrigin: 'bottom center', transform: `rotate(${angle}deg)`, zIndex: 2, pointerEvents: 'none', transition: isDragging ? 'none' : 'transform 0.15s ease-out' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '-11px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-2)', opacity: 0.8 }} />
            </div>
            {numbers.map((num, i) => {
              const na = i * 30 * (Math.PI / 180); const r = 72;
              const left = 100 + r * Math.sin(na); const top = 100 - r * Math.cos(na);
              const isSel = mode === 'hours' ? (tempHour === num || (tempHour === 12 && num === 12)) : (Math.round(tempMin / 5) * 5 === num || (tempMin === 0 && num === 0));
              return (
                <div key={num} style={{ position: 'absolute', left: `${left}px`, top: `${top}px`, transform: 'translate(-50%,-50%)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: isSel ? '700' : '500', color: isSel ? '#fff' : 'var(--ink-2)', zIndex: 4, userSelect: 'none', pointerEvents: 'none' }}>
                  {mode === 'minutes' ? String(num).padStart(2, '0') : num}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'flex-end', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { updateTime(tempHour, tempMin, tempAmPm); setOpen(false); }} style={{ padding: '6px 12px', border: 'none' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
