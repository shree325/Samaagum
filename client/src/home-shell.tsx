// @ts-nocheck
/* ============================================================
   Samaagum Home — app shell (sidebar, topbar, menus) + shared bits
   ============================================================ */

/* ---------------- Popover (click-away) ---------------- */
function Popover({ open, onClose, children, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const k = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", h); document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open, onClose]);
  if (!open) return null;
  return <div ref={ref} className="pop" style={style}>{children}</div>;
}

/* ---------------- Create menu content ---------------- */
function CreateMenu({ onPick }) {
  const items = [
    { k:"create-event", ic:<I.ticket/>, t:"Create event", d:"Sell tickets or take RSVPs", c:"linear-gradient(135deg,#ff6b4a,#ff4d8d)" },
    { k:"create-group", ic:<I.groups/>, t:"Create group", d:"Gather your community", c:"linear-gradient(135deg,#6d5efc,#2a7fff)" },
  ];
  return (
    <div className="cmenu">
      {items.map(it => (
        <button key={it.k} className="cmenu-it" onClick={() => onPick(it.k)}>
          <span className="ci" style={{ background: it.c }}>{it.ic}</span>
          <span className="ct"><span className="t">{it.t}</span><span className="d">{it.d}</span></span>
          <I.arrowR className="ar" />
        </button>
      ))}
    </div>
  );
}

/* ---------------- Sidebar ---------------- */
function Sidebar({ view, go, counts }) {
  const [createOpen, setCreateOpen] = useState(false);
  const main = [
    { k:"home", ic:<I.home/>, label:"Home" },
    { k:"discover", ic:<I.compass/>, label:"Discover" },
    { k:"events", ic:<I.ticket/>, label:"My Events" },
    { k:"groups", ic:<I.groups/>, label:"Groups" },
  ];
  const social = [
    { k:"messages", ic:<I.chat/>, label:"Messages", badge: counts.messages },
    { k:"notifications", ic:<I.bell/>, label:"Notifications", badge: counts.notifs },
    { k:"profile", ic:<I.user/>, label:"Profile" },
  ];
  const active = (k) => view === k || (k==="events" && view==="event") || (k==="groups" && view==="group");
  return (
    <aside className="sidebar">
      <div className="sb-brand"><Wordmark size={19} /></div>
      <div style={{ position:"relative" }}>
        <button className="sb-create" onClick={() => setCreateOpen(v=>!v)}>
          <I.plus/> Create <span className="plus"><I.chevD/></span>
        </button>
        <Popover open={createOpen} onClose={()=>setCreateOpen(false)} style={{ top:"calc(100% + 6px)", left:0, right:0 }}>
          <CreateMenu onPick={(k)=>{ setCreateOpen(false); go(k); }} />
        </Popover>
      </div>
      <nav className="sb-nav">
        {main.map(it => (
          <button key={it.k} className={`sb-item ${active(it.k)?"on":""}`} onClick={()=>go(it.k)}>
            <span className="ic">{it.ic}</span>{it.label}
          </button>
        ))}
        <div className="sb-section">Community</div>
        {social.map(it => (
          <button key={it.k} className={`sb-item ${active(it.k)?"on":""}`} onClick={()=>go(it.k)}>
            <span className="ic">{it.ic}</span>{it.label}
            {it.badge ? <span className="badge">{it.badge}</span> : null}
          </button>
        ))}
      </nav>
      <div className="sb-foot">
        <button className="sb-user" onClick={()=>go("profile")}>
          <I.Avatar userId={window.ME?.id} name={ME.name} img={ME.img} size={36} className="ring" />
          <span className="meta"><span className="n">{ME.name}</span><span className="h">{ME.handle}</span></span>
          <I.chevD style={{ color:"var(--ink-3)" }} />
        </button>
      </div>
    </aside>
  );
}

/* ---------------- Topbar (desktop) ---------------- */
function Topbar({ go, counts, dark, onToggleTheme, city, onCity }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  return (
    <header className="topbar">
      <div className="tb-search">
        <span className="ic"><I.search/></span>
        <input placeholder="Search events, groups, people, interests…" />
        <kbd>/</kbd>
      </div>
      {window.featureSettings?.location_active !== false && (
        <button className="tb-loc" onClick={onCity}>
          <I.pin style={{ color:"var(--accent-2)" }} /> {city} <I.chevD style={{ color:"var(--ink-3)" }} />
        </button>
      )}
      <div className="tb-spacer" />
      <div style={{ position:"relative" }}>
        <button className="tb-icon" onClick={()=>setCreateOpen(v=>!v)} title="Create"><I.plus/></button>
        <Popover open={createOpen} onClose={()=>setCreateOpen(false)} style={{ top:"calc(100% + 8px)", right:0, width:280 }}>
          <CreateMenu onPick={(k)=>{ setCreateOpen(false); go(k); }} />
        </Popover>
      </div>
      <button className="tb-icon" onClick={onToggleTheme} title="Toggle theme">{dark? <I.sun/> : <I.moon/>}</button>
      <button className="tb-icon" onClick={()=>go("messages")} title="Messages">
        <I.chat/>{counts.messages ? <span className="dot" /> : null}
      </button>
      <button className="tb-icon" onClick={()=>go("notifications")} title="Notifications">
        <I.bell/>{counts.notifs ? <span className="dot" /> : null}
      </button>
      <div style={{ position:"relative" }}>
        <button className="tb-icon" style={{ padding:0, border:"none" }} onClick={()=>setProfileOpen(v=>!v)}>
          <I.Avatar userId={window.ME?.id} name={ME.name} img={ME.img} size={40} className="ring" />
        </button>
        <Popover open={profileOpen} onClose={()=>setProfileOpen(false)} style={{ top:"calc(100% + 8px)", right:0, width:248 }}>
          <ProfileMenu go={(k)=>{ setProfileOpen(false); go(k); }} dark={dark} onToggleTheme={onToggleTheme} />
        </Popover>
      </div>
    </header>
  );
}

function ProfileMenu({ go, dark, onToggleTheme }) {
  const isAdmin = ME.role && ME.role.toLowerCase().includes("admin");
  const items = [
    { k:"profile", ic:<I.user/>, t:"My profile" },
    { k:"events", ic:<I.ticket/>, t:"My tickets" },
    { k:"groups", ic:<I.groups/>, t:"My groups" },
    { k:"upgrade", ic:<I.crown style={{ color: "var(--accent-1)" }}/>, t:"Upgrade Plan" },
    ...(isAdmin ? [{ k:"admin", ic:<I.compass/>, t:"Admin Console" }] : []),
  ];
  return (
    <div className="pmenu">
      <div className="pmenu-head">
        <I.Avatar userId={window.ME?.id} name={ME.name} img={ME.img} size={42} />
        <div><div className="n">{ME.name}</div><div className="h">{ME.handle}</div></div>
      </div>
      <div className="pmenu-list">
        {items.map(it => (
          <button key={it.k} className="pmenu-it" onClick={() => {
            if (it.k === "admin") {
              window.location.href = "admin/index.html";
            } else {
              go(it.k);
            }
          }}>
            {it.ic}{it.t}
          </button>
        ))}
        <button className="pmenu-it" onClick={onToggleTheme}>{dark? <I.sun/> : <I.moon/>}{dark? "Light mode":"Dark mode"}</button>
      </div>
      <div className="pmenu-foot">
        <button 
          className="pmenu-it muted" 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('samaagum_admin_token');
            window.location.href = "/";
          }}
        >
          <I.external/>Sign out
        </button>
      </div>
    </div>
  );
}

