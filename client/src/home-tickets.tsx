// @ts-nocheck
import React, { useRef, useState, useEffect } from 'react';
import { Wordmark } from './components';
import { COVERS, EVENTS, FEATURED } from './home-data';
import { Discover } from './home-feed';
import { Avatar, Grain, QRCode } from './home-icons';
import { Empty } from './home-shell';
import { Waitlist } from './home-waitlist';
import { I } from './home-icons';
import { OnlineMeetingCard } from "./OnlineMeetingCard";
import { Events } from './landing-features';

/* ============================================================
   Samaagum — Tickets wallet (S-085) · Ticket detail (S-086)
   · Claim-your-ticket (F4: S-090 landing, S-091 OTP)
   ============================================================ */

// Shared helpers — used by both the My Events wallet (MyTickets) and the My Tickets
// page (AllTickets) so a "joined event" booking is normalized into ticket-shaped data
// exactly the same way in both places.
// Ticket-scanner check-in window: how long before an event's start (and after its end,
// or after a default duration when no end time is set) a scanner may check attendees in.
const CHECKIN_WINDOW_BEFORE_MS = 2 * 60 * 60 * 1000; // 2h grace before starts_at
const CHECKIN_WINDOW_AFTER_MS = 0; // 2h grace after ends_at
const DEFAULT_EVENT_DURATION_MS = 24 * 60 * 60 * 1000; // assumed length when ends_at is missing

function checkinWindow(ev) {
  const startsAt = ev?.starts_at ? new Date(ev.starts_at) : null;
  if (!startsAt) return null;
  const endsAt = ev.ends_at ? new Date(ev.ends_at) : new Date(startsAt.getTime() + DEFAULT_EVENT_DURATION_MS);
  return {
    opensAt: new Date(startsAt.getTime() - CHECKIN_WINDOW_BEFORE_MS),
    closesAt: new Date(endsAt.getTime() + CHECKIN_WINDOW_AFTER_MS)
  };
}

function isCheckinWindowOpen(ev) {
  const win = checkinWindow(ev);
  if (!win) return false;
  const now = Date.now();
  return now >= win.opensAt.getTime() && now <= win.closesAt.getTime();
}

function getVenueStr(v) {
  if (typeof v === 'object' && v !== null) {
    return v.name || v.address || 'Venue TBD';
  }
  return v || 'Venue TBD';
}

