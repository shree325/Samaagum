import React, { useState, useEffect } from 'react';
import { I, Avatar, Grain } from './home-icons';
import { FEATURED, ME } from './home-data';
import { Waitlist } from './home-waitlist';
import { CheckoutModal } from './checkout_modal';
import { ClaimFlow } from './home-tickets';

export function JoinEventPage({ ev, st, go }) {
    const [fetchedEvent, setFetchedEvent] = useState<any>(null);
    const [showClaimPopup, setShowClaimPopup] = useState(false);
    const [claimAlreadyClaimed, setClaimAlreadyClaimed] = useState(false);
    let e = fetchedEvent || ev || FEATURED;
    const claimToken = ev?.claimToken;
    const apiBaseJ = window.location.port === "8080" ? "http://localhost:3000" : "";

    // Check on load if this claim token has already been used
    useEffect(() => {
        if (!claimToken) return;
        fetch(`${apiBaseJ}/api/tickets/claim/${claimToken}`)
            .then(r => r.json())
            .then(res => {
                if (res.claimed === true) {
                    setClaimAlreadyClaimed(true);
                }
            })
            .catch(() => {});
    }, [claimToken]);

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
        let priceVal = '—';
        if (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') {
            priceVal = 'Free';
        } else if (e.tickets && e.tickets.length > 0) {
            const prices = e.tickets.map(t => t.price_minor ? t.price_minor / 100 : (t.price_amount_minor ? t.price_amount_minor / 100 : 0));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            if (minPrice === maxPrice) {
                priceVal = minPrice === 0 ? 'Free' : `₹${minPrice.toFixed(0)}`;
            } else {
                priceVal = `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
            }
        }

        e = {
            ...e,
            desc: e.description || e.desc,
            cover: e.cover || meta.cover || "",
            cat: meta.category || e.cat || "General",
            instructions: e.instruction || e.instructions || meta.instructions || "",
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
        if (typeof e.venue === 'object' && e.venue !== null) {
            e = {
                ...e,
                venue: e.venue.name || e.venue.address || 'Venue TBD'
            };
        }
    }

    const [liveEvent, setLiveEvent] = useState(e);
    const { wishlisted, toggleWishlist, register, city, waitlisted, fetchJoinedEvents } = st;
    const isWishlisted = wishlisted ? wishlisted.has(liveEvent.id) : false;
    const isWaitlisted = liveEvent.bookingStatus === 'waitlisted' || 
        (liveEvent.bookingStatus !== 'cancelled' && 
         liveEvent.bookingStatus !== 'confirmed' && 
         liveEvent.bookingStatus !== 'pending_approval' && 
         liveEvent.bookingStatus !== 'pending_payment' && 
         ((waitlisted ? waitlisted.has(liveEvent.id) : false) || 
          (st.joinedEvents?.some(je => je.id === liveEvent.id && je.bookingStatus === 'waitlisted') ?? false)));
    const isSoldOut = liveEvent.going >= (liveEvent.cap || 9999) || liveEvent.id === "ev-feat";
    const [regStatus, setRegStatus] = useState(() => {
        let s = liveEvent.registrationStatus || liveEvent.registration_status || "OPEN";
        if (s === "SCHEDULED" && liveEvent.registration_opens_at) {
            if (new Date() >= new Date(liveEvent.registration_opens_at)) {
                s = "OPEN";
            }
        }
        if (s !== "CLOSED" && liveEvent.registration_closes_at) {
            if (new Date() >= new Date(liveEvent.registration_closes_at)) {
                s = "CLOSED";
            }
        }
        return s;
    });
    const [waitlistEnabled, setWaitlistEnabled] = useState(
        liveEvent.settings?.capacity?.waitlist ?? liveEvent.waitlist ?? true
    );
    const isClosed = regStatus === "CLOSED";
    const isScheduled = regStatus === "SCHEDULED";
    const isEnded = liveEvent.ends_at ? new Date(liveEvent.ends_at) < new Date() : (liveEvent.starts_at ? new Date(liveEvent.starts_at) < new Date() : false);

    // Always fetch live registration status from server so the button state
    // reflects reality even if the card navigation data was stale.
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const UUID_RE_J = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const fetchEventData = () => {
        if (!liveEvent.id || !UUID_RE_J.test(liveEvent.id)) return;
        const tok = localStorage.getItem('token');
        fetch(`${apiBase}/api/events/${liveEvent.id}`, {
            headers: tok ? { 'Authorization': `Bearer ${tok}` } : {},
            cache: 'no-store'
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data?.event) {
                    const srv = data.data.event;
                    
                    const startsAt = srv.starts_at ? new Date(srv.starts_at) : null;
                    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
                    const day = startsAt ? startsAt.getDate().toString() : "TBD";
                    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
                    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

                    const venueObj = srv.venue || {};
                    const cityVal = srv.city || (srv.location_type === 'online' ? 'Online' : (venueObj.address ? venueObj.address.split(',').pop().trim() : ''));
                    const venueVal = srv.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD');

                    setLiveEvent(prev => ({
                        ...prev,
                        ...srv,
                        going: data.data.attendees ? data.data.attendees.length : (srv.going ?? prev.going),
                        attendees: data.data.attendees || prev.attendees || [],
                        cap: srv.capacity_total ?? srv.cap ?? prev.cap,
                        cover: srv.cover ?? prev.cover,
                        title: srv.title ?? prev.title,
                        description: srv.description ?? prev.description,
                        settings: srv.settings ?? prev.settings,
                        month,
                        day,
                        date: dateStr,
                        time,
                        venue: venueVal,
                        city: cityVal,
                        online: srv.location_type === 'online',
                        type: (srv.registration_mode === 'free' || srv.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
                        bookingStatus: data.data.bookingStatus ?? null,
                        bookingId: data.data.bookingId ?? null,
                        attendeeId: data.data.attendeeId ?? null,
                        ticketId: data.data.ticketId ?? null,
                        qrToken: data.data.qrToken ?? null,
                        checkinStatus: data.data.checkinStatus ?? null
                    }));
                    let s = srv.registrationStatus || srv.registration_status || "OPEN";
                    if (s === "SCHEDULED" && srv.registration_opens_at) {
                        if (new Date() >= new Date(srv.registration_opens_at)) {
                            s = "OPEN";
                        }
                    }
                    if (s !== "CLOSED" && srv.registration_closes_at) {
                        if (new Date() >= new Date(srv.registration_closes_at)) {
                            s = "CLOSED";
                        }
                    }
                    const fetchedSrv = {
                        ...data.data.event,
                        tickets: data.data.tickets || []
                    };
                    setFetchedEvent(fetchedSrv);
                    setRegStatus(s);
                    
                    let settings = srv.settings || {};
                    if (typeof settings === 'string') {
                      try { settings = JSON.parse(settings); } catch {}
                    }
                    if (settings?.capacity?.waitlist !== undefined) {
                      setWaitlistEnabled(settings.capacity.waitlist);
                    }
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (regStatus === "SCHEDULED" && liveEvent.registration_opens_at) {
            const ms = new Date(liveEvent.registration_opens_at).getTime() - Date.now();
            if (ms > 0 && ms <= 2147483647) {
                const timer = setTimeout(() => {
                    setRegStatus("OPEN");
                }, ms);
                return () => clearTimeout(timer);
            } else if (ms <= 0) {
                setRegStatus("OPEN");
            }
        } else if (regStatus === "OPEN" && liveEvent.registration_closes_at) {
            const ms = new Date(liveEvent.registration_closes_at).getTime() - Date.now();
            if (ms > 0 && ms <= 2147483647) {
                const timer = setTimeout(() => {
                    setRegStatus("CLOSED");
                }, ms);
                return () => clearTimeout(timer);
            } else if (ms <= 0) {
                setRegStatus("CLOSED");
            }
        }
    }, [regStatus, liveEvent.registration_opens_at, liveEvent.registration_closes_at]);

    useEffect(() => {
        fetchEventData();
    }, [liveEvent.id]);

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
    const sourceTickets = fetchedEvent?.tickets || e.tickets;
    const currentType = liveEvent.type || e.type;
    const tiers = (sourceTickets && sourceTickets.length > 0)
        ? sourceTickets.filter((t: any) => !t.visibility || t.visibility === 'public').map((t: any) => {
            const isFree = t.price_minor === 0 || t.price_amount_minor === 0 || (!t.price_minor && !t.price_amount_minor);
            const priceVal = isFree ? 0 : (t.price_minor || t.price_amount_minor || 0);
            return {
                id: t.id,
                n: t.name,
                d: t.description || (isFree ? "Free entry" : "Standard entry"),
                p: isFree ? "Free" : `₹${(priceVal / 100).toFixed(0)}`,
                priceVal: priceVal,
                free: isFree,
                isFull: t.isFull,
                capacity: t.capacity || null,
                remaining: t.remaining !== undefined ? t.remaining : null,
                maxPerBooking: t.max_per_booking || null,
                desc: t.description || "",
                salesEndAt: t.sales_end_at || t.salesEndAt || null
            };
          })
        : (currentType === "Free"
            ? [{ id: "rsvp", n: "General RSVP", d: "Free entry · approval-based", p: "Free", free: true, capacity: null, remaining: null, desc: "Free entry · approval-based", salesEndAt: null }]
            : [{ id: "general", n: "General Admission", d: "Standard entry", p: e.price || "₹500", free: false, capacity: null, remaining: null, desc: "Standard entry", salesEndAt: null }]);
    const [selectedTickets, setSelectedTickets] = React.useState<Record<string, { ticketId: string; ticketName: string; price: number; qty: number; maxQty: number; remaining: number }>>({});
    const expandedTickets = Object.values(selectedTickets).flatMap(t => Array(t.qty).fill({ ticketTypeId: t.ticketId, ticketName: t.ticketName, price: t.price }));
    const totalQty = expandedTickets.length;
    const totalPrice = Object.values(selectedTickets).reduce((acc, t) => acc + (t.qty * t.price), 0);
    const [showTicketPopup, setShowTicketPopup] = useState(false);
    const [expandedTicketDetails, setExpandedTicketDetails] = useState<Record<string, boolean>>({});
    const [checkoutTransactionId, setCheckoutTransactionId] = useState('');
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                if (window.toast) window.toast("File is too large (max 5MB)", "warning");
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => {
                setCheckoutTransactionId(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const sel = null;
    const evtCap = liveEvent.cap || e.cap;
    const evtGoing = liveEvent.going || e.going;
    const pct = evtCap ? Math.min(100, Math.round((evtGoing / evtCap) * 100)) : 0;


    const attendees = liveEvent.attendees || e.attendees || ["Dev K", "Mira S", "Leo P", "Zoya N", "Sam K", "Riya T"];

  const [showShareSheet, setShowShareSheet] = useState(false);
  const [localStatus, setLocalStatus] = useState(e.status || "published");

  React.useEffect(() => {
    if (window.io && e.id && e.id !== "ev-feat") {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
      const socket = window.io(socketUrl, { transports: ['websocket'] });
      
      socket.emit('join_event', e.id);
      
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
      
      socket.on('ticket_updated', (payload) => {
          if (payload.eventId === liveEvent.id) {
              fetchEventData();
              if (payload.counts.active > 0) {
                  setLiveEvent((prev: any) => ({ ...prev, bookingStatus: 'confirmed' }));
              } else if (payload.counts.pending > 0) {
                  setLiveEvent((prev: any) => ({ ...prev, bookingStatus: 'pending_approval' }));
              } else {
                  setLiveEvent((prev: any) => ({ ...prev, bookingStatus: null }));
              }
          }
      });
      
      socket.on('my_events_updated', (payload) => {
          const data = payload?.data || payload;
          const allEvs = [
              ...(data?.joined || []),
              ...(data?.pending || []),
              ...(data?.upcoming || []),
              ...(data?.waitlist || []),
              ...(data?.cancelled || [])
          ];
          const match = allEvs.find((ev: any) => ev.id === liveEvent.id);
          if (match) {
              setLiveEvent((prev: any) => ({ ...prev, bookingStatus: match.bookingStatus }));
          } else {
              setLiveEvent((prev: any) => ({ ...prev, bookingStatus: null }));
          }
          if (fetchJoinedEvents) {
              fetchJoinedEvents();
          }
      });
      
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

      socket.on('waitlist_updated', (payload) => {
        if (payload.eventId === liveEvent.id) fetchEventData();
      });

      return () => {
        socket.emit('leave_event', liveEvent.id);
        socket.disconnect();
      };
    }
  }, [liveEvent.id]);
  
  if (e.id === "ev-feat") {
    // skip
  }

    return (
        <div className="scroll">
            <div className="view-enter">
                <div className="detail-cover" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
                    <Grain /><div className="scrim" />
                    <button className="detail-back" onClick={() => { go("back"); }}><I.arrowL />Back</button>
                    <div className="detail-actions-top">
                        {!liveEvent.bookingStatus && (
                            <button className={`cbtn ${isWishlisted ? "on" : ""}`} onClick={() => toggleWishlist && toggleWishlist(liveEvent.id, liveEvent.wishlistCount)}>{isWishlisted ? <I.heartF /> : <I.heart />}</button>
                        )}
                        <div style={{ position: "relative" }}>
                            <button className="hbtn hbtn--ghost hbtn--sm" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => setShowShareSheet(!showShareSheet)}><I.share /> Share</button>
                            {showShareSheet && (
                                <>
                                    <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setShowShareSheet(false)} />
                                    <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, display: "flex", gap: 8, padding: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--sh-md)", zIndex: 9999 }}>
                                        {(() => {
                                            const link = encodeURIComponent(`${window.location.origin}${window.location.pathname}#event=${e.id}`);
                                            const msg = encodeURIComponent(`Join me at ${liveEvent.title} on Samaagum! ${decodeURIComponent(link)}`);
                                            const subject = encodeURIComponent(`Invitation to ${liveEvent.title}`);
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
                    </div>
                </div>

                <div className="ev-detail">
                    <div className="ev-head">
                        <div className="card-top">
                            <div className="tags">
                                <span className="fchip on" style={{ pointerEvents: "none" }}>{liveEvent.cat}</span>
                                <span className="fchip" style={{ pointerEvents: "none" }}>{liveEvent.online ? <><I.online style={{ width: 14, height: 14 }} /> Online</> : <><I.pin style={{ width: 14, height: 14 }} /> {liveEvent.city || city}</>}</span>
                                <span className="fchip" style={{ pointerEvents: "none" }}>{liveEvent.type}</span>
                            </div>
                            <div className="ttl">{e.title}</div>
                             <div 
                                 className="ev-host"
                                 style={{ cursor: e.hostUserId || e.hosted_by_entity_id || e.host_entity_id ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}
                                 onClick={() => {
                                     if (e.hostType === 'group' && (e.hosted_by_entity_id || e.host_entity_id)) {
                                         go("group", { id: e.hosted_by_entity_id || e.host_entity_id });
                                     } else if (e.hostUserId) {
                                         go("public-profile", { id: e.hostUserId, displayName: e.hostBy || e.host, profilePhoto: e.hostPhoto });
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
                                    <div className="ev-fact"><span className="ico"><I.cal /></span><div><div className="k">Date</div><div className="v">{liveEvent.date}</div><div className="v2">{liveEvent.time}</div></div></div>
                                    <div className="ev-fact"><span className="ico">{liveEvent.online ? <I.online /> : <I.pin />}</span><div><div className="k">{liveEvent.online ? "Location" : "Venue"}</div><div className="v">{liveEvent.venue}</div><div className="v2">{liveEvent.online ? "Link revealed after registration" : liveEvent.city}</div></div></div>
                                </div>
                            </div>

                            <div className="ev-block">
                                <h3>About this event</h3>
                                <div className="ev-about">
                                    <p>{liveEvent.desc || "Join us for an unforgettable evening bringing together the most interesting people in the city. Whether you're here to learn, connect, or simply enjoy the atmosphere — there's a place for you."}</p>
                                    <p>Expect curated conversations, a welcoming community, and the kind of serendipity that only happens in the same room. Doors open 30 minutes early — come say hi.</p>
                                </div>
                            </div>

                            {liveEvent.instructions && (
                                <div className="ev-block" style={{ background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px", marginBottom: "20px" }}>
                                    <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 700 }}>📢 Special Instructions</h3>
                                    <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)" }}>{liveEvent.instructions}</p>
                                </div>
                            )}

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
                                        <I.pin style={{ color: "var(--accent-2)" }} /> {liveEvent.venue}, {liveEvent.city} <button className="hbtn hbtn--ghost hbtn--sm" style={{ marginLeft: "auto" }}>Get directions</button>
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
                                <h3>{liveEvent.going} attending</h3>
                                <div className="att-grid">
                                    {attendees.map((n, i) => {
                                        const name = typeof n === 'object' ? (n.name || n.display_name) : n;
                                        const userId = typeof n === 'object' ? n.id : undefined;
                                        const picture = typeof n === 'object' ? n.picture : undefined;
                                        return (
                                            <div 
                                                key={`${userId || name || 'u'}-${i}`} 
                                                className="att"
                                                style={{ cursor: userId ? 'pointer' : 'default' }}
                                                onClick={() => {
                                                    if (userId) {
                                                        go("public-profile", { id: userId, displayName: name, profilePhoto: picture });
                                                    }
                                                }}
                                            >
                                                <Avatar name={name} userId={userId} img={picture} size={28} />
                                                <span className="nm">{name}</span>
                                            </div>
                                        );
                                    })}
                                    {liveEvent.going > attendees.length && (
                                        <div className="att" style={{ paddingRight: 14 }}><div className="av" style={{ width: 28, height: 28, fontSize: 11, background: "var(--surface-2)", color: "var(--ink-2)" }}>+{liveEvent.going - attendees.length}</div><span className="nm">more</span></div>
                                    )}
                                </div>
                            </div>
                            {isWaitlisted && localStatus !== 'completed' && (
                                <div style={{ marginTop: 20 }}>
                                    <Waitlist ev={liveEvent} st={st} go={go} />
                                </div>
                            )}
                        </div>

                        {/* Ticket sidebar */}
                        <div className="ev-aside">
                            {claimToken && !claimAlreadyClaimed ? (
                                <div className="ticket-box" style={{ padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                                        <I.ticket style={{ width: 24, height: 24 }} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18 }}>You've received a ticket!</h3>
                                    <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.4 }}>
                                        A ticket has been approved for you. Verify your email to claim it and add it to your account.
                                    </p>
                                    {/* Blurred ticket placeholder */}
                                    <div style={{ position: 'relative', width: '100%', marginTop: 4 }}>
                                        <div style={{
                                            background: 'var(--surface-2)', padding: '24px 14px', borderRadius: 8,
                                            border: '1px dashed var(--border)', display: 'flex', justifyContent: 'center',
                                            alignItems: 'center', width: '100%',
                                            filter: 'blur(4px)', opacity: 0.5, userSelect: 'none'
                                        }}>
                                            <I.ticket style={{ width: 40, height: 40, opacity: 0.5 }} />
                                        </div>
                                        <button
                                            className="hbtn hbtn--primary hbtn--block"
                                            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '85%', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}
                                            onClick={() => setShowClaimPopup(true)}
                                        >
                                            🎟 Claim Your Ticket
                                        </button>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)' }}>
                                        Your ticket is waiting. Verify your email to unlock it.
                                    </p>
                                </div>
                            ) : (isClosed || isScheduled) && (!liveEvent.bookingStatus || liveEvent.bookingStatus === 'cancelled') ? (
                                <div className="ticket-box" style={{ padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--surface-3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)" }}>
                                        {isScheduled ? <I.clock style={{ width: 24, height: 24 }} /> : <I.lock style={{ width: 24, height: 24 }} />}
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: 18 }}>{isScheduled ? "Coming Soon" : "Registration Closed"}</h3>
                                    <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.4 }}>
                                        {isScheduled 
                                            ? "Registration for this event will open soon. Save the event to be notified." 
                                            : "The host has closed registration for this event."}
                                    </p>
                                    <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: 8 }} onClick={() => toggleWishlist && toggleWishlist(liveEvent.id, liveEvent.wishlistCount)}>
                                        {isWishlisted ? <I.heartF /> : <I.heart />} {isWishlisted ? "Wishlisted" : "Save for later"}
                                    </button>
                                </div>
                            ) : (
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

                                    <div style={{ width: '100%' }}>
                                    <div className="ticket-foot" style={{ padding: 0 }}>
                                        {localStatus === 'completed' && (
                                            <div style={{ padding: 12, background: "rgba(34,197,94,0.1)", color: "var(--accent-1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, textAlign: "center", fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                <I.cal /> EVENT COMPLETED
                                            </div>
                                        )}
                                        {localStatus !== 'completed' && (
                                            liveEvent.bookingStatus === 'confirmed' ? (
                                                <button className="hbtn hbtn--block" onClick={() => go("event", liveEvent)} style={{ background: "#1f9d57", color: "#fff", borderRadius: 14 }}>
                                                    <I.check style={{ marginRight: 6 }} /> Get Ticket
                                                </button>
                                            ) : liveEvent.bookingStatus === 'waitlisted' ? (
                                                <button className="hbtn hbtn--soft hbtn--block" style={{ color: "var(--accent-2)", borderRadius: 14 }} onClick={() => go("waitlist", liveEvent)}>
                                                    <I.users /> View Waitlist Status
                                                </button>
                                            ) : liveEvent.bookingStatus === 'pending_approval' ? (
                                                <button className="hbtn hbtn--soft hbtn--block" disabled style={{ borderRadius: 14 }}>
                                                    Pending Approval
                                                </button>
                                            ) : liveEvent.bookingStatus === 'pending_payment' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                    <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, fontSize: 13, color: '#f59e0b', lineHeight: 1.5 }}>
                                                        <strong>Awaiting Payment Verification</strong> — Your request has been submitted. The host will review and confirm once payment is received.
                                                    </div>
                                                    <button className="hbtn hbtn--soft hbtn--block" disabled style={{ borderRadius: 14, opacity: 0.6 }}>
                                                        Pending Approval
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Cash Payment: Show payment instructions & Transaction ID input upfront */}
                                                    {liveEvent.cash_enabled && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                                                            <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
                                                                <strong>Cash Payment Required</strong> – Please check the event description for payment details and complete the payment before submitting.
                                                            </div>
                                                            {(() => {
                                                                const settingsObj = liveEvent.settings || {};
                                                                const allowImg = settingsObj.allow_image_proof === true;
                                                                return (
                                                                    <>
                                                                        {allowImg ? (
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                                                <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Submit Transaction ID or Upload Proof:</div>
                                                                                <input
                                                                                    type="text"
                                                                                    className="cinput"
                                                                                    placeholder="Transaction ID / UTR (optional)"
                                                                                    value={checkoutTransactionId && !checkoutTransactionId.startsWith('data:') ? checkoutTransactionId : ''}
                                                                                    onChange={ev => setCheckoutTransactionId(ev.target.value)}
                                                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', fontSize: 13 }}
                                                                                />
                                                                                <label style={{ 
                                                                                    display: 'flex', 
                                                                                    alignItems: 'center', 
                                                                                    justifyContent: 'center', 
                                                                                    gap: 8, 
                                                                                    padding: '10px 12px', 
                                                                                    background: checkoutTransactionId.startsWith('data:') ? 'var(--green)' : 'var(--surface)', 
                                                                                    border: checkoutTransactionId.startsWith('data:') ? 'none' : '1px solid var(--border)', 
                                                                                    borderRadius: 8, 
                                                                                    fontSize: 13, 
                                                                                    fontWeight: 600, 
                                                                                    color: checkoutTransactionId.startsWith('data:') ? '#fff' : 'var(--ink-2)', 
                                                                                    cursor: 'pointer',
                                                                                    transition: 'all 0.2s'
                                                                                }}>
                                                                                    <I.image style={{ width: 16, height: 16 }} />
                                                                                    {checkoutTransactionId.startsWith('data:') ? 'Change Image' : 'Upload Image Proof'}
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/*"
                                                                                        onChange={handleImageChange}
                                                                                        style={{ display: 'none' }}
                                                                                    />
                                                                                </label>
                                                                                {checkoutTransactionId.startsWith('data:') && (
                                                                                    <div style={{ fontSize: 12, color: 'var(--accent-2)', fontWeight: 600, textAlign: 'center' }}>Image selected</div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                className="cinput"
                                                                                placeholder="Transaction ID / UTR (optional)"
                                                                                value={checkoutTransactionId}
                                                                                onChange={ev => setCheckoutTransactionId(ev.target.value)}
                                                                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)', fontSize: 13 }}
                                                                            />
                                                                        )}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                    {isEnded ? (
                                                        <button
                                                            style={{
                                                                width: '100%',
                                                                background: 'var(--surface-3)',
                                                                border: 'none',
                                                                borderRadius: 16,
                                                                height: 54,
                                                                fontSize: 15.5,
                                                                fontWeight: 600,
                                                                color: 'var(--ink-2)',
                                                                cursor: 'not-allowed',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                            disabled
                                                        >
                                                            Event is ended
                                                        </button>
                                                    ) : (
                                                        <button
                                                            style={{
                                                                width: '100%',
                                                                background: 'linear-gradient(90deg, #FF7A6B 0%, #D95CF5 50%, #6B63FF 100%)',
                                                                border: 'none',
                                                                borderRadius: 16,
                                                                height: 54,
                                                                fontSize: 15.5,
                                                                fontWeight: 600,
                                                                color: '#fff',
                                                                cursor: 'pointer',
                                                                boxShadow: '0 4px 20px rgba(169, 92, 245, 0.35)',
                                                                transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: 8,
                                                                letterSpacing: '-0.1px',
                                                            }}
                                                            onMouseEnter={e => {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 8px 28px rgba(169, 92, 245, 0.45)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(169, 92, 245, 0.35)';
                                                            }}
                                                            onClick={() => {
                                                                if (liveEvent.type === "Free") {
                                                                    if (tiers.length > 0) {
                                                                        const t = tiers[0];
                                                                        setSelectedTickets({
                                                                            [t.id]: { ticketId: t.id, ticketName: t.n, price: 0, qty: 1, maxQty: 1, remaining: 999 }
                                                                        });
                                                                    }
                                                                    setShowCheckoutModal(true);
                                                                } else {
                                                                    setShowTicketPopup(true);
                                                                }
                                                            }}
                                                        >
                                                            {liveEvent.cash_enabled
                                                                ? (liveEvent.type === "Free" ? "Request to join" : 'Submit Payment Request')
                                                                : (liveEvent.type === "Free" ? "Request to join" : "Get Tickets")}
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                                        </button>
                                                    )}
                                                    {(() => {
                                                        let settingsObj = liveEvent.settings || {};
                                                        if (typeof settingsObj === 'string') {
                                                            try { settingsObj = JSON.parse(settingsObj); } catch {}
                                                        }
                                                        const isCapacityLimited = settingsObj?.capacity?.limit === true || (evtCap && evtCap > 0 && evtCap < 9999);
                                                        if (!isCapacityLimited) return null;
                                                        const remaining = evtCap - evtGoing;
                                                        return (
                                                            <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500, marginTop: 10, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                                                {remaining > 0 ? `${remaining} seats left` : "Sold Out"}
                                                            </div>
                                                        );
                                                    })()}
                                                </>
                                            )
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center", marginTop: 14, fontSize: 11.5, color: "var(--ink-3)" }}>
                                            <I.check style={{ width: 12, height: 12, color: "var(--accent-1)" }} />
                                            Secure checkout · instant ticket
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            )}

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
                                            {tiers.map(t => {
                                                const selQty = selectedTickets[t.id]?.qty || 0;
                                                const maxPerBookingLimit = t.maxPerBooking || 10;
                                                const maxAllowed = t.remaining !== null ? Math.min(maxPerBookingLimit, t.remaining) : maxPerBookingLimit;
                                                return (
                                                <div 
                                                    key={t.id} 
                                                    style={{
                                                        background: 'var(--surface-2)', border: `1px solid var(--border)`,
                                                        borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column',
                                                        gap: 10, transition: 'all 0.2s', opacity: t.isFull ? 0.6 : 1
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
                                                            <button 
                                                                onClick={(ev) => {
                                                                    ev.stopPropagation();
                                                                    setExpandedTicketDetails(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                                                                }}
                                                                style={{
                                                                    background: 'transparent', border: 'none', color: 'var(--accent)',
                                                                    fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '6px 0', marginTop: 4
                                                                }}
                                                            >
                                                                {expandedTicketDetails[t.id] ? 'Less Info' : 'More Info'}
                                                            </button>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                            {t.isFull ? (
                                                                <div className="stepper" style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
                                                                    <button style={{ background: 'transparent', border: 'none', fontSize: 18, color: 'var(--ink)', cursor: 'not-allowed' }}>–</button>
                                                                    <span style={{ fontSize: 15, fontWeight: 600, width: 20, textAlign: 'center' }}>0</span>
                                                                    <button style={{ background: 'transparent', border: 'none', fontSize: 18, color: 'var(--ink)', cursor: 'not-allowed' }}>+</button>
                                                                </div>
                                                            ) : (
                                                                <div className="stepper" style={{ background: 'var(--surface)', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    <button 
                                                                        style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: selQty > 0 ? 'pointer' : 'not-allowed', color: 'var(--ink)', opacity: selQty > 0 ? 1 : 0.5 }} 
                                                                        disabled={selQty <= 0}
                                                                        onClick={() => {
                                                                            setSelectedTickets(prev => {
                                                                                const n = { ...prev };
                                                                                if (n[t.id]) {
                                                                                    if (n[t.id].qty > 1) {
                                                                                        n[t.id].qty -= 1;
                                                                                    } else {
                                                                                        delete n[t.id];
                                                                                    }
                                                                                }
                                                                                return n;
                                                                            });
                                                                        }}
                                                                    >–</button>
                                                                    <span style={{ fontSize: 15, fontWeight: 600, width: 20, textAlign: 'center' }}>{selQty}</span>
                                                                    <button 
                                                                        style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: selQty < maxAllowed ? 'pointer' : 'not-allowed', color: 'var(--ink)', opacity: selQty < maxAllowed ? 1 : 0.5 }} 
                                                                        disabled={selQty >= maxAllowed}
                                                                        onClick={() => {
                                                                            setSelectedTickets(prev => {
                                                                                const n = { ...prev };
                                                                                if (!n[t.id]) {
                                                                                    n[t.id] = { ticketId: t.id, ticketName: t.n, price: t.priceVal, qty: 0, maxQty: maxAllowed, remaining: t.remaining || 999 };
                                                                                }
                                                                                if (n[t.id].qty < maxAllowed) {
                                                                                    n[t.id].qty += 1;
                                                                                }
                                                                                return n;
                                                                            });
                                                                        }}
                                                                    >+</button>
                                                                </div>
                                                            )}
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
                                            )})}
                                            
                                            <div style={{ marginTop: 16, borderTop: '1px solid var(--border-2)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', bottom: 0, background: 'var(--surface)' }}>
                                                {totalQty > 0 && (
                                                    <div style={{ fontSize: 13, background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                                                        {Object.values(selectedTickets).map(stk => (
                                                            <div key={stk.ticketId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                <span>{stk.ticketName} &times;{stk.qty}</span>
                                                                <span style={{ fontWeight: 600 }}>{stk.price > 0 ? `₹${(stk.price * stk.qty / 100).toFixed(0)}` : 'Free'}</span>
                                                            </div>
                                                        ))}
                                                        <div style={{ borderTop: '1px dashed var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                            <span>Total Tickets ({totalQty})</span>
                                                            <span>{totalPrice > 0 ? `₹${(totalPrice / 100).toFixed(0)}` : 'Free'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <button 
                                                    className="hbtn hbtn--primary hbtn--block" 
                                                    style={{ width: '100%', height: 46, fontSize: 15 }}
                                                    disabled={totalQty === 0}
                                                    onClick={() => {
                                                        setShowTicketPopup(false);
                                                        setShowCheckoutModal(true);
                                                    }}
                                                >
                                                    Continue {totalQty > 0 ? `• ₹${(totalPrice / 100).toFixed(0)}` : ''}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <CheckoutModal
                                isOpen={showCheckoutModal}
                                onClose={() => setShowCheckoutModal(false)}
                                liveEvent={liveEvent}
                                expandedTickets={expandedTickets}
                                st={st}
                                onConfirm={(checkoutPayload: any) => {
                                    setShowCheckoutModal(false);
                                    const grouped = Object.values(selectedTickets).map(t => ({ ticketTypeId: t.ticketId, qty: t.qty, ticketName: t.ticketName }));
                                    register(liveEvent.id, false, { 
                                        tickets: grouped,
                                        transactionId: checkoutTransactionId || undefined,
                                        ...checkoutPayload 
                                    }, liveEvent.inviteToken);
                                    go("events");
                                }}
                            />

                            <div 
                                className="host-card"
                                style={{ cursor: (e.hostUserId || e.hosted_by_entity_id || e.host_entity_id) ? 'pointer' : 'default' }}
                                onClick={() => {
                                    if (e.hostType === 'group' && (e.hosted_by_entity_id || e.host_entity_id)) {
                                        go("group", { id: e.hosted_by_entity_id || e.host_entity_id });
                                    } else if (e.hostUserId) {
                                        go("public-profile", { id: e.hostUserId, displayName: e.hostBy || e.host, profilePhoto: e.hostPhoto });
                                    }
                                }}
                            >
                                <div className="hh"><Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={46} /><div><div className="n">{e.host}</div><div className="r">Organizer · 24 events</div></div></div>
                                <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss a drop.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* OTP Popup */}
            {showClaimPopup && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}>
                    <button 
                        onClick={() => setShowClaimPopup(false)}
                        style={{ position: "absolute", top: 24, right: 24, zIndex: 100000, background: "var(--surface-3)", border: "none", borderRadius: "50%", width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}
                    >
                        ✕
                    </button>
                    <div style={{ width: '100%', height: '100%' }}>
                        <ClaimFlow 
                            token={claimToken} 
                            st={st} 
                            go={go} 
                            onClaimed={(_newToken: any) => {
                                // Re-fetch this event's data from the server now that the user
                                // is verified and the booking is confirmed. This updates
                                // liveEvent.bookingStatus → 'confirmed' so the pending banner
                                // disappears and the user sees the confirmed member view.
                                fetchEventData();
                                if (fetchJoinedEvents) fetchJoinedEvents();
                                setShowClaimPopup(false);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

