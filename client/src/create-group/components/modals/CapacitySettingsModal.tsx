// @ts-nocheck
import React from 'react';
import { I } from '../../../home-icons';
import { Toggle } from '../common/Toggle';

export function CapacitySettingsModal({ open, onClose, limitCap, setLimitCap, maxCap, setMaxCap, waitlist, setWaitlist, entitlementMaxCap = -1, triggerUpgrade }) {
  const [tempLimitCap, setTempLimitCap] = React.useState(limitCap);
  const [tempMaxCap, setTempMaxCap] = React.useState(maxCap);
  const [tempWaitlist, setTempWaitlist] = React.useState(waitlist);

  React.useEffect(() => {
    if (open) {
      if (entitlementMaxCap !== -1 && !limitCap) {
        setTempLimitCap(true);
        setTempMaxCap(String(entitlementMaxCap));
      } else {
        setTempLimitCap(limitCap);
        setTempMaxCap(maxCap || (entitlementMaxCap !== -1 ? String(entitlementMaxCap) : ""));
      }
      setTempWaitlist(waitlist);
    }
  }, [open, limitCap, maxCap, waitlist, entitlementMaxCap]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 440, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>

        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>Capacity Settings</h3>
          </div>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I.x style={{ width: 14 }} />
          </button>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-2)", lineHeight: 1.5 }}>
            Close registration when reaching the capacity. Only approved attendees count toward capacity.
          </p>

          {entitlementMaxCap !== -1 && (
            <div style={{ padding: "10px 12px", background: "var(--field-2, var(--field))", borderRadius: "var(--r-sm)", border: "1px dashed var(--accent)", fontSize: "12px", color: "var(--ink-2)" }}>
              🔒 Under your current plan, capacity is capped at a maximum of <strong>{entitlementMaxCap}</strong> members. Upgrade to Standard for unlimited capacity.
            </div>
          )}

          <div className="toggle-row" style={{ padding: "4px 0", background: "transparent", border: "none", margin: 0 }}>
            <div className="ti">
              <div className="t" style={{ fontSize: "13.5px", fontWeight: 600 }}>Enable Capacity Limit</div>
            </div>
            <Toggle 
              on={tempLimitCap} 
              onClick={() => {
                if (tempLimitCap && entitlementMaxCap !== -1) {
                  triggerUpgrade("Unlimited Group Capacity");
                  return;
                }
                setTempLimitCap(!tempLimitCap);
              }} 
            />
          </div>

          {tempLimitCap && (
            <>
              <div className="cfield" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "6px", display: "block" }}>Max Capacity</label>
                <input
                  className="cinput"
                  type="number"
                  placeholder="50"
                  value={tempMaxCap}
                  onChange={e => setTempMaxCap(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", fontSize: "13.5px" }}
                />
              </div>

              <div className="toggle-row" style={{ padding: "4px 0", background: "transparent", border: "none", margin: 0, borderTop: "1px solid var(--border-2)", paddingTop: "14px" }}>
                <div className="ti">
                  <div className="t" style={{ fontSize: "13.5px", fontWeight: 600 }}>Enable Waitlist</div>
                  <div className="d" style={{ fontSize: "11.5px", color: "var(--ink-3)", marginTop: 2 }}>Registrations above capacity are added to the waitlist.</div>
                </div>
                <Toggle on={tempWaitlist} onClick={() => setTempWaitlist(!tempWaitlist)} />
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: "10px", background: "var(--field)" }}>
          <button type="button" className="hbtn hbtn--ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="hbtn hbtn--primary"
            onClick={() => {
              if (tempLimitCap && (!tempMaxCap || parseInt(tempMaxCap) < 1)) {
                alert("Please enter a valid capacity (at least 1).");
                return;
              }
              if (tempLimitCap && entitlementMaxCap !== -1 && parseInt(tempMaxCap) > entitlementMaxCap) {
                alert(`Capacity cannot exceed ${entitlementMaxCap} members under your current plan.`);
                triggerUpgrade(`Group Capacity > ${entitlementMaxCap}`);
                return;
              }
              setLimitCap(tempLimitCap);
              setMaxCap(tempLimitCap ? tempMaxCap : "");
              setWaitlist(tempWaitlist);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
