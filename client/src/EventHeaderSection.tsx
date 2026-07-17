import React, { useState } from 'react';
import { I, Grain } from './home-icons';

interface EventHeaderSectionProps {
  e: any;
  ev: any;
  st: any;
  go: (view: string, params?: any) => void;
  attendees: any[];
  bookingStatusProp: string | null;
  registrationOpen: boolean;
  isScheduled: boolean;
  regToggleLoading: boolean;
  isHostOrCoHost: boolean;
  effectiveIsMember: boolean;
  isSaved: boolean;
  toggleWishlist: (id: string, count?: number) => void;
  handleToggleRegistration: () => Promise<void>;
  handleLeaveEvent: () => Promise<void>;
  currentEvent: any;
  tabs: Array<[string, string]>;
  tab: string;
  setTab: (t: string) => void;
}

export function EventHeaderSection({
  e,
  ev,
  st,
  go,
  attendees,
  bookingStatusProp,
  registrationOpen,
  isScheduled,
  regToggleLoading,
  isHostOrCoHost,
  effectiveIsMember,
  isSaved,
  toggleWishlist,
  handleToggleRegistration,
  handleLeaveEvent,
  currentEvent,
  tabs,
  tab,
  setTab
}: EventHeaderSectionProps) {
  const [showShareSheet, setShowShareSheet] = useState(false);

  return (
    <>
      {/* Banner section */}
      <div className="detail-cover" style={{
        height: 200,
        backgroundSize: "cover",
        backgroundPosition: "center",
        background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat`
      }}>
        {!e.cover && <Grain />}
        <div className="scrim" />
        <button className="detail-back" style={{ top: 20, left: 20 }} onClick={() => (e.id === "new" && e.__draft) ? go("edit-event", { __draft: e.__draft, id: e.__draft.id }) : go("back")}><I.arrowL />Back</button>
      </div>

      {/* Group details header container */}
      <div className="grp-detail" style={{ paddingBottom: 0 }}>
        <div className="grp-head">
          {/* Custom visual event icon box */}
          <div className="gicon-lg" style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25)"
          }}>
            📅
          </div>

          <div className="gh-meta">
            <div className="nm">{e.title}</div>
            <div className="sub">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <I.users /> {attendees.length} members
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1f9d57", fontWeight: 600 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bb673" }} />
                {e.online ? "Online" : "In-person"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                🎫 {e.price}
              </span>
              <span className="fchip on" style={{ pointerEvents: "none", padding: "4px 11px", fontSize: 12 }}>
                {e.cat || "Event"}
              </span>
              {e.hostName && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <I.users /> Hosted by {e.hostName}{e.hostType === 'group' ? ' (Group)' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="gh-act">
            {!bookingStatusProp && !registrationOpen && (
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => toggleWishlist && toggleWishlist(e.id, e.wishlistCount)}>
                {isSaved ? <I.heartF /> : <I.heart />} {isSaved ? "Wishlisted" : "Wishlist"}
              </button>
            )}
            <div style={{ position: "relative" }}>
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setShowShareSheet(!showShareSheet)}>
                <I.share /> Share
              </button>
              {showShareSheet && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setShowShareSheet(false)} />
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, display: "flex", gap: 8, padding: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--sh-md)", zIndex: 9999 }}>
                    {(() => {
                      const link = encodeURIComponent(`${window.location.origin}${window.location.pathname}#event=${e.id}`);
                      const msg = encodeURIComponent(`Join me at ${e.title} on Samaagum! ${decodeURIComponent(link)}`);
                      const subject = encodeURIComponent(`Invitation to ${e.title}`);
                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${msg}`;
                      const btnStyle = { display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", transition: "all 0.2s" };
                      return (
                        <>
                          <a href={`https://wa.me/?text=${msg}`} target="_blank" style={btnStyle} title="WhatsApp">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.81 11.81 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/></svg>
                          </a>
                          <a href={`https://www.facebook.com/sharer/sharer.php?u=${link}`} target="_blank" style={btnStyle} title="Facebook">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                          </a>
                          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`} target="_blank" style={btnStyle} title="LinkedIn">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06s2.06.92 2.06 2.06c0 1.14-.92 2.06-2.06 2.06zM20.45 20.45h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.63-1.84 3.36-1.84 3.59 0 4.25 2.36 4.25 5.43v6.3z"/></svg>
                          </a>
                          <a href={gmailUrl} target="_blank" style={btnStyle} title="Email (Gmail)">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="#EA4335"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>
                          </a>
                          <button style={btnStyle} title="Copy Link" onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(decodeURIComponent(link));
                              alert("Link copied!");
                            } catch (err) {
                              console.error(err);
                            }
                            setShowShareSheet(false);
                          }}>
                            <I.copy style={{ width: 16, height: 16, color: "var(--ink-2)" }} />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
            {isHostOrCoHost && (
              <>
                {/* Registration Open/Close toggle — host only */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: registrationOpen ? "rgba(31,157,87,0.10)" : "rgba(239,68,68,0.10)",
                  border: `1px solid ${registrationOpen ? "rgba(31,157,87,0.3)" : "rgba(239,68,68,0.3)"}`,
                  borderRadius: "var(--r-full, 9999px)",
                  padding: "5px 12px 5px 8px",
                  cursor: regToggleLoading ? "wait" : "pointer",
                  transition: "all 0.25s",
                  userSelect: "none"
                }} onClick={handleToggleRegistration} title={registrationOpen ? "Click to close registration" : "Click to open registration"}>
                  <span style={{
                    width: 32, height: 18, borderRadius: 9, background: registrationOpen ? "#1f9d57" : "#ef4444",
                    display: "inline-flex", alignItems: "center", position: "relative",
                    transition: "background 0.25s", flexShrink: 0
                  }}>
                    <span style={{
                      position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#fff",
                      top: 2, left: registrationOpen ? 16 : 2,
                      transition: "left 0.22s", boxShadow: "0 1px 4px rgba(0,0,0,0.18)"
                    }} />
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: registrationOpen ? "#1f9d57" : "#ef4444" }}>
                    {regToggleLoading ? "…" : (isScheduled ? `Scheduled (${registrationOpen ? 'Open' : 'Closed'})` : (registrationOpen ? "Registration Open" : "Registration Closed"))}
                  </span>
                </div>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => (e.id === "new" && e.__draft) ? go("edit-event", { __draft: e.__draft, id: e.__draft.id }) : go("edit-event", currentEvent || e)}>
                  <I.edit style={{ width: 14 }} /> Edit Event
                </button>
              </>
            )}
            {effectiveIsMember && !isHostOrCoHost && (
              <button className="hbtn hbtn--sm" style={{ background: "#e5484d", color: "#fff" }} onClick={handleLeaveEvent}>
                Leave Event
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grp-tabs">
          {tabs.map(([k, l]) => (
            <button key={k} className={`grp-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
