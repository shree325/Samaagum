/* ============================================================
   Samaagum landing — Communities, Events
   ============================================================ */
const { useState } = React;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ---------------- Communities (scatter → arc) ---------------- */
const COMM_LAYOUT = [
  { fx: -430, fy: 36, rot: -7 },
  { fx: -215, fy: -34, rot: -3 },
  { fx: 0, fy: 28, rot: 0 },
  { fx: 215, fy: -34, rot: 3 },
  { fx: 430, fy: 36, rot: 7 },
];
function Communities() {
  const stageRef = useScrub((p, r, vh, el) => {
    const sp = easeOutCubic(range(p, 0.1, 0.52));
    const cards = el.querySelectorAll(".comm-card");
    cards.forEach((c, i) => {
      const L = COMM_LAYOUT[i] || COMM_LAYOUT[2];
      const x = lerp(L.fx * 0.16, L.fx, sp);
      const y = lerp(L.fy + 24, L.fy, sp);
      const rot = lerp(L.rot * 2.4, L.rot, sp);
      const sc = lerp(0.82, 1, sp);
      c.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
      c.style.opacity = `${lerp(0.25, 1, range(p, 0.12, 0.4)).toFixed(2)}`;
      c.style.zIndex = i === 2 ? 5 : 4 - Math.abs(i - 2);
    });
  });
  return (
    <section className="section" id="communities">
      <div className="sec-glow" style={{ width: 600, height: 600, background: "var(--accent-1)", top: "10%", left: "-10%", opacity: 0.18 }} />
      <div className="wrap center" style={{ position: "relative", zIndex: 2 }}>
        <Reveal y={16}><span className="eyebrow-pill"><span className="grad-dot" />Communities</span></Reveal>
        <Reveal y={20} delay={80}><h2 className="h-section" style={{ marginTop: 20 }}>Spaces where people<br /><span className="glow-text">actually belong.</span></h2></Reveal>
        <Reveal y={20} delay={160}><p className="sub-section">Start a community in minutes. Give it a home with members, events, discussions and a feed that keeps everyone in the loop.</p></Reveal>
      </div>
      <div className="wrap">
        <div className="comm-stage" ref={stageRef}>
          {COMMUNITIES.map((c, i) => {
            const L = COMM_LAYOUT[i];
            return (
              <div key={c.name} className="comm-card glass-card"
                style={{ transform: `translate(${L.fx}px, ${L.fy}px) rotate(${L.rot}deg)` }}>
                <div className="cc-head">
                  <div className="comm-cover" style={{ background: `linear-gradient(135deg, ${c.c1}, ${c.c2})` }} />
                  <div>
                    <h4>{c.name}</h4>
                    <div className="meta">{c.members} members · {c.tag}</div>
                  </div>
                </div>
                <div className="desc">{c.desc}</div>
                <div className="comm-foot">
                  <AvaRow names={PEOPLE.slice(i, i + 4).concat(PEOPLE).slice(0, 4)} />
                  <span className="tag-pill">{c.tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Events (scroll-linked drift) ---------------- */
function EventCard({ ev }) {
  const [rsvp, setRsvp] = useState(false);
  return (
    <div className="event-card glass-card">
      <div className="event-thumb" style={{ background: `linear-gradient(135deg, ${ev.c1}, ${ev.c2})` }}>
        <div className="stripes" />
        <div className="event-date"><div className="d">{ev.day}</div><div className="m">{ev.mon}</div></div>
        {ev.live && <div className="event-live"><i />Live</div>}
      </div>
      <div className="event-body">
        <h4>{ev.title}</h4>
        <div className="loc">{I.pin({ style: { color: "var(--ink-3)" } })}{ev.loc}</div>
        <div className="event-foot">
          <AvaRow names={PEOPLE.slice(0, ev.going)} size={26} />
          <button className="rsvp" onClick={() => setRsvp(r => !r)} style={rsvp ? { background: "var(--accent-grad)", borderColor: "transparent", color: "#fff" } : {}}>
            {rsvp ? "Going ✓" : "RSVP"}
          </button>
        </div>
      </div>
    </div>
  );
}
function Events() {
  const railRef = useScrub((p, r, vh, el) => {
    const drift = lerp(80, -360, range(p, 0.05, 0.95));
    el.style.transform = `translateX(${drift.toFixed(1)}px)`;
  });
  return (
    <section className="section" id="events" style={{ overflow: "hidden" }}>
      <div className="wrap" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <Reveal y={16}><span className="eyebrow-pill"><span className="grad-dot" />Events</span></Reveal>
            <Reveal y={20} delay={80}><h2 className="h-section" style={{ marginTop: 20 }}>Discover what's<br /><span className="glow-text">happening near you.</span></h2></Reveal>
          </div>
          <Reveal y={20} delay={120}><p className="sub-section" style={{ marginTop: 0 }}>From rooftop sessions to demo days — browse, RSVP and show up. Every event lives inside the community that hosts it.</p></Reveal>
        </div>
      </div>
      <div style={{ marginTop: 48, position: "relative", zIndex: 2, WebkitMaskImage: "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)", maskImage: "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)" }}>
        <div className="wrap" style={{ maxWidth: "none", paddingLeft: "max(28px, calc((100vw - 1200px)/2 + 28px))" }}>
          <div className="events-rail" ref={railRef}>
            {EVENTS.map((ev) => <EventCard key={ev.title} ev={ev} />)}
            <div className="event-card glass-card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 360 }}>
              <a href={AUTH} className="btn btn-ghost">See all events {I.arrow()}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Communities, Events, EventCard, easeOutCubic });
