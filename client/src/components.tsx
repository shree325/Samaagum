/* ============================================================
   Samaagum — shared atoms, icons, data, immersive panel
   ============================================================ */
var { useState, useRef, useEffect, useCallback } = React;

/* ---------------- Icons ---------------- */
const Ic = {
  arrowL: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowR: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  mail: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  check: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  cam: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.2" stroke="currentColor" strokeWidth="1.8"/></svg>,
  user: (p) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="8.5" r="3.8" stroke="currentColor" strokeWidth="1.8"/><path d="M4.5 20c1-3.8 4-5.5 7.5-5.5s6.5 1.7 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  pin: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 21c4-4.5 7-8 7-11a7 7 0 10-14 0c0 3 3 6.5 7 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8"/></svg>,
  spark: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>,
  cal: (p) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}><rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  briefcase: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="7.5" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><path d="M9 7.5V6a2 2 0 012-2h2a2 2 0 012 2v1.5" stroke="currentColor" strokeWidth="1.7"/></svg>,
  mic: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  compass: (p) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M15.5 8.5l-2 5-5 2 2-5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  google: (p) => <svg width="19" height="19" viewBox="0 0 24 24" {...p}><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C17.1 2.6 14.8 1.6 12 1.6 6.7 1.6 2.4 5.9 2.4 12s4.3 10.4 9.6 10.4c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/><path fill="#34A853" d="M3.9 7.3l3.2 2.3C8 7.7 9.8 6.4 12 6.4c1.9 0 3.1.8 3.9 1.5l2.6-2.6C17.1 3.4 14.8 2.4 12 2.4 8 2.4 4.6 4.7 3.9 7.3z" opacity="0"/></svg>,
  linkedin: (p) => <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>,
};

/* ---------------- Logo ---------------- */
function Mark({ size = 28 }) {
  const id = "mk" + Math.round(size);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent-1)"/><stop offset="1" stopColor="var(--accent-2)"/>
        </linearGradient>
      </defs>
      <circle cx="15" cy="16" r="9.2" fill={`url(#${id})`} opacity="0.92"/>
      <circle cx="25" cy="16" r="9.2" fill={`url(#${id})`} opacity="0.6"/>
      <circle cx="20" cy="25" r="9.2" fill={`url(#${id})`} opacity="0.8"/>
    </svg>
  );
}
function Wordmark({ size = 20, color, mark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {mark && <Mark size={size * 1.35} />}
      <span className="wm" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", color }}>samaagum</span>
    </span>
  );
}

/* ---------------- Avatar helper ---------------- */
function gradFor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const a = Math.abs(h) % 360, b = (a + 40) % 360;
  return `linear-gradient(135deg, hsl(${a} 70% 62%), hsl(${b} 72% 52%))`;
}
function initials(name) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/* ---------------- Buttons ---------------- */
function SBtn({ variant = "primary", block, loading, children, leftIcon, rightIcon, ...rest }) {
  return (
    <button className={`sbtn sbtn--${variant} ${block ? "sbtn--block" : ""} focusable`} disabled={loading || rest.disabled} {...rest}>
      {loading ? <span className="spin" /> : leftIcon}
      {!loading && children}
      {!loading && rightIcon}
    </button>
  );
}

/* ---------------- Field ---------------- */
function Field({ label, icon, error, ...rest }) {
  return (
    <div className="sfield">
      {label && <label>{label}</label>}
      <div className="sfield-wrap">
        {icon && <span className="lead">{icon}</span>}
        <input className={`focusable ${icon ? "" : "no-icon"}`} {...rest} />
      </div>
      {error && <div className="err">{error}</div>}
    </div>
  );
}

