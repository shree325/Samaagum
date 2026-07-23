// @ts-nocheck
import React from 'react';
import { Toggle } from '../common/Toggle';

export function RolesSubModal({ open, onClose, bucket, setBucket, titleText }) {
  if (!open) return null;
  const current = bucket || { public: false, roles: [] };

  const togglePublic = () => {
    setBucket({ ...current, public: !current.public });
  };

  const toggleRole = (key) => {
    const roles = current.roles.includes(key)
      ? current.roles.filter(k => k !== key)
      : [...current.roles, key];
    setBucket({ ...current, roles });
  };

  const rolesToRender = [
    { key: 'group_owner', label: 'Group Owner' },
    { key: 'group_admin', label: 'Group Admin' },
    { key: 'group_moderator', label: 'Group Moderator' },
    { key: 'registered_user', label: 'Group Member' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="setting-modal" onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: "380px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "24px", boxShadow: "var(--sh-xl)", color: "var(--ink)" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{titleText}</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--border-3)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Public (Everyone)</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Opens this to everyone, including non-members — overrides role selection below.</div>
            </div>
            <Toggle on={current.public} onClick={togglePublic} />
          </div>

          {rolesToRender.map(r => (
            <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: current.public ? 0.5 : 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</span>
              <Toggle on={current.public ? true : current.roles.includes(r.key)} onClick={() => { if (!current.public) toggleRole(r.key); }} />
            </div>
          ))}
        </div>

        <button className="hbtn hbtn--primary" style={{ width: "100%", justifyContent: "center" }} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
