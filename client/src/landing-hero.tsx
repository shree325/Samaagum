import React, { useEffect, useState } from 'react';
import { PEOPLE, Wordmark, gradFor, initials } from './components';
import { I, REDUCED, Reveal, clamp, useScrub } from './landing-core';
import { Communities, Events } from './landing-features';
import { Networking, Profiles } from './landing-features2';

/* ============================================================
   Samaagum landing — Nav, Hero, Trust marquee
   ============================================================ */

export const AUTH = "/pages/Samaagum Auth.html";

/* ---------------- Nav ---------------- */
export function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav ${stuck ? "stuck" : ""}`}>
      <div className="nav-inner">
        <a href="#top" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}><Wordmark size={19} /></a>
        <div className="nav-links">
          <a href="#communities">Communities</a>
          <a href="#events">Events</a>
          <a href="#networking">Networking</a>
          <a href="#profiles">Profiles</a>
          <a href="#activity">Activity</a>
        </div>
        <div className="nav-actions">
          <a href={`${AUTH}#login`} className="nav-login">Log in</a>
          <a href={`${AUTH}#signup`} className="btn btn-primary btn-sm">Get started{I.arrow({ width: 15, height: 15 })}</a>
          <button className="btn-ghost btn btn-sm nav-burger" aria-label="Menu" onClick={() => setOpen(o => !o)} style={{ padding: 9 }}>{I.menu()}</button>
        </div>
      </div>
      {open && (
        <div className="glass-card" style={{ position: "absolute", top: 74, left: 24, right: 24, padding: 16, display: "flex", flexDirection: "column", gap: 4 }}>
          {["communities", "events", "networking", "profiles", "activity"].map(s => (
            <a key={s} href={`#${s}`} onClick={() => setOpen(false)} style={{ padding: "12px 14px", borderRadius: 12, color: "var(--ink-2)", textDecoration: "none", textTransform: "capitalize", fontWeight: 600 }}>{s}</a>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ---------------- Hero floating chip ---------------- */
export function HeroFloat({ pos, speed, delay = 0, children }) {
  const ref = useScrub((p, r, vh, el) => {
    const hp = clamp(-r.top / vh);
    el.style.transform = `translateY(${(hp * speed).toFixed(1)}px)`;
  });
  return (
    <div className="hero-float" ref={ref} style={pos}>
      <div style={{ animation: REDUCED ? "none" : `floatY ${6 + delay}s var(--ease-out) ${-delay}s infinite` }}>
        {children}
      </div>
    </div>
  );
}

export function AvaRow({ names, size = 24 }) {
  return (
    <div className="av-stack">
      {names.map((n, i) => <div key={i} className="a" style={{ background: gradFor(n), width: size, height: size }}>{initials(n)}</div>)}
    </div>
  );
}

/* ---------------- Hero ---------------- */
export function Hero() {
  const meshRef = useScrub((p, r, vh, el) => {
    const hp = clamp(-r.top / vh);
    el.style.transform = `translateY(${(hp * 130).toFixed(1)}px) scale(${(1 + hp * 0.08).toFixed(3)})`;
  });
  const innerRef = useScrub((p, r, vh, el) => {
    const hp = clamp(-r.top / vh);
    el.style.transform = `translateY(${(hp * -64).toFixed(1)}px)`;
    el.style.opacity = `${clamp(1 - hp * 1.15)}`;
  });

  return (
    <header className="hero" id="top">
      <div className="hero-mesh" ref={meshRef}>
        <div className="hero-blob" style={{ width: 520, height: 520, top: "-12%", left: "-6%", background: "var(--accent-1)" }} />
        <div className="hero-blob" style={{ width: 560, height: 560, top: "8%", right: "-10%", background: "var(--accent-2)" }} />
        <div className="hero-blob" style={{ width: 360, height: 360, bottom: "-14%", left: "30%", background: "#e5489d", opacity: 0.55 }} />
      </div>
      <div className="hero-grid-fade" />
      <div className="hero-noise" />

      {/* floating chips */}
      <HeroFloat pos={{ top: "21%", left: "5%" }} speed={-150} delay={0.6}>
        <div className="glass-card" style={{ padding: 14, width: 224 }}>
          <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6d5efc,#2a7fff)", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Design Systems Night</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>Sat · WeWork Galaxy</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 13 }}>
            <AvaRow names={PEOPLE.slice(0, 4)} />
            <span className="tag-pill">Going</span>
          </div>
        </div>
      </HeroFloat>

      <HeroFloat pos={{ top: "15%", right: "7%" }} speed={140} delay={1.2}>
        <div className="glass-card" style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--accent-grad)" }} />
          <span style={{ fontSize: 13.5, fontWeight: 600 }}>Founders Club</span>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>· 4.2k members</span>
        </div>
      </HeroFloat>

      <HeroFloat pos={{ top: "55%", right: "4%" }} speed={-110} delay={0.3}>
        <div className="glass-card" style={{ padding: 14, width: 200, display: "flex", gap: 11, alignItems: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: gradFor("Aanya Rao"), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>AR</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>Aanya Rao {I.verify({ width: 14, height: 14, style: { color: "var(--accent-2)" } })}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>Founder · Bengaluru</div>
          </div>
        </div>
      </HeroFloat>

      <HeroFloat pos={{ bottom: "17%", left: "7%" }} speed={120} delay={0.9}>
        <div className="glass-card" style={{ padding: "12px 16px", display: "flex", gap: 10, alignItems: "center", maxWidth: 230 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: gradFor("Dev Kapoor"), flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 11 }}>DK</div>
          <span style={{ fontSize: 13, color: "var(--ink)" }}>Count me in — see you Saturday!</span>
        </div>
      </HeroFloat>

      <HeroFloat pos={{ bottom: "22%", right: "13%" }} speed={-90} delay={1.5}>
        <div className="glass-card" style={{ padding: "12px 18px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 22 }}>+128</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>going this week</div>
        </div>
      </HeroFloat>

      {/* center */}
      <div className="wrap">
        <div className="hero-inner" ref={innerRef}>
          <Reveal y={14}><span className="eyebrow-pill"><span className="pulse" />Now live in 40+ cities</span></Reveal>
          <Reveal y={20} delay={80}><h1>Where your community <span className="glow-text">comes together.</span></h1></Reveal>
          <Reveal y={20} delay={160}><p className="hero-sub">Samaagum is the home for communities, events, networking and rich profiles — one elegant place to find your people and what's happening around you.</p></Reveal>
          <Reveal y={20} delay={240}>
            <div className="hero-cta">
              <a href={`${AUTH}#signup`} className="btn btn-primary">Get started — it's free {I.arrow()}</a>
              <a href={`${AUTH}#login`} className="btn btn-ghost">Log in</a>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="hero-scroll"><span>Scroll</span><div className="mouse"><i /></div></div>
    </header>
  );
}

/* ---------------- Trust marquee ---------------- */
export function TrustStrip() {
  const items = [
    ["Founders Club", "#ff6b4a"], ["Design Guild", "#6d5efc"], ["Indie Hackers", "#10b981"],
    ["Sound & City", "#f59e0b"], ["Wellness Collective", "#22c55e"], ["AI Builders", "#2a7fff"],
    ["Women in Tech", "#e5489d"], ["Creators Hub", "#a855f7"],
  ];
  const all = [...items, ...items];
  return (
    <section className="section-tight" style={{ paddingTop: 10 }}>
      <div className="wrap center" style={{ marginBottom: 28 }}>
        <span className="eyebrow" style={{ color: "var(--ink-3)" }}>Home to 12,000+ communities worldwide</span>
      </div>
      <div className="marquee">
        <div className="marquee-track">
          {all.map(([n, c], i) => (
            <div key={i} className="trust-pill"><span className="dot" style={{ background: c }} />{n}</div>
          ))}
        </div>
      </div>
    </section>
  );
}


