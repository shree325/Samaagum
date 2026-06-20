// @ts-nocheck
/* ============================================================
   Samaagum — auth flow (state machine + screens)
   Depends on components.jsx (globals)
   ============================================================ */

const { useState, useEffect, useRef } = React;

/* ---------------- State machine ---------------- */
const ORDER = {
  signup: ["method", "otp", "profile", "interests", "location", "done"],
  login:  ["method", "otp", "done"],
};
const STEP_LABELS = { method: "Sign in", otp: "Verify", profile: "Profile", interests: "Interests", location: "Location" };

function useAuth() {
  const [mode, setMode] = useState("signup");
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState("f");
  const [data, setData] = useState({ email: "", otp: "", name: "", role: "", interests: [], city: null, avatar: false, google: false });

  const order = ORDER[mode];
  const step = order[Math.min(idx, order.length - 1)];
  const set = (patch) => setData(d => ({ ...d, ...patch }));

  const goName = (name, d = "f") => { setDir(d); setIdx(order.indexOf(name)); };
  const next = () => { setDir("f"); setIdx(i => Math.min(i + 1, order.length - 1)); };
  const back = () => { setDir("b"); setIdx(i => Math.max(i - 1, 0)); };
  const switchMode = (m) => { setMode(m); setIdx(0); setDir("f"); };
  const restart = () => { setMode("signup"); setIdx(0); setDir("f"); setData({ email: "", otp: "", name: "", role: "", interests: [], city: null, avatar: false, google: false }); };

  // progress (exclude "done")
  const flow = order.filter(s => s !== "done");
  const total = flow.length;
  const pIndex = Math.min(idx, total - 1);
  const showProgress = step !== "done";

  return { mode, idx, dir, step, data, set, next, back, goName, switchMode, restart, total, pIndex, showProgress };
}

