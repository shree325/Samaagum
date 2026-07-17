import React, { useState } from 'react';
import { EMOJIS } from '../../utils/constants';

interface EmojiBarProps {
  counts: Record<string, number>;
  onReact: (emoji: string) => void;
}

export function EmojiBar({ counts, onReact }: EmojiBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {EMOJIS.filter(e => (counts || {})[e] > 0).map(e => (
        <button key={e} onClick={ev => { ev.stopPropagation(); onReact(e); }} style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          {e} <span style={{ color: "var(--ink-2)" }}>{(counts || {})[e]}</span>
        </button>
      ))}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button onClick={ev => { ev.stopPropagation(); setShowPicker(v => !v); }} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: "var(--ink-3)" }} title="React">+</button>
        {showPicker && (
          <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 8, display: "flex", gap: 4, zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={ev => { ev.stopPropagation(); onReact(e); setShowPicker(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}>{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
