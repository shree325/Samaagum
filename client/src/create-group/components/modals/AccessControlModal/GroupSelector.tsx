// @ts-nocheck
import React, { useState } from 'react';

export function GroupSelector({ rule, dynamicGroups, tempSelectedGroups, setTempSelectedGroups, onSave, onClose }) {
  const [groupSearch, setGroupSearch] = useState("");

  const filteredGroups = dynamicGroups.filter(g =>
    g.toLowerCase().includes(groupSearch.toLowerCase())
  );
  const allSelected = dynamicGroups.length > 0 && tempSelectedGroups.length === dynamicGroups.length;
  
  const handleSelectAll = () => {
    if (allSelected) {
      setTempSelectedGroups([]);
    } else {
      setTempSelectedGroups([...dynamicGroups]);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", width: 380, borderRadius: "var(--r-md)", border: "1px solid var(--border)", boxShadow: "var(--sh-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0, fontSize: "14.5px", color: "var(--ink)", fontWeight: 600 }}>
            Select Groups for {Array.isArray(rule.communities) ? rule.communities.join(", ") : rule.community}
          </h4>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: "18px" }}>&times;</button>
        </div>

        <div style={{ padding: "14px 20px 8px 20px", display: "flex", flexDirection: "column", gap: "10px", borderBottom: "1px solid var(--border)" }}>
          <input
            className="cinput"
            type="text"
            placeholder="Search groups..."
            value={groupSearch}
            onChange={e => setGroupSearch(e.target.value)}
            style={{ padding: "6px 10px", fontSize: "13px" }}
          />

          {tempSelectedGroups.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Selected Groups</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "80px", overflowY: "auto", padding: "2px 0" }}>
                {tempSelectedGroups.map(g => (
                  <span
                    key={g}
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
                    {g}
                    <button
                      type="button"
                      onClick={() => setTempSelectedGroups(tempSelectedGroups.filter(x => x !== g))}
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
              Selected: {tempSelectedGroups.length} of {dynamicGroups.length}
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
          {filteredGroups.map(g => {
            const checked = tempSelectedGroups.includes(g);
            return (
              <label
                key={g}
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
                      setTempSelectedGroups(tempSelectedGroups.filter(x => x !== g));
                    } else {
                      setTempSelectedGroups([...tempSelectedGroups, g]);
                    }
                  }}
                  style={{ cursor: "pointer", accentColor: "var(--accent-2)" }}
                />
                <span>{g}</span>
              </label>
            );
          })}
          {filteredGroups.length === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-3)", fontSize: "12px" }}>No groups found</div>
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
