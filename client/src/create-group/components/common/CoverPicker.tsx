// @ts-nocheck
import React from 'react';
import { COVER_SWATCHES } from '../../constants/covers';

export function CoverPicker({ value, onPick }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
      {COVER_SWATCHES.map(s => (
        <button key={s.k} onClick={() => onPick(s.v)} title={s.k}
          style={{
            width: 34, height: 34, borderRadius: 10, cursor: "pointer", background: s.v,
            border: value === s.v ? "2.5px solid var(--ink)" : "2px solid transparent",
            boxShadow: value === s.v ? "0 0 0 2px var(--surface) inset" : "var(--sh-sm)", transition: "transform .15s"
          }} />
      ))}
    </div>
  );
}
