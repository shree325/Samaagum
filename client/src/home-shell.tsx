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
          <Avatar name={ME.name} img={ME.img} size={36} className="ring" />
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
      <button className="tb-loc" onClick={onCity}>
        <I.pin style={{ color:"var(--accent-2)" }} /> {city} <I.chevD style={{ color:"var(--ink-3)" }} />
      </button>
      <div className="tb-spacer" />
      <div style={{ position:"relative" }}>
        <button className="tb-icon" onClick={()=>setCreateOpen(v=>!v)} title="Create"><I.plus/></button>
        <Popover open={createOpen} onClose={()=>setCreateOpen(false)} style={{ top:"calc(100% + 8px)", right:0, width:280 }}>
          <CreateMenu onPick={(k)=>{ setCreateOpen(false); go(k); }} />
        </Popover>
      </div>
      <button className="tb-icon" onClick={onToggleTheme} title="Toggle theme">{dark? <I.sun/> : <I.moon/>}</button>
      <button className="tb-icon" onClick={()=>go("notifications")} title="Notifications">
        <I.bell/>{counts.notifs ? <span className="dot" /> : null}
      </button>
      <div style={{ position:"relative" }}>
        <button className="tb-icon" style={{ padding:0, border:"none" }} onClick={()=>setProfileOpen(v=>!v)}>
          <Avatar name={ME.name} img={ME.img} size={40} className="ring" />
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
        <Avatar name={ME.name} img={ME.img} size={42} />
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
  const cities = ["Bengaluru","Mumbai","Delhi NCR","Hyderabad","Pune","Chennai","Goa","Online"];
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-head"><h3>Choose your city</h3><button className="sheet-x" onClick={onClose}><I.x/></button></div>
        <p className="sheet-sub">Discovery is biased to events near you.</p>
        <div className="city-list">
          {cities.map(c => (
            <button key={c} className={`city-opt ${c===city?"on":""}`} onClick={()=>{ onPick(c); onClose(); }}>
              <I.pin style={{ color: c===city?"var(--accent-2)":"var(--ink-3)" }} />
              <span>{c}</span>
              {c===city && <I.check style={{ marginLeft:"auto", color:"var(--accent-2)" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Popover, Sidebar, Topbar, ProfileMenu, CreateMenu, SectionBar, FilterChip, Empty, CityPicker });
