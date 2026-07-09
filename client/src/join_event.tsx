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
            host: e.host || ME.name || "Organizer",
            hostBy: e.hostBy || ME.name || "Organizer",
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
    const isWaitlisted = waitlisted ? waitlisted.has(e.id) : false;
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

    return (
        <div className="scroll">
            <div className="view-enter">
                <div className="detail-cover" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
                    <Grain /><div className="scrim" />
                    <button className="detail-back" onClick={() => { go("home"); }}><I.arrowL />Back</button>
                    <div className="detail-actions-top">
                        <button className={`cbtn ${isWishlisted ? "on" : ""}`} onClick={() => toggleWishlist && toggleWishlist(e.id)}>{isWishlisted ? <I.heartF /> : <I.heart />}</button>
                        <button className="cbtn"><I.share /></button>
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
                                <button className="hbtn hbtn--ghost hbtn--sm" style={{ marginLeft: "auto" }}><I.plus />Follow</button>
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
                            )}
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
                                        ) : isSoldOut ? (
                                            isWaitlisted ? (
                                                <button className="hbtn hbtn--soft hbtn--block" style={{ color: "var(--accent-2)" }} onClick={() => go("waitlist", e)}>
                                                    <I.users /> View Waitlist Status
                                                </button>
                                            ) : (
                                                <button className="hbtn hbtn--primary hbtn--block" onClick={() => { st.toggleWaitlist(e.id); go("waitlist", e); }}>
                                                    Join Waitlist
                                                </button>
                                            )
                                        ) : (
                                            <button className="hbtn hbtn--primary hbtn--block" onClick={() => { register(e.id, false, null, e.inviteToken); go("events"); }}>
                                                {e.type === "Free" ? "Request to join" : `Get ${qty > 1 ? qty + " tickets" : "ticket"}`}
                                            </button>
                                        )}
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 11, fontSize: 12, color: "var(--ink-3)" }}>
                                            <I.check style={{ width: 13, height: 13, color: "#1f9d57" }} /> {isSoldOut ? "Waitlist claim window: 15 mins" : e.type === "Free" ? "Approval-based · free" : "Secure checkout · instant ticket"}
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