/* ---------------- Screens ---------------- */
function ScreenMethod({ m }) {
  const [email, setEmail] = useState(m.data.email);
  const [err, setErr] = useState("");
  const [gLoading, setGLoading] = useState(false);
  const [cLoading, setCLoading] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const google = () => {
    setGLoading(true);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
    // Redirect to backend — it reads clientId from platform_settings and redirects to Google
    window.location.href = `${apiBase}/api/auth/google?mode=${m.mode}`;
  };
  const cont = async () => {
    if (!valid) { setErr("Enter a valid email address"); return; }
    setCLoading(true);
    setErr("");
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const res = await fetch(`${apiBase}/api/admin/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: m.mode === 'signup' ? 'Signup' : 'Login' })
      });
      const data = await res.json();
      if (data.success) {
        m.set({ email, otp: data.code || '' });
        m.next();
      } else {
        setErr(data.message || "Failed to send verification code");
      }
    } catch (e) {
      setErr("Failed to connect to authentication service");
    } finally {
      setCLoading(false);
    }
  };

  return (
    <div>
      <h2 className="auth-h">{m.mode === "signup" ? "Create your account" : "Welcome back"}</h2>
      <p className="auth-p">{m.mode === "signup"
        ? "Join Samaagum to discover events and meet your people."
        : "Sign in to continue to your community."}</p>

      <div style={{ marginTop: 26 }}>
        <SBtn variant="google" block loading={gLoading} leftIcon={<Ic.google />} onClick={google}>
          Continue with Google
        </SBtn>
      </div>
      <div className="divider">or continue with email</div>
      <Field label="Email address" icon={<Ic.mail />} type="email" placeholder="you@email.com"
        value={email} error={err}
        onChange={(e) => { setEmail(e.target.value); setErr(""); }}
        onKeyDown={(e) => e.key === "Enter" && cont()} />
      <div style={{ marginTop: 18 }}>
        <SBtn variant="primary" block loading={cLoading} onClick={cont} rightIcon={<Ic.arrowR />}>
          {m.mode === "signup" ? "Continue" : "Send code"}
        </SBtn>
      </div>

      <p className="terms">
        {m.mode === "signup" ? (
          <React.Fragment>By continuing you agree to our <a>Terms</a> &amp; <a>Privacy Policy</a>.</React.Fragment>
        ) : <span>&nbsp;</span>}
      </p>
      <p style={{ textAlign: "center", fontSize: 13.5, color: "var(--ink-3)", marginTop: 6, marginBottom: 0 }}>
        {m.mode === "signup" ? "Already have an account? " : "New to Samaagum? "}
        <a style={{ color: "var(--accent-2)", fontWeight: 600, cursor: "pointer" }}
          onClick={() => m.switchMode(m.mode === "signup" ? "login" : "signup")}>
          {m.mode === "signup" ? "Sign in" : "Create account"}
        </a>
      </p>
    </div>
  );
}

function ScreenOtp({ m }) {
  const [code, setCode] = useState(m.data.otp);
  const [status, setStatus] = useState("");
  const [secs, reset] = useCountdown(30, m.step);
  const verifying = useRef(false);
  const [errMsg, setErrMsg] = useState("");

  const handleResend = async () => {
    setErrMsg("");
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const res = await fetch(`${apiBase}/api/admin/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: m.data.email, purpose: m.mode === 'signup' ? 'Signup' : 'Login' })
      });
      const data = await res.json();
      if (data.success) {
        reset();
        if (data.code) {
          m.set({ otp: data.code });
          setCode(data.code);
        }
      } else {
        setErrMsg(data.message || "Failed to resend code");
      }
    } catch (e) {
      setErrMsg("Failed to connect to authentication service");
    }
  };

  useEffect(() => {
    if (code.length === 6 && !verifying.current) {
      verifying.current = true;
      setErrMsg("");
      setStatus("");
      
      const verifyCode = async () => {
        try {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
          const res = await fetch(`${apiBase}/api/admin/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: m.data.email,
              purpose: m.mode === 'signup' ? 'Signup' : 'Login',
              code: code
            })
          });
          const data = await res.json();
          if (data.success) {
            setStatus("ok");
            if (data.token) {
              localStorage.setItem('token', data.token);
              localStorage.setItem('samaagum_admin_token', data.token);
            }
            setTimeout(() => {
              m.set({ otp: code });
              m.next();
            }, 650);
          } else {
            setStatus("error");
            setErrMsg(data.message || "Incorrect verification code");
            verifying.current = false;
          }
        } catch (e) {
          setStatus("error");
          setErrMsg("Failed to verify code");
          verifying.current = false;
        }
      };
      
      verifyCode();
    } else if (code.length < 6) {
      setStatus("");
      setErrMsg("");
      verifying.current = false;
    }
  }, [code]);

  return (
    <div>
      <h2 className="auth-h">Check your inbox</h2>
      <p className="auth-p">We sent a 6-digit code to <b>{m.data.email || "you@email.com"}</b>. Enter it below.</p>
      <div style={{ marginTop: 24 }}>
        <OTPInput value={code} onChange={setCode} status={status} />
      </div>
      {errMsg && (
        <p style={{ color: "var(--accent-1, #ff5555)", fontSize: "13px", marginTop: "12px", textAlign: "center", fontWeight: "500" }}>
          {errMsg}
        </p>
      )}
      <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 14, textAlign: "center" }}>
        <Ic.spark style={{ verticalAlign: "-2px", marginRight: 5, color: "var(--accent-2)" }} />
        Please enter the code sent to your email to verify your identity.
      </p>
      <p className="otp-resend">
        {secs > 0
          ? <React.Fragment>Resend code in <b>0:{String(secs).padStart(2, "0")}</b></React.Fragment>
          : <a onClick={handleResend} style={{ cursor: 'pointer' }}>Resend code</a>}
      </p>
    </div>
  );
}

function ScreenProfile({ m }) {
  const [name, setName] = useState(m.data.name);
  const [role, setRole] = useState(m.data.role);
  const [avatar, setAvatar] = useState(m.data.avatar);
  const [loading, setLoading] = useState(false);
  const ok = name.trim().length >= 2 && role;
  const cont = () => { setLoading(true); setTimeout(() => { m.set({ name, role, avatar }); m.next(); }, 700); };

  return (
    <div>
      <h2 className="auth-h">Set up your profile</h2>
      <p className="auth-p">This is how the community will see you.</p>

      <div className="avatar-up">
        <div className="avatar-ring" onClick={() => setAvatar(a => !a)}>
          <div className="inner" style={avatar ? { background: gradFor(name || "Aanya") } : {}}>
            {avatar
              ? <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26 }}>{initials(name || "You")}</span>
              : <span className="ph"><Ic.user /></span>}
          </div>
          <span className="cam"><Ic.cam /></span>
        </div>
        <div className="au-text">
          <div className="t">{avatar ? "Looking good!" : "Add a photo"}</div>
          <div className="d">{avatar ? "Tap to remove" : "Tap to upload (optional)"}</div>
        </div>
      </div>

      <Field label="Full name" placeholder="e.g. Aanya Rao" value={name}
        onChange={(e) => setName(e.target.value)} />

      <div className="sfield">
        <label>I'm here as a…</label>
        <div className="role-grid">
          {ROLES.map(([r, ic]) => (
            <div key={r} className={`role ${role === r ? "on" : ""}`} onClick={() => setRole(r)}>
              <span className="ic">{Ic[ic]()}</span>{r}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <SBtn variant="primary" block disabled={!ok} loading={loading} onClick={cont} rightIcon={<Ic.arrowR />}>Continue</SBtn>
      </div>
    </div>
  );
}

function ScreenInterests({ m }) {
  const [sel, setSel] = useState(m.data.interests);
  const [loading, setLoading] = useState(false);
  const toggle = (name) => setSel(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  const ok = sel.length >= 3;
  const cont = () => { setLoading(true); setTimeout(() => { m.set({ interests: sel }); m.next(); }, 600); };

  return (
    <div>
      <h2 className="auth-h">What are you into?</h2>
      <p className="auth-p">Pick at least 3 — we'll tailor your event feed.</p>
      <div className="chips-wrap" style={{ marginTop: 20 }}>
        {INTERESTS.map(([name, col]) => {
          const on = sel.includes(name);
          return (
            <button key={name} className={`ichip ${on ? "on" : ""}`} onClick={() => toggle(name)}>
              <span className="dot" style={{ background: col }} />
              {name}
              {on && <span className="check" style={{ display: "inline-flex", color: "var(--accent-2)" }}><Ic.check /></span>}
            </button>
          );
        })}
      </div>
      <p className="int-count">{ok ? <React.Fragment><b>{sel.length}</b> selected — nicely done</React.Fragment> : <React.Fragment><b>{sel.length}</b> of 3 selected</React.Fragment>}</p>
      <div style={{ marginTop: 14 }}>
        <SBtn variant="primary" block disabled={!ok} loading={loading} onClick={cont} rightIcon={<Ic.arrowR />}>Continue</SBtn>
      </div>
    </div>
  );
}

function ScreenLocation({ m }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState(m.data.city);
  const { location } = window.useLocation ? window.useLocation() : { location: null };
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      setSearching(true);
      try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
        const res = await fetch(`${apiBase}/api/location/cities?limit=6&search=${encodeURIComponent(q)}`);
        const json = await res.json();
        if (json.success) {
          setList(json.data.map(c => [c.city_name, c.country_name, "📍"]));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    };
    const timer = setTimeout(fetchCities, 300);
    return () => clearTimeout(timer);
  }, [q]);
  const finish = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
        
        await fetch(`${apiBase}/api/admin/user/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            displayName: m.data.name,
            bio: m.data.role || '',
            preferredLocation: city ? city[0] : 'Bengaluru'
          })
        });
      }
    } catch (e) {
      console.error('Failed to save profile to database:', e);
    }

    if (window.ME) {
      window.ME.name = m.data.name || window.ME.name;
      window.ME.role = m.data.role || window.ME.role;
      window.ME.location = city ? `${city[0]}, ${city[1]}` : window.ME.location;
      if (m.data.email) {
        window.ME.handle = `@${m.data.email.split('@')[0]}`;
      }
    }

    m.set({ city });
    m.next();
  };

  return (
    <div>
      <h2 className="auth-h">Where should we look?</h2>
      <p className="auth-p">We'll surface events and people near you first.</p>

      {location && location.city && !city && (
        <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--accent-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ic.pin style={{ color: "var(--accent-2)" }} />
            <div>
              <div style={{ fontSize: '13px', color: 'var(--ink-3)' }}>📍 Detected Location</div>
              <div style={{ fontWeight: '600' }}>{location.city}, {location.state || location.country}</div>
            </div>
            <button className="sbtn sbtn--primary" style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px' }} onClick={() => setCity([location.city, location.country, "📍"])}>Use This</button>
          </div>
        </div>
      )}

      <div className="loc-search">
        <Field icon={<Ic.search />} placeholder="Search your city" value={q}
          onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="popular-label">{q ? "Results" : "Popular near India & beyond"}</div>
      <div className="city-grid">
        {list.map(([c, country, flag], idx) => (
          <button key={`${c}-${idx}`} className={`city ${city && city[0] === c ? "on" : ""}`} onClick={() => setCity([c, country, flag])}>
            <span className="flag">{flag}</span>
            <span><span className="cn" style={{ display: "block" }}>{c}</span><span className="cc">{country}</span></span>
          </button>
        ))}
        {searching && <div style={{ padding: "16px", color: "var(--ink-3)", fontSize: "14px" }}>Searching...</div>}
        {!searching && list.length === 0 && <div style={{ padding: "16px", color: "var(--ink-3)", fontSize: "14px" }}>No cities found.</div>}
      </div>

      <div className={`map-reveal ${city ? "open" : ""}`}>
        <div className="map-canvas">
          <div className="map-grid" />
          <div className="map-road" style={{ left: 0, right: 0, top: "60%", height: 6, opacity: 0.6 }} />
          <div className="map-road" style={{ left: "38%", top: 0, bottom: 0, width: 6, opacity: 0.6 }} />
          {city && <React.Fragment>
            <div className="map-pin"><span className="ring" /><span className="dot" /></div>
            <div className="map-label"><Ic.pin style={{ verticalAlign: "-3px", marginRight: 4 }} />{city[0]}, {city[1]}</div>
          </React.Fragment>}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        <SBtn variant="primary" block disabled={!city} loading={loading} onClick={finish} rightIcon={<Ic.check />}>
          {city ? `Finish — let's go` : "Choose a city"}
        </SBtn>
      </div>
    </div>
  );
}

