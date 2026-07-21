// @ts-nocheck
import React from 'react';
import { I } from '../../../home-icons';

export function DescriptionModal({ open, onClose, desc, setDesc }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" style={{ background: "var(--surface)", width: 600, height: "80vh", borderRadius: "var(--r-lg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, color: "var(--ink)" }}>Group Description</h3>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer", color: "var(--ink)" }}><I.x style={{ width: 16 }} /></button>
        </div>
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column" }}>
          <textarea style={{ flex: 1, border: "none", resize: "none", outline: "none", fontSize: 16, color: "var(--ink)", background: "transparent" }} placeholder="Describe your community: what it's about, who should join, guidelines..." value={desc} onChange={e => setDesc(e.target.value)} />
          <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-3)", marginTop: 10 }}>{desc.length} chars</div>
        </div>
        <div style={{ padding: 20, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="hbtn hbtn--ghost" onClick={() => setDesc(desc + " Welcome to our vibrant community! We gather regularly to share ideas, collaborate on projects, and grow together. Everyone is welcome to participate, ask questions, and share their journey.")}><I.spark style={{ width: 16 }} /> Suggest with AI</button>
          <button className="hbtn hbtn--primary" onClick={onClose}>Save Description</button>
        </div>
      </div>
    </div>
  );
}
export default DescriptionModal;
