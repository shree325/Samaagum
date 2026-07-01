// @ts-nocheck
/* ============================================================
   Samaagum — Tickets wallet (S-085) · Ticket detail (S-086)
   · Claim-your-ticket (F4: S-090 landing, S-091 OTP)
   ============================================================ */

function MyTickets({ st, go }) {
  const [tab, setTab] = useState("upcoming");
  const tickets = st.myTickets || [];
  const upcoming = tickets.filter(t => t.status !== "used" && t.status !== "voided");
  const past = tickets.filter(t => t.status === "used");
  
  const waitlistIds = Array.from(st.waitlisted || []);
  const waitlistedEvents = [FEATURED, ...EVENTS].filter(e => waitlistIds.includes(e.id));
  
  const createdList = st.createdEvents || [];
  const list = tab === "upcoming" ? upcoming 
             : tab === "past" ? past 
             : tab === "waitlist" ? waitlistedEvents 
             : createdList;
  
  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            My Events
            <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{tickets.length + waitlistedEvents.length + createdList.length}</span>
          </h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="seg-tabs">
              <button className={tab === "upcoming" ? "on" : ""} onClick={() => setTab("upcoming")}>Upcoming · {upcoming.length}</button>
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
          <Empty icon={<I.groups />} title="No waitlisted events" text="You aren't on the waitlist for any events yet." action={<button className="hbtn hbtn--primary" onClick={() => go("discover")}>Discover events</button>} />
        ) : tab === "created" && createdList.length === 0 ? (
          <Empty icon={<I.plus />} title="No hosted events" text="Create and share your first event to host it here." action={<button className="hbtn hbtn--primary" onClick={() => go("create-event")}>Create Event</button>} />
        ) : list.length === 0 ? (
          <Empty icon={<I.ticket />} title="No tickets yet" text="When you book or RSVP to an event, your tickets live here." action={<button className="hbtn hbtn--primary" onClick={() => go("discover")}>Discover events</button>} />
        ) : tab === "waitlist" ? (
          <div className="wallet-grid">
            {waitlistedEvents.map(e => (
              <div key={e.id} className="tkt" onClick={() => go("waitlist", e)}>
                <div className="tkt-cov" style={{ background: e.cover }}>
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
              <div key={e.id} className="tkt" onClick={() => go("event-dashboard", e)}>
                <div className="tkt-cov" style={{ background: e.cover }}>
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
              <div key={t.id} className={`tkt ${t.status === "used" ? "used" : ""}`} onClick={() => go("ticket", t)}>
                <div className="tkt-cov" style={{ background: t.cover }}>
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
          <div className="qt-cov" style={{ background: t.cover }}>
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
              <div className="qt-cov" style={{ background: t.cover, height: 120, position: "relative", display: "flex", alignItems: "flex-end", padding: 16 }}>
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
  const [attendees, setAttendees] = useState(e.attendees || ["Dev Kapoor", "Mira Shah", "Leo Patel", "Zoya Nair", "Ishaan Malhotra"]);
  const [requests, setRequests] = useState(["Kabir Anand", "Mira Shah", "Riya Thomas"]);
  
  const handleApprove = (name) => {
    setRequests(prev => prev.filter(r => r !== name));
    setAttendees(prev => [...prev, name]);
  };
  const handleDecline = (name) => {
    setRequests(prev => prev.filter(r => r !== name));
  };

  const revenue = e.type === "Free" ? "Free" : `₹${(parseInt(e.price?.replace(/[^\d]/g, "") || "499") * attendees.length).toLocaleString()}`;

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
            <div style={{ width: 80, height: 60, borderRadius: 8, background: e.cover, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</h3>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>{e.date} · {e.time}</div>
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft: "auto" }} onClick={() => go("edit-event", e)}>
              <I.edit style={{ width: 14, height: 14 }} /> Edit Event
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Total Attendees</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{attendees.length} <span style={{ fontSize: 13, fontWeight: 400, color: "var(--ink-3)" }}>/ {e.cap || 120}</span></div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Estimated Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: e.type === "Free" ? "var(--ink-3)" : "#1f9d57" }}>{revenue}</div>
            </div>
            <div style={{ background: "var(--field)", padding: 14, borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Pending Requests</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: requests.length > 0 ? "var(--accent-2)" : "var(--ink)" }}>{requests.length}</div>
            </div>
          </div>

          {requests.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)" }} />
                Pending Approvals ({requests.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map(r => (
                  <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={r} size={32} />
                      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleDecline(r)} style={{ color: "#ef4444" }}>Decline</button>
                      <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleApprove(r)}>Approve</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Confirmed Attendees ({attendees.length})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {attendees.map(a => (
                <div key={a} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={a} size={28} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{a}</span>
                  </div>
                  <span style={{ fontSize: 11.5, color: "#1f9d57", display: "flex", alignItems: "center", gap: 4 }}><I.check style={{ width: 12, height: 12 }} /> Confirmed</span>
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
