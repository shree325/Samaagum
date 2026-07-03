// @ts-nocheck
// @ts-nocheck
/* ============================================================
   Samaagum — auth flow (state machine + screens)
   Depends on components.jsx (globals)
   ============================================================ */

var { useState, useEffect, useRef } = React;

/* ---------------- State machine ---------------- */
const ORDER = {
  signup: ["method", "otp", "profile", "interests", "location", "done"],
  login: ["method", "otp", "done"],
};
const STEP_LABELS = { method: "Sign in", otp: "Verify", profile: "Profile", interests: "Interests", location: "Location" };

function getModeFromUrl() {
  if (typeof window === 'undefined') return "signup";
  if (window.location.hash === '#login') return 'login';
  if (window.location.hash === '#signup') return 'signup';
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'login' ? 'login' : 'signup';
}

function useAuth() {
  const [mode, setMode] = useState(getModeFromUrl);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState("f");
  const [data, setData] = useState({ email: "", otp: "", name: "", role: "", interests: [], city: null, avatar: false, google: false });

  // Re-sync mode from the URL whenever the page becomes visible again
  // (covers back/forward-cache navigations where the component stays
  // mounted and the initial useState value would otherwise go stale).
  useEffect(() => {
    const syncFromUrl = () => setMode(getModeFromUrl());
    syncFromUrl();
    window.addEventListener('pageshow', syncFromUrl);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener('pageshow', syncFromUrl);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

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
function useOAuthProviders(mode) {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState({});

  useEffect(() => {
    let active = true;
    const fetchProviders = async () => {
      try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
        const res = await fetch(`${apiBase}/api/auth/providers`);
        const data = await res.json();
        if (active && data.success && Array.isArray(data.providers)) {
          setProviders(data.providers.filter(p => p.enabled));
        }
      } catch (e) {
        console.error("Failed to load auth providers", e);
      } finally {
        if (active) setLoadingProviders(false);
      }
    };
    fetchProviders();
    return () => { active = false; };
  }, []);

  const handleProviderLogin = (key, isCustom) => {
    setLoadingKeys(prev => ({ ...prev, [key]: true }));
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
    if (isCustom) {
      window.location.href = `${apiBase}/api/auth/custom/${key}?mode=${mode}`;
    } else {
      window.location.href = `${apiBase}/api/auth/${key}?mode=${mode}`;
    }
  };

  return { providers, loadingProviders, loadingKeys, handleProviderLogin };
}

function ScreenSignup({ m }) {
  const [formData, setFormData] = useState({
    firstName: m.data.name?.split(' ')[0] || '',
    lastName: m.data.name?.split(' ').slice(1).join(' ') || '',
    gender: '',
    dob: '',
    phoneNumber: m.data.phoneNumber || '',
    email: m.data.email || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { providers, loadingKeys, handleProviderLogin } = useOAuthProviders(m.mode);
  const hasOauth = providers.length > 0;

  const handleChange = (e) => setFormData(d => ({ ...d, [e.target.name]: e.target.value }));

  const cont = async () => {
    let newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (formData.phoneNumber && !/^\+?[0-9]{10,15}$/.test(formData.phoneNumber)) newErrors.phoneNumber = "Phone number must be numeric (10-15 digits)";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const res = await fetch(`${apiBase}/api/admin/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          purpose: 'Signup'
        })
      });
      const data = await res.json();
      if (data.success) {
        m.set({
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          gender: formData.gender,
          dob: formData.dob,
          phoneNumber: formData.phoneNumber,
          // saving other data to pass along if needed
          otp: data.code || ''
        });
        m.next();
      } else {
        setErrors({ general: data.message || "Failed to send code" });
      }
    } catch (e) {
      setErrors({ general: "Failed to connect to authentication service" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="auth-h">Create Account</h2>
      {/* <p className="auth-p">Join Samaagum to discover events and meet your people.</p> */}

      {hasOauth && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {providers.map(p => {
            const IconComponent = Ic[p.key] || Ic.spark;
            const btnVariant = (p.key === 'google' || p.key === 'linkedin') ? p.key : 'ghost';
            return (
              <SBtn 
                key={p.key} 
                variant={btnVariant} 
                block 
                loading={loadingKeys[p.key] || false} 
                leftIcon={<IconComponent />} 
                onClick={() => handleProviderLogin(p.key, p.isCustom)}
              >
                Continue with {p.displayName || p.key}
              </SBtn>
            );
          })}
        </div>
      )}
      {hasOauth && <div className="divider">or continue with email</div>}

      <div style={{ marginTop: hasOauth ? 0 : 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="First Name" value={formData.firstName} onChange={e => setFormData(d => ({ ...d, firstName: e.target.value }))} placeholder="John" />
            {errors.firstName && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.firstName}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Last Name" value={formData.lastName} onChange={e => setFormData(d => ({ ...d, lastName: e.target.value }))} placeholder="Doe" />
            {errors.lastName && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.lastName}</div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="sfield">
              <label>Gender</label>
              <div className="sfield-wrap">
                <select className="focusable no-icon" value={formData.gender} onChange={e => setFormData(d => ({ ...d, gender: e.target.value }))}>
                  <option value="" disabled hidden>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {errors.gender && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.gender}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <Field type="date" label="Date of Birth" value={formData.dob} onChange={e => setFormData(d => ({ ...d, dob: e.target.value }))} />
            {errors.dob && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.dob}</div>}
          </div>
        </div>

        {/* Removed location field */}

        <div>
          <Field label="Phone Number (Optional)" value={formData.phoneNumber} onChange={e => {
            const val = e.target.value.replace(/[^\d+]/g, '');
            setFormData(d => ({ ...d, phoneNumber: val }));
          }} placeholder="+919876543210" />
          {errors.phoneNumber && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.phoneNumber}</div>}
        </div>

        <div>
          <Field label="Email Address" value={formData.email} onChange={e => setFormData(d => ({ ...d, email: e.target.value }))} onKeyDown={e => e.key === 'Enter' && cont()} placeholder="you@example.com" />
          {errors.email && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
        </div>

        {errors.general && <div style={{ padding: "12px", background: "#fee2e2", color: "#dc2626", borderRadius: "var(--r)", fontSize: "14px", textAlign: "center" }}>{errors.general}</div>}

        <div style={{ marginTop: 22 }}>
          <SBtn variant="primary" block disabled={loading} loading={loading} onClick={cont} rightIcon={<Ic.arrowR />}>Create Account</SBtn>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--ink-3)", marginTop: 24 }}>
        Already have an account? <a style={{ color: "var(--accent-2)", fontWeight: 600, cursor: "pointer" }} onClick={() => m.switchMode("login")}>Sign in</a>
      </p>
    </div>
  );
}

function ScreenLogin({ m }) {
  const [email, setEmail] = useState(m.data.email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { providers, loadingKeys, handleProviderLogin } = useOAuthProviders(m.mode);
  const hasOauth = providers.length > 0;

  const cont = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const res = await fetch(`${apiBase}/api/admin/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'Login' })
      });
      const data = await res.json();
      if (data.success) {
        m.set({ email, otp: data.code || '' });
        m.next();
      } else {
        setError(data.message || "Failed to send code");
      }
    } catch (e) {
      setError("Failed to connect to authentication service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="auth-h">Welcome Back</h2>
      <p className="auth-p">Sign in to continue to your community.</p>

      {hasOauth && (
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {providers.map(p => {
            const IconComponent = Ic[p.key] || Ic.spark;
            const btnVariant = (p.key === 'google' || p.key === 'linkedin') ? p.key : 'ghost';
            return (
              <SBtn 
                key={p.key} 
                variant={btnVariant} 
                block 
                loading={loadingKeys[p.key] || false} 
                leftIcon={<IconComponent />} 
                onClick={() => handleProviderLogin(p.key, p.isCustom)}
              >
                Continue with {p.displayName || p.key}
              </SBtn>
            );
          })}
        </div>
      )}
      {hasOauth && <div className="divider">or continue with email</div>}

      <div style={{ marginTop: hasOauth ? 0 : 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <Field label="Email Address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && cont()} placeholder="you@example.com" />
          {error && <div style={{ color: "#dc2626", fontSize: 12, marginTop: 4 }}>{error}</div>}
        </div>

        <div style={{ marginTop: 22 }}>
          <SBtn variant="primary" block disabled={loading} loading={loading} onClick={cont} rightIcon={<Ic.arrowR />}>Send Login Code</SBtn>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--ink-3)", marginTop: 24 }}>
        New to Samaagum? <a style={{ color: "var(--accent-2)", fontWeight: 600, cursor: "pointer" }} onClick={() => m.switchMode("signup")}>Create an account</a>
      </p>
    </div>
  );
}

function ScreenMethod({ m }) {
  return m.mode === "signup" ? <ScreenSignup m={m} /> : <ScreenLogin m={m} />;
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
              code: code,
              dob: m.data.dob,
              gender: m.data.gender,
              firstName: m.data.firstName,
              lastName: m.data.lastName,
              phoneNumber: m.data.phoneNumber
            })
          });
          const data = await res.json();
          if (data.success) {
            setStatus("ok");
            if (data.token) {
              localStorage.setItem('token', data.token);

              // Fetch profile to show in ScreenDone
              try {
                const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
                const pRes = await fetch(`${apiBase}/api/admin/user/profile`, { headers: { 'Authorization': `Bearer ${data.token}` } });
                const pData = await pRes.json();
                if (pData.success && pData.data) {
                  m.set({
                    name: pData.data.profile?.display_name || m.data.name,
                    role: pData.data.profile?.bio || m.data.role,
                    city: pData.data.profile?.preferred_location || m.data.city,
                    profilePhoto: pData.data.profilePhoto || '',
                    gender: pData.data.gender || m.data.gender,
                    dob: pData.data.dob || m.data.dob,
                    phoneNumber: pData.data.phone || m.data.phoneNumber
                  });
                }
              } catch (e) { }
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
    <div style={{ textAlign: "center" }}>
      <h2 className="auth-h">Check your inbox</h2>
      <p className="auth-p" style={{ marginBottom: 24 }}>We sent a 6-digit code to <b style={{ color: "var(--ink)" }}>{m.data.email || "you@email.com"}</b>.</p>

      {m.data.otp && (
        <div style={{ marginBottom: 24, padding: "12px 16px", background: "#fef3c7", color: "#92400e", borderRadius: "var(--r)", fontSize: 14, textAlign: "left" }}>
          <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#d97706", marginBottom: 4 }}>Dev Mode Active</div>
          Your verification code is: <span style={{ fontWeight: 800, fontSize: 16, background: "rgba(251,191,36,0.3)", padding: "2px 6px", borderRadius: 4, letterSpacing: 2, marginLeft: 6 }}>{m.data.otp}</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <OTPInput value={code} onChange={setCode} status={status} />
      </div>

      {errMsg && (
        <p style={{ color: "#dc2626", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
          {errMsg}
        </p>
      )}

      <div style={{ fontSize: 14, color: "var(--ink-3)", marginTop: 24 }}>
        {secs > 0 ? (
          <span>
            Resend code in <b style={{ color: "var(--ink)" }}>0:{String(secs).padStart(2, "0")}</b>
          </span>
        ) : (
          <a onClick={handleResend} style={{ color: "var(--accent-2)", fontWeight: 600, cursor: "pointer" }}>
            Resend Code
          </a>
        )}
      </div>
    </div>
  );
}

function ScreenProfile({ m }) {
  const [name, setName] = useState(m.data.name);
  const [role, setRole] = useState(m.data.role);
  const [profilePhoto, setProfilePhoto] = useState(m.data.profilePhoto || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const ok = name.trim().length >= 2 && role;
  const cont = () => { setLoading(true); setTimeout(() => { m.set({ name, role, profilePhoto }); m.next(); }, 700); };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid image format. Please upload JPG, PNG or WEBP.");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const token = localStorage.getItem('token');

      const res = await fetch(`${apiBase}/api/upload-profile-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setProfilePhoto(data.imageUrl);
      } else {
        alert(data.message || "Upload failed");
      }
    } catch (err) {
      alert("Failed to upload photo");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div>
      <h2 className="auth-h">Set up your profile</h2>
      <p className="auth-p">This is how the community will see you.</p>

      <div className="avatar-up" style={{ position: "relative" }}>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handlePhotoUpload}
          style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }}
          disabled={uploadingImage}
        />
        <div className="avatar-ring">
          <div className="inner" style={!profilePhoto ? { background: gradFor(name || "Aanya") } : {}}>
            {uploadingImage ? (
              <span style={{ color: "#fff", fontSize: 14 }}>...</span>
            ) : profilePhoto ? (
              <img src={profilePhoto.startsWith('http') || profilePhoto.startsWith('data:') ? profilePhoto : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '') + profilePhoto)} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Profile" />
            ) : (
              <span style={{ color: "#fff", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26 }}>{initials(name || "You")}</span>
            )}
          </div>
          <span className="cam"><Ic.cam /></span>
        </div>
        <div className="au-text">
          <div className="t">{uploadingImage ? "Uploading..." : profilePhoto ? "Looking good!" : "Add a photo"}</div>
          <div className="d">{uploadingImage ? "Please wait" : profilePhoto ? "Tap to change" : "Tap to upload (optional)"}</div>
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
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
    fetch(`${api}/api/public/categories`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCategories(data.data.map(c => [c.name, c.kind || "#333"]));
        }
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  const toggle = (name) => setSel(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  const ok = sel.length >= 3;
  const cont = () => { setLoading(true); setTimeout(() => { m.set({ interests: sel }); m.next(); }, 600); };

  const displayInterests = categories.length > 0 ? categories : INTERESTS;

  return (
    <div>
      <h2 className="auth-h">What are you into?</h2>
      <p className="auth-p">Pick at least 3 — we'll tailor your event feed.</p>
      <div className="chips-wrap" style={{ marginTop: 20 }}>
        {displayInterests.map(([name, col]) => {
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
  const [city, setCity] = useState(m.data.city); // expected: { location_name, address, latitude, longitude }
  const [loading, setLoading] = useState(false);
  const { location } = window.useLocation ? window.useLocation() : { location: null };

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : window.location.origin;
        const res = await fetch(`${apiBase}/api/features`);
        const json = await res.json();
        if (json.success && json.data && json.data.location_active === false) {
          m.set({ city: null });
          m.next();
        }
      } catch (e) { }
    };
    checkFeature();
  }, []);

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
            firstName: m.data.firstName,
            lastName: m.data.lastName,
            gender: m.data.gender,
            dob: m.data.dob,
            displayName: m.data.name,
            bio: m.data.role || '',
            location: city?.address ?? null,
            preferredLocation: city?.address ?? null,
            locationName: city?.location_name ?? null,
            locationLat: city?.latitude ?? null,
            locationLng: city?.longitude ?? null,
            address: city?.address ?? null,
            phoneNumber: m.data.phoneNumber || '',
            interests: m.data.interests || []
          })
        });
      }
    } catch (e) {
      console.error('Failed to save profile to database:', e);
    }

    if (window.ME) {
      window.ME.name = m.data.name || window.ME.name;
      window.ME.role = m.data.role || window.ME.role;
      if (city) window.ME.location = city.location_name;
      if (m.data.interests && m.data.interests.length > 0) {
        window.ME.skills = m.data.interests;
      }
      if (m.data.email) {
        window.ME.handle = `@${m.data.email.split('@')[0]}`;
      }
      if (m.data.profilePhoto) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
        window.ME.img = m.data.profilePhoto.startsWith('http') || m.data.profilePhoto.startsWith('data:') ? m.data.profilePhoto : apiBase + m.data.profilePhoto;
      }
      if (m.data.gender) window.ME.gender = m.data.gender;
      if (m.data.dob) window.ME.dob = m.data.dob;
      if (m.data.phoneNumber) window.ME.phone = m.data.phoneNumber;
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
            <button className="sbtn sbtn--primary" style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '12px' }} onClick={() => setCity({
              location_name: location.city,
              address: `${location.city}, ${location.state || location.country}`,
              latitude: location.lat || 0,
              longitude: location.lon || 0
            })}>Use This</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: "16px" }}>
        {window.LocationSelector && (
          <window.LocationSelector
            value={city}
            onChange={(val) => setCity(val)}
            placeholder="Search your city..."
          />
        )}
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
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;

  const loc = React.useMemo(() => {
    if (!d.city) return null;
    if (Array.isArray(d.city)) {
      return {
        location_name: d.city[0],
        address: d.city[5] || d.city[0],
        latitude: parseFloat(d.city[3]),
        longitude: parseFloat(d.city[4])
      };
    }
    return {
      location_name: d.city.location_name || d.city.address || d.city.name || d.city,
      address: d.city.address || d.city.location_name,
      latitude: parseFloat(d.city.latitude),
      longitude: parseFloat(d.city.longitude)
    };
  }, [d.city]);

  return (
    <div className="welcome">
      <Confetti />
      <div className="seal"><Ic.check style={{ width: 38, height: 38 }} /></div>
      <h2>You're all set{d.name ? `, ${d.name.split(" ")[0]}` : ""}!</h2>
      <p>Your Samaagum community is ready. Let's find your first event.</p>

      <div className="summary">
        <div className="srow"><span className="k">Profile</span><span className="v">
          {d.profilePhoto ? (
            <img src={d.profilePhoto.startsWith('http') || d.profilePhoto.startsWith('data:') ? d.profilePhoto : apiBase + d.profilePhoto} style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", display: "inline-block" }} />
          ) : (
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: gradFor(d.name || "Aanya"), display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700 }}>{initials(d.name || "You")}</span>
          )}
          {d.name || "You"} · {d.role || "Explorer"}
        </span></div>
        <div className="srow"><span className="k">Location</span><span className="v"><Ic.pin style={{ color: "var(--accent-2)" }} />{loc ? loc.location_name : "Not set"}</span></div>
        <div className="srow"><span className="k">Interests</span><span className="v">
          {(d.interests.length ? d.interests : ["Startups", "Design", "Music"]).slice(0, 4).map(i => <span key={i} className="mini-chip">{i}</span>)}
          {d.interests.length > 4 && <span className="mini-chip">+{d.interests.length - 4}</span>}
        </span></div>
      </div>

      {loc && !isNaN(loc.latitude) && !isNaN(loc.longitude) && (
        <div style={{ marginTop: "16px", marginBottom: "24px" }}>
          <iframe
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.longitude - 0.01},${loc.latitude - 0.01},${loc.longitude + 0.01},${loc.latitude + 0.01}&marker=${loc.latitude},${loc.longitude}`}
            width="100%"
            height="140"
            style={{ border: 0, borderRadius: "16px", background: "var(--bg-2, #f5f5f5)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            loading="lazy"
          />
        </div>
      )}

      <a href="Samaagum%20Home.html" className="sbtn sbtn--primary sbtn--block focusable" style={{ textDecoration: "none" }}>Enter Samaagum<Ic.arrowR /></a>
      {/* <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-3)", marginTop: 14, cursor: "pointer" }} onClick={m.restart}>↻</p> */}
    </div>
  );
}

const SCENES = { method: ScreenMethod, otp: ScreenOtp, profile: ScreenProfile, interests: ScreenInterests, location: ScreenLocation, done: ScreenDone };

Object.assign(window, { useAuth, SCENES, ORDER, STEP_LABELS, ScreenMethod, ScreenOtp, ScreenProfile, ScreenInterests, ScreenLocation, ScreenDone });