/* ---------------- Shared section bits ---------------- */
function SectionBar({ title, count, onMore, moreLabel = "See all" }) {
  return (
    <div className="sec-bar">
      <h2>{title}</h2>
      {count != null && <span className="cnt">{count}</span>}
      {onMore && <button className="more" onClick={onMore}>{moreLabel} <I.arrowR/></button>}
    </div>
  );
}

function FilterChip({ active, icon, children, onClick, count }) {
  return (
    <button className={`fchip ${active?"on":""}`} onClick={onClick}>
      {icon && <span className="cv">{icon}</span>}{children}
      {count!=null && <span style={{ opacity:0.7, fontVariantNumeric:"tabular-nums" }}>{count}</span>}
    </button>
  );
}

function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <div className="ill">{icon}</div>
      <h3>{title}</h3><p>{text}</p>
      {action && <div className="acts">{action}</div>}
    </div>
  );
}

/* ---------------- City picker sheet ---------------- */
function CityPicker({ open, onClose, city, onPick }) {
  const [selectedLocation, setSelectedLocation] = useState(
    window.ME?.locationLat && window.ME?.locationLng ? {
      location_name: city,
      address: window.ME.address || window.ME.location || city,
      latitude: window.ME.locationLat,
      longitude: window.ME.locationLng
    } : (city && city !== "Global" ? { location_name: city, address: city, latitude: 0, longitude: 0 } : null)
  );

  const [activeCities, setActiveCities] = useState([]);
  React.useEffect(() => {
    if (window.getActiveCities) {
      window.getActiveCities().then(data => {
        if (data && data.length) setActiveCities(data);
      });
    }
  }, []);

  if (!open) return null;

  const handleSelect = async (loc) => {
    setSelectedLocation(loc);
    if (loc) {
      onPick(loc.location_name);
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
          await fetch(`${apiBase}/api/admin/user/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              location: loc.address,
              preferredLocation: loc.address,
              locationName: loc.location_name,
              locationLat: loc.latitude,
              locationLng: loc.longitude,
              address: loc.address
            })
          });
        }
        if (window.ME) {
          window.ME.location = loc.location_name;
          window.ME.address = loc.address;
          window.ME.locationLat = loc.latitude;
          window.ME.locationLng = loc.longitude;
        }
      } catch (e) {
        console.error(e);
      }
      
      setTimeout(() => onClose(), 800);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000 }} onClick={onClose}>
      <div 
        style={{
          position: "absolute", top: "72px", left: "50%", transform: "translateX(-50%)",
          width: "90%", maxWidth: "360px", background: "var(--bg-1, #ffffff)", borderRadius: "24px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.2)", border: "1px solid var(--border)", display: "flex", flexDirection: "column"
        }} 
        onClick={e=>e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 8px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--ink-1)" }}>Choose your location</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <p style={{ margin: "0 24px", fontSize: "13px", color: "var(--ink-2)" }}>Discovery is biased to events near you.</p>
        
        <div style={{ padding: "20px 24px 24px" }}>
          {window.LocationSelector && (
            <window.LocationSelector 
              value={selectedLocation}
              onChange={handleSelect}
              placeholder="Search a new location..."
            />
          )}
          {selectedLocation?.location_name && activeCities.length > 0 && !activeCities.some(ac => {
            const ln = selectedLocation.location_name.toLowerCase().trim();
            return ln === ac || ln === ac + " city" || ac === ln + " city";
          }) && (
            <div style={{ background: "var(--danger-soft, #fee2e2)", color: "var(--danger, #ef4444)", padding: 12, borderRadius: 8, fontSize: 13, marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>This location is currently unavailable. Please select an active city.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Popover, Sidebar, Topbar, ProfileMenu, CreateMenu, SectionBar, FilterChip, Empty, CityPicker });
