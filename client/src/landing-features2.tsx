// @ts-nocheck
/* ============================================================
   Samaagum landing — Networking, Rich Profiles
   ============================================================ */

/* ---------------- Networking constellation ---------------- */
const NET_NODES = [
  { x: 50, y: 49, n: "You", you: true, s: 66 },
  { x: 17, y: 23, n: "Mira Shah", s: 50 },
  { x: 83, y: 19, n: "Leo Park", s: 46 },
  { x: 11, y: 63, n: "Zoya Nair", s: 48 },
  { x: 89, y: 60, n: "Kabir Anand", s: 52 },
  { x: 33, y: 87, n: "Sara Iyer", s: 44 },
  { x: 71, y: 88, n: "Noah Field", s: 50 },
];
const NET_EDGES = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [1, 3], [2, 4], [5, 6], [1, 0], [4, 6]];

function Networking() {
  const stageRef = useScrub((p, r, vh, el) => {
    const sp = easeOutCubic(range(p, 0.1, 0.58));
    el.querySelectorAll(".net-edge").forEach((path, i) => {
      path.style.strokeDashoffset = `${(1 - clamp((sp - i * 0.04) / 0.55)).toFixed(3)}`;
    });
    el.querySelectorAll(".net-node").forEach((node, i) => {
      const s = lerp(0.25, 1, clamp((sp - i * 0.05) / 0.5));
      node.style.transform = `translate(-50%,-50%) scale(${s.toFixed(3)})`;
      node.style.opacity = `${clamp((sp - i * 0.04) / 0.3).toFixed(2)}`;
    });
  });
  return (
    <section className="section" id="networking">
      <div className="sec-glow" style={{ width: 540, height: 540, background: "var(--accent-2)", top: "20%", right: "-8%", opacity: 0.16 }} />
      <div className="wrap">
        <div className="net-grid">
          <div className="constellation" ref={stageRef}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="netgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="var(--accent-1)" /><stop offset="1" stopColor="var(--accent-2)" />
                </linearGradient>
              </defs>
              {NET_EDGES.map(([a, b], i) => (
                <path key={i} className="net-edge" pathLength="1" vectorEffect="non-scaling-stroke"
                  style={{ strokeDashoffset: REDUCED ? 0 : 1 }}
                  d={`M ${NET_NODES[a].x} ${NET_NODES[a].y} L ${NET_NODES[b].x} ${NET_NODES[b].y}`} />
              ))}
            </svg>
            {NET_NODES.map((nd, i) => (
              <div key={i} className={`net-node ${nd.you ? "you" : ""}`} style={{ left: nd.x + "%", top: nd.y + "%" }}>
                <div className="ava" style={{ width: nd.s, height: nd.s, background: nd.you ? "var(--accent-grad)" : gradFor(nd.n), fontSize: nd.you ? 15 : 13 }}>{initials(nd.n)}</div>
                <span className="nm">{nd.n}</span>
              </div>
            ))}
          </div>

          <div>
            <Reveal y={16}><span className="eyebrow-pill"><span className="grad-dot" />Networking</span></Reveal>
            <Reveal y={20} delay={80}><h2 className="h-section" style={{ marginTop: 20 }}>Meet the people<br /><span className="glow-text">worth knowing.</span></h2></Reveal>
            <Reveal y={20} delay={140}><p className="sub-section">Samaagum maps the people around every community and event — so the right introduction is always one tap away.</p></Reveal>
            <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                ["Warm intros", "See who you have in common before you reach out."],
                ["Shared rooms", "Discover the communities and events you both attend."],
                ["No cold DMs", "Connect through context, not spam."],
              ].map(([t, d], i) => (
                <Reveal key={t} y={18} delay={180 + i * 70}>
                  <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 9, background: "var(--accent-soft)", border: "1px solid color-mix(in oklch, var(--accent-2) 40%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-2)", flexShrink: 0, marginTop: 1 }}>{I.check()}</span>
                    <div><div style={{ fontWeight: 600, fontSize: 15.5 }}>{t}</div><div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 3 }}>{d}</div></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Rich Profiles (3D tilt) ---------------- */
function FloatBadge({ pos, speed, children, style }) {
  const ref = useScrub((p, r, vh, el) => {
    const k = (p - 0.5) * 2;
    el.style.transform = `translateY(${(k * speed).toFixed(1)}px)`;
  });
  return <div className="float-badge glass-card" ref={ref} style={{ ...pos, ...style }}>{children}</div>;
}
function Profiles() {
  const cardRef = useTilt(9);
  return (
    <section className="section" id="profiles">
      <div className="sec-glow" style={{ width: 520, height: 520, background: "#e5489d", bottom: "0%", left: "0%", opacity: 0.14 }} />
      <div className="wrap">
        <div className="profile-grid">
          <div>
            <Reveal y={16}><span className="eyebrow-pill"><span className="grad-dot" />Rich public profiles</span></Reveal>
            <Reveal y={20} delay={80}><h2 className="h-section" style={{ marginTop: 20 }}>A profile that<br /><span className="glow-text">opens doors.</span></h2></Reveal>
            <Reveal y={20} delay={140}><p className="sub-section">More than a headshot. Show the communities you lead, the events you've hosted, what you're into and how to reach you — all in one beautiful, verifiable page.</p></Reveal>
            <Reveal y={20} delay={210}>
              <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={AUTH} className="btn btn-primary">Claim your profile {I.arrow()}</a>
                <a href="#activity" className="btn btn-ghost">See it live</a>
              </div>
            </Reveal>
          </div>

          <div className="profile-stage">
            <FloatBadge pos={{ top: "-4%", right: "8%" }} speed={34} style={{ zIndex: 4 }}>
              {I.verify({ width: 16, height: 16, style: { color: "var(--accent-2)" } })} Verified host
            </FloatBadge>
            <FloatBadge pos={{ bottom: "6%", left: "-3%" }} speed={-30} style={{ zIndex: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#5ef0b0" }} /> Open to connect
            </FloatBadge>
            <div className="profile-card glass-card" ref={cardRef}>
              <div className="pc-cover" style={{ background: "linear-gradient(120deg,#ff6b4a,#6d5efc)" }}><div className="stripes" /></div>
              <div className="pc-body">
                <div className="pc-avatar" style={{ background: gradFor("Aanya Rao") }}>AR</div>
                <div className="pc-name">Aanya Rao <span className="pc-verify">{I.verify({ width: 19, height: 19, style: { color: "var(--accent-2)" } })}</span></div>
                <div className="pc-role">Founder · Design Guild &amp; Founders Club · Bengaluru</div>
                <div className="pc-stats">
                  <div className="pc-stat"><div className="n">3</div><div className="l">Communities</div></div>
                  <div className="pc-stat"><div className="n">28</div><div className="l">Events hosted</div></div>
                  <div className="pc-stat"><div className="n">1.2k</div><div className="l">Connections</div></div>
                </div>
                <div className="pc-chips">
                  {["Startups", "Design", "Public speaking", "Mentoring", "Coffee chats"].map(c => <span key={c} className="pc-chip">{c}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Networking, Profiles, FloatBadge });
