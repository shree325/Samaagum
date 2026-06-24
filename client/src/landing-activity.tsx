// @ts-nocheck
/* ============================================================
   Samaagum landing — Discussions, Activity, CTA, Footer
   ============================================================ */

/* ---------------- Discussions ---------------- */
const THREAD = [
  { who: "Mira Shah", txt: "Anyone going to Design Systems Night on Saturday? Looking for a +1 👀", me: false, reacts: ["Same!", "I'm in"] },
  { who: "You", txt: "Yes! RSVP'd this morning — let's go together.", me: true },
  { who: "Dev Kapoor", txt: "Dropping the deck from last week's critique here for everyone.", me: false, reacts: ["Helpful · 9"] },
  { who: "You", txt: "This is gold. Pinning it to the community.", me: true },
];
function Discussions() {
  return (
    <section className="section" id="discussions">
      <div className="wrap center">
        <Reveal y={16}><span className="eyebrow-pill"><span className="grad-dot" />Discussions</span></Reveal>
        <Reveal y={20} delay={80}><h2 className="h-section" style={{ marginTop: 20 }}>Conversations that<br /><span className="glow-text">keep going.</span></h2></Reveal>
        <Reveal y={20} delay={160}><p className="sub-section">Threads, polls and pinned posts inside every community — so the conversation never stops at the event door.</p></Reveal>
      </div>
      <div className="wrap">
        <div className="thread">
          {THREAD.map((m, i) => (
            <Reveal key={i} y={22} delay={i * 120} className={`msg ${m.me ? "me" : ""}`} style={{}}>
              <div className="ava" style={{ background: m.me ? "var(--accent-grad)" : gradFor(m.who) }}>{initials(m.who)}</div>
              <div className="bubble">
                <div className="who">{m.who}</div>
                <div className="txt">{m.txt}</div>
                {m.reacts && <div className="reacts">{m.reacts.map(r => <span key={r} className="react">{r}</span>)}</div>}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Platform Activity ---------------- */
function ActivityItem({ a }) {
  return (
    <div className="activity-item">
      <div className="ava" style={{ background: gradFor(a.who) }}>{initials(a.who)}</div>
      <div className="t"><b>{a.who}</b> {a.t} <b>{a.obj}</b></div>
      <div className="ago">{a.ago}</div>
    </div>
  );
}
function PlatformActivity() {
  const feed = [...ACTIVITY, ...ACTIVITY];
  const STATS = [
    { n: 240, sfx: "k+", l: "Members worldwide", c1: "#ff6b4a", c2: "#ff4d8d" },
    { n: 18, sfx: "k+", l: "Events hosted", c1: "#6d5efc", c2: "#2a7fff" },
    { n: 42, sfx: "", l: "Cities & growing", c1: "#10b981", c2: "#22d3ee" },
    { n: 1.4, sfx: "M", dec: 1, l: "Messages / month", c1: "#f59e0b", c2: "#ef6f53" },
  ];
  return (
    <section className="section" id="activity">
      <div className="sec-glow" style={{ width: 600, height: 600, background: "var(--accent-2)", top: "0%", left: "20%", opacity: 0.14 }} />
      <div className="wrap center" style={{ position: "relative", zIndex: 2 }}>
        <Reveal y={16}><span className="eyebrow-pill"><span className="pulse" />Live right now</span></Reveal>
        <Reveal y={20} delay={80}><h2 className="h-section" style={{ marginTop: 20 }}>A platform that's<br /><span className="glow-text">always alive.</span></h2></Reveal>
      </div>

      <div className="wrap">
        <div className="stats-row">
          {STATS.map((s, i) => (
            <Reveal key={s.l} y={24} delay={i * 80}>
              <div className="stat-card glass-card">
                <div className="sec-glow" style={{ width: 180, height: 180, background: s.c1, top: "-30%", right: "-20%", opacity: 0.22, filter: "blur(50px)" }} />
                <div className="n" style={{ position: "relative" }}><span className="glow-text"><CountUp to={s.n} suffix={s.sfx} decimals={s.dec || 0} /></span></div>
                <div className="l">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="activity-wrap">
          <Reveal y={26}>
            <div className="glass-card activity-feed">
              <div className="activity-col">
                {feed.map((a, i) => <ActivityItem key={i} a={a} />)}
              </div>
            </div>
          </Reveal>
          <Reveal y={26} delay={100}>
            <div className="glass-card map-card">
              <div className="map-dots" />
              <div className="sec-glow" style={{ width: 300, height: 300, background: "var(--accent-1)", top: "20%", left: "30%", opacity: 0.18 }} />
              {CITIES.map((c) => (
                <div key={c.n} className="map-pin2" style={{ left: c.x + "%", top: c.y + "%" }}>
                  <span className="ring" /><span className="core" />
                  {["Bengaluru", "London", "New York"].includes(c.n) && <span className="lbl">{c.n}</span>}
                </div>
              ))}
              <div style={{ position: "absolute", left: 22, bottom: 20, zIndex: 3 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22 }}>1,243 events</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>happening this month</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */
function FinalCTA() {
  const ringRef = useScrub((p, r, vh, el) => {
    el.style.transform = `translate(-50%,-50%) scale(${(0.9 + p * 0.3).toFixed(3)})`;
    el.style.opacity = `${(0.4 + range(p, 0.2, 0.7) * 0.6).toFixed(2)}`;
  });
  return (
    <section className="cta-final">
      <div className="sec-glow" style={{ width: 700, height: 500, background: "var(--accent-2)", top: "30%", left: "50%", transform: "translateX(-50%)", opacity: 0.28 }} />
      <div className="sec-glow" style={{ width: 460, height: 460, background: "var(--accent-1)", top: "10%", left: "30%", opacity: 0.2 }} />
      <div ref={ringRef} style={{ position: "absolute", left: "50%", top: "50%" }}>
        {[300, 520, 760, 1020].map((d) => (
          <div key={d} className="cta-ring" style={{ width: d, height: d }} />
        ))}
      </div>
      <div className="wrap" style={{ position: "relative", zIndex: 3 }}>
        <Reveal y={16}><span className="eyebrow-pill" style={{ marginBottom: 24 }}><span className="grad-dot" />Your people are waiting</span></Reveal>
        <Reveal y={24} delay={80}><h2>Find your people.<br /><span className="glow-text">Start today.</span></h2></Reveal>
        <Reveal y={20} delay={160}><p className="sub-section">Join Samaagum free. Create a community, discover events, and meet the people who'll shape what's next.</p></Reveal>
        <Reveal y={20} delay={240}>
          <div className="hero-cta">
            <a href={AUTH} className="btn btn-primary">Get started — it's free {I.arrow()}</a>
            <a href={AUTH} className="btn btn-ghost">Log in</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer() {
  const cols = [
    ["Product", ["Communities", "Events", "Networking", "Profiles", "Discussions"]],
    ["Company", ["About", "Careers", "Blog", "Press"]],
    ["Resources", ["Help center", "Guidelines", "Privacy", "Terms"]],
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark size={20} />
            <p>The premium home for communities, events and the people who make them happen.</p>
          </div>
          {cols.map(([h, links]) => (
            <div key={h}>
              <h5>{h}</h5>
              {links.map(l => (
                <a key={l} href={AUTH}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© 2026 Samaagum. Crafted for community.</span>
          <span style={{ display: "inline-flex", gap: 18 }}>
            <a href={AUTH} style={{ display: "inline", margin: 0 }}>Privacy</a>
            <a href={AUTH} style={{ display: "inline", margin: 0 }}>Terms</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Discussions, PlatformActivity, FinalCTA, Footer, ActivityItem });
