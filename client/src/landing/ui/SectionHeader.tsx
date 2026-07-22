import React from "react";
import { useReveal } from "../hooks/useReveal";

interface SectionHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  eyebrow?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  align = "center",
  className = ""
}: SectionHeaderProps) {
  const { ref, show } = useReveal();

  const alignmentClass = align === "center" ? "center" : align === "right" ? "right" : "";

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`sec-header ${alignmentClass} ${show ? "in" : ""} ${className}`}
      style={{ opacity: show ? 1 : 0, transform: show ? "none" : "translateY(20px)", transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {eyebrow && (
        <span className="eyebrow-pill">
          <span className="grad-dot" />
          {eyebrow}
        </span>
      )}
      <h2 className="h-section" style={{ marginTop: eyebrow ? 16 : 0 }}>{title}</h2>
      {subtitle && <p className="sub-section" style={{ margin: "16px auto 0" }}>{subtitle}</p>}
    </div>
  );
}
export default SectionHeader;