function formatCurrency(amountMinor: number | null, currency: string = 'INR') {
  if (amountMinor === null || amountMinor === undefined) return 'Free';
  const amount = Number(amountMinor) / 100;
  if (currency.toUpperCase() === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `${currency.toUpperCase()} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function normalizeJoinedEvent(e) {
  const startsAt = e.starts_at ? new Date(e.starts_at) : null;
  const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "Date TBD";
  const timeStr = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "";
  const venueObj = (typeof e.venue === 'object' && e.venue !== null) ? e.venue : {};
  const meta = venueObj.meta || {};
  const firstTicket = Array.isArray(e.tickets) ? e.tickets[0] : null;

  const eventNameClean = (e.title || e.ev || "TICKET").replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 8);
  const idSource = e.ticketId || e.attendeeId || e.id || "00000000";
  const shortNo = idSource.split('-')[0].toUpperCase();
  const friendlyTicketId = `${eventNameClean}_${shortNo}`;

  const totalMinor = Number(e.bookingTotalMinor ?? 0);
  const paidVal = (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp')
    ? 'Free'
    : (totalMinor > 0 ? formatCurrency(totalMinor, e.bookingCurrency ?? 'INR') : (firstTicket?.price_amount_minor != null ? formatCurrency(Number(firstTicket.price_amount_minor), e.bookingCurrency ?? 'INR') : 'Free'));

  return {
    ...e,
    ev: e.title || e.ev,
    cover: e.cover || meta.cover || "",
    tier: e.bookedTicketName || firstTicket?.name || "General",
    paid: paidVal,
    online: e.location_type === 'online',
    date: dateStr,
    time: timeStr,
    venue: e.location_type === 'online' ? 'Online' : getVenueStr(e.venue),
    attendee: (typeof window !== 'undefined' && window.ME?.name) || ME.name,
    qty: Number(e.bookingQty) > 0 ? Number(e.bookingQty) : 1,
    status: e.status === 'cancelled' ? 'voided' : 'confirmed',
    // Real per-attendee verification token (from tickets.qr_token via GET /joined) — the
    // event's own id is kept as `t.id` for display/keys, but the QR/verification content
    // must use qrToken (falls back to attendeeId, then event id, if a token isn't set yet).
    qrToken: e.qrToken || e.attendeeId || null,
    ticketId: friendlyTicketId,
    attendeeId: e.attendeeId || null,
    checkedIn: e.checkinStatus === 'checked_in',
    allAttendees: e.allAttendees || [],
  };
}

// Real, scannable QR code for a ticket's verification token. Generated server-side
// (server/src/controllers/eventRoutes.ts `GET /api/events/qr/:token`, via the Node
// `qrcode` package) and rendered as a plain <img> — the client-side `qrcode` CDN build
// (window.QRCodeLib, unpkg.com/qrcode@1.5.3/build/qrcode.min.js) 404s for this package
// version, which is why QR codes were silently falling back to the fake placeholder
// below. Still falls back to the decorative QRCode placeholder if there's no token yet
// (e.g. a ticket that hasn't resolved to a real backend booking) or the image errors.
function TicketQR({ token, size = 120 }) {
  const [failed, setFailed] = useState(false);
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  useEffect(() => { setFailed(false); }, [token]);

  if (!token || failed) {
    return <QRCode seed={token || "ticket"} size={size} />;
  }
  const src = `${apiBase}/api/events/qr/${encodeURIComponent(token)}`;
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Ticket QR code"
      style={{ display: "block" }}
      onError={() => setFailed(true)}
    />
  );
}

// A locally-synthesized ticket (added optimistically at registration time, before the
// server round-trip resolves) never carries a real qr_token — it's a placeholder with a
// random "BL-xxxx" id. Once the same event shows up in joinedEvents (the real, backend-
// sourced booking with a real qr_token), the real one must win so opening a ticket always
// shows a valid QR + unique token. Drop any local placeholder that's now superseded.
function dropSupersededLocalTickets(tickets, joinedEvents) {
  const realTitles = new Set(joinedEvents.map(j => j.title).filter(Boolean));
  return tickets.filter(t => !t.qrToken && !realTitles.has(t.ev));
}

export function MyTickets({ st, go }) {
  const [tab, setTab] = useState("upcoming");
  const [waitlistPositions, setWaitlistPositions] = useState({});
  const joinedEvents = st.joinedEvents || [];
  const tickets = dropSupersededLocalTickets(st.myTickets || [], joinedEvents);
  const getVenueStr = (v) => {
    if (typeof v === 'object' && v !== null) {
      return v.name || v.address || 'Venue TBD';
    }
    return v || 'Venue TBD';
  };

  useEffect(() => {
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch positions for waitlisted events
    const waitlistIds = Array.from(st.waitlisted || []);
    for (const e of joinedEvents) {
      if (e.bookingStatus === 'waitlisted' && !waitlistIds.includes(e.id)) {
        waitlistIds.push(e.id);
      }
    }

    waitlistIds.forEach(id => {
      fetch(`${apiBase}/api/events/${id}/waitlist/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setWaitlistPositions(prev => ({
            ...prev,
            [id]: res.data
          }));
        }
      })
      .catch(() => {});
    });

    if (window.io) {
      const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
      const socket = window.io(socketUrl, { transports: ['websocket'] });
      
      waitlistIds.forEach(id => {
        socket.emit('join_event', id);
      });

      let userId = null;
      const token = localStorage.getItem('token');
      if (token) {
          try {
              const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
              userId = payload.id;
          } catch (err) {}
      }
      if (userId) {
          socket.emit('join_user', userId);
      }

      socket.on('ticket_updated', () => {
        if (st.fetchJoinedEvents) st.fetchJoinedEvents();
      });

      socket.on('my_events_updated', () => {
        if (st.fetchJoinedEvents) st.fetchJoinedEvents();
      });

      socket.on('events_updated', () => {
        if (st.fetchJoinedEvents) st.fetchJoinedEvents();
      });

      socket.on('waitlist_positions_updated', (payload) => {
        const myUserId = window.ME?.id;
        if (myUserId && payload.positions) {
          const myPos = payload.positions.find(p => p.userId === myUserId);
          if (myPos) {
            setWaitlistPositions(prev => ({
              ...prev,
              [payload.eventId]: {
                position: myPos.position,
                totalWaiting: payload.totalWaiting,
                isWaitlisted: true
              }
            }));
          } else if (payload.totalWaiting === 0) {
            // No one left — remove this event's position entry
            setWaitlistPositions(prev => {
              const next = { ...prev };
              delete next[payload.eventId];
              return next;
            });
          }
        }
      });

      socket.on('waitlist_closed', (payload) => {
        // Remove the closed event from waitlist positions immediately
        setWaitlistPositions(prev => {
          const next = { ...prev };
          delete next[payload.eventId];
          return next;
        });
        // Trigger a joinedEvents refetch globally so the waitlist tab empties live
        window.dispatchEvent(new CustomEvent('samaagum:refreshJoinedEvents'));
      });

      return () => {
        waitlistIds.forEach(id => socket.emit('leave_event', id));
        socket.disconnect();
      };
    }
  }, [st.waitlisted, joinedEvents.length]);

  const normalizeJoinedEvent = (e) => {
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "Date TBD";
    const timeStr = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "";
    const venueObj = (typeof e.venue === 'object' && e.venue !== null) ? e.venue : {};
    const meta = venueObj.meta || {};
    const firstTicket = Array.isArray(e.tickets) ? e.tickets[0] : null;

    const totalMinor = Number(e.bookingTotalMinor ?? 0);
    const paidVal = (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp')
      ? 'Free'
      : (totalMinor > 0 ? formatCurrency(totalMinor, e.bookingCurrency ?? 'INR') : (firstTicket?.price_amount_minor != null ? formatCurrency(Number(firstTicket.price_amount_minor), e.bookingCurrency ?? 'INR') : 'Free'));

    return {
      ...e,
      ev: e.title || e.ev,
      cover: e.cover || meta.cover || "",
      tier: e.bookedTicketName || firstTicket?.name || "General",
      paid: paidVal,
      online: e.location_type === 'online',
      online_link: e.online_link || null,
      date: dateStr,
      time: timeStr,
      venue: e.location_type === 'online' ? 'Online' : getVenueStr(e.venue),
      qty: Number(e.bookingQty) > 0 ? Number(e.bookingQty) : 1,
    };
  };

  // now is used by isPast() in the priority classification below.
  // isPastEvent / confirmedJoined are kept for normalizeJoinedEvent calls.
  const now = Date.now();
  const isPastEvent = (j) => j.starts_at ? new Date(j.starts_at).getTime() < now : false;
  const confirmedJoined = joinedEvents.filter(j => j.bookingStatus === "confirmed");

  // Returns the best available "end" time: ends_at → starts_at → null
  const getEndTime = (e) => {
    if (e.ends_at) return new Date(e.ends_at);
    if (e.starts_at) return new Date(e.starts_at);
    return null;
  };

  // Archived if event or booking is cancelled
  const isArchived = (e) =>
    e.status === 'cancelled' || e.bookingStatus === 'cancelled';

  // Past if end time has passed (and not archived)
  const isPast = (e) => {
    const end = getEndTime(e);
    return end !== null && end < now;
  };

  // Normalize any event-like object for card display
  const normalizeEvent = (e) => {
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "Date TBD";
    const timeStr = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "";
    const venueObj = (typeof e.venue === 'object' && e.venue !== null) ? e.venue : {};
    const meta = venueObj.meta || {};
    const firstTicket = Array.isArray(e.tickets) ? e.tickets[0] : null;
    return {
      ...e,
      ev: e.title || e.ev,
      cover: e.cover || meta.cover || "",
      cat: meta.category || e.cat || "General",
      tier: firstTicket?.name || "General",
      paid: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp')
        ? 'Free'
        : (firstTicket?.price_amount_minor != null ? `₹${(firstTicket.price_amount_minor / 100).toFixed(0)}` : '—'),
      online: e.location_type === 'online',
      online_link: e.online_link || null,
      date: dateStr,
      time: timeStr,
      venue: e.location_type === 'online' ? 'Online' : getVenueStr(e.venue),
    };
  };

  // ─── Build a unified pool from all sources ────────────────────────────────
  // Each entry gets a _source tag so we know where it came from
  const joinedPool = (st.joinedEvents || []).map((e) => ({ ...e, _source: 'joined' }));

  // 2. createdEvents (events the user hosted)
  const createdListRaw = st.createdEvents || [];
  const createdPool = createdListRaw.map((e) => {
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";
    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    return {
      ...e,
      _source: 'created',
      _isCreated: true,
      cover: e.cover || meta.cover || "",
      cat: meta.category || e.cat || "General",
      online: e.location_type === 'online',
      online_link: e.online_link || null,
      month, day, date: dateStr, time,
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
    };
  });

  // ─── Priority classification ──────────────────────────────────────────────
  // Rule: every event belongs to exactly ONE category.
  // Priority: Archived > Past > Pending > Waitlist > Upcoming > Created

  // Track which event IDs have been classified to avoid duplicates
  const classified = new Set();

  // --- 1. ARCHIVED ---
  const archivedList = [];
  for (const e of joinedPool) {
    if (isArchived(e)) {
      archivedList.push(normalizeEvent(e));
      classified.add(e.id);
    }
  }
  for (const e of createdPool) {
    if (!classified.has(e.id) && e.status === 'cancelled') {
      archivedList.push(e);
      classified.add(e.id);
    }
  }

  // --- 2. PAST ---
  const pastList = [];
  for (const e of joinedPool) {
    if (!classified.has(e.id) && isPast(e)) {
      pastList.push(normalizeEvent(e));
      classified.add(e.id);
    }
  }
  for (const e of createdPool) {
    if (!classified.has(e.id) && isPast(e)) {
      pastList.push(e);
      classified.add(e.id);
    }
  }
  const usedTicketEvents = (st.myTickets || []).filter((t) => t.status === 'used');
  for (const t of usedTicketEvents) {
    const allProcessed = [...archivedList, ...pastList];
    const alreadyIn = allProcessed.some((u) => 
      (t.eventId && u.eventId === t.eventId) || 
      (t.eventId && u.id === t.eventId) || 
      (t.id && u.id === t.id) ||
      (t.ev && u.ev === t.ev)
    );
    if (!alreadyIn) pastList.push(t);
  }

  // --- 3. PENDING ---
  const pending = [];
  for (const e of joinedPool) {
    if (!classified.has(e.id) && e.bookingStatus === 'pending_approval') {
      pending.push(normalizeEvent(e));
      classified.add(e.id);
    }
  }

  // --- 4. WAITLIST ---
  const waitlistIds = Array.from(st.waitlisted || []);
  const waitlistedEvents = (typeof FEATURED !== 'undefined' && typeof EVENTS !== 'undefined')
    ? [FEATURED, ...EVENTS].filter((e) => waitlistIds.includes(e.id))
    : [];
  for (const e of joinedPool) {
    if (!classified.has(e.id) && e.bookingStatus === 'waitlisted') {
      waitlistedEvents.push(normalizeEvent(e));
      classified.add(e.id);
    }
  }

  // --- 5. UPCOMING ---
  const upcoming = [];
  for (const e of joinedPool) {
    if (!classified.has(e.id) && e.bookingStatus === 'confirmed') {
      upcoming.push(normalizeEvent(e));
      classified.add(e.id);
    }
  }
  for (const t of (st.myTickets || []).filter((t) => t.status !== 'used' && t.status !== 'voided')) {
    const allProcessed = [...archivedList, ...pastList, ...pending, ...waitlistedEvents, ...upcoming];
    const alreadyIn = allProcessed.some((u) => 
      (t.eventId && u.eventId === t.eventId) || 
      (t.eventId && u.id === t.eventId) || 
      (t.id && u.id === t.id) ||
      (t.ev && u.ev === t.ev)
    );
    if (!alreadyIn) upcoming.push(t);
  }

  // --- 6. CREATED ---
  const createdList = [];
  for (const e of createdPool) {
    if (!classified.has(e.id)) {
      createdList.push(e);
      classified.add(e.id);
    }
  }

  const list = tab === "upcoming" ? upcoming
    : tab === "pending" ? pending
      : tab === "past" ? pastList
        : tab === "waitlist" ? waitlistedEvents
          : tab === "wishlist" ? (st.wishlistEvents || [])
            : createdList;

  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => go("discover", "events")}>
            My Events
            <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{upcoming.length + pending.length + waitlistedEvents.length + createdList.length + pastList.length + (st.wishlistEvents?.length || 0)}</span>
          </h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="seg-tabs">
              <button className={tab === "upcoming" ? "on" : ""} onClick={() => setTab("upcoming")}>Upcoming · {upcoming.length}</button>
              <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>Pending · {pending.length}</button>
              <button className={tab === "waitlist" ? "on" : ""} onClick={() => setTab("waitlist")}>Waitlist · {waitlistedEvents.length}</button>
              <button className={tab === "wishlist" ? "on" : ""} onClick={() => setTab("wishlist")}>Wishlist · {st.wishlistEvents?.length || 0}</button>
              <button className={tab === "created" ? "on" : ""} onClick={() => setTab("created")}>Created · {createdList.length}</button>
              <button className={tab === "past" ? "on" : ""} onClick={() => setTab("past")}>Past · {pastList.length}</button>
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => go("create-event")}>
              <I.plus style={{ width: 14, height: 14 }} /> Create Event
            </button>
          </div>
        </div>

        {tab === "waitlist" && waitlistedEvents.length === 0 ? (
          <Empty icon={<I.groups />} title="No waitlisted events" text="You aren't on the waitlist for any events yet." action={<button className="hbtn hbtn--primary" onClick={() => go("discover", "events")}>Discover events</button>} />
        ) : tab === "created" && createdList.length === 0 ? (
          <Empty icon={<I.plus />} title="No hosted events" text="Create and share your first event to host it here." action={<button className="hbtn hbtn--primary" onClick={() => go("create-event")}>Create Event</button>} />
        ) : tab === "wishlist" && (st.wishlistEvents?.length || 0) === 0 ? (
          <Empty icon={<I.heart />} title="Your wishlist is empty" text="Save events you're interested in to easily find them later." action={<button className="hbtn hbtn--primary" onClick={() => go("discover", "events")}>Discover events</button>} />
        ) : list.length === 0 ? (
          <Empty icon={<I.ticket />} title="No events yet" text="When you book or RSVP to an event, your activity lives here." action={<button className="hbtn hbtn--primary" onClick={() => go("discover", "events")}>Discover events</button>} />
        ) : tab === "pending" ? (
          <div className="wallet-grid">
            {pending.map(e => {
              const startsAt = e.starts_at ? new Date(e.starts_at) : null;
              const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "Date TBD";
              const timeStr = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "";
              let venueObj = {};
              if (typeof e.venue === 'object' && e.venue !== null) venueObj = e.venue;
              else if (typeof e.venue === 'string') { try { venueObj = JSON.parse(e.venue); } catch { venueObj = { name: e.venue }; } }
              const venueStr = e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD');
              return (
                <div key={e.id} className="tkt" onClick={() => go("event", { ...e, bookingStatus: 'pending_approval' })}>
                  <div className="tkt-cov" style={{ background: e.cover && !e.cover.startsWith('http') ? e.cover : `url(${e.cover || ''}) center/cover no-repeat` }}>
                    <Grain />
                    <span className="pill" style={{ background: "rgba(245,158,11,0.92)", color: "#fff" }}>
                      <span className="pdot" style={{ background: "#fff" }} />Pending Approval
                    </span>
                  </div>
                  <span className="perf l" /><span className="perf r" />
                  <div className="tkt-body">
                    <div className="tkt-ttl">{e.title}</div>
                    <div className="tkt-meta">
                      <span><I.cal style={{ width: 14, height: 14 }} /> {dateStr} · {timeStr}</span>
                      <span>{e.location_type === 'online' ? <I.online style={{ width: 14, height: 14 }} /> : <I.pin style={{ width: 14, height: 14 }} />} {venueStr}</span>
                    </div>
                    <div className="tkt-foot">
                      <span className="tkt-id">#{e.id?.slice(0, 8)}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>Awaiting host ⏳</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : tab === "wishlist" ? (
          <div className="wallet-grid">
            {st.wishlistEvents?.length === 0 ? (
              <Empty icon={<I.heart />} title="No wishlisted events" text="Events you wishlist will appear here." action={<button className="hbtn hbtn--primary" onClick={() => go("discover", "events")}>Discover events</button>} />
            ) : (
              st.wishlistEvents?.map(e => {
                const startsAt = e.starts_at ? new Date(e.starts_at) : null;
                const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "Date TBD";
                const timeStr = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "";
                let venueObj = {};
                if (typeof e.venue === 'object' && e.venue !== null) venueObj = e.venue;
                else if (typeof e.venue === 'string') { try { venueObj = JSON.parse(e.venue); } catch { venueObj = { name: e.venue }; } }
                const venueStr = e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD');
                return (
                  <div key={e.id} className="tkt" onClick={() => go("event", e)}>
                    <div className="tkt-cov" style={{ background: e.cover && !e.cover.startsWith('http') ? e.cover : `url(${e.cover || ''}) center/cover no-repeat` }}>
                      <Grain />
                      <span className="pill" style={{ background: "rgba(236,72,153,0.92)", color: "#fff" }}>
                        <span className="pdot" style={{ background: "#fff" }} />Wishlisted
                      </span>
                    </div>
                    <span className="perf l" /><span className="perf r" />
                    <div className="tkt-body">
                      <div className="tkt-ttl">{e.title}</div>
                      <div className="tkt-meta">
                        <span><I.cal style={{ width: 14, height: 14 }} /> {dateStr} · {timeStr}</span>
                        <span>{e.location_type === 'online' ? <I.online style={{ width: 14, height: 14 }} /> : <I.pin style={{ width: 14, height: 14 }} />} {venueStr}</span>
                      </div>
                      <div className="tkt-foot">
                        <span className="tkt-id">#{e.id?.slice(0, 8)}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-1)" }}>Wishlisted ❤️</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === "waitlist" ? (
          <div className="wallet-grid">
            {waitlistedEvents.map(e => {
              const wPos = waitlistPositions[e.id];
              return (
              <div key={e.id} className="tkt" onClick={() => go("waitlist", e)}>
                <div className="tkt-cov" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
                  <Grain />
                  <span className="pill" style={{ background: "rgba(0,0,0,0.32)", color: "#fff", backdropFilter: "blur(8px)" }}>{e.cat}</span>
                  <span className="pill violet" style={{ background: "rgba(255,255,255,0.92)", color: "var(--accent-2)" }}><span className="pdot" style={{ background: "var(--accent-2)" }} />Waitlisted</span>
                </div>
                <span className="perf l" /><span className="perf r" />
                <div className="tkt-body">
                  <div className="tkt-ttl">{e.title || e.ev}</div>
                  <div className="tkt-meta">
                    <span><I.cal style={{ width: 14, height: 14 }} /> {e.date} · {e.time}</span>
                    <span>{e.online ? <I.online style={{ width: 14, height: 14 }} /> : <I.pin style={{ width: 14, height: 14 }} />} {e.venue}</span>
                  </div>
                  <div className="tkt-foot">
                    <span className="tkt-id">#{e.id?.slice(0, 8)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {wPos && (
                        <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 12, color: 'var(--text-2)' }}>
                          Pos {wPos.position} / {wPos.totalWaiting}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 4 }}>
                        View Queue <I.arrowR style={{ width: 14, height: 14 }} />
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : tab === "created" ? (
          <div className="wallet-grid">
            {createdList.map(e => (
              <div key={e.id} className="tkt" onClick={() => go("event", e)}>
                <div className="tkt-cov" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
                  <Grain />
                  <span className="pill" style={{ background: "rgba(0,0,0,0.32)", color: "#fff", backdropFilter: "blur(8px)" }}>{e.cat}</span>
                  <span className="pill green" style={{ background: "rgba(255,255,255,0.92)", color: "#1f9d57" }}><span className="pdot" style={{ background: "#1f9d57" }} />Hosting</span>
                </div>
                <span className="perf l" /><span className="perf r" />
                <div className="tkt-body">
                  <div className="tkt-ttl">{e.title}</div>
                  <div className="tkt-meta">
                    <span><I.cal style={{ width: 14, height: 14 }} /> {e.date} · {e.time}</span>
                    <span>{e.online ? <I.online style={{ width: 14, height: 14 }} /> : <I.pin style={{ width: 14, height: 14 }} />} {e.venue}</span>
                  </div>
                  <div className="tkt-foot">
                    <span className="tkt-id">#{e.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 4 }}>
                      Manage <I.arrowR style={{ width: 14, height: 14 }} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab === "archived" ? (
          <div className="wallet-grid">
            {archivedList.map(e => (
              <div key={e.id} className="tkt" style={{ opacity: 0.82, filter: "grayscale(0.3)" }} onClick={() => go("event", e)}>
                <div className="tkt-cov" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
                  <Grain />
                  <span className="pill" style={{ background: "rgba(0,0,0,0.32)", color: "#fff", backdropFilter: "blur(8px)" }}>{e.cat || e.tier || "Event"}</span>
                  <span className="pill gray" style={{ background: "rgba(255,255,255,0.88)", color: "#6b7280", border: "1px solid #e5e7eb" }}>
                    <span className="pdot" style={{ background: "#9ca3af" }} />
                    {e._isCreated ? "Cancelled Event" : "Cancelled"}
                  </span>
                </div>
                <span className="perf l" /><span className="perf r" />
                <div className="tkt-body">
                  <div className="tkt-ttl" style={{ color: "var(--ink-2)" }}>{e.title || e.ev}</div>
                  <div className="tkt-meta">
                    <span><I.cal style={{ width: 14, height: 14 }} /> {e.date} · {e.time}</span>
                    <span>{e.online ? <I.online style={{ width: 14, height: 14 }} /> : <I.pin style={{ width: 14, height: 14 }} />} {e.venue}</span>
                  </div>
                  <div className="tkt-foot">
                    <span className="tkt-id">#{e.id?.slice(0, 8)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", display: "flex", alignItems: "center", gap: 3 }}>
                      🗄️ Archived
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="wallet-grid">
            {list.map(t => {
              // A ticket is "attended" (past) either because it's explicitly marked used,
              // or because it's rendering under the Past tab (real bookings whose event
              // date has already elapsed, computed above from starts_at).
              const isPast = t.status === "used" || tab === "past";
              return (
              <div key={t.id} className={`tkt ${isPast ? "used" : ""}`} onClick={() => {
                // If it is a normalized joined event, it already has the event fields, otherwise locate it in our local cache or joinedEvents
                const evObj = t.starts_at ? t : ([FEATURED, ...EVENTS].find(e => e.title === t.ev || e.id === t.eventId) || st.joinedEvents?.find(je => je.id === t.eventId || je.title === t.ev));
                if (evObj) {
                  go("event", evObj);
                } else {
                  go("ticket", t);
                }
              }}>
                <div className="tkt-cov" style={{ background: t.cover && (t.cover.startsWith("linear-gradient") || t.cover.startsWith("radial-gradient") || t.cover.startsWith("var(")) ? t.cover : `url(${t.cover}) center/cover no-repeat` }}>
                  <Grain />
                  <span className="pill" style={{ background: "rgba(0,0,0,0.32)", color: "#fff", backdropFilter: "blur(8px)" }}>{t.tier}</span>
                  {isPast ? (
                    <span className="pill gray">Attended</span>
                  ) : (
                    <span className="pill green" style={{ background: "rgba(255,255,255,0.92)" }}><span className="pdot" />Confirmed</span>
                  )}
                </div>
                <span className="perf l" /><span className="perf r" />
                <div className="tkt-body">
                  <div className="tkt-ttl">{t.ev}</div>
                  <div className="tkt-meta">
                    <span><I.cal style={{ width: 14, height: 14 }} /> {t.date} · {t.time}</span>
                    <span>{t.online ? <I.online style={{ width: 14, height: 14 }} /> : <I.pin style={{ width: 14, height: 14 }} />} {t.venue}</span>
                  </div>
                  <div className="tkt-foot">
                    <span className="tkt-id">#{t.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.paid === "Free" ? "#1f9d57" : "var(--ink)" }}>{t.paid}</span>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- My Tickets (F: dedicated ticket wallet — S-085 refined) ----------------
   Distinct from MyTickets/"My Events" above: this shows every ticket the user holds as a
   ticket-shaped card — QR code, price, attendee name, date/venue — not an event browser. */
export function AllTickets({ st, go }) {
  const joinedEvents = st.joinedEvents || [];
  const tickets = dropSupersededLocalTickets(st.myTickets || [], joinedEvents);

  const confirmedJoined = joinedEvents
    .filter(j => j.bookingStatus === "confirmed")
    .map(normalizeJoinedEvent);
  const pendingPaymentJoined = joinedEvents
    .filter(j => j.bookingStatus === "pending_payment")
    .map(normalizeJoinedEvent);
  const pendingJoined = joinedEvents.filter(j => j.bookingStatus === "pending_approval");

  // Every real/synthetic ticket the user holds — newest first, voided ones dropped.
  // Real, backend-sourced tickets (confirmedJoined, each carrying a genuine qr_token) are
  // listed first so the ones with a valid QR + unique token surface before any leftover
  // local placeholder that hasn't been superseded yet.
  const allTickets = [
    ...confirmedJoined,
    ...pendingPaymentJoined,
    ...tickets.filter(t => t.status !== "voided")
  ];

  const totalCount = allTickets.length + pendingJoined.length;

  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2>My Tickets <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{totalCount}</span></h2>
        </div>

        {totalCount === 0 ? (
          <Empty
            icon={<I.ticket />}
            title="No tickets yet"
            text="When you book or RSVP to an event, your ticket — with QR code, price and details — will show up here."
            action={<button className="hbtn hbtn--primary" onClick={() => go("discover", "events")}>Discover events</button>}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pendingJoined.map(p => {
              const startsAt = p.starts_at ? new Date(p.starts_at) : null;
              const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : "Date TBD";
              const timeStr = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "";
              const venueStr = p.location_type === 'online' ? 'Online' : getVenueStr(p.venue);
              return (
                <div
                  key={p.id}
                  className="tkt-row"
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", cursor: "pointer" }}
                  onClick={() => go("event", { ...p, bookingStatus: 'pending_approval' })}
                >
                  <div style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⏳</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>{dateStr} · {timeStr} · {venueStr}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#f59e0b", flexShrink: 0 }}>Awaiting approval ⏳</span>
                </div>
              );
            })}

            {allTickets.map((t, i) => {
              const attended = t.status === "used";
              return (
                <div
                  key={t.id || i}
                  className="tkt-row"
                  style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", cursor: "pointer" }}
                  onClick={() => go("ticket", t)}
                >
                  <div style={{ width: 64, height: 64, borderRadius: 10, flexShrink: 0, background: "#fff", padding: 6, boxSizing: "border-box", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                    {t.online ? (
                      <div style={{ width: '100%', height: '100%', borderRadius: 6, background: `url(${t.cover || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=100'}) center/cover no-repeat`, position: 'relative' }}>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '2px 0', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}>ONLINE</div>
                      </div>
                    ) : (
                      <TicketQR token={t.qrToken || t.id || t.ev || "ticket"} size={52} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.ev}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>{t.date} · {t.time} · {t.online ? "Online" : t.venue}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                      <span className="pill" style={{ background: "var(--field)", color: "var(--ink-2)", fontSize: 11 }}>{t.tier}</span>
                      <span style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4 }}><I.user style={{ width: 12, height: 12 }} /> {t.attendee || ME.name}</span>
                      <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>#{t.id}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.paid === "Free" ? "#1f9d57" : "var(--ink)" }}>{t.paid}</div>
                    {attended ? (
                      <span className="pill gray" style={{ marginTop: 6, display: "inline-block" }}>Attended</span>
                    ) : t.bookingStatus === "pending_payment" ? (
                      <span className="pill" style={{ marginTop: 6, display: "inline-block", background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>Pending Payment</span>
                    ) : (
                      <span className="pill green" style={{ marginTop: 6, display: "inline-block" }}><span className="pdot" />Confirmed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function downloadInvoice(t) {
  const win = window.open("", "_blank");
  if (!win) { alert("Please allow pop-ups to download the invoice."); return; }
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const token = t.qrToken || t.id || "";
  const qrSrc = token ? `${apiBase}/api/events/qr/${encodeURIComponent(token)}` : "";
  const rows = [
    ["Event", t.ev || "—"],
    ["Attendee", t.attendee || "—"],
    ["Ticket tier", t.tier || "General"],
    ["Ticket / Token #", t.qrToken || t.id || "—"],
    ["Date", `${t.date || ""} ${t.time ? "· " + t.time : ""}`.trim() || "—"],
    [t.online ? "Location" : "Venue", t.venue || "—"],
    ["Quantity", String(t.qty || 1)],
    ["Amount paid", t.paid || "—"],
  ];
  win.document.write(`
    <html>
      <head>
        <title>Invoice · ${t.ev || "Ticket"}</title>
        <style>
          body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 40px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .sub { color: #6b7280; font-size: 13px; margin-bottom: 28px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          td:first-child { color: #6b7280; width: 40%; }
          td:last-child { font-weight: 600; text-align: right; }
          .qr-block { margin-top: 28px; display: flex; flex-direction: column; align-items: center; }
          .qr-block img { width: 160px; height: 160px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
          .qr-block .cap { margin-top: 10px; font-size: 12px; color: #6b7280; }
          .qr-block .tok { margin-top: 4px; font-size: 10.5px; color: #9ca3af; font-family: monospace; word-break: break-all; text-align: center; }
          .foot { margin-top: 32px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <h1>Samaagum · Ticket Invoice</h1>
        <div class="sub">Issued ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>
        ${t.online ? (t.online_link ? `
        <div class="qr-block">
          <div style="padding: 16px; background: #f3f4f6; border-radius: 8px; font-weight: 600; text-align: center;">
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Meeting Link</div>
            <a href="${t.online_link}" target="_blank" style="color: #0b5cff; text-decoration: none; word-break: break-all;">${t.online_link}</a>
          </div>
        </div>` : "") : (qrSrc ? `
        <div class="qr-block">
          <img src="${qrSrc}" alt="Ticket QR code" />
          <div class="cap">Show this QR code at the gate for scanning</div>
          <div class="tok">Token: ${token}</div>
        </div>` : "")}
        <div class="foot">This invoice was generated automatically and serves as proof of booking.</div>
        <script>
          (() => {
            const img = document.querySelector('.qr-block img');
            const go = () => window.print();
            if (img && !img.complete) {
              img.addEventListener('load', go);
              img.addEventListener('error', go);
              setTimeout(go, 3000);
            } else {
              window.onload = go;
            }
          })();
        <\/script>
      </body>
    </html>
  `);
  win.document.close();
}

async function shareTicket(t) {
  const url = `${window.location.origin}${window.location.pathname}#ticket/${encodeURIComponent(t.qrToken || t.id || "")}`;
  const shareData = {
    title: `${t.ev || "My ticket"} · Samaagum`,
    text: t.online && t.online_link 
      ? `Join ${t.ev || "this event"} online — ${t.date || ""} · ${t.online_link}`
      : `My ticket for ${t.ev || "this event"} — ${t.date || ""}`,
    url
  };
  if (navigator.share) {
    try { await navigator.share(shareData); return; } catch (e) { /* user cancelled or unsupported, fall through */ }
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
      return;
    } catch (e) { /* fall through */ }
  }
  alert(url);
}

export function TicketDetail({ tkt, st, go }) {
  const tickets = st?.myTickets || [];
  const t = tkt || tickets[0] || {};
  const used = t.status === "used" || t.checkedIn;
  const verifyToken = t.qrToken || t.id;

  const addToCalendar = () => {
    const startStr = t.starts_at ? new Date(t.starts_at).toISOString().replace(/-|:|\.\d\d\d/g, "") : "";
    let endStr = t.ends_at ? new Date(t.ends_at).toISOString().replace(/-|:|\.\d\d\d/g, "") : "";
    if (!endStr && startStr) {
      // Default to 1 hour duration if no end time
      endStr = new Date(new Date(t.starts_at).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    }
    const dates = startStr && endStr ? `&dates=${startStr}/${endStr}` : "";
    const title = encodeURIComponent(t.ev || "Event");
    const details = encodeURIComponent("Tickets booked via Samaagum");
    const location = encodeURIComponent(t.venue !== "Online" ? t.venue || "" : "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${dates}&details=${details}&location=${location}`;
    window.open(url, "_blank");
  };

  return (
    <div className="scroll">
      <div className="flow view-enter" style={{ padding: "26px 24px 80px" }}>
        <div className="flow-head" style={{ marginBottom: 20 }}>
          <button className="back" onClick={() => go("events")}><I.arrowL /></button>
          <div>
            <div className="flow-title">Ticket</div>
            <div className="flow-sub">#{t.id}</div>
          </div>
        </div>

        <div className="qr-ticket">
          {!t.online && (
            <div className="qt-cov" style={{ background: t.cover && (t.cover.startsWith("linear-gradient") || t.cover.startsWith("radial-gradient") || t.cover.startsWith("var(")) ? t.cover : `url(${t.cover}) center/cover no-repeat` }}>
              <Grain />
              <span className="pill" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", backdropFilter: "blur(8px)" }}>{t.tier}</span>
            </div>
          )}
          <div className="qt-pad">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--ink)", lineHeight: 1.25, textAlign: "center", marginBottom: 20 }}>{t.ev}</div>

            {used ? (
              <div className="notice gray" style={{ background: "var(--field)", border: "1px solid var(--border)", margin: "18px 0" }}>
                <span className="ni"><I.check /></span><div>This ticket was used on {t.date}. The QR is no longer valid.</div>
              </div>
            ) : t.online ? (
              <div style={{ margin: "20px 0 24px" }}>
                <OnlineMeetingCard url={t.online_link} banner={t.cover} status={t.bookingStatus === 'cancelled' ? 'cancelled' : 'active'} isPast={t.ends_at ? new Date(t.ends_at).getTime() < Date.now() : (t.starts_at ? new Date(t.starts_at).getTime() < Date.now() : false)} />
              </div>
            ) : (
              <div className="qr-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "20px 0 24px" }}>
                <div className="qr-box" style={{ padding: 14, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "var(--sh-sm)", width: 200, height: 200 }}><TicketQR token={verifyToken || "test"} size={172} /></div>
                <div className="qr-caption" style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12, textAlign: "center" }}>Show this at the gate for scanning</div>
                {verifyToken && (
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--ink-3)", fontFamily: "monospace", letterSpacing: "0.02em", wordBreak: "break-all", textAlign: "center", padding: "0 10px" }}>
                    Token: {verifyToken}
                  </div>
                )}
              </div>
            )}

            <div className="qt-rows">
              {t.ticketId && <div className="qt-row"><span className="k">Ticket ID</span><span className="v" style={{ fontFamily: "monospace", fontSize: 12 }}>{t.ticketId}</span></div>}
              {t.allAttendees?.length <= 1 && <div className="qt-row"><span className="k">Attendee</span><span className="v">{t.attendee}</span></div>}
              <div className="qt-row"><span className="k">Date</span><span className="v">{t.date} · {t.time}</span></div>
              <div className="qt-row"><span className="k">{t.online ? "Location" : "Venue"}</span><span className="v">{t.venue}</span></div>
              <div className="qt-row"><span className="k">Quantity</span><span className="v">{t.qty}</span></div>
              <div className="qt-row"><span className="k">Paid</span><span className="v">{t.paid}</span></div>
              <div className="qt-row">
                <span className="k">Order Status</span>
                <span className="v">
                  {used ? (
                    <span className="pill gray">Used</span>
                  ) : t.bookingStatus === "pending_payment" ? (
                    <span className="pill" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>Pending Payment</span>
                  ) : (
                    <span className="pill green"><span className="pdot" />Confirmed</span>
                  )}
                </span>
              </div>
            </div>

            {t.allAttendees && t.allAttendees.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attendee Status</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {t.allAttendees.map((att: any) => (
                    <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--field)', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{att.name}</div>
                        {att.email && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{att.email}</div>}
                      </div>
                      <div>
                        {att.status === 'approved' ? <span className="pill green">Approved</span> :
                         att.status === 'pending' ? <span className="pill" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>Pending</span> :
                         att.status === 'waitlisted' ? <span className="pill gray">Waitlisted</span> :
                         att.status === 'rejected' ? <span className="pill" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Rejected</span> :
                         <span className="pill gray">{att.status}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => downloadInvoice(t)}><I.download /> Invoice</button>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={addToCalendar}><I.cal /> Add to calendar</button>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => shareTicket(t)}><I.share /> Share</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Claim-your-ticket (F4) ---------------- */
export function ClaimFlow({ token, st, go, onClaimed }: any) {
  const [step, setStep] = useState("loading"); // loading | landing | otp | done | error
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [otpError, setOtpError] = useState("");
  const refs = useRef([]);
  const [claimData, setClaimData] = useState<any>(null);

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const authToken = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setStep("error");
      setErrorMsg("No claim token provided.");
      return;
    }
    fetch(`${apiBase}/api/tickets/claim/${token}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setClaimData(res.data);
          setStep("landing");
        } else {
          setStep("error");
          setErrorMsg(res.message);
        }
      })
      .catch(() => {
        setStep("error");
        setErrorMsg("Failed to load claim details.");
      });
  }, [token, apiBase]);

  const sendOtp = () => {
    setStatus("sending");
    setErrorMsg("");
    fetch(`${apiBase}/api/tickets/claim/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })
    .then(r => r.json())
    .then(res => {
      setStatus("");
      if (res.success) {
        setOtpError("");
        setStep("otp");
      } else {
        setErrorMsg(res.message || "Failed to send OTP.");
      }
    })
    .catch(() => {
      setStatus("");
      setErrorMsg("Network error. Please try again.");
    });
  };

  const verifyOtp = (otp) => {
    setStatus("checking");
    setOtpError("");
    const headers: any = { "Content-Type": "application/json" };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    fetch(`${apiBase}/api/tickets/claim/otp/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ token, otp })
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        if (res.token) {
          localStorage.setItem('token', res.token);
          // Immediately update window.ME from the new token so the UI
          // treats this user as a verified, logged-in member right away
          try {
            const parts = res.token.split('.');
            if (parts.length >= 2) {
              const p = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
              if (p.id) (window as any).ME.id = p.id;
              if (p.email) {
                const local = p.email.split('@')[0];
                (window as any).ME.name = local.replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                (window as any).ME.handle = `@${local}`;
              }
            }
          } catch (_) {}
        }
        // Notify parent (join_event.tsx) so it can re-fetch the event page state
        if (typeof onClaimed === 'function') {
          onClaimed(res.token);
        }
        // Refresh joined-events list in the sidebar
        if (st && typeof st.fetchJoinedEvents === 'function') {
          st.fetchJoinedEvents();
        }
        setStep("done");
      } else {
        setStatus("");
        setOtpError(res.message || "Invalid OTP. Please try again.");
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => refs.current[0]?.focus(), 50);
      }
    })
    .catch(() => {
      setStatus("");
      setOtpError("Network error. Please try again.");
    });
  };

  const onDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join("").length === 6) {
      verifyOtp(next.join(""));
    }
  };

  return (
    <div className="scroll">
      <div className="flow view-enter" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "40px" }}>Loading...</div>
        )}
        
        {step === "error" && (
          <div className="fcard fcard-pad" style={{ textAlign: "center", color: "var(--red)" }}>
            <h3>Error</h3>
            <p>{errorMsg}</p>
          </div>
        )}

        {step === "landing" && claimData && (
          <>
            <div style={{ textAlign: "center", padding: "10px 0 6px" }}><Wordmark size={20} /></div>
            <div className="fcard" style={{ marginTop: 18 }}>
              <div className="qt-cov" style={{ background: claimData.cover && (claimData.cover.startsWith("linear-gradient") || claimData.cover.startsWith("radial-gradient") || claimData.cover.startsWith("var(")) ? claimData.cover : `url(${claimData.cover}) center/cover no-repeat`, height: 120, position: "relative", display: "flex", alignItems: "flex-end", padding: 16 }}>
                <Grain />
                <span className="pill" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", backdropFilter: "blur(8px)" }}>Ticket for {claimData.ticketName || 'Guest'}</span>
              </div>
              <div className="fcard-pad">
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-2)" }}>You've been given a ticket</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--ink)", marginTop: 8, lineHeight: 1.2 }}>{claimData.eventTitle}</h2>
                <div className="notice info" style={{ marginTop: 16 }}>
                  <span className="ni"><I.link /></span>
                  <div>This is a secure single-use claim link. Verify it's you to add the ticket to your Samaagum wallet. Your entry stays valid even if you never claim.</div>
                </div>
                {errorMsg && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--red)", background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 6 }}>
                    {errorMsg}
                  </div>
                )}
                <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: 16 }} onClick={sendOtp} disabled={status === "sending"}>
                  {status === "sending" ? "Sending OTP..." : "Claim this ticket"}
                </button>
              </div>
            </div>
          </>
        )}

        {step === "otp" && claimData && (
          <>
            <div className="flow-head"><button className="back" onClick={() => setStep("landing")}><I.arrowL /></button><div><div className="flow-title">Verify it's you</div><div className="flow-sub">Code sent to {claimData.attendeeEmail}</div></div></div>
            <div className="fcard fcard-pad" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>Enter the 6-digit code we sent to <strong>{claimData.attendeeEmail}</strong></p>
              <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
                {code.map((d, i) => (
                  <input key={i} ref={el => refs.current[i] = el} className="otp-box" value={d} maxLength={1} inputMode="numeric"
                    style={{ width: 42, height: 48, fontSize: 20, textAlign: "center", borderRadius: 8, border: `1px solid ${otpError ? 'var(--red)' : 'var(--border)'}`, background: "var(--field)", color: "var(--ink)" }}
                    onChange={e => onDigit(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }} />
                ))}
              </div>
              {otpError && <div style={{ marginTop: 12, fontSize: 13, color: "var(--red)", background: "rgba(239,68,68,0.08)", padding: "8px 12px", borderRadius: 6 }}>{otpError}</div>}
              {status === "checking" && <div style={{ marginTop: 12, fontSize: 13, color: "var(--ink-3)", display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}>Verifying…</div>}
              <div style={{ marginTop: 18, fontSize: 13, color: "var(--ink-3)" }}>Didn't get it? <button className="linkbtn" onClick={sendOtp}>Resend code</button></div>
            </div>
          </>
        )}

        {step === "done" && claimData && (
          <div className="fcard" style={{ marginTop: 20 }}>
            <div className="terminal" style={{ textAlign: "center", padding: 24 }}>
              <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><I.check style={{ width: 34, height: 34 }} /></div>
              <h2>🎉 Ticket Claimed!</h2>
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>
                <strong>{claimData.eventTitle}</strong> is now in your wallet. Your account has been verified — you are now a confirmed member!
              </p>
            </div>
            <div className="fcard-pad" style={{ paddingTop: 4, paddingBottom: 24 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="hbtn hbtn--primary hbtn--block" onClick={() => {
                  // Close popup and show event as confirmed member
                  if (typeof onClaimed === 'function') onClaimed(localStorage.getItem('token'));
                  // Full reload ensures profile, sidebar, and event page all refresh cleanly
                  window.location.reload();
                }}><I.check /> Go to Event</button>
                <button className="hbtn hbtn--ghost" onClick={() => {
                  window.location.hash = '#events';
                  window.location.reload();
                }}><I.ticket /> My Tickets</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Verify Ticket panel (manual token entry + camera QR scan) ----------------
   Used inside EventDashboard so hosts/staff can check attendees in by scanning or typing
   the unique token embedded in their ticket's QR code. Hits GET/POST /:id/verify/:qrToken. */
export function VerifyTicketPanel({ eventId, onCheckedIn }) {
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const [tokenInput, setTokenInput] = useState("");
  const [result, setResult] = useState(null); // { valid, alreadyCheckedIn, name, ... } | { valid: false }
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  const lookup = async (token) => {
    const t = (token || "").trim();
    if (!t) return;
    setBusy(true);
    setResult(null);
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${eventId}/verify/${encodeURIComponent(t)}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setResult({ ...data.data, token: t });
      } else {
        setResult({ valid: false, reason: data.message || "Lookup failed" });
      }
    } catch (err) {
      setResult({ valid: false, reason: "Network error" });
    } finally {
      setBusy(false);
    }
  };

  const confirmCheckin = async (paymentReceived = false, specificTicket: any = null) => {
    const target = specificTicket || result;
    if (!target?.valid || target.alreadyCheckedIn) return;
    if (target.isCashPayment && target.isPaymentPending && !paymentReceived) {
      if (!window.confirm(`Has cash payment of ₹${(target.amountMinor || 0) / 100} been collected?`)) {
        return;
      }
      paymentReceived = true;
    }
    setBusy(true);
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${eventId}/verify/${encodeURIComponent(target.qrToken)}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ paymentReceived })
      });
      const data = await res.json();
      if (data.success) {
        if (result.isMultiple) {
          setResult(r => ({
            ...r,
            tickets: r.tickets.map(t => t.ticketId === target.ticketId ? { ...t, alreadyCheckedIn: true, isPaymentPending: false } : t)
          }));
        } else {
          setResult(r => ({ ...r, alreadyCheckedIn: true, isPaymentPending: false }));
        }
        onCheckedIn && onCheckedIn();
      } else {
        alert(data.message || "Check-in failed.");
      }
    } catch (err) {
      alert("Network error confirming check-in.");
    } finally {
      setBusy(false);
    }
  };

  // Camera scanning loop — decodes frames with jsQR (CDN-loaded, see Samaagum Home.html).
  // Guarded: if jsQR/camera isn't available, the scan button simply won't do anything harmful.
  useEffect(() => {
    if (!scanning) return;
    if (typeof jsQR === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setScanning(false);
      alert("Camera scanning isn't available in this browser. Use manual entry instead.");
      return;
    }
    let stopped = false;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (stopped) { stream.getTracks().forEach(tr => tr.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        const tick = () => {
          if (stopped) return;
          const video = videoRef.current, canvas = canvasRef.current;
          if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);
            if (code && code.data) {
              setResult(null);
              setScanning(false);
              setTokenInput(code.data);
              lookup(code.data);
              return;
            }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        setScanning(false);
        alert("Couldn't access the camera. Check permissions, or use manual entry.");
      });
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(tr => tr.stop());
    };
  }, [scanning]);

  return (
    <div className="fcard" style={{ padding: 16, marginBottom: 20, background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <I.ticket style={{ width: 15, height: 15 }} /> Verify Ticket
      </h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={tokenInput}
          onChange={ev2 => { setTokenInput(ev2.target.value); setResult(null); }}
          onFocus={() => setResult(null)}
          onKeyDown={ev2 => { if (ev2.key === 'Enter') { setResult(null); lookup(tokenInput); } }}
          placeholder="Paste or type ticket token / Booking ID..."
          style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", fontSize: 13 }}
        />
        <button className="hbtn hbtn--primary hbtn--sm" disabled={busy || !tokenInput.trim()} onClick={() => { setResult(null); lookup(tokenInput); }}>Verify</button>
        <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
          if (!scanning) setResult(null);
          setScanning(s => !s);
        }}>{scanning ? "Stop scan" : "Scan QR"}</button>
      </div>

      {scanning && (
        <div style={{ marginTop: 12, position: "relative", width: "100%", maxWidth: 320, borderRadius: 10, overflow: "hidden", background: "#000" }}>
          <video ref={videoRef} style={{ width: "100%", display: "block" }} muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {result && (
        <div style={{ marginTop: 12 }}>
          {!result.valid && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: "rgba(239,68,68,0.08)" }}>
              <div style={{ fontSize: 13, color: "#ef4444" }}>Invalid ticket / Booking ID — {result.reason === 'not_found' ? "no matching ticket for this event." : (result.reason || "not recognized.")}</div>
            </div>
          )}

          {result.valid && result.isMultiple && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Booking found. Contains {result.tickets?.length || 0} ticket(s):</div>
              {result.tickets?.map((t: any) => (
                <div key={t.ticketId} style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: t.alreadyCheckedIn ? "var(--field)" : "rgba(31,157,87,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: t.userId ? "pointer" : "default" }} onClick={() => { if (t.userId) setSelectedProfile(t); }}>
                      {/* Avatar */}
                      {t.picture && t.picture !== "null" ? (
                        <img src={t.picture} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--border)" }} />
                      ) : (
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--accent-2)", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid var(--border)" }}>
                          {t.name ? t.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, textDecoration: t.userId ? "underline" : "none" }}>
                          {t.name}
                        </div>
                        {t.email && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{t.email}</div>}
                        {t.isCashPayment && (
                          <div style={{ fontSize: 12, fontWeight: 500, color: t.isPaymentPending ? "#f59e0b" : "#1f9d57", marginTop: 4 }}>
                            {t.isPaymentPending ? `⚠️ Cash Payment Pending: ₹${(t.amountMinor || 0) / 100}` : "✅ Cash Collected"}
                          </div>
                        )}
                      </div>
                    </div>
                    {t.alreadyCheckedIn ? (
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", background: "rgba(124,90,255,0.1)", padding: "4px 10px", borderRadius: 999 }}>Already checked in</span>
                    ) : (
                      <button className="hbtn hbtn--primary hbtn--sm" disabled={busy} onClick={() => confirmCheckin(false, t)}>Check-in</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.valid && !result.isMultiple && (
            <div style={{ padding: 12, borderRadius: 8, border: "1px solid var(--border)", background: result.alreadyCheckedIn ? "var(--field)" : "rgba(31,157,87,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: result.userId ? "pointer" : "default" }} onClick={() => { if (result.userId) setSelectedProfile(result); }}>
                  {/* Avatar */}
                  {result.picture && result.picture !== "null" ? (
                    <img src={result.picture} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--border)" }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--accent-2)", color: "#fff", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid var(--border)" }}>
                      {result.name ? result.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, textDecoration: result.userId ? "underline" : "none" }}>
                      {result.name}
                    </div>
                    {result.email && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{result.email}</div>}
                    {result.isCashPayment && (
                      <div style={{ fontSize: 12, fontWeight: 500, color: result.isPaymentPending ? "#f59e0b" : "#1f9d57", marginTop: 4 }}>
                        {result.isPaymentPending ? `⚠️ Cash Payment Pending: ₹${(result.amountMinor || 0) / 100}` : "✅ Cash Collected"}
                      </div>
                    )}
                  </div>
                </div>
                {result.alreadyCheckedIn ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", background: "rgba(124,90,255,0.1)", padding: "4px 10px", borderRadius: 999 }}>Already checked in</span>
                ) : (
                  <button className="hbtn hbtn--primary hbtn--sm" disabled={busy} onClick={() => confirmCheckin(false)}>Confirm Check-in</button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {selectedProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSelectedProfile(null)}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 360, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
            <div style={{ height: 80, background: 'var(--accent-grad, linear-gradient(135deg, #3b82f6, #8b5cf6))', position: 'relative' }}>
              <button onClick={() => setSelectedProfile(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.x style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ padding: '0 20px 24px', marginTop: -40, position: 'relative', textAlign: 'center' }}>
              {selectedProfile.picture && selectedProfile.picture !== "null" ? (
                <img src={selectedProfile.picture} style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--surface)', objectFit: 'cover', background: 'var(--bg-1)', display: 'block', margin: '0 auto 12px' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid var(--surface)', background: 'var(--accent-2)', color: '#fff', fontSize: 32, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  {selectedProfile.name ? selectedProfile.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <h3 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{selectedProfile.name}</h3>
              {selectedProfile.username && <p style={{ margin: '0 0 8px 0', fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>@{selectedProfile.username}</p>}
              {selectedProfile.headline && <p style={{ margin: '0 0 16px 0', fontSize: 14, color: 'var(--ink)' }}>{selectedProfile.headline}</p>}
              
              <div style={{ textAlign: 'left', background: 'var(--field)', borderRadius: 8, padding: 12, marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Contact</div>
                <div style={{ fontSize: 14, color: 'var(--ink)' }}>{selectedProfile.email || 'No email provided'}</div>
              </div>
              
              {selectedProfile.bio && (
                <div style={{ textAlign: 'left', background: 'var(--field)', borderRadius: 8, padding: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>About</div>
                  <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.4 }}>{selectedProfile.bio}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ---------------- Scan hub (ticket-scanner-only landing page) ----------------
   Lists the events the current user can scan tickets for (any active event-team
   role carrying the checkin.gate_staff capability), sorted soonest-first. Only
   events currently within their check-in window are clickable. */
export function ScanHub({ st, go }) {
  const events = [...(st.scannerEvents || [])].sort((a, b) => new Date(a.starts_at || 0) - new Date(b.starts_at || 0));

  return (
    <div className="scroll" style={{ padding: "24px 20px", maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
        <I.scan style={{ width: 20, height: 20 }} /> Scan tickets
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>Events you're a ticket scanner for. Only events currently in their check-in window can be opened.</p>

      {events.length === 0 ? (
        <Empty title="No scan assignments" desc="You'll see events here once you're assigned as a ticket scanner." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map(ev => {
            const open = isCheckinWindowOpen(ev);
            const win = checkinWindow(ev);
            const startsAt = ev.starts_at ? new Date(ev.starts_at) : null;
            return (
              <button
                key={ev.id}
                disabled={!open}
                onClick={() => open && go("scan-event", ev)}
                className="fcard"
                style={{
                  textAlign: "left", padding: 16, border: "1px solid var(--border)", background: "var(--surface)",
                  opacity: open ? 1 : 0.5, cursor: open ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{ev.title || "Untitled event"}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                    {startsAt ? startsAt.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Date TBD"}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap", color: open ? "#1f9d57" : "var(--ink-3)", background: open ? "rgba(31,157,87,0.1)" : "var(--field)" }}>
                  {open ? "Open now" : win ? `Opens ${win.opensAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : "Not scheduled"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ScanEventPage({ ev, go }) {
  useEffect(() => {
    if (!ev || !isCheckinWindowOpen(ev)) go("scan");
  }, [ev]);

  if (!ev || !isCheckinWindowOpen(ev)) return null;

  return (
    <div className="scroll" style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("scan")} style={{ marginBottom: 14 }}>&larr; Back to Scan</button>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{ev.title || "Untitled event"}</h2>
      {ev.location_type === 'online' || ev.online ? (
        <div className="fcard fcard-pad" style={{ textAlign: "center", color: "var(--ink-2)", padding: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>This is an online event.</h3>
          <p style={{ fontSize: 13 }}>There is nothing to scan.</p>
        </div>
      ) : (
        <VerifyTicketPanel eventId={ev.id} onCheckedIn={() => {}} />
      )}
    </div>
  );
}

Object.assign(window, { MyTickets, AllTickets, TicketDetail, ClaimFlow, TicketQR, VerifyTicketPanel, ScanHub, ScanEventPage });
