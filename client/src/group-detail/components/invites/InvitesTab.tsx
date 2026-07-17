import React from 'react';
import { copyText } from '../../../home-data';

interface InvitesTabProps {
  invites: any[];
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteLink: string;
  setInviteLink: (val: string) => void;
  fetchInvites: () => void;
  g: any;
}

export function InvitesTab({
  invites,
  inviteEmail,
  setInviteEmail,
  inviteLink,
  setInviteLink,
  fetchInvites,
  g
}: InvitesTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Invitations</h3>
      <div className="form-card" style={{ padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: g.visibility === "private" ? "1fr 1fr" : "1fr", gap: 16 }}>
          <div>
            <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Send Invite via Email</h4>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="cinput" placeholder="email@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <button className="hbtn hbtn--primary" onClick={async () => {
                if (!inviteEmail) return;
                const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                const token = localStorage.getItem('token');
                const res = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                  body: JSON.stringify({ targets: [{ email: inviteEmail }] })
                });
                const data = await res.json();
                if (data.success && data.data[0]?.success) {
                  alert("Invitation email sent successfully!");
                  setInviteEmail("");
                  fetchInvites();
                } else {
                  alert((data.data?.[0]?.message) || data.message || "Failed to send invite");
                }
              }}>Send</button>
            </div>
          </div>
          {g.visibility === "private" && (
            <div>
              <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Unlisted Group Link</h4>
              {(() => {
                const shareInvite = invites.find((inv: any) => !inv.email && !inv.username && inv.status !== 'revoked');
                const link = shareInvite ? `${window.location.origin}${window.location.pathname}#/groups/invite/${shareInvite.token}` : inviteLink;
                if (!link) return <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Generating link…</div>;
                return (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="cinput" readOnly value={link} />
                    <button className="hbtn hbtn--soft" onClick={async () => { await copyText(link); alert("Copied!"); }}>Copy</button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, marginTop: 12 }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Sent Invitations</h4>
        {invites.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No invitations sent yet.</div>
        ) : (
          <table className="grp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Target</th>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Status</th>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Uses</th>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv: any) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 4px" }}>{inv.email || inv.username || <span style={{ color: "var(--ink-3)" }}>Shareable Link</span>}</td>
                  <td style={{ padding: "10px 4px" }}><span className={`fchip ${inv.status}`} style={{ textTransform: "capitalize" }}>{inv.status}</span></td>
                  <td style={{ padding: "10px 4px" }}>{inv.uses ?? 0} {inv.max_uses ? `/ ${inv.max_uses}` : ""}</td>
                  <td style={{ padding: "10px 4px" }}>
                    {inv.status === 'pending' && (
                      <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#e74c3c" }} onClick={async () => {
                        if (!confirm("Revoke this invitation?")) return;
                        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${apiBase}/api/groups/${g.id}/invites/${inv.id}/revoke`, {
                          method: 'POST',
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        const data = await res.json();
                        if (data.success) fetchInvites();
                        else alert(data.message);
                      }}>Revoke</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
