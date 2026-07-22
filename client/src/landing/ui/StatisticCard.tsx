import React from "react";
import { useCountUp } from "../hooks/useCountUp";

interface StatisticCardProps {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  c1?: string;
  c2?: string;
}

export function StatisticCard({
  value,
  suffix = "",
  decimals = 0,
  label,
  c1 = "var(--primary)",
  c2 = "var(--accent-2)"
}: StatisticCardProps) {
  const { value: currentVal, elementRef } = useCountUp(value);

  const displayValue = decimals
    ? currentVal.toFixed(decimals)
    : Math.round(currentVal).toLocaleString();

  return (
    <div className="stat-card glass-card" style={{ padding: "24px 20px", position: "relative", overflow: "hidden", borderRadius: 20 }}>
      <div
        className="sec-glow"
        style={{
          width: 140,
          height: 140,
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
          top: "-20%",
          right: "-10%",
          opacity: 0.15,
          filter: "blur(40px)",
          position: "absolute",
          zIndex: 1
        }}
      />
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        className="n"
        style={{
          fontSize: 36,
          fontWeight: 750,
          fontFamily: "var(--font-display)",
          color: "var(--ink)",
          position: "relative",
          zIndex: 2,
          marginBottom: 4
        }}
      >
        {displayValue}
        {suffix}
      </div>
      <div className="l" style={{ fontSize: 13, color: "var(--ink-2)", position: "relative", zIndex: 2 }}>
        {label}
      </div>
    </div>
  );
}