/* ---------------- OTP input ---------------- */
function OTPInput({ length = 6, value, onChange, status }) {
  const refs = useRef([]);
  const set = (i, v) => {
    const next = value.split("");
    next[i] = v;
    onChange(next.join("").slice(0, length));
  };
  const onKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) set(i, "");
      else if (i > 0) { set(i - 1, ""); refs.current[i - 1]?.focus(); }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };
  const onInput = (i, e) => {
    const d = e.target.value.replace(/\D/g, "");
    if (!d) return;
    if (d.length > 1) {
      const arr = d.slice(0, length).split("");
      onChange(arr.join(""));
      const last = Math.min(arr.length, length - 1);
      refs.current[last]?.focus();
      return;
    }
    set(i, d);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };
  return (
    <div className={`otp ${status || ""}`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i} ref={el => refs.current[i] = el}
          className={`cell focusable ${value[i] ? "filled" : ""}`}
          inputMode="numeric" maxLength={1} value={value[i] || ""}
          onChange={(e) => onInput(i, e)} onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

/* ---------------- Data ---------------- */
const INTERESTS = [
  ["Startups", "#ff6b4a"], ["Design", "#6d5efc"], ["Technology", "#2a7fff"], ["Music", "#e5489d"],
  ["Art & Culture", "#f59e0b"], ["Wellness", "#10b981"], ["Food & Drink", "#ef6f53"], ["Networking", "#8b5cf6"],
  ["Investing", "#0ea5a4"], ["Travel", "#3b82f6"], ["Gaming", "#a855f7"], ["Film & Media", "#f43f5e"],
  ["Writing", "#64748b"], ["Sustainability", "#22c55e"], ["Sports", "#f97316"], ["Photography", "#06b6d4"],
];
const ROLES = [
  ["Founder", "briefcase"], ["Creator", "mic"], ["Investor", "spark"], ["Explorer", "compass"],
];
const CITIES = [
  ["Bengaluru", "India", "🇮🇳"], ["Mumbai", "India", "🇮🇳"], ["San Francisco", "USA", "🇺🇸"],
  ["New York", "USA", "🇺🇸"], ["London", "UK", "🇬🇧"], ["Singapore", "SG", "🇸🇬"],
  ["Dubai", "UAE", "🇦🇪"], ["Berlin", "Germany", "🇩🇪"],
];
const EVENTS = [
  { t: "Founders & Funders Mixer", d: "Thu · Indiranagar", tag: "Networking", thumb: "linear-gradient(135deg,#ff6b4a,#ff4d8d)", going: 3 },
  { t: "Design Systems Night", d: "Sat · WeWork Galaxy", tag: "Design", thumb: "linear-gradient(135deg,#6d5efc,#2a7fff)", going: 5 },
  { t: "Sunset Rooftop Sessions", d: "Fri · Koramangala", tag: "Music", thumb: "linear-gradient(135deg,#f59e0b,#ef6f53)", going: 4 },
];
const PEOPLE = ["Aanya R", "Dev K", "Mira S", "Leo P", "Zoya N", "Kabir A"];

/* ---------------- Mesh background ---------------- */
const MESH_SETS = {
  sunset: { base: "#1a1330", blobs: [
    { c: "var(--accent-1)", s: 360, x: "-12%", y: "-18%" }, { c: "var(--accent-2)", s: 400, x: "52%", y: "34%" },
    { c: "#ff4d8d", s: 240, x: "8%", y: "62%" }, { c: "#ffb86b", s: 190, x: "72%", y: "-12%" } ] },
  aurora: { base: "#06231f", blobs: [
    { c: "#10b981", s: 360, x: "-10%", y: "-12%" }, { c: "var(--accent-2)", s: 360, x: "55%", y: "20%" },
    { c: "#22d3ee", s: 260, x: "20%", y: "64%" }, { c: "#a3e635", s: 170, x: "70%", y: "70%" } ] },
  dusk: { base: "#150f2e", blobs: [
    { c: "#6d5efc", s: 380, x: "-8%", y: "-10%" }, { c: "#b15efc", s: 320, x: "55%", y: "40%" },
    { c: "#2a3fff", s: 280, x: "10%", y: "60%" }, { c: "#ff5a7a", s: 170, x: "72%", y: "-6%" } ] },
  plum: { base: "#1e1023", blobs: [
    { c: "#e5489d", s: 360, x: "-10%", y: "-14%" }, { c: "#8b5cf6", s: 380, x: "56%", y: "30%" },
    { c: "#ff6b4a", s: 220, x: "14%", y: "64%" }, { c: "#f59e0b", s: 160, x: "70%", y: "72%" } ] },
};
function MeshBg({ gradient = "sunset" }) {
  const set = MESH_SETS[gradient] || MESH_SETS.sunset;
  return (
    <React.Fragment>
      <div className="lp-bg" style={{ background: set.base }} />
      <div className="lp-mesh">
        {set.blobs.map((b, i) => (
          <div key={i} className="lp-blob" style={{
            width: b.s, height: b.s, left: b.x, top: b.y, background: b.c,
            animationDelay: `${i * -3.5}s`, animationDuration: `${16 + i * 3}s`,
          }} />
        ))}
      </div>
      <div className="lp-grain" />
      <div className="lp-noise" />
    </React.Fragment>
  );
}

/* ---------------- Floating event card ---------------- */
function FloatCard({ ev, style }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: py * -10, y: px * 12 });
  };
  return (
    <div className="float-card"
      style={{ ...style, transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <div className="fc-top">
        <div className="fc-thumb" style={{ background: ev.thumb }}><span /></div>
        <div className="fc-meta">
          <div className="t">{ev.t}</div>
          <div className="d">{ev.d}</div>
        </div>
      </div>
      <div className="fc-row">
        <div className="fc-going">
          {Array.from({ length: ev.going }).map((_, i) => (
            <div key={i} className="a" style={{ background: gradFor(PEOPLE[(i + ev.going) % PEOPLE.length]) }} />
          ))}
        </div>
        <span className="fc-pill">{ev.tag}</span>
      </div>
    </div>
  );
}

/* ---------------- Immersive left panel ---------------- */
const LP_COPY = {
  default: { eye: "Live in your city", title: "Where your\ncommunity\ncomes together.", sub: "Discover curated events, meet your people, and build your network — all in one beautifully simple place." },
  done: { eye: "You're in", title: "Welcome to\nthe gathering.", sub: "Your first events are already waiting. Let's find your people." },
};
function LeftPanel({ gradient, phase = "default" }) {
  const copy = LP_COPY[phase] || LP_COPY.default;
  return (
    <div className="lp">
      <MeshBg gradient={gradient} />
      {/* floating cards */}
      <FloatCard ev={EVENTS[0]} style={{ top: "16%", right: "-26px", animationDelay: "0s" }} />
      <FloatCard ev={EVENTS[1]} style={{ top: "44%", right: "8%", animationDelay: "-2.2s" }} />
      <FloatCard ev={EVENTS[2]} style={{ bottom: "16%", left: "-18px", animationDelay: "-4s" }} />

      <div className="lp-top"><Wordmark size={20} color="#fff" /></div>

      <div className="lp-mid">
        <span className="lp-eyebrow"><span className="pulse" />{copy.eye}</span>
        <h1 className="lp-title">{copy.title.split("\n").map((l, i) => <React.Fragment key={i}>{l}<br/></React.Fragment>)}</h1>
        <p className="lp-sub">{copy.sub}</p>
      </div>

      <div className="lp-foot">
        <div className="lp-avatars">
          {PEOPLE.slice(0, 4).map((p, i) => <div key={i} className="av" style={{ background: gradFor(p) }}>{initials(p)}</div>)}
          <div className="av" style={{ background: "rgba(255,255,255,0.22)", fontSize: 11 }}>+9k</div>
        </div>
        <div className="lp-div" />
        <div className="lp-stat"><div className="n">1,200+</div><div className="l">events monthly</div></div>
      </div>
    </div>
  );
}

/* ---------------- Confetti ---------------- */
function Confetti() {
  const cols = ["var(--accent-1)", "var(--accent-2)", "#ffb86b", "#6effc0", "#e5489d"];
  const bits = Array.from({ length: 36 });
  return (
    <div className="confetti">
      {bits.map((_, i) => (
        <i key={i} style={{
          left: `${Math.random() * 100}%`,
          background: cols[i % cols.length],
          animationDuration: `${1.6 + Math.random() * 1.4}s`,
          animationDelay: `${Math.random() * 0.5}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  );
}

/* ---------------- Reveal (transition-based, resting state visible) ---------------- */
function Reveal({ dir = "f", children, style }) {
  const [enter, setEnter] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setEnter(false), 24);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className={`reveal ${dir === "b" ? "from-left" : "from-right"} ${enter ? "enter" : ""}`} style={style}>
      {children}
    </div>
  );
}

/* countdown hook */
function useCountdown(start, dep) {
  const [n, setN] = useState(start);
  useEffect(() => {
    setN(start);
    const id = setInterval(() => setN(v => (v <= 1 ? (clearInterval(id), 0) : v - 1)), 1000);
    return () => clearInterval(id);
  }, [dep]);
  return [n, () => setN(start)];
}

Object.assign(window, {
  Ic, Mark, Wordmark, SBtn, Field, OTPInput, FloatCard, LeftPanel, MeshBg, Confetti, Reveal,
  gradFor, initials, useCountdown,
  INTERESTS, ROLES, CITIES, EVENTS, PEOPLE,
});
