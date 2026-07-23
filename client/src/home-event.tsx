import React, { useState, useEffect } from 'react';
import { FEATURED, ME } from './home-data';
import { CheckoutModal } from './checkout_modal';
import { HtmlRenderer } from './components/HtmlRenderer';
import { Avatar, Grain } from './home-icons';
import { Waitlist } from './home-waitlist';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — Event detail (Luma-grade)
   ============================================================ */

function EventDetail({ ev, st, go }) {
  const [fetchedEvent, setFetchedEvent] = useState<any>(null);
  let e = fetchedEvent || ev || FEATURED;

  // Normalize if it's a database event
  if (e && (e.starts_at || typeof e.venue === 'object')) {
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    const priceVal = e.price || (e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : ((e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : '—'));

    e = {
      ...e,
      desc: e.description || e.desc,
      cover: e.cover || meta.cover || "",
      cat: e.category || meta.category || e.cat || "General",
      type: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
      online: e.location_type === 'online',
      month,
      day,
      date: dateStr,
      time,
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
      city: e.city || (e.location_type === 'online' ? 'Online' : (venueObj.address ? venueObj.address.split(',').pop().trim() : '')),
      going: e.going || 0,
      cap: e.capacity_total || e.cap || 9999,
      price: priceVal,
      host: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostName || e.host || ME.name || "Organizer"),
      hostBy: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostName || e.hostBy || ME.name || "Organizer"),
      hostPhoto: typeof e.host === 'object' && e.host !== null ? (e.host.photo || "") : (e.hostPhoto || ""),
      hostBanner: typeof e.host === 'object' && e.host !== null ? (e.host.banner || "") : (e.hostBanner || ""),
      attendees: e.attendees || []
    };
  } else if (e) {
    // If it's a standard/hardcoded event but has venue as object
    if (typeof e.venue === 'object' && e.venue !== null) {
      e = {
        ...e,
        venue: e.venue.name || e.venue.address || 'Venue TBD'
      };
    }
  }

  const [liveEvent, setLiveEvent] = useState(e);
  e = liveEvent; // Override local 'e' so the rest of the component is reactive
  const UUID_RE_H = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  useEffect(() => {
    if (!e.id || !UUID_RE_H.test(e.id)) return;
    const tok = localStorage.getItem('token');
    fetch(`${apiBase}/api/events/${e.id}`, {
      headers: tok ? { 'Authorization': `Bearer ${tok}` } : {}
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.event) {
          setFetchedEvent({
            ...data.data.event,
            tickets: data.data.tickets || []
          });
        }
      })
      .catch(() => {});
  }, [e.id]);

  const { wishlisted, toggleWishlist, registered, register, city, waitlisted } = st;
  const isSaved = wishlisted ? wishlisted.has(e.id) : false;
  const isReg = registered.has(e.id) && e.bookingStatus !== 'cancelled';
  const isWaitlisted = (waitlisted ? waitlisted.has(e.id) : false) || (st.joinedEvents?.some(je => je.id === e.id && je.bookingStatus === 'waitlisted') ?? false);
  const isSoldOut = e.going >= (e.cap || 9999) || e.id === "ev-feat";

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const fetchEventData = () => {
    if (!liveEvent.id || liveEvent.id === "ev-feat") return;
    const tok = localStorage.getItem('token');
    fetch(`${apiBase}/api/events/${liveEvent.id}`, {
      headers: tok ? { 'Authorization': `Bearer ${tok}` } : {}
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.event) {
          const srv = data.data.event;
          setLiveEvent(prev => ({
            ...prev,
            going: srv.going ?? prev.going,
            cap: srv.cap ?? prev.cap,
            title: srv.title ?? prev.title,
            description: srv.description ?? prev.description,
            venue: srv.location_type === 'online' ? 'Online' : (typeof srv.venue === 'object' && srv.venue !== null ? (srv.venue.name || srv.venue.address) : 'Venue TBD')
          }));
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    fetchEventData();
  }, [e.id]);

  const chatSettings = st.chatSettings || {
    allowSiteMessaging: true,
    allowDirectMessaging: true,
    allowGroupChat: true,
    allowEventChat: true
  };
  const showChatButton = chatSettings.allowSiteMessaging !== false && (
    chatSettings.allowDirectMessaging ||
    (chatSettings.allowGroupChat || chatSettings.allowEventChat)
  );

  const priceStr = e.price || "₹500";
    const rawTiers = (e.tickets && e.tickets.length > 0)
      ? e.tickets.filter((t: any) => !t.visibility || t.visibility === 'public')
      : null;

  const tiers = rawTiers 
    ? rawTiers.map((t: any) => {
        const isFree = t.price_minor === 0 || t.price_amount_minor === 0 || (!t.price_minor && !t.price_amount_minor);
        const priceVal = isFree ? 0 : (t.price_minor || t.price_amount_minor || 0);
        return {
            id: t.id,
            n: t.name,
            d: t.description || (isFree ? "Free entry" : "Standard entry"),
            p: isFree ? "Free" : `₹${(priceVal / 100).toFixed(0)}`,
            free: isFree,
            isFull: t.isFull,
            capacity: t.capacity || null,
            remaining: t.remaining !== undefined ? t.remaining : null,
            maxPerBooking: t.max_per_booking || null,
            desc: t.description || "",
            salesEndAt: t.sales_end_at || t.salesEndAt || null
        };
      })
    : (e.type === "Free"
      ? [{ id: "rsvp", n: "General RSVP", d: "Free entry · approval-based", p: "Free", free: true, isFull: false, desc: "Free entry · approval-based", salesEndAt: null, capacity: null, remaining: null }]
      : [
        { id: "early", n: "Early Bird", d: "Limited · ends Jun 14", p: priceStr, early: true, free: false, isFull: false, desc: "Limited early bird access", salesEndAt: "2026-06-14T23:59:59.000Z", capacity: null, remaining: null },
        { id: "std", n: "General Admission", d: "Standard entry", p: priceStr.replace(/\d+/, m => String(Math.round(+m * 1.4))), free: false, isFull: false, desc: "General admission access to the event", salesEndAt: null, capacity: null, remaining: null },
        { id: "vip", n: "VIP · Front tables", d: "Reserved seating + drink", p: priceStr.replace(/\d+/, m => String(Math.round(+m * 2.2))), free: false, isFull: false, desc: "Exclusive VIP tables and reserved seating + complimentary drinks", salesEndAt: null, capacity: null, remaining: null },
      ]);

  const [tier, setTier] = useState<string | null>(e.type === "Free" ? (tiers[0]?.id || null) : null);
  const [qty, setQty] = useState(1);
  const [showTicketPopup, setShowTicketPopup] = useState(false);
  const [expandedTicketDetails, setExpandedTicketDetails] = useState<Record<string, boolean>>({});

  const sel = tier ? tiers.find(t => t.id === tier) : null;
  const evtCap = liveEvent.cap || e.cap;
  const evtGoing = liveEvent.going || e.going;
  const pct = evtCap ? Math.min(100, Math.round((evtGoing / evtCap) * 100)) : 0;

  const attendees = liveEvent.attendees || ["Dev K", "Mira S", "Leo P", "Zoya N", "Sam K", "Riya T"];

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [localStatus, setLocalStatus] = useState(e.status || "published");
  const isEnded = liveEvent.ends_at ? new Date(liveEvent.ends_at) < new Date() : (liveEvent.starts_at ? new Date(liveEvent.starts_at) < new Date() : false);
  const displayStatus = isEnded ? 'completed' : localStatus;

  React.useEffect(() => {
    if (window.io && liveEvent.id && liveEvent.id !== "ev-feat") {
      const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
      const socket = window.io(socketUrl, { transports: ['websocket'] });
      
      socket.emit('join_event', liveEvent.id);
      
      socket.on('event_completed', (payload) => {
        if (payload.eventId !== liveEvent.id) return;
        setLocalStatus('completed');
      });

      socket.on('capacity_updated', (payload) => {
        if (payload.eventId === liveEvent.id) fetchEventData();
      });

      socket.on('events_updated', (payload) => {
        if (payload.eventId === liveEvent.id) fetchEventData();
      });

      socket.on('dashboard_updated', (payload) => {
        if (payload.eventId === liveEvent.id) fetchEventData();
      });

      return () => {
        socket.emit('leave_event', liveEvent.id);
        socket.disconnect();
      };
    }
  }, [liveEvent.id]);
  
  if (e.id === "ev-feat") {
    // If it's the featured placeholder and doesn't have an ID, sharing might not work well
  }

  return (
    <div className="scroll">
      <div className="view-enter">
        <div className="detail-cover" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
          <Grain /><div className="scrim" />
          <button className="detail-back" onClick={() => { if (e.id === "new") { go("create-event"); } else { go("back"); } }}><I.arrowL />Back</button>
          <div className="detail-actions-top">
            <button className={`cbtn ${isSaved ? "on" : ""}`} onClick={() => toggleWishlist(e.id, e.wishlistCount)}>{isSaved ? <I.bookmarkF /> : <I.bookmark />}</button>
            <div style={{ position: "relative" }}>
              <button className="hbtn hbtn--ghost hbtn--sm" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => setShowShareSheet(!showShareSheet)}><I.share /> Share</button>
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
                            } catch (e) {
                              console.error(e);
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
          </div>
        </div>

        <div className="ev-detail">
          <div className="ev-head">
            <div className="card-top">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
                }}>
                  {/* 
                    NOTE: Inline useState/useEffect causes React hook violations inside mapped items. 
                    Categories should be fetched once in the parent component and passed down. 
                    Using a static icon for now to prevent application crashes.
                  */}
                  {'📅'}
                </div>
                <div className="tags" style={{ margin: 0 }}>
                  {e.cat && (
                    <span className="fchip on" style={{ pointerEvents: "none", textTransform: 'capitalize' }}>{e.cat}</span>
                  )}
                  <span className="fchip" style={{ pointerEvents: "none" }}>
                    {e.online ? <><I.online style={{ width: 14, height: 14 }} /> Online</> : <><I.pin style={{ width: 14, height: 14 }} /> {e.city || city}</>}
                  </span>
                  <span className="fchip" style={{ pointerEvents: "none" }}>
                    <I.ticket style={{ width: 14, height: 14 }} /> {e.type || ((e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : (e.cash_enabled ? 'Cash' : 'Paid'))}
                  </span>
                </div>
              </div>
            </div>
            <div className="ttl">{e.title}</div>
              <div 
                className="ev-host"
                style={{ cursor: e.hostUserId || e.hosted_by_entity_id || e.host_entity_id ? 'pointer' : 'default' }}
                onClick={() => {
                  if (e.hostType === 'group' && (e.hosted_by_entity_id || e.host_entity_id)) {
                    go("group", { id: e.hosted_by_entity_id || e.host_entity_id });
                  } else if (e.hostUserId) {
                    go("public-profile", { id: e.hostUserId });
                  }
                }}
              >
                <Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={34} />
                Hosted by <b className="host-link">{e.host}</b>
              </div>
            </div>
          </div>

          <div className="ev-cols">
            <div className="ev-main">
              <div className="ev-block">
                <div className="ev-when">
                  <div className="ev-fact"><span className="ico"><I.cal /></span><div><div className="k">Date</div><div className="v">{e.date}</div><div className="v2">{e.time}</div></div></div>
                  <div className="ev-fact"><span className="ico">{e.online ? <I.online /> : <I.pin />}</span><div><div className="k">{e.online ? "Location" : "Venue"}</div><div className="v">{e.venue}</div><div className="v2">{e.online ? "Link revealed after registration" : e.city}</div></div></div>
                </div>
              </div>

              <div className="ev-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>About this event</h3>
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
                                  } catch (e) {
                                    console.error(e);
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
                </div>
                <div className="ev-about">
                  {e.desc ? <HtmlRenderer content={e.desc} /> : <p>Join us for an unforgettable evening bringing together the most interesting people in the city. Whether you're here to learn, connect, or simply enjoy the atmosphere — there's a place for you.</p>}
                  <p>Expect curated conversations, a welcoming community, and the kind of serendipity that only happens in the same room. Doors open 30 minutes early — come say hi.</p>
                </div>
              </div>

              {!e.online && e.venue && (
                <div className="ev-block">
                  <h3>Location</h3>
                  <div className="ev-map">
                    <iframe
                      title="Event location map"
                      width="100%"
                      height="100%"
                      style={{ border: 0, display: "block" }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        e.venue && e.city && e.venue.toLowerCase().includes(e.city.toLowerCase())
                          ? e.venue
                          : `${e.venue}${e.city ? ", " + e.city : ""}`
                      )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      allowFullScreen
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13.5, color: "var(--ink-2)" }}>
                    <I.pin style={{ color: "var(--accent-2)" }} /> {
                      e.venue && e.city && e.venue.toLowerCase().includes(e.city.toLowerCase())
                        ? e.venue
                        : `${e.venue}${e.city ? ", " + e.city : ""}`
                    }
                    <a 
                      className="hbtn hbtn--ghost hbtn--sm" 
                      style={{ marginLeft: "auto", textDecoration: "none" }}
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        e.venue && e.city && e.venue.toLowerCase().includes(e.city.toLowerCase())
                          ? e.venue
                          : `${e.venue}${e.city ? ", " + e.city : ""}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get directions
                    </a>
                  </div>
                </div>
              )}

              <div className="ev-block">
                <h3>{e.going} attending</h3>
                <div className="att-grid">
                  {attendees.map((n, index) => {
                    const name = typeof n === 'object' ? (n.name || n.display_name) : n;
                    const userId = typeof n === 'object' ? n.id : undefined;
                    const picture = typeof n === 'object' ? n.picture : undefined;
                    return (
                      <div key={`${name}-${index}`} className="att">
                        <Avatar name={name} userId={userId} img={picture} size={28} />
                        <span className="nm">{name}</span>
                      </div>
                    );
                  })}
                  <div className="att" style={{ paddingRight: 14 }}><div className="av" style={{ width: 28, height: 28, fontSize: 11, background: "var(--surface-2)", color: "var(--ink-2)" }}>+{Math.max(0, e.going - attendees.length)}</div><span className="nm">more</span></div>
                </div>
              </div>
              {isWaitlisted && displayStatus !== 'completed' && (
                <div style={{ marginTop: 20 }}>
                  <Waitlist ev={e} st={st} go={go} />
                </div>
              )}
            </div>

            {/* Ticket sidebar */}
            <div className="ev-aside">
              <div className="ticket-box" style={{
                  position: 'relative',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 22,
                  padding: '28px 24px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
              }}>
                {/* Ticket Icon Badge */}
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.1))',
                  border: '1px solid rgba(168,85,247,0.2)',
                  boxShadow: '0 4px 12px rgba(168,85,247,0.12)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  marginBottom: 18,
                }}>
                  <I.ticket style={{ width: 22, height: 22, color: '#a855f7' }} />
                </div>

                {/* Heading */}
                <h2 style={{
                  color: 'var(--ink)',
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '0 0 6px 0',
                  textAlign: 'center',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2,
                }}>Ready to Join?</h2>

                {/* Subtitle */}
                <p style={{
                  color: 'var(--ink-3)',
                  fontSize: 13.5,
                  margin: '0 0 24px 0',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  maxWidth: 220,
                }}>Book your tickets securely in just a few clicks.</p>

                {/* Ticket type selector & quantity */}
                <div style={{ width: '100%' }}>
                {e.type !== "Free" && (
                  <div style={{ marginBottom: 14 }}>
                    {!tier ? (
                      <button
                        className="hbtn hbtn--soft hbtn--block"
                        onClick={() => setShowTicketPopup(true)}
                        style={{ justifyContent: 'center', fontWeight: 600, height: 44, borderRadius: 10 }}
                      >
                        🎟 Select Ticket
                      </button>
                    ) : (
                      <div
                        onClick={() => setShowTicketPopup(true)}
                        style={{
                          background: 'var(--surface-2)', padding: '11px 14px', borderRadius: 10,
                          border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', cursor: 'pointer', transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{sel?.n}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sel?.p}</div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Change</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="ticket-foot" style={{ padding: 0 }}>
                  {e.type !== "Free" && (
                    <div className="qty" style={{ marginBottom: 16 }}>
                      <span className="lbl">Quantity</span>
                      <div className="stepper">
                        <button onClick={() => setQty(q => Math.max(1, q - 1))}>–</button>
                        <span className="n">{qty}</span>
                        <button onClick={() => setQty(q => Math.min(sel?.maxPerBooking || 10, q + 1))}>+</button>
                      </div>
                    </div>
                  )}
                  {displayStatus === 'completed' && (
                    <div style={{ padding: 12, background: "rgba(34,197,94,0.1)", color: "var(--accent-1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, textAlign: "center", fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <I.cal /> EVENT IS ENDED
                    </div>
                  )}
                  {displayStatus !== 'completed' && (
                    isReg || e.bookingStatus === 'confirmed' ? (
                      <button className="hbtn hbtn--ghost hbtn--block" style={{ color: "var(--accent-2)", borderRadius: 14 }} onClick={() => go("events")}>
                        <I.check />You're registered (View Ticket)
                      </button>
                    ) : e.bookingStatus === 'pending_payment' ? (
                      <button className="hbtn hbtn--soft hbtn--block" disabled style={{ borderRadius: 14 }}>
                        Pending Approval
                      </button>
                    ) : e.bookingStatus === 'pending_approval' ? (
                      <button className="hbtn hbtn--soft hbtn--block" disabled style={{ borderRadius: 14 }}>
                        Pending Approval
                      </button>
                    ) : isSoldOut ? (
                      isWaitlisted ? (
                        <button className="hbtn hbtn--soft hbtn--block" style={{ color: "var(--accent-2)", borderRadius: 14 }} onClick={() => go("waitlist", e)}>
                          <I.users /> View Waitlist Status
                        </button>
                      ) : (
                        <button className="hbtn hbtn--primary hbtn--block" style={{ borderRadius: 14 }} onClick={() => { st.toggleWaitlist(e.id); go("waitlist", e); }}>
                          Join Waitlist
                        </button>
                      )
                    ) : (
                      <button
                        disabled={e.type !== "Free" && !tier}
                        onClick={() => { register(e.id, false, { ticketTypeId: tier, qty, ticketName: sel?.n }); go("events"); }}
                        style={{
                          width: '100%',
                          background: (e.type !== "Free" && !tier) ? 'var(--surface-3)' : 'linear-gradient(90deg, #FF7A6B 0%, #D95CF5 50%, #6B63FF 100%)',
                          border: 'none',
                          borderRadius: 16,
                          height: 54,
                          fontSize: 15.5,
                          fontWeight: 600,
                          color: '#fff',
                          cursor: (e.type !== "Free" && !tier) ? 'not-allowed' : 'pointer',
                          opacity: (e.type !== "Free" && !tier) ? 0.5 : 1,
                          boxShadow: (e.type !== "Free" && !tier) ? 'none' : '0 4px 20px rgba(169, 92, 245, 0.35)',
                          transition: 'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          letterSpacing: '-0.1px',
                        }}
                        onMouseEnter={ev => {
                          if (e.type !== "Free" && !tier) return;
                          ev.currentTarget.style.transform = 'translateY(-2px)';
                          ev.currentTarget.style.boxShadow = '0 8px 28px rgba(169, 92, 245, 0.45)';
                        }}
                        onMouseLeave={ev => {
                          if (e.type !== "Free" && !tier) return;
                          ev.currentTarget.style.transform = 'translateY(0)';
                          ev.currentTarget.style.boxShadow = '0 4px 20px rgba(169, 92, 245, 0.35)';
                        }}
                      >
                        {e.type === "Free" ? "Request to join" : `Get ${qty > 1 ? qty + " tickets" : "ticket"}`}
                        {e.type !== "Free" && tier && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        )}
                      </button>
                    )
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", marginTop: 14, fontSize: 11.5, color: "var(--ink-3)" }}>
                    <I.check style={{ width: 12, height: 12, color: "var(--accent-1)" }} />
                    {isSoldOut ? "Waitlist claim window: 15 mins" : e.type === "Free" ? "Approval-based · free" : "Secure checkout · instant ticket"}
                  </div>
                </div>
                </div>
              </div>

              {/* Ticket Selector Popup Modal */}
              {showTicketPopup && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', zIndex: 10000, padding: 16
                }}>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 16, width: '100%', maxWidth: 460, display: 'flex',
                    flexDirection: 'column', maxHeight: '80vh', boxShadow: 'var(--sh-lg)'
                  }}>
                    {/* Modal Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-2)' }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Select Ticket</h3>
                      <button 
                        onClick={() => setShowTicketPopup(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', fontSize: 20, cursor: 'pointer' }}
                      >
                        ×
                      </button>
                    </div>
                    {/* Modal Body */}
                    <div className="scroll" style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {tiers.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => {
                            if (!t.isFull) {
                              setTier(t.id);
                              setQty(q => t.maxPerBooking ? Math.min(q, t.maxPerBooking) : q);
                              setShowTicketPopup(false);
                            }
                          }}
                          style={{
                            background: 'var(--surface-2)', border: `1px solid ${tier === t.id ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column',
                            gap: 10, transition: 'all 0.2s', opacity: t.isFull ? 0.6 : 1,
                            cursor: t.isFull ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                <span>{t.n}</span>
                                {t.isFull && <span style={{ color: '#ef4444', fontSize: 11 }}>(Sold Out)</span>}
                                {!t.isFull && t.remaining !== null && t.remaining !== undefined && t.remaining > 0 && (
                                  <span style={{ 
                                    color: '#f59e0b', 
                                    fontSize: 11, 
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    display: 'inline-block'
                                  }}>
                                    {t.remaining} left
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginTop: 2 }}>{t.p}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button 
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  setExpandedTicketDetails(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                                }}
                                style={{
                                  background: 'transparent', border: 'none', color: 'var(--accent)',
                                  fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 0'
                                }}
                              >
                                {expandedTicketDetails[t.id] ? 'Less Info' : 'More Info'}
                              </button>
                            </div>
                          </div>
                          {expandedTicketDetails[t.id] && (
                            <div style={{ borderTop: '1px solid var(--border-2)', paddingTop: 10, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ color: 'var(--ink-2)' }}><strong style={{ color: 'var(--ink)' }}>Name:</strong> {t.n}</div>
                              {t.desc && <div style={{ color: 'var(--ink-2)' }}><strong style={{ color: 'var(--ink)' }}>Description:</strong> {t.desc}</div>}
                              <div style={{ color: 'var(--ink-2)' }}><strong style={{ color: 'var(--ink)' }}>Price:</strong> {t.p}</div>
                              {t.salesEndAt && (
                                <div style={{ color: 'var(--ink-2)' }}>
                                  <strong style={{ color: 'var(--ink)' }}>End Date:</strong> {new Date(t.salesEndAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="host-card">
                 <div className="hh"><Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={46} /><div><div className="n">{e.host}</div><div className="r">Organizer · 24 events</div></div></div>
                <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss a drop.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}


