// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';

export function RuleGroupSummaryChip({ rule, onEditClick }) {
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

  const groups = rule.groups || [];

  let displayText = "No Group Restriction";
  if (groups.length === 1) {
    displayText = groups[0];
  } else if (groups.length > 1) {
    displayText = `${groups[0]} +${groups.length - 1}`;
  }

  const tooltipText = groups.length > 0 ? `Selected Groups: ${groups.join(", ")}` : "No Group Restriction";

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
          gap: "8px",
          padding: "6px 12px",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--r-pill)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--ink)",
          cursor: "pointer",
          transition: "all var(--t-fast)",
          maxWidth: "240px",
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
        <span style={{ fontSize: "14px" }}>👥</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {displayText}
        </span>
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
          }}>
            Selected Groups
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxHeight: "150px",
            overflowY: "auto"
          }}>
            {groups.length === 0 ? (
              <div style={{ fontSize: "13px", color: "var(--ink-3)", fontStyle: "italic" }}>
                No Group Restriction (All groups allowed)
              </div>
            ) : (
              groups.map((group, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "var(--ink-2)"
                  }}
                >
                  <span style={{ color: "var(--accent-2)", fontWeight: "bold" }}>✓</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {group}
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "4px" }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEditClick();
              }}
              style={{
                width: "100%",
                background: "var(--field)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--accent-2)",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Edit Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default RuleGroupSummaryChip;
