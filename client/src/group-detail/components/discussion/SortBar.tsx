import React from 'react';

interface SortBarProps {
  sort: string;
  onSort: (sort: string) => void;
}

export function SortBar({ sort, onSort }: SortBarProps) {
  const opts = [["new", "New"], ["hot", "🔥 Hot"], ["top", "Top"], ["pinned", "📌 Pinned"]];
  return (
    <div style={{ display: "flex", gap: 2, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => onSort(k)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: sort === k ? 600 : 400, background: sort === k ? "var(--ink)" : "transparent", color: sort === k ? "var(--surface)" : "var(--ink-2)", transition: "all .15s" }}>{l}</button>
      ))}
    </div>
  );
}
