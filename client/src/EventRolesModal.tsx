import React from 'react';

interface ToggleProps {
  on: boolean;
  onClick: () => void;
}

function Toggle({ on, onClick }: ToggleProps) {
  return <button type="button" className={`tg ${on ? "on" : ""}`} onClick={onClick} />;
}

interface RolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucket: any;
  setBucket: (next: any) => void;
  titleText: string;
  onSave?: (next: any) => void;
  availableRoles: any[];
}

export function EventRolesModal({
  isOpen,
  onClose,
  bucket,
  setBucket,
  titleText,
  onSave,
  availableRoles
}: RolesModalProps) {
  if (!isOpen) return null;

  const isNewShape = bucket && Array.isArray(bucket.roles);

  const legacyBucketToRoleKeys = (b: any) => {
    const keys: string[] = [];
    if (b?.owner) keys.push('event_owner', 'event_manager');
    if (b?.admin) keys.push('co_host');
    if (b?.moderator) keys.push('checkin_lead', 'gate_staff', 'session_gate_staff', 'ticket_scanner');
    if (b?.member) keys.push('member');
    const validKeys = new Set((availableRoles || []).map(r => r.key));
    return keys.filter(k => validKeys.has(k));
  };

  const current = isNewShape ? bucket : { public: !!bucket?.public, roles: legacyBucketToRoleKeys(bucket) };

  const togglePublic = () => {
    const next = { ...current, public: !current.public };
    setBucket(next);
    if (onSave) onSave(next);
  };

  const toggleRole = (key: string) => {
    const roles = current.roles.includes(key)
      ? current.roles.filter((k: string) => k !== key)
      : [...current.roles, key];
    const next = { public: current.public, roles };
    setBucket(next);
    if (onSave) onSave(next);
  };

  return (
    <div className="modal-overlay" style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 10000
    }}>
      <div className="modal-content" style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", width: "90%", maxWidth: "380px",
        padding: "24px", boxShadow: "var(--sh-xl)", color: "var(--ink)"
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{titleText}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, maxHeight: "50vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--border-3)" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Public (Everyone)</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Opens this to everyone, including non-members — overrides role selection below.</div>
            </div>
            <Toggle on={current.public} onClick={togglePublic} />
          </div>
          {(availableRoles || []).map(r => (
            <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: current.public ? 0.5 : 1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{r.display_name}</span>
              <Toggle on={current.roles.includes(r.key)} onClick={() => { if (!current.public) toggleRole(r.key); }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="hbtn hbtn--primary hbtn--sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
