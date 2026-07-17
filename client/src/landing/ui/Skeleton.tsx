import React from "react";

export function SkeletonCard() {
  return (
    <div className="skeleton-card glass-card" style={{ padding: 20, borderRadius: 20, minHeight: 280, display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="skeleton-thumb" style={{ height: 140, borderRadius: 12, background: "var(--card-border)", animation: "pulse 1.5s infinite ease-in-out" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 18, width: "70%", borderRadius: 4, background: "var(--card-border)", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ height: 14, width: "40%", borderRadius: 4, background: "var(--card-border)", animation: "pulse 1.5s infinite ease-in-out" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <div style={{ height: 24, width: 60, borderRadius: 12, background: "var(--card-border)", animation: "pulse 1.5s infinite ease-in-out" }} />
        <div style={{ height: 28, width: 80, borderRadius: 14, background: "var(--card-border)", animation: "pulse 1.5s infinite ease-in-out" }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <React.Fragment>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </React.Fragment>
  );
}
