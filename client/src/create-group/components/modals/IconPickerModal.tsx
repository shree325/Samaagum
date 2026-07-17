// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';

export function IconPickerModal({ open, onClose, icon, setIcon }) {
  const [iconUploading, setIconUploading] = useState(false);
  const icons = ["✺", "🚀", "🌅", "◆", "🎧", "🍲", "🎨", "⚡", "🌱", "📚"];

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 450, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Select Icon</h3>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {icons.map(em => (
              <button
                key={em}
                onClick={() => { setIcon(em); onClose(); }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  fontSize: 24,
                  cursor: "pointer",
                  border: icon === em ? "2px solid var(--accent-2)" : "1px solid var(--border)",
                  background: icon === em ? "var(--accent-soft)" : "var(--field)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent-2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = icon === em ? "var(--accent-2)" : "var(--border)"}
              >
                {em}
              </button>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)" }}>Or upload custom icon</span>
            <button
              type="button"
              className="hbtn hbtn--soft"
              style={{ width: "100%", justifyContent: "center", height: 36, display: "flex", alignItems: "center", gap: 6 }}
              disabled={iconUploading}
              onClick={() => document.getElementById("icon-upload").click()}
            >
              <I.image style={{ width: 14 }} /> {iconUploading ? "Uploading..." : "Upload Icon Image"}
            </button>
            <input
              type="file"
              id="icon-upload"
              style={{ display: "none" }}
              accept="image/*"
              onChange={async e => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setIconUploading(true);
                  try {
                    const token = localStorage.getItem('token');
                    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                    const form = new FormData();
                    form.append('file', file);
                    const res = await fetch(`${apiBase}/api/upload-group-media`, {
                      method: 'POST',
                      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      body: form
                    });
                    const data = await res.json();
                    if (data.success && data.imageUrl) {
                      setIcon(data.imageUrl);
                      onClose();
                    } else {
                      alert("Icon upload failed. Please try again.");
                    }
                  } catch {
                    alert("Icon upload failed. Please check your connection.");
                  } finally {
                    setIconUploading(false);
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
export default IconPickerModal;
