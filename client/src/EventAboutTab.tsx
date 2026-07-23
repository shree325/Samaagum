import React from 'react';
import { I } from './home-icons';
import { HtmlRenderer } from './components/HtmlRenderer';

interface EventAboutTabProps {
  e: any;
  currentEvent: any;
  registrationOpen: boolean;
  isHostOrCoHost: boolean;
  isPending: boolean;
}

export function EventAboutTab({
  e,
  currentEvent,
  registrationOpen,
  isHostOrCoHost,
  isPending
}: EventAboutTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Archived banner */}
      {currentEvent?.status === 'cancelled' && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.35)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <span style={{ fontSize: 22 }}>🗄️</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>This event has been archived</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>This event was cancelled and is no longer active. It now appears in the Archived section of My Events.</div>
          </div>
        </div>
      )}

      {/* Registration closed banner — visible to non-host members/visitors */}
      {!registrationOpen && !isHostOrCoHost && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <span style={{ fontSize: 22 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>Registration is currently closed</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>The host has temporarily closed registration. Add to your wishlist to get notified when it reopens.</div>
          </div>
        </div>
      )}

      {/* Pending approval banner */}
      {isPending && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
          <span style={{ fontSize: 22 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>Your request is pending approval</div>
            <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>The host will review and accept or decline your request. You'll be notified.</div>
          </div>
        </div>
      )}

      <div className="ev-block">
        <div className="ev-when">
          <div className="ev-fact"><span className="ico"><I.cal /></span><div><div className="k">Date & Time</div><div className="v">{e.date}</div><div className="v2">{e.time}</div></div></div>
          <div className="ev-fact"><span className="ico">{e.online ? <I.online /> : <I.pin />}</span><div><div className="k">{e.online ? "Online Link" : "Venue"}</div><div className="v">{e.venue}</div><div className="v2">{e.city}</div></div></div>
        </div>
      </div>

      <div className="ev-block">
        <h3>About this event</h3>
        <div className="ev-about">
          {e.desc ? <HtmlRenderer content={e.desc} /> : <p>No description provided.</p>}
        </div>
      </div>

      {e.online ? (
        <div className="ev-block">
          <h3>Location</h3>
          <div className="ev-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 16, fontWeight: 500, height: 120, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
            <span style={{ marginRight: 8, fontSize: 24 }}>🌐</span> Online Event
          </div>
        </div>
      ) : e.venue ? (
        <div className="ev-block">
          <h3>Location</h3>
          <div className="ev-map">
            <iframe
              title="Event location map"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              src={`https://maps.google.com/maps?q=${encodeURIComponent(`${e.venue}${e.city ? ", " + e.city : ""}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              allowFullScreen
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13.5, color: "var(--ink-2)" }}>
            <I.pin style={{ color: "var(--accent-2)" }} /> {e.venue}{e.city ? `, ${e.city}` : ""}
            <a
              className="hbtn hbtn--ghost hbtn--sm"
              style={{ marginLeft: "auto", textDecoration: "none" }}
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${e.venue}${e.city ? ", " + e.city : ""}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </div>
        </div>
      ) : null}

      {e.instructions && (
        <div className="ev-block" style={{ background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px" }}>
          <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 700 }}>📢 Special Instructions</h3>
          <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)" }}>{e.instructions}</p>
        </div>
      )}
    </div>
  );
}
