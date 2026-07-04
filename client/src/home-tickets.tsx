// @ts-nocheck
/* ============================================================
   Samaagum — Tickets wallet (S-085) · Ticket detail (S-086)
   · Claim-your-ticket (F4: S-090 landing, S-091 OTP)
   ============================================================ */

function MyTickets({ st, go }) {
  const [tab, setTab] = useState("upcoming");
  const tickets = st.myTickets || [];
  const joinedEvents = st.joinedEvents || [];

  const getVenueStr = (v) => {
    if (typeof v === 'object' && v !== null) {
      return v.name || v.address || 'Venue TBD';
    }
    return v || 'Venue TBD';
  };

  const normalizeJoinedEvent = (e) => {
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
      tier: firstTicket?.name || "General",
      paid: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp')
        ? 'Free'
        : (firstTicket?.price_amount_minor != null ? `₹${(firstTicket.price_amount_minor / 100).toFixed(0)}` : '—'),
      online: e.location_type === 'online',
      date: dateStr,
      time: timeStr,
      venue: e.location_type === 'online' ? 'Online' : getVenueStr(e.venue),
      status: e.status === 'cancelled' ? 'voided' : 'confirmed',
    };
  };

  const upcoming = [
    ...tickets.filter(t => t.status !== "used" && t.status !== "voided"),
    ...joinedEvents.filter(j => j.bookingStatus === "confirmed").map(normalizeJoinedEvent)
  ];
  const pending = joinedEvents.filter(j => j.bookingStatus === "pending_approval");
  const past = tickets.filter(t => t.status === "used");

  const waitlistIds = Array.from(st.waitlisted || []);
  const waitlistedEvents = [FEATURED, ...EVENTS].filter(e => waitlistIds.includes(e.id));

  const createdListRaw = st.createdEvents || [];
  const createdList = createdListRaw.map(e => {
    if (e.date && typeof e.venue === 'string') return e;
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    return {
      ...e,
      cover: e.cover || meta.cover || "",
      cat: meta.category || e.cat || "General",
      online: e.location_type === 'online',
      month,
      day,
      date: dateStr,
      time,
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
    };
  });

  const list = tab === "upcoming" ? upcoming
    : tab === "pending" ? pending
      : tab === "past" ? past
        : tab === "waitlist" ? waitlistedEvents
          : createdList;

  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => go("discover", "events")}>
            My Events
            <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{tickets.length + joinedEvents.length + waitlistedEvents.length + createdList.length}</span>
          </h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="seg-tabs">
              <button className={tab === "upcoming" ? "on" : ""} onClick={() => setTab("upcoming")}>Upcoming · {upcoming.length}</button>
              <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>Pending · {pending.length}</button>
              <button className={tab === "waitlist" ? "on" : ""} onClick={() => setTab("waitlist")}>Waitlist · {waitlistedEvents.length}</button>
              <button className={tab === "created" ? "on" : ""} onClick={() => setTab("created")}>Created · {createdList.length}</button>
              <button className={tab === "past" ? "on" : ""} onClick={() => setTab("past")}>Past · {past.length}</button>
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
        ) : tab === "waitlist" ? (
          <div className="wallet-grid">
            {waitlistedEvents.map(e => (
              <div key={e.id} className="tkt" onClick={() => go("waitlist", e)}>
                <div className="tkt-cov" style={{ background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat` }}>
                  <Grain />
                  <span className="pill" style={{ background: "rgba(0,0,0,0.32)", color: "#fff", backdropFilter: "blur(8px)" }}>{e.cat}</span>
                  <span className="pill violet" style={{ background: "rgba(255,255,255,0.92)", color: "var(--accent-2)" }}><span className="pdot" style={{ background: "var(--accent-2)" }} />Waitlisted</span>
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
                      View Queue <I.arrowR style={{ width: 14, height: 14 }} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
        ) : (
          <div className="wallet-grid">
            {list.map(t => (
              <div key={t.id} className={`tkt ${t.status === "used" ? "used" : ""}`} onClick={() => {
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
                  {t.status === "used" ? (
                    <span className="pill gray">Used</span>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketDetail({ tkt, st, go }) {
  const tickets = st?.myTickets || [];
  const t = tkt || tickets[0] || {};
  const used = t.status === "used";

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
          <div className="qt-cov" style={{ background: t.cover && (t.cover.startsWith("linear-gradient") || t.cover.startsWith("radial-gradient") || t.cover.startsWith("var(")) ? t.cover : `url(${t.cover}) center/cover no-repeat` }}>
            <Grain />
            <span className="pill" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", backdropFilter: "blur(8px)" }}>{t.tier}</span>
          </div>
          <div className="qt-pad">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, color: "var(--ink)", lineHeight: 1.25, textAlign: "center", marginBottom: 20 }}>{t.ev}</div>

            {used ? (
              <div className="notice gray" style={{ background: "var(--field)", border: "1px solid var(--border)", margin: "18px 0" }}>
                <span className="ni"><I.check /></span><div>This ticket was used on {t.date}. The QR is no longer valid.</div>
              </div>
            ) : (
              <div className="qr-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "20px 0 24px" }}>
                <div className="qr-box" style={{ padding: 14, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "var(--sh-sm)", width: 200, height: 200 }}><QRCode seed={t.id || "test"} size={172} /></div>
                <div className="qr-caption" style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12, textAlign: "center" }}>Show this at the gate · refreshes every scan</div>
              </div>
            )}

            <div className="qt-rows">
              <div className="qt-row"><span className="k">Attendee</span><span className="v">{t.attendee}</span></div>
              <div className="qt-row"><span className="k">Date</span><span className="v">{t.date} · {t.time}</span></div>
              <div className="qt-row"><span className="k">{t.online ? "Location" : "Venue"}</span><span className="v">{t.venue}</span></div>
              <div className="qt-row"><span className="k">Quantity</span><span className="v">{t.qty}</span></div>
              <div className="qt-row"><span className="k">Paid</span><span className="v">{t.paid}</span></div>
              <div className="qt-row">
                <span className="k">Status</span>
                <span className="v">
                  {used ? (
                    <span className="pill gray">Used</span>
                  ) : (
                    <span className="pill green"><span className="pdot" />Confirmed</span>
                  )}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 9, marginTop: 18 }}>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => alert("Downloading PDF Invoice...")}><I.download /> Invoice</button>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => alert("Event added to your calendar.")}><I.cal /> Add to calendar</button>
              <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => alert("Link copied to clipboard!")}><I.share /> Share</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Claim-your-ticket (F4) ---------------- */
function ClaimFlow({ st, go }) {
  const [step, setStep] = useState("landing"); // landing | otp | done
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("");
  const refs = useRef([]);
  const t = { ev: "Founders & Funders Mixer — Summer Edition", cover: COVERS.sunset, tier: "VIP · Front tables", date: "Thu, Jun 18", time: "6:30 PM", venue: "Skydeck, Indiranagar" };

  const onDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d) && next.join("").length === 6) {
      setStatus("checking");
      setTimeout(() => {
        // Automatically add claimed ticket to user's wallet
        if (st && st.addClaimedTicket) {
          st.addClaimedTicket(t);
        }
        setStep("done");
      }, 900);
    }
  };

  return (
    <div className="scroll">
      <div className="flow view-enter" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
        {step === "landing" && (
          <>
            <div style={{ textAlign: "center", padding: "10px 0 6px" }}><Wordmark size={20} /></div>
            <div className="fcard" style={{ marginTop: 18 }}>
              <div className="qt-cov" style={{ background: t.cover && (t.cover.startsWith("linear-gradient") || t.cover.startsWith("radial-gradient") || t.cover.startsWith("var(")) ? t.cover : `url(${t.cover}) center/cover no-repeat`, height: 120, position: "relative", display: "flex", alignItems: "flex-end", padding: 16 }}>
                <Grain />
                <span className="pill" style={{ background: "rgba(0,0,0,0.3)", color: "#fff", backdropFilter: "blur(8px)" }}>{t.tier}</span>
              </div>
              <div className="fcard-pad">
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent-2)" }}>You've been given a ticket</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22, color: "var(--ink)", marginTop: 8, lineHeight: 1.2 }}>{t.ev}</h2>
                <div className="tkt-meta" style={{ fontSize: 13, marginTop: 12 }}>
                  <span><I.cal style={{ width: 14, height: 14 }} /> {t.date} · {t.time}</span>
                  <span><I.pin style={{ width: 14, height: 14 }} /> {t.venue}</span>
                </div>
                <div className="notice info" style={{ marginTop: 16 }}>
                  <span className="ni"><I.link /></span>
                  <div>This is a secure single-use claim link. Verify it's you to add the ticket to your Samaagum wallet. Your entry stays valid even if you never claim.</div>
                </div>
                <button className="hbtn hbtn--primary hbtn--block" style={{ marginTop: 16 }} onClick={() => setStep("otp")}>Claim this ticket</button>
              </div>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="flow-head"><button className="back" onClick={() => setStep("landing")}><I.arrowL /></button><div><div className="flow-title">Verify it's you</div><div className="flow-sub">Code sent to a•••a@samaagum.co</div></div></div>
            <div className="fcard fcard-pad" style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 18 }}>Enter the 6-digit code we emailed to the address on this ticket.</p>
              <div style={{ display: "flex", gap: 9, justifyContent: "center" }}>
                {code.map((d, i) => (
                  <input key={i} ref={el => refs.current[i] = el} className="otp-box" value={d} maxLength={1} inputMode="numeric"
                    style={{ width: 42, height: 48, fontSize: 20, textAlign: "center", borderRadius: 8, border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                    onChange={e => onDigit(i, e.target.value)}
                    onKeyDown={e => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }} />
                ))}
              </div>
              {status === "checking" && <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-3)", display: "flex", gap: 8, justifyContent: "center", alignItems: "center" }}><Spinner /> Verifying…</div>}
              <div style={{ marginTop: 18, fontSize: 13, color: "var(--ink-3)" }}>Didn't get it? <button className="linkbtn" onClick={() => alert("A new code has been sent.")}>Resend code</button></div>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="fcard" style={{ marginTop: 20 }}>
            <div className="terminal" style={{ textAlign: "center", padding: 24 }}>
              <div className="badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><I.check style={{ width: 34, height: 34 }} /></div>
              <h2>Ticket claimed</h2>
              <p style={{ fontSize: 14, color: "var(--ink-2)" }}>{t.ev} is now in your wallet. We've linked it to your account — see you there!</p>
            </div>
            <div className="fcard-pad" style={{ paddingTop: 4, paddingBottom: 24 }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="hbtn hbtn--primary hbtn--block" onClick={() => go("events")}><I.ticket /> View tickets</button>
                <button className="hbtn hbtn--ghost" onClick={() => go("home")}>Home</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventDashboard({ ev, st, go }) {
  const e = ev || st.createdEvents[0];
  const [stats, setStats] = useState({ totalAttendees: 0, checkedInCount: 0, pendingRequestsCount: 0, revenue: 0, capacity: 120, confirmed: [], requests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-stats`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || "Failed to load dashboard data.");
      }
    } catch (err) {
      setError("Network error loading dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [e.id]);

  useEffect(() => {
    if (!e?.id || !window.io) return;
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = window.io(socketUrl, { transports: ['websocket'] });
    socket.emit('join_event', e.id);
    socket.on('dashboard_updated', () => {
      fetchStats();
    });
    return () => {
      socket.emit('leave_event', e.id);
      socket.disconnect();
    };
  }, [e.id]);

  const handleAction = async (bookingId, action) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/requests/${bookingId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        alert(data.message || `Failed to ${action} request.`);
      }
    } catch (err) {
      alert("Network error updating request.");
    }
  };

  const handleCheckin = async (attendeeId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/attendees/${attendeeId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchStats();
      } else {
        alert(data.message || "Failed to check in attendee.");
      }
    } catch (err) {
      alert("Network error checking in attendee.");
    }
  };

  const renderAnswers = (answers) => {
    if (!answers || Object.keys(answers).length === 0) return null;
    const fields = e.venue?.meta?.formFields || [];
    return (
      <div style={{ marginTop: 8, padding: "10px 12px", background: "var(--bg-2)", borderRadius: 8, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8, width: "100%", boxSizing: "border-box" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", letterSpacing: "0.05em" }}>Questionnaire Response</div>
        {Object.entries(answers).map(([key, val]) => {
          const field = fields.find(f => f.id === key);
          const label = field ? field.question : key;
          return (
            <div key={key} style={{ fontSize: 12 }}>
              <div style={{ color: "var(--ink-3)", marginBottom: 1, fontSize: 11 }}>{label}</div>
              <div style={{ color: "var(--ink)", fontWeight: 500 }}>{String(val)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--ink-3)" }}>
        <Spinner /> <span style={{ marginLeft: 8 }}>Loading host dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: 24, textAlign: "center" }}>
        <div style={{ color: "red", fontSize: 16, fontWeight: 600, marginBottom: 12 }}>⚠️ Error</div>
        <div style={{ color: "var(--ink-2)", marginBottom: 20 }}>{error}</div>
        <button className="hbtn hbtn--primary" onClick={() => go("events")}>Back to Events</button>
      </div>
    );
  }

  const revenueDisplay = stats.revenue === 0 ? "Free" : `₹${stats.revenue.toLocaleString()}`;

  return (
    <div className="scroll">
      <div className="flow view-enter" style={{ padding: "26px 24px 80px" }}>
        <div className="flow-head" style={{ marginBottom: 20 }}>
          <button className="back" onClick={() => go("events")}><I.arrowL /></button>
          <div>
            <div className="flow-title">Event Dashboard</div>
            <div className="flow-sub">{e.title}</div>
          </div>
        </div>

        <div className="fcard" style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 80, height: 60, borderRadius: 8, background: e.cover ? (e.cover.startsWith("linear-gradient") ? e.cover : `url(${e.cover}) center/cover no-repeat`) : "var(--border-2)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{e.date} · {e.time}</div>
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft: "auto" }} onClick={() => go("edit-event", e)}>
              <I.edit style={{ width: 14, height: 14 }} /> Edit Event
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Total Attendees</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{stats.totalAttendees} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-3)" }}>/ {stats.capacity}</span></div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Estimated Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: stats.revenue === 0 ? "var(--ink-3)" : "#1f9d57" }}>{revenueDisplay}</div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Pending Requests</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: stats.pendingRequestsCount > 0 ? "var(--accent-2)" : "var(--ink)" }}>{stats.pendingRequestsCount}</div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Checked In</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: "var(--accent-2)" }}>{stats.checkedInCount} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-3)" }}>/ {stats.totalAttendees}</span></div>
            </div>
          </div>

          {stats.requests.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)" }} />
                Pending Approvals ({stats.requests.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {stats.requests.map(r => (
                  <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={r.name} size={32} />
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</span>
                          <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{r.email}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleAction(r.bookingId, 'decline')} style={{ color: "#ef4444" }}>Decline</button>
                        <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleAction(r.bookingId, 'accept')}>Approve</button>
                      </div>
                    </div>
                    {renderAnswers(r.answers)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Confirmed Attendees ({stats.confirmed.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stats.confirmed.map(a => (
                <div key={a.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={a.name} size={28} />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
                        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{a.email}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11.5, color: "#1f9d57", display: "flex", alignItems: "center", gap: 4 }}><I.check style={{ width: 12, height: 12 }} /> Confirmed</span>
                      {a.checkinStatus === 'checked_in' ? (
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", background: "rgba(124, 90, 255, 0.1)", padding: "3px 8px", borderRadius: 999 }}>Checked In</span>
                      ) : (
                        <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleCheckin(a.id)} style={{ padding: "2px 8px", fontSize: 11, height: 24 }}>Check In</button>
                      )}
                    </div>
                  </div>
                  {renderAnswers(a.answers)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MyTickets, TicketDetail, ClaimFlow, EventDashboard });
