import React from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string | React.ReactNode;
  gradient?: string;
}

export function FeatureCard({
  title,
  description,
  icon,
  gradient = "rgba(108, 77, 246, 0.04)"
}: FeatureCardProps) {
  return (
    <div
      className="feature-card glass-card"
      style={{
        padding: 24,
        borderRadius: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        border: "1px solid var(--card-border)",
        background: "var(--card-bg)"
      }}
    >
      <div
        className="icon-wrap"
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: gradient,
          display: "flex",
          alignItems: "center",
          justify: "center",
          fontSize: 20,
          color: "var(--primary)",
          justifyContent: "center"
        }}
      >
        {icon}
      </div>
      <div>
        <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{title}</h4>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>{description}</p>
      </div>
    </div>
  );
}
