/* ============================================================
   Samaagum Home — app shell (sidebar, topbar, menus) + shared bits
   ============================================================ */

/* ---------------- Popover (click-away) ---------------- */
function Popover({ open, onClose, children = null, style = null }: { open: any; onClose: any; children?: any; style?: any }) {
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
function Sidebar({ view, go, counts, collapsed, onToggleCollapse }) {
  const [createOpen, setCreateOpen] = useState(false);
  const main = [
    { k:"home", ic:<I.home/>, label:"Home" },
    { k:"discover", ic:<I.compass/>, label:"Discover" },
    { k:"events", ic:<I.ticket/>, label:"Events" },
    { k:"groups", ic:<I.groups/>, label:"Groups" },
  ];
  const social = [
    { k:"messages", ic:<I.chat/>, label:"Messages", badge: counts.messages },
    { k:"notifications", ic:<I.bell/>, label:"Notifications", badge: counts.notifs },
    { k:"profile", ic:<I.user/>, label:"Profile" },
  ];
  const active = (k) => view === k || (k==="events" && view==="event") || (k==="groups" && view==="group");
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sb-brand" style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between" }}>
        <Wordmark size={19} />
        <button 
          onClick={onToggleCollapse} 
          className="sb-collapse-btn" 
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            borderRadius: "50%",
            color: "var(--ink-3)",
            transition: "background var(--t-fast)"
          }}
        >
          {collapsed ? <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg> : <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
      </div>
      <div style={{ position:"relative" }}>
        <button className="sb-create" onClick={() => setCreateOpen(v=>!v)} title="Create" style={collapsed ? { padding: 12, width: 42, height: 42, borderRadius: "50%", margin: "0 auto", justifyContent: "center" } : {}}>
          <I.plus/> {!collapsed && <>Create <span className="plus"><I.chevD/></span></>}
        </button>
        <Popover open={createOpen} onClose={()=>setCreateOpen(false)} style={{ top:"calc(100% + 6px)", left: collapsed ? -16 : 0, width: 280 }}>
          <CreateMenu onPick={(k)=>{ setCreateOpen(false); go(k); }} />
        </Popover>
      </div>
      <nav className="sb-nav" style={collapsed ? { alignItems: "center" } : {}}>
        {main.map(it => (
          <button key={it.k} className={`sb-item ${active(it.k)?"on":""}`} onClick={()=>go(it.k)} title={it.label} style={collapsed ? { justifyContent: "center", padding: "11px 0" } : {}}>
            <span className="ic">{it.ic}</span>{!collapsed && it.label}
          </button>
        ))}
        {collapsed ? <div style={{ height: 1, background: "var(--border-2)", margin: "12px 0", width: "100%" }} /> : <div className="sb-section">Community</div>}
        {social.map(it => (
          <button key={it.k} className={`sb-item ${active(it.k)?"on":""}`} onClick={()=>go(it.k)} title={it.label} style={collapsed ? { justifyContent: "center", padding: "11px 0", position: "relative" } : {}}>
            <span className="ic">{it.ic}</span>{!collapsed && it.label}
            {it.badge ? (collapsed ? <span style={{ position: "absolute", top: 6, right: 12, width: 6, height: 6, borderRadius: "50%", background: "var(--accent-1)" }} /> : <span className="badge">{it.badge}</span>) : null}
          </button>
        ))}
      </nav>
      <div className="sb-foot" style={collapsed ? { display: "flex", justifyContent: "center" } : {}}>
        <button className="sb-user" onClick={()=>go("profile")} title={ME.name} style={collapsed ? { padding: 4, justifyContent: "center" } : {}}>
          <Avatar name={ME.name} size={36} className="ring" />
          {!collapsed && (
            <>
              <span className="meta"><span className="n">{ME.name}</span><span className="h">{ME.handle}</span></span>
              <I.chevD style={{ color:"var(--ink-3)" }} />
            </>
          )}
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
      <button className="tb-icon" onClick={()=>go("notifications")} title="Notifications">
        <I.bell/>{counts.notifs ? <span className="dot" /> : null}
      </button>
      <button className="tb-icon" onClick={onToggleTheme} title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
        {dark ? <I.sun/> : <I.moon/>}
      </button>
      <div style={{ position:"relative" }}>
        <button className="tb-icon" style={{ padding:0, border:"none" }} onClick={()=>setProfileOpen(v=>!v)}>
          <Avatar name={ME.name} size={40} className="ring" />
        </button>
        <Popover open={profileOpen} onClose={()=>setProfileOpen(false)} style={{ top:"calc(100% + 8px)", right:0, width:248 }}>
          <ProfileMenu go={(k)=>{ setProfileOpen(false); go(k); }} dark={dark} onToggleTheme={onToggleTheme} />
        </Popover>
      </div>
    </header>
  );
}

function ProfileMenu({ go, dark, onToggleTheme }) {
  const items = [
    { k:"profile", ic:<I.user/>, t:"My profile" },
    { k:"events", ic:<I.ticket/>, t:"My tickets" },
    { k:"groups", ic:<I.groups/>, t:"My groups" },
  ];
  return (
    <div className="pmenu">
      <div className="pmenu-head">
        <Avatar name={ME.name} size={42} />
        <div><div className="n">{ME.name}</div><div className="h">{ME.handle}</div></div>
      </div>
      <div className="pmenu-list">
        {items.map(it => <button key={it.k} className="pmenu-it" onClick={()=>go(it.k)}>{it.ic}{it.t}</button>)}
        <button className="pmenu-it" onClick={onToggleTheme}>
          {dark ? <I.sun/> : <I.moon/>}
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
      <div className="pmenu-foot"><button className="pmenu-it muted"><I.external/>Sign out</button></div>
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
