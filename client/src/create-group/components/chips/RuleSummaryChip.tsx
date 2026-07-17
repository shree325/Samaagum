// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

export function RuleSummaryChip({ rule, onEditClick }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const popoverWidth = 240;
        const windowWidth = window.innerWidth;
        let left = rect.left;
        if (left + popoverWidth > windowWidth) {
          left = Math.max(10, windowWidth - popoverWidth - 10);
        }
        setCoords({
          top: rect.bottom + 6,
          left: left
        });
      }
    };

    updatePosition();

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  const ruleCommunities = Array.isArray(rule.communities)
    ? rule.communities
    : (rule.community ? [rule.community] : []);
  const groups = rule.groups || [];

  let leftText = "";
  let tooltipText = "";

  if (ruleCommunities.length > 0) {
    const firstComm = ruleCommunities[0];
    leftText = ruleCommunities.length > 1 ? `${firstComm} +${ruleCommunities.length - 1}` : firstComm;
    tooltipText += `Communities: ${ruleCommunities.join(", ")}`;
  } else {
    leftText = "No Communities";
    tooltipText += "No Communities Selected";
  }

  let rightText = "";
  if (groups && groups.length > 0) {
    const firstGroup = groups[0];
    const groupCount = groups.length;
    rightText = groupCount > 1 ? `${firstGroup} +${groupCount - 1}` : firstGroup;
    tooltipText += `\nGroups: ${groups.join(", ")}`;
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        title={tooltipText}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-sm)",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--ink)",
          cursor: "pointer",
          transition: "all var(--t-fast)",
          maxWidth: "280px",
          boxShadow: "var(--sh-sm)",
          outline: "none"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent-2)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "var(--sh-md)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = "var(--sh-sm)";
        }}
      >
        <span>🏛️</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>
          {leftText}
        </span>
        {rightText && (
          <>
            <span style={{ color: "var(--ink-3)", margin: "0 2px" }}>→</span>
            <span style={{ fontSize: "14px" }}>👥</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>
              {rightText}
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 10005,
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--sh-lg)",
            minWidth: "220px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>Rule Details</span>
            {onEditClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onEditClick();
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-2)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0
                }}
              >
                Edit
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🏛️</span> {ruleCommunities.join(", ")}
            </div>
            {groups && groups.length > 0 && (
              <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)" }}>Groups</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: "120px", overflowY: "auto" }}>
                  {groups.map((group, idx) => (
                    <div key={idx} style={{ fontSize: "13px", color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--accent-2)", fontWeight: "bold" }}>✓</span> 👥 {group}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default RuleSummaryChip;