function ScreenDone({ m }) {
  const d = m.data;
  return (
    <div className="welcome">
      <Confetti />
      <div className="seal"><Ic.check style={{ width: 38, height: 38 }} /></div>
      <h2>You're all set{d.name ? `, ${d.name.split(" ")[0]}` : ""}!</h2>
      <p>Your Samaagum community is ready. Let's find your first event.</p>

      <div className="summary">
        <div className="srow"><span className="k">Profile</span><span className="v">
          <span style={{ width: 22, height: 22, borderRadius: "50%", background: gradFor(d.name || "Aanya"), display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>{initials(d.name || "You")}</span>
          {d.name || "You"} · {d.role || "Explorer"}
        </span></div>
        <div className="srow"><span className="k">Location</span><span className="v"><Ic.pin style={{ color: "var(--accent-2)" }} />{d.city ? `${d.city[0]}, ${d.city[1]}` : "Bengaluru, India"}</span></div>
        <div className="srow"><span className="k">Interests</span><span className="v">
          {(d.interests.length ? d.interests : ["Startups", "Design", "Music"]).slice(0, 4).map(i => <span key={i} className="mini-chip">{i}</span>)}
          {d.interests.length > 4 && <span className="mini-chip">+{d.interests.length - 4}</span>}
        </span></div>
      </div>

      <a href="Samaagum%20Home.html" className="sbtn sbtn--primary sbtn--block focusable" style={{ textDecoration: "none" }}>Enter Samaagum<Ic.arrowR /></a>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", marginTop: 14, cursor: "pointer" }} onClick={m.restart}>↻ Replay the flow</p>
    </div>
  );
}

const SCENES = { method: ScreenMethod, otp: ScreenOtp, profile: ScreenProfile, interests: ScreenInterests, location: ScreenLocation, done: ScreenDone };

Object.assign(window, { useAuth, SCENES, ORDER, STEP_LABELS, ScreenMethod, ScreenOtp, ScreenProfile, ScreenInterests, ScreenLocation, ScreenDone });
