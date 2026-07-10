import React, { useState, useEffect } from 'react';
import { I, Avatar, Grain } from './home-icons';
import { FEATURED, ME } from './home-data';

export function JoinEventPage({ ev, st, go }) {
    let e = ev || FEATURED;

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
        const priceVal = e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : ((e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : '—');

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
            host: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.host || ME.name || "Organizer"),
            hostBy: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostBy || ME.name || "Organizer"),
            hostPhoto: typeof e.host === 'object' && e.host !== null ? (e.host.photo || "") : (e.hostPhoto || ""),
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

    const { wishlisted, toggleWishlist, register, city, waitlisted } = st;
    const isWishlisted = wishlisted ? wishlisted.has(e.id) : false;
    const isWaitlisted = (waitlisted ? waitlisted.has(e.id) : false) || (st.joinedEvents?.some(je => je.id === e.id && je.bookingStatus === 'waitlisted') ?? false);
    const isSoldOut = e.going >= (e.cap || 9999) || e.id === "ev-feat";
    const [regStatus, setRegStatus] = useState(
        e.registrationStatus || e.registration_status || "OPEN"
    );
    const isClosed = regStatus === "CLOSED";
    const isScheduled = regStatus === "SCHEDULED";

    // Always fetch live registration status from server so the button state
    // reflects reality even if the card navigation data was stale.
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const UUID_RE_J = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    useEffect(() => {
        if (!e.id || !UUID_RE_J.test(e.id)) return;
        const tok = localStorage.getItem('token');
        fetch(`${apiBase}/api/events/${e.id}`, {
            headers: tok ? { 'Authorization': `Bearer ${tok}` } : {}
        })
            .then(r => r.json())
            .then(data => {
                if (data.success && data.data?.event) {
                    const srv = data.data.event;
                    const s = srv.registrationStatus || srv.registration_status || "OPEN";
                    setRegStatus(s);
                }
            })
            .catch(() => {});
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
    const tiers = (e.tickets && e.tickets.length > 0)
        ? e.tickets.map((t: any) => ({
            id: t.id,
            n: t.name,
            d: t.description || (t.price_minor === 0 ? "Free entry" : "Standard entry"),
            p: t.price_minor === 0 ? "Free" : `₹${(t.price_minor / 100).toFixed(0)}`,
            free: t.price_minor === 0
          }))
        : (e.type === "Free"
            ? [{ id: "rsvp", n: "General RSVP", d: "Free entry · approval-based", p: "Free", free: true }]
            : [{ id: "general", n: "General Admission", d: "Standard entry", p: priceStr }]);
    const [tier, setTier] = useState(tiers[0].id);
    const [qty, setQty] = useState(1);
    const sel = tiers.find(t => t.id === tier);
    const pct = Math.round((e.going / (e.cap || e.going)) * 100);

    const attendees = e.attendees || ["Dev K", "Mira S", "Leo P", "Zoya N", "Sam K", "Riya T"];

  const [showShareSheet, setShowShareSheet] = useState(false);
  
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
                        <button className={`cbtn ${isWishlisted ? "on" : ""}`} onClick={() => toggleWishlist && toggleWishlist(e.id)}>{isWishlisted ? <I.heartF /> : <I.heart />}</button>
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
                                <span className="fchip on" style={{ pointerEvents: "none" }}>{e.cat}</span>
                                <span className="fchip" style={{ pointerEvents: "none" }}>{e.online ? <><I.online style={{ width: 14, height: 14 }} /> Online</> : <><I.pin style={{ width: 14, height: 14 }} /> {e.city || city}</>}</span>
                                <span className="fchip" style={{ pointerEvents: "none" }}>{e.type}</span>
                            </div>
                            <div className="ttl">{e.title}</div>
                            <div className="ev-host">
                                <Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={34} />
                                Hosted by <b>{e.host}</b>
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
                                <h3>About this event</h3>
                                <div className="ev-about">
                                    <p>{e.desc || "Join us for an unforgettable evening bringing together the most interesting people in the city. Whether you're here to learn, connect, or simply enjoy the atmosphere — there's a place for you."}</p>
                                    <p>Expect curated conversations, a welcoming community, and the kind of serendipity that only happens in the same room. Doors open 30 minutes early — come say hi.</p>
                                </div>
                            </div>

                            {e.instructions && (
                                <div className="ev-block" style={{ background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px", marginBottom: "20px" }}>
                                    <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 700 }}>📢 Special Instructions</h3>
                                    <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)" }}>{e.instructions}</p>
                                </div>
                            )}

                            {!e.online && (
                                <div className="ev-block">
                                    <h3>Location</h3>
                                    <div className="ev-map">
                                        <div className="grid" />
                                        <div style={{ position: "absolute", left: "18%", top: 0, bottom: 0, width: 6, background: "var(--border)" }} />
                                        <div style={{ position: "absolute", top: "62%", left: 0, right: 0, height: 6, background: "var(--border)" }} />
                                        <div className="pin"><span className="ring" /><span className="dot" /></div>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13.5, color: "var(--ink-2)" }}>
                                        <I.pin style={{ color: "var(--accent-2)" }} /> {e.venue}, {e.city} <button className="hbtn hbtn--ghost hbtn--sm" style={{ marginLeft: "auto" }}>Get directions</button>
                                    </div>
                                </div>
                            )}

                            <div className="ev-block">
                                <h3>{e.going} attending</h3>
                                <div className="att-grid">
                                    {attendees.map(n => {
                                        const name = typeof n === 'object' ? (n.name || n.display_name) : n;
                                        const userId = typeof n === 'object' ? n.id : undefined;
                                        const picture = typeof n === 'object' ? n.picture : undefined;
                                        return (
                                            <div key={name} className="att">
                                                <Avatar name={name} userId={userId} img={picture} size={28} />
                                                <span className="nm">{name}</span>
                                            </div>
                                        );
                                    })}
                                    <div className="att" style={{ paddingRight: 14 }}><div className="av" style={{ width: 28, height: 28, fontSize: 11, background: "var(--surface-2)", color: "var(--ink-2)" }}>+{Math.max(0, e.going - attendees.length)}</div><span className="nm">more</span></div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket sidebar */}
                        <div className="ev-aside">
                            {isClosed || isScheduled ? (
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
                                    <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: 8 }} onClick={() => toggleWishlist && toggleWishlist(e.id)}>
                                        {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                                    </button>
                                </div>
                            ) : (
                                <div className="ticket-box">
                                    <div className="tb-head">
                                        <div className="pmeta">
                                            <span className="price-big" style={e.type === "Free" ? { color: "#1f9d57" } : {}}>{sel.free ? "Free" : sel.p}</span>
                                            {!sel.free && <span className="price-un">onwards</span>}
                                        </div>
                                        <div className="seats">
                                            <span style={{ whiteSpace: "nowrap" }}>{e.cap - e.going} left</span>
                                            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                                            <span style={{ whiteSpace: "nowrap", color: "var(--ink-3)" }}>{pct}% full</span>
                                        </div>
                                    </div>
                                    <div className="tier-list">
                                        {tiers.map(t => (
                                            <div key={t.id} className={`tier ${tier === t.id ? "on" : ""}`} onClick={() => setTier(t.id)}>
                                                <span className="radio" />
                                                <div className="ti"><div className="n">{t.n}</div><div className="d">{t.d}</div>{t.early && <span className="early">EARLY BIRD</span>}</div>
                                                <div className={`tp ${t.free ? "free" : ""}`}>{t.free ? "Free" : t.p}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="ticket-foot">
                                        <div className="qty">
                                            <span className="lbl">Quantity</span>
                                            <div className="stepper">
                                                <button onClick={() => setQty(q => Math.max(1, q - 1))}>–</button>
                                                <span className="n">{qty}</span>
                                                <button onClick={() => setQty(q => Math.min(6, q + 1))}>+</button>
                                            </div>
                                        </div>
                                        {e.bookingStatus === 'pending_approval' ? (
                                            <button className="hbtn hbtn--soft hbtn--block" disabled>
                                                Pending Approval
                                            </button>
                                        ) : isSoldOut && e.waitlist === false ? (
                                            <button className="hbtn hbtn--soft hbtn--block" disabled>
                                                Sold Out
                                            </button>
                                        ) : isSoldOut ? (
                                            isWaitlisted ? (
                                                <button className="hbtn hbtn--soft hbtn--block" style={{ color: "var(--accent-2)" }} onClick={() => go("waitlist", e)}>
                                                    <I.users /> View Waitlist Status
                                                </button>
                                            ) : (
                                                <button className="hbtn hbtn--primary hbtn--block" onClick={() => { st.toggleWaitlist(e.id); go("waitlist", e); }}>
                                                    Get Ticket
                                                </button>
                                            )
                                        ) : (
                                            <button className="hbtn hbtn--primary hbtn--block" onClick={() => { register(e.id, false, null, e.inviteToken); go("events"); }}>
                                                {e.type === "Free" ? "Request to join" : `Get ${qty > 1 ? qty + " tickets" : "ticket"}`}
                                            </button>
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 11, fontSize: 12, color: "var(--ink-3)" }}>
                                            <I.check style={{ width: 13, height: 13, color: "#1f9d57" }} /> {isSoldOut && e.waitlist !== false ? "Waitlist claim window: 15 mins" : isSoldOut ? "Fully booked" : e.type === "Free" ? "Approval-based · free" : "Secure checkout · instant ticket"}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="host-card">
                                <div className="hh"><Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={46} /><div><div className="n">{e.host}</div><div className="r">Organizer · 24 events</div></div></div>
                                <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss a drop.</div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button className="hbtn hbtn--ghost hbtn--sm hbtn--block"><I.plus />Follow</button>
                                    {showChatButton && (e.hostBy || e.host) && (e.hostBy || e.host) !== ME.name && (
                                        <button
                                            className="hbtn hbtn--ghost hbtn--sm hbtn--block"
                                            onClick={() => {
                                                if ((window as any).initiateChatWithName) {
                                                    (window as any).initiateChatWithName(e.hostBy || e.host);
                                                }
                                            }}
                                        >
                                            <I.msg />Message
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

