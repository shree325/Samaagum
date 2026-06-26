// @ts-nocheck
/* ============================================================
   Samaagum — showcase app (desktop + mobile + tweaks)
   ============================================================ */

const { useState, useEffect } = React;

// ── Handle Google OAuth redirect ─────────────────────────────────────────────
// After Google login, the backend redirects back here with ?token=...&auth=google
// Read the token, save it, clean the URL, and go straight to the home page.
(function handleOAuthRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const auth  = params.get('auth');
  const authError = params.get('auth_error');

  if (authError) {
    console.error('OAuth error:', authError);
    // Strip the param so the user sees the login page cleanly
    window.history.replaceState({}, '', '/');
    return;
  }

  if (token && auth) {
    // Save the real JWT token from OAuth login
    localStorage.setItem('token', decodeURIComponent(token));
    // Navigate to the home app — same path as "Enter Samaagum" button
    window.location.replace('pages/Samaagum Home.html');
  }
})();

const Lock = (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M7.5 10.5V8a4.5 4.5 0 019 0v2.5" stroke="currentColor" strokeWidth="1.8"/></svg>;

/* ---------------- Scene wrapper ---------------- */
function Scene({ m }) {
  const Cmp = SCENES[m.step];
  const wide = m.step === "interests" || m.step === "location";
  return (
    <div className={`auth-scene ${wide ? "wide" : ""}`}>
      {m.showProgress && (
        <div className="prog">
          <div className="prog-track"><div className="prog-fill" style={{ width: `${((m.pIndex + 1) / m.total) * 100}%` }} /></div>
          <span className="prog-meta">Step {m.pIndex + 1} of {m.total}</span>
        </div>
      )}
      <Reveal key={m.step} dir={m.dir}>
        <Cmp m={m} />
      </Reveal>
    </div>
  );
}

/* ---------------- Desktop split-screen ---------------- */
function DesktopAuth({ gradient }) {
  const m = useAuth();
  const showBack = m.idx > 0 && m.step !== "done";
  return (
    <div className="desk-window">
      <LeftPanel gradient={gradient} phase={m.step === "done" ? "done" : "default"} />
      <div className="auth">
        <div className="auth-topbar">
          <button className={`auth-back ${showBack ? "" : "hidden"}`} onClick={m.back}><Ic.arrowL />Back</button>
          <span className="auth-help" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Lock style={{ color: "var(--accent-2)" }} />Passwordless &amp; secure
          </span>
        </div>
        <div className="auth-body"><Scene m={m} /></div>
      </div>
    </div>
  );
}

/* ---------------- Mobile (iOS) ---------------- */
function MobileAuth({ gradient }) {
  const m = useAuth();
  const showBack = m.idx > 0 && m.step !== "done";
  const tall = m.step === "method";
  return (
    <div className="mob">
      <div className={`mob-hero ${tall ? "tall" : ""}`}>
        <MeshBg gradient={gradient} />
        <div className="mob-hero-content">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 32 }}>
            {showBack
              ? <button className="mob-back" onClick={m.back}><Ic.arrowL />Back</button>
              : <Wordmark size={17} color="#fff" />}
            {m.showProgress && (
              <div className="mdots">
                {Array.from({ length: m.total }).map((_, i) => <i key={i} className={i <= m.pIndex ? "on" : ""} />)}
              </div>
            )}
          </div>
          {tall && (
            <React.Fragment>
              <h2>Where your community comes together.</h2>
              <p>Discover events, meet your people, build your network.</p>
            </React.Fragment>
          )}
        </div>
      </div>
      <div className="mob-sheet">
        <div className="mob-grab" />
        <Reveal key={m.step} dir={m.dir} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <SceneMobileInner m={m} />
        </Reveal>
      </div>
    </div>
  );
}
/* mobile uses same screens; CTA naturally sits at bottom of the sheet */
function SceneMobileInner({ m }) {
  const Cmp = SCENES[m.step];
  return <div style={{ display: "flex", flexDirection: "column", flex: 1 }}><Cmp m={m} /></div>;
}

/* ---------------- Tweaks ---------------- */
const ACCENTS = [
  ["sunset", "linear-gradient(120deg,#ff6b4a,#6d5efc)"],
  ["violet", "linear-gradient(120deg,#8b7bff,#6d5efc)"],
  ["blue", "linear-gradient(120deg,#5eafff,#2a7fff)"],
  ["emerald", "linear-gradient(120deg,#6ee7c7,#10b981)"],
  ["coral", "linear-gradient(120deg,#ff9a6b,#ff5a7a)"],
];
const GRADS = [["sunset", "Sunset"], ["aurora", "Aurora"], ["dusk", "Dusk"], ["plum", "Plum"]];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "sunset",
  "gradient": "sunset",
  "dark": false,
  "radius": 1,
  "glass": 22
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.dark ? "dark" : "light");
    if (t.accent && t.accent !== "sunset") r.setAttribute("data-accent", t.accent);
    else r.removeAttribute("data-accent");
    r.style.setProperty("--r", String(t.radius));
    r.style.setProperty("--glass-blur", `${t.glass}px`);
    const op = Math.min(0.85, 0.30 + (t.glass / 34) * 0.45);
    r.style.setProperty("--glass-opacity", String(op));
    r.style.setProperty("--glass-bg", t.dark
      ? `rgba(28,27,42,${op * 0.9})`
      : `rgba(255,255,255,${op})`);
  }, [t]);

  // responsive width check
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const mobile = width <= 820;

  return mobile
    ? <MobileAuth gradient={t.gradient} />
    : <DesktopAuth gradient={t.gradient} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
