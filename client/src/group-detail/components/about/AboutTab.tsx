import React from 'react';
import { ConductedEventsSection } from './ConductedEventsSection';

interface AboutTabProps {
  g: any;
}

export function AboutTab({ g }: AboutTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "24px" }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>About this group</h3>
        <div style={{ color: "var(--ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
          {g.description || g.desc || "No description provided."}
        </div>
      </div>
      {(g.rules || (g.settings && g.settings.rules)) && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "24px" }}>
          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Group Rules</h3>
          <div style={{ color: "var(--ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {g.rules || g.settings.rules}
          </div>
        </div>
      )}
      <ConductedEventsSection groupId={g.id} />
    </div>
  );
}
