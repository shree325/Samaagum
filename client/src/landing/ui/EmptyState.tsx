import React from "react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  onActionClick?: () => void;
  actionText?: string;
}

export function EmptyState({
  title = "No results found",
  message = "Try adjusting your search filters or browse other categories to find what you are looking for.",
  onActionClick,
  actionText
}: EmptyStateProps) {
  return (
    <div className="empty-state glass-card" style={{ padding: "48px 24px", textAlign: "center", width: "100%", maxWidth: 500, margin: "24px auto", borderRadius: 20 }}>
      <div className="icon" style={{ fontSize: 32, marginBottom: 16 }}>🔍</div>
      <h4 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--ink)" }}>{title}</h4>
      <p style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.5, marginBottom: onActionClick ? 20 : 0 }}>{message}</p>
      {onActionClick && actionText && (
        <button className="btn btn-ghost btn-sm" onClick={onActionClick}>
          {actionText}
        </button>
      )}
    </div>
  );
}
