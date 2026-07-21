import React from 'react';

interface EventInviteTabProps {
  eventVisibility: string;
  eventJoinEligibility: string;
  inviteLinks: { view: string | null; join: string[] };
  inviteLoading: { view: boolean; join: boolean };
  generateInviteLink: (purpose: 'view' | 'join') => void;
  copyInviteLink: (url: string) => void;
}

export function EventInviteTab({
  eventVisibility,
  eventJoinEligibility,
  inviteLinks,
  inviteLoading,
  generateInviteLink,
  copyInviteLink
}: EventInviteTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Invite Guests</h3>

      {eventVisibility === "unlisted" && (
        <div className="ticket-box" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Shareable view link</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
              This event is unlisted, so it won't show on Discover. This link lets anyone open the event page to view it — it can be shared and opened any number of times, but it only unlocks viewing, not joining.
            </div>
          </div>
          {!inviteLinks.view && (
            <button type="button" className="hbtn hbtn--primary" disabled={inviteLoading.view} onClick={() => generateInviteLink('view')} style={{ alignSelf: "flex-start" }}>
              {inviteLoading.view ? "Generating..." : "+ Generate view link"}
            </button>
          )}
          {inviteLinks.view && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input className="cinput" readOnly value={inviteLinks.view} onFocus={ev => ev.target.select()} style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)", fontSize: 12 }} />
              <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => copyInviteLink(inviteLinks.view!)}>Copy</button>
            </div>
          )}
        </div>
      )}

      {eventJoinEligibility === "invite" && (
        <div className="ticket-box" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600 }}>One-time join link</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
              Join eligibility is set to invite-only. Generate a link for a guest — it unlocks the join flow and can be used once.
            </div>
          </div>
          <button type="button" className="hbtn hbtn--primary" disabled={inviteLoading.join} onClick={() => generateInviteLink('join')} style={{ alignSelf: "flex-start" }}>
            {inviteLoading.join ? "Generating..." : "+ Generate join link"}
          </button>
          {inviteLinks.join.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {inviteLinks.join.map((url, i) => (
                <div key={url + i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="cinput" readOnly value={url} onFocus={ev => ev.target.select()} style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)", fontSize: 12 }} />
                  <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => copyInviteLink(url)}>Copy</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {eventVisibility !== "unlisted" && eventJoinEligibility !== "invite" && (
        <div className="ticket-box" style={{ padding: 20, fontSize: 13, color: "var(--ink-3)" }}>
          This event is publicly visible with open join eligibility — no invite links are needed.
        </div>
      )}
    </div>
  );
}
