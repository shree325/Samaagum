// @ts-nocheck
import React, { useState } from 'react';

export function CommunitySelector({ dynamicCommunities, tempSelectedCommunities, setTempSelectedCommunities, onSave, onClose }) {
  const [commSearch, setCommSearch] = useState("");

  const filteredComms = dynamicCommunities.filter(c =>
    c.toLowerCase().includes(commSearch.toLowerCase())
  );
  const allSelected = dynamicCommunities.length > 0 && tempSelectedCommunities.length === dynamicCommunities.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setTempSelectedCommunities([]);
    } else {
      setTempSelectedCommunities([...dynamicCommunities]);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", width: 380, borderRadius: "var(--r-md)", border: "1px solid var(--border)", boxShadow: "var(--sh-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: "14.5px", color: "var(--ink)", fontWeight: 600 }}>Select Communities</h4>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: "18px" }}>&times;</button>
        </div>

        <div style={{ padding: "14px 20px 8px 20px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--border)" }}>
          <input
            className="cinput"
            type="text"
            placeholder="Search communities..."
            value={commSearch}
            onChange={e => setCommSearch(e.target.value)}
            style={{ padding: "6px 10px", fontSize: "13px" }}
          />

          {tempSelectedCommunities.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Selected Communities</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto", padding: "2px 0" }}>
                {tempSelectedCommunities.map(c => (
                  <span
                    key={c}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 6px",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "11.5px",
                      color: "var(--accent-2)",
                      fontWeight: 500
                    }}
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => setTempSelectedCommunities(tempSelectedCommunities.filter(x => x !== c))}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0 2px",
                        color: "var(--accent-2)",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11.5px" }}>
            <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
              Selected: {tempSelectedCommunities.length} of {dynamicCommunities.length}
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent-2)",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0
              }}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        <div style={{ padding: "10px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {filteredComms.map(c => {
            const checked = tempSelectedCommunities.includes(c);
            return (
              <label
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "var(--r-sm)",
                  cursor: "pointer",
                  background: checked ? "var(--field)" : "transparent",
                  fontSize: "13px",
                  color: checked ? "var(--ink)" : "var(--ink-2)"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--field)"}
                onMouseLeave={e => e.currentTarget.style.background = checked ? "var(--field)" : "transparent"}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) {
                      setTempSelectedCommunities(tempSelectedCommunities.filter(x => x !== c));
                    } else {
                      setTempSelectedCommunities([...tempSelectedCommunities, c]);
                    }
                  }}
                  style={{ cursor: "pointer", accentColor: "var(--accent-2)" }}
                />
                <span>{c}</span>
              </label>
            );
          })}
          {filteredComms.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>No communities found</div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--field)" }}>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose}>Cancel</button>
          <button type="button" className="hbtn hbtn--primary hbtn--sm" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
