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
      <button className="tb-icon" onClick={()=>go("messages")} title="Messages">
        <I.chat/>{counts.messages ? <span className="dot" /> : null}
      </button>
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
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchCities = async () => {
      setLoading(true);
      try {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
        const res = await fetch(`${apiBase}/api/location/cities?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
        const json = await res.json();
        if (json.success) {
          if (page === 1) {
            setCities(json.data);
          } else {
            setCities(prev => [...prev, ...json.data]);
          }
          setTotal(json.total || 0);
          setHasMore(page < (json.totalPages || 1));
        }
      } catch (err) {
        console.error("Failed to load cities", err);
      } finally {
        setLoading(false);
      }
    };
    
    // debounce search
    const timer = setTimeout(() => {
      fetchCities();
    }, 300);
    return () => clearTimeout(timer);
  }, [open, search, page]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={e=>e.stopPropagation()}>
        <div className="sheet-head">
          <h3>Choose your city</h3>
          <button className="sheet-x" onClick={onClose}><I.x/></button>
        </div>
        <p className="sheet-sub">Discovery is biased to events near you. <span style={{color: "var(--ink-3)", fontSize: "12px", float: "right"}}>{total} cities available</span></p>
        
        <div style={{ padding: "0 24px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "var(--surface-2)", borderRadius: "8px", padding: "8px 12px" }}>
            <I.search style={{ color: "var(--ink-3)", marginRight: "8px" }} />
            <input 
              type="text" 
              placeholder="Search cities..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", flex: 1, fontSize: "15px", color: "var(--ink-1)" }}
            />
          </div>
        </div>

        <div className="city-list" style={{ maxHeight: "300px", overflowY: "auto", padding: "0 24px 24px" }}>
          {cities.map(c => {
            const isMatch = city === c.city_name;
            return (
              <button key={c.geoname_id} className={`city-opt ${isMatch?"on":""}`} onClick={()=>{ onPick(c.city_name); onClose(); }} style={{ display: "flex", alignItems: "flex-start", padding: "12px", width: "100%", background: "transparent", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <I.pin style={{ color: isMatch?"var(--accent-2)":"var(--ink-3)", marginTop: "2px", flexShrink: 0 }} />
                <div style={{ marginLeft: "12px", flex: 1 }}>
                  <div style={{ fontWeight: isMatch ? "600" : "500", color: isMatch ? "var(--accent-2)" : "var(--ink-1)", fontSize: "15px" }}>{c.city_name}</div>
                  <div style={{ fontSize: "13px", color: "var(--ink-3)", marginTop: "2px" }}>{c.state_name}, {c.country_name}</div>
                </div>
                {isMatch && <I.check style={{ color:"var(--accent-2)", flexShrink: 0, marginTop: "2px" }} />}
              </button>
            )
          })}
          
          {loading && <div style={{ textAlign: "center", padding: "16px", color: "var(--ink-3)", fontSize: "14px" }}>Loading...</div>}
          
          {!loading && cities.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--ink-3)", fontSize: "14px" }}>
              No cities found matching "{search}"
            </div>
          )}

          {!loading && hasMore && (
            <button 
              onClick={() => setPage(p => p + 1)}
              style={{ width: "100%", padding: "12px", background: "var(--surface-2)", border: "none", borderRadius: "8px", marginTop: "12px", color: "var(--ink-2)", cursor: "pointer", fontWeight: "500" }}
            >
              Load more cities
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Popover, Sidebar, Topbar, ProfileMenu, CreateMenu, SectionBar, FilterChip, Empty, CityPicker });
