// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { ME, WAITLIST_ME } from './home-data';
import { Grain } from './home-icons';
import { I } from './home-icons';

/* ============================================================
   Samaagum — Waitlist full lifecycle (F9 · S-160 / S-161)
   QUEUED → INVITED → CONVERTED / EXPIRED
   Notify-and-claim (collect-and-settle, no auth holds).
   ============================================================ */

export function CircleProgress({ pct, size = 168, children }) {
  const r = (size - 16) / 2, c = 2 * Math.PI * r;
  return (
    <div className="wl-ring" style={{ width: size, height: size, position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#wlg)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .6s var(--ease-out)" }} />
        <defs><linearGradient id="wlg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--accent-1)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2 }}>{children}</div>
    </div>
  );
}

export function useWaitlistCountdown(initialSeconds, active, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (!active) {
      setSeconds(initialSeconds);
      return;
    }
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, initialSeconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return {
    label,
    reset: () => setSeconds(initialSeconds)
  };
}

export function Waitlist({ ev, st, go }) {
  const base = WAITLIST_ME;
  const targetId = ev?.id || "ev-feat";
  const e = ev ? { ...base, ev: ev.title || base.ev, cover: ev.cover || base.cover, date: ev.date || base.date, time: ev.time || base.time, venue: ev.venue || base.venue } : base;
  
  // Detect if user is already waitlisted or if we start in join state
  const isWaitlisted = st.waitlisted ? st.waitlisted.has(targetId) : false;
  
  const [state, setState] = useState(isWaitlisted ? "QUEUED" : "JOIN"); // JOIN | QUEUED | INVITED | CONVERTED | EXPIRED
  const [refs, setRefs] = useState(0);
  const pos = Math.max(1, base.position - refs * base.boostPerRef);
  const boostUnits = Math.min(base.boostCap / base.boostPerRef, refs);
  const inviteTimer = useWaitlistCountdown(base.claimWindowMins * 60, state === "INVITED", () => setState("EXPIRED"));

  const handleJoinWaitlist = () => {
    if (st.toggleWaitlist) st.toggleWaitlist(targetId);
    setState("QUEUED");
  };

  const handleLeaveWaitlist = () => {
    if (st.toggleWaitlist) st.toggleWaitlist(targetId);
    setState("JOIN");
  };

  const handleClaimSeat = () => {
    if (st.register) {
      st.register(targetId);
    }
    // Remove from waitlist
    if (st.toggleWaitlist && st.waitlisted && st.waitlisted.has(targetId)) {
      st.toggleWaitlist(targetId);
    }
    alert("Waitlist slot claimed! A ticket has been added to your wallet.");
    go("events");
  };

  return (
    <div className="scroll">
      <div className="flow view-enter" style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
        <div className="flow-head">
          <button className="back" onClick={() => go("back")}><I.arrowL /></button>
          <div><div className="flow-title">Waitlist</div><div className="flow-sub">{e.ev}</div></div>
        </div>

        <div className="co-event" style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", padding: 12, borderRadius: 12 }}>
          <div className="cov" style={{ width: 80, height: 60, borderRadius: 6, background: e.cover, flexShrink: 0, position: "relative", overflow: "hidden" }}><Grain /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ttl" style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.ev}</div>
            <div className="meta" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><I.cal style={{ width: 12, height: 12 }} /> {e.date} · {e.time}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><I.pin style={{ width: 12, height: 12 }} /> {e.venue}</div>
            </div>
          </div>
          <span className="pill red" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}><span className="pdot" style={{ background: "#ef4444" }} />Sold out</span>
        </div>

        {/* JOIN */}
        {state === "JOIN" && (
          <div className="fcard fcard-pad" style={{ textAlign: "center" }}>
            <div className="empty" style={{ padding: "8px 0 4px" }}>
              <div className="ill" style={{ fontSize: 32, marginBottom: 8 }}>👥</div>
              <h3>This event is sold out</h3>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4 }}>
                Join the waitlist and we'll notify you the moment a spot frees up. You'll get a time-boxed window to claim it — no payment until then.
              </p>
            </div>
            <div className="notice info" style={{ textAlign: "left", margin: "8px 0 16px" }}>
              <span className="ni"><I.spark /></span>
              <div style={{ fontSize: 12.5 }}><b>{base.total} people</b> are waiting. Share your referral link after joining to move up the queue (capped, so it stays fair).</div>
            </div>
            <button className="hbtn hbtn--primary hbtn--block" onClick={handleJoinWaitlist}>Join the waitlist</button>
          </div>
        )}

        {/* QUEUED */}
        {state === "QUEUED" && (
          <>
            <div className="fcard fcard-pad" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="pill violet" style={{ marginBottom: 16 }}><span className="pdot" />Queued</span>
              <CircleProgress pct={1 - pos / base.total}>
                <div className="wl-pos"><span className="hash">#</span>{pos}</div>
                <div className="wl-of">of {base.total} waiting</div>
              </CircleProgress>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 16, maxWidth: 380, marginInline: "auto", lineHeight: 1.5 }}>
                You're <b>#{pos}</b> in line. We'll email and notify you instantly if you're promoted to claim a seat.
              </p>
            </div>

            <div className="fcard boost-card fcard-pad" style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-2)", color: "#fff", flexShrink: 0 }}><I.spark /></span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Boost your position</div>
                  <div style={{ fontSize: 12, color: "var(--ink-2)" }}>Each friend who joins via your link moves you up {base.boostPerRef} spots · max {base.boostCap}.</div>
                </div>
              </div>
              <div className="boost-meter">
                {Array.from({ length: base.boostCap / base.boostPerRef }).map((_, i) => (
                  <i key={i} className={i < boostUnits ? "on" : ""} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 9 }}>
                <input className="ss-search" style={{ flex: 1, fontSize: 12, fontFamily: "monospace" }} readOnly value="samaagum.co/w/indie-live?ref=aanya" />
                <button className="hbtn hbtn--ghost" onClick={() => setRefs(r => Math.min(base.boostCap / base.boostPerRef, r + 1))}><I.share /> Boost</button>
              </div>
              {refs > 0 && <div style={{ fontSize: 12.5, color: "#1f9d57", fontWeight: 600, marginTop: 10, display: "flex", gap: 6, alignItems: "center" }}><I.check style={{ width: 14, height: 14 }} /> {refs} referral{refs > 1 ? "s" : ""} — moved up {boostUnits * base.boostPerRef} spots</div>}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={handleLeaveWaitlist}>Leave waitlist</button>
              {(window.location.search.includes("dev") || (ME.role && ME.role.toLowerCase().includes("admin"))) && (
                <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={() => setState("INVITED")}>▶ Simulate a spot opening</button>
              )}
            </div>
          </>
        )}

        {/* INVITED — time-boxed claim */}
        {state === "INVITED" && (
          <div className="fcard fcard-pad" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span className="pill green" style={{ marginBottom: 14 }}><span className="pdot" />A spot opened for you!</span>
            <div className="empty" style={{ padding: "4px 0" }}>
              <div className="ill" style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
              <h3>You're invited to claim a seat</h3>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4 }}>
                A seat freed up and you're next in line. Claim it before the timer runs out, or it passes to the next person.
              </p>
            </div>
            <div className="hold-banner" style={{ width: "100%", justifyContent: "center" }}>
              <span className="clock"><I.clock style={{ width: 14, height: 14 }} /></span>
              <div>Claim window: <b style={{ fontVariantNumeric: "tabular-nums" }}>{inviteTimer?.label || "14:59"}</b></div>
            </div>
            <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: 16 }} onClick={handleClaimSeat}>
              Claim &amp; book now
            </button>
            {(window.location.search.includes("dev") || (ME.role && ME.role.toLowerCase().includes("admin"))) && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
                <button className="linkbtn" style={{ fontSize: 12 }} onClick={() => setState("EXPIRED")}>Let it expire</button>
              </div>
            )}
          </div>
        )}

        {/* EXPIRED */}
        {state === "EXPIRED" && (
          <div className="fcard" style={{ marginTop: 20 }}>
            <div className="terminal" style={{ textAlign: "center", padding: 24 }}>
              <div className="badge fail"><I.clock style={{ width: 34, height: 34 }} /></div>
              <h2>Claim window expired</h2>
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>The offer passed to the next person in line. You can rejoin the waitlist — we'll notify you if another spot opens.</p>
            </div>
            <div className="fcard-pad" style={{ paddingTop: 4, paddingBottom: 24 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="hbtn hbtn--primary hbtn--block" onClick={() => { setState("QUEUED"); if (inviteTimer?.reset) inviteTimer.reset(); }}>Rejoin waitlist</button>
                <button className="hbtn hbtn--ghost" onClick={() => go("back")}>Back</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


