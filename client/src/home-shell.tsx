// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { LocationSelector, Wordmark } from './components';
import { Toggle } from './create_event';
import { ME } from './home-data';
import { Discover } from './home-feed';
import { Avatar } from './home-icons';
import { Messages } from './home-messages';
import { Notifications } from './home-notifications';
import { Profile } from './home-profile';
import { apiBase } from './home-subscription';
import { I } from './home-icons';
import { Events } from './landing-features';

/* ============================================================
   Samaagum Home — app shell (sidebar, topbar, menus) + shared bits
   ============================================================ */

/* ---------------- Popover (click-away) ---------------- */
export function Popover({ open, onClose, children = null, style = null }: { open: any; onClose: any; children?: any; style?: any }) {
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
export function CreateMenu({ onPick }) {
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
export function Sidebar({ view, go, counts, collapsed, onToggleCollapse, chatSettings, hasScannerEvents }) {
  const [createOpen, setCreateOpen] = useState(false);
  const showMessages = chatSettings?.allowSiteMessaging !== false;
  const main = [
    { k:"home", ic:<I.home/>, label:"Home" },
    { k:"discover", ic:<I.compass/>, label:"Discover" },
    { k:"events", ic:<I.ticket/>, label:"My Events" },
    { k:"groups", ic:<I.groups/>, label:"My Groups" },
    ...(hasScannerEvents ? [{ k:"scan", ic:<I.scan/>, label:"Scan" }] : []),
  ];
  const social = [
    ...(showMessages ? [{ k:"messages", ic:<I.chat/>, label:"Messages", badge: counts.messages }] : []),
    { k:"notifications", ic:<I.bell/>, label:"Notifications", badge: counts.notifs },
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
          <Avatar userId={window.ME?.id} name={ME.name} img={ME.img} size={36} className="ring" />
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
export function Topbar({ go, counts, dark, onToggleTheme, city, onCity, chatSettings }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const showMessages = chatSettings?.allowSiteMessaging !== false;

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ events: [], groups: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults({ events: [], groups: [] });
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const res = await fetch(`${apiBase}/api/public/global-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResultClick = (type, item) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (type === "group") {
      go("group", { id: item.id, entity_id: item.id, name: item.name });
    } else if (type === "event") {
      go("event", { id: item.id, entity_id: item.id, title: item.title });
    }
  };

  return (
    <header className="topbar">
      <div className="tb-search" ref={searchContainerRef} style={{ position: "relative" }}>
        <span className="ic"><I.search/></span>
        <input 
          placeholder="Search events, groups, people, interests…" 
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
        />
        <kbd>/</kbd>

        {searchOpen && (
          <div 
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
              zIndex: 10000,
              padding: "12px",
              maxHeight: "360px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {searchLoading ? (
              <div style={{ padding: "12px", textAlign: "center", color: "var(--ink-3)", fontSize: "14px" }}>
                Searching...
              </div>
            ) : (searchResults.events.length === 0 && searchResults.groups.length === 0) ? (
              <div style={{ padding: "12px", textAlign: "center", color: "var(--ink-3)", fontSize: "14px" }}>
                No results found
              </div>
            ) : (
              <>
                {searchResults.events.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px", letterSpacing: "0.5px" }}>
                      Events
                    </div>
                    {searchResults.events.map(ev => {
                      const noImageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="100%" height="100%" fill="%23f3f4f6" /><circle cx="100" cy="90" r="45" fill="none" stroke="%230f4c81" stroke-width="4"/><line x1="68" y1="58" x2="132" y2="122" stroke="%230f4c81" stroke-width="4"/><path d="M82 78h36v26H82zm7-8h22l2 4H87z" fill="none" stroke="%230f4c81" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="91" r="7" fill="none" stroke="%230f4c81" stroke-width="3"/><text x="100" y="165" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230f4c81" text-anchor="middle">NO IMAGE</text></svg>';
                      const coverUrl = ev.cover 
                        ? (ev.cover.startsWith("http") || ev.cover.startsWith("data:") || ev.cover.startsWith("linear-gradient") || ev.cover.startsWith("var(")
                            ? ev.cover 
                            : `${apiBase}/${ev.cover.startsWith('/') ? ev.cover.substring(1) : ev.cover}`)
                        : noImageUrl;
                      const coverBg = `url("${coverUrl}") center/cover no-repeat`;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => handleResultClick("event", ev)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          <div style={{ width: "60px", height: "34px", borderRadius: "6px", background: coverBg, flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</span>
                            <span style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "2px" }}>{ev.attendeeCount || 0} {ev.attendeeCount === 1 ? 'attendee' : 'attendees'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {searchResults.groups.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px", letterSpacing: "0.5px" }}>
                      Groups
                    </div>
                    {searchResults.groups.map(grp => {
                      const noImageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="100%" height="100%" fill="%23f3f4f6" /><circle cx="100" cy="90" r="45" fill="none" stroke="%230f4c81" stroke-width="4"/><line x1="68" y1="58" x2="132" y2="122" stroke="%230f4c81" stroke-width="4"/><path d="M82 78h36v26H82zm7-8h22l2 4H87z" fill="none" stroke="%230f4c81" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="91" r="7" fill="none" stroke="%230f4c81" stroke-width="3"/><text x="100" y="165" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230f4c81" text-anchor="middle">NO IMAGE</text></svg>';
                      const iconUrl = grp.icon 
                        ? (grp.icon.startsWith("http") || grp.icon.startsWith("data:") || grp.icon.startsWith("linear-gradient") || grp.icon.startsWith("var(")
                            ? grp.icon 
                            : `${apiBase}/${grp.icon.startsWith('/') ? grp.icon.substring(1) : grp.icon}`)
                        : noImageUrl;
                      const iconBg = `url("${iconUrl}") center/cover no-repeat`;
                      return (
                        <button
                          key={grp.id}
                          onClick={() => handleResultClick("group", grp)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          <div style={{ width: "60px", height: "34px", borderRadius: "6px", background: iconBg, flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{grp.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "2px" }}>{grp.memberCount || 0} {grp.memberCount === 1 ? 'member' : 'members'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
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
      {showMessages && (
        <button className="tb-icon" onClick={()=>go("messages")} title="Messages">
          <I.chat/>{counts.messages ? <span className="badge">{counts.messages}</span> : null}
        </button>
      )}
      <button className="tb-icon" onClick={()=>go("notifications")} title="Notifications">
        <I.bell/>{counts.notifs ? <span className="badge">{counts.notifs}</span> : null}
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

export function ProfileMenu({ go, dark, onToggleTheme }) {
  const isAdmin = ME.role && ME.role.toLowerCase().includes("admin");
  const items = [
    { k:"profile", ic:<I.user/>, t:"My profile" },
    { k:"tickets", ic:<I.ticket/>, t:"My tickets" },
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
export function SectionBar({ title, count, onMore, moreLabel = "See all" }) {
  return (
    <div className="sec-bar">
      <h2>{title}</h2>
      {count != null && <span className="cnt">{count}</span>}
      {onMore && <button className="more" onClick={onMore}>{moreLabel} <I.arrowR/></button>}
    </div>
  );
}

export function FilterChip({ active, icon, children, onClick, count }) {
  const showBadge = count != null && count > 0;
  return (
    <button className={`fchip ${active?"on":""}`} onClick={onClick}>
      {icon && <span className="cv">{icon}</span>}{children}
      {count!=null && (
        <span style={showBadge ? { 
          background: "var(--accent-1, #6d5efc)", 
          color: "#fff", 
          padding: "2px 7px", 
          borderRadius: "99px", 
          fontSize: "11px", 
          fontWeight: "700", 
          marginLeft: "6px", 
          display: "inline-flex", 
          alignItems: "center", 
          justifyContent: "center",
          fontVariantNumeric: "tabular-nums",
          boxShadow: "0 2px 8px rgba(109, 94, 252, 0.3)"
        } : { 
          opacity: 0.5, 
          marginLeft: "4px",
          fontVariantNumeric: "tabular-nums" 
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

export function Empty({ icon, title, text, action }) {
  return (
    <div className="empty">
      <div className="ill">{icon}</div>
      <h3>{title}</h3><p>{text}</p>
      {action && <div className="acts">{action}</div>}
    </div>
  );
}

/* ---------------- City picker sheet ---------------- */
export function CityPicker({ open, onClose, city, onPick }) {
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

      // Persist as manual (device-level) selection and lock out auto-detection
      const manualObj = {
        city_name: loc.location_name,
        state_name: null,
        country_name: null,
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      localStorage.setItem('samaagum_selected_city', JSON.stringify(manualObj));
      localStorage.setItem('samaagum_location_locked', '1');

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
          width: "90%", maxWidth: "360px", background: "var(--surface)", borderRadius: "24px",
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
          {LocationSelector && (
            <LocationSelector 
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


/* ---------------- Guest Sidebar ---------------- */
/* Shown to unauthenticated users — browse-only navigation. */
export function GuestSidebar({ view, go }) {
  const AUTH_PATH = '/pages/Samaagum Auth.html';
  const nav = [
    { k: 'discover',        label: 'Discover', ic: <I.compass /> },
    { k: 'discover-events', label: 'Events',   ic: <I.ticket />  },
    { k: 'discover-groups', label: 'Groups',   ic: <I.groups />  },
  ];

  const handleNav = (k) => {
    if (k === 'discover-events') go('discover', 'events');
    else if (k === 'discover-groups') go('discover', 'groups');
    else go(k);
  };

  const isActive = (k) => {
    if (k === 'discover-events') return view === 'discover-events';
    if (k === 'discover-groups') return view === 'discover-groups';
    return view === k;
  };

  return (
    <aside className="sidebar">
      <div className="sb-brand" style={{ display: 'flex', alignItems: 'center' }}>
        <Wordmark size={19} />
      </div>

      <nav className="sb-nav" style={{ flex: 1 }}>
        {nav.map((it) => (
          <button
            key={it.k}
            className={`sb-item ${isActive(it.k) ? 'on' : ''}`}
            onClick={() => handleNav(it.k)}
          >
            <span className="ic">{it.ic}</span>
            <span className="label">{it.label}</span>
          </button>
        ))}
      </nav>

      <div className="sb-foot" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 12px 16px' }}>
        <a
          href={`${AUTH_PATH}#login`}
          className="hbtn hbtn--ghost"
          style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}
        >
          Log in
        </a>
        <a
          href={`${AUTH_PATH}#signup`}
          className="hbtn hbtn--primary"
          style={{ textAlign: 'center', textDecoration: 'none', display: 'block' }}
        >
          Sign up
        </a>
      </div>
    </aside>
  );
}

/* ---------------- Guest Topbar ---------------- */
/* Shown to unauthenticated users — search + location + Login / Sign up. */
export function GuestTopbar({ go, city, onCity, onCreateClick }) {
  const AUTH_PATH = '/pages/Samaagum Auth.html';

  // Search states
  const [searchQuery, setSearchQuery] = useState(() => {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      return params.get('query') || "";
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('query') || "";
  });
  const [searchResults, setSearchResults] = useState({ events: [], groups: [] });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const triggerSearch = async (q: string) => {
    if (!q.trim()) {
      setSearchResults({ events: [], groups: [] });
      setSearchOpen(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
      const res = await fetch(`${apiBase}/api/public/global-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      triggerSearch(searchQuery);
    }
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    triggerSearch(q);
  };

  const handleResultClick = (type, item) => {
    setSearchOpen(false);
    setSearchQuery("");
    if (type === "group") {
      go("group", { id: item.id, entity_id: item.id, name: item.name });
    } else if (type === "event") {
      go("event", { id: item.id, entity_id: item.id, title: item.title });
    }
  };

  return (
    <header className="topbar">
      {/* Search — usable for discovery */}
      <div className="tb-search" ref={searchContainerRef} style={{ position: 'relative' }}>
        <span className="ic"><I.search /></span>
        <input
          placeholder="Search events, groups, people…"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
          style={{ cursor: 'text' }}
        />
        <kbd>/</kbd>

        {searchOpen && (
          <div 
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              left: 0,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
              zIndex: 10000,
              padding: "12px",
              maxHeight: "360px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            {searchLoading ? (
              <div style={{ padding: "12px", textAlign: "center", color: "var(--ink-3)", fontSize: "14px" }}>
                Searching...
              </div>
            ) : (searchResults.events.length === 0 && searchResults.groups.length === 0) ? (
              <div style={{ padding: "12px", textAlign: "center", color: "var(--ink-3)", fontSize: "14px" }}>
                No results found
              </div>
            ) : (
              <>
                {searchResults.events.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px", letterSpacing: "0.5px" }}>
                      Events
                    </div>
                    {searchResults.events.map(ev => {
                      const noImageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="100%" height="100%" fill="%23f3f4f6" /><circle cx="100" cy="90" r="45" fill="none" stroke="%230f4c81" stroke-width="4"/><line x1="68" y1="58" x2="132" y2="122" stroke="%230f4c81" stroke-width="4"/><path d="M82 78h36v26H82zm7-8h22l2 4H87z" fill="none" stroke="%230f4c81" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="91" r="7" fill="none" stroke="%230f4c81" stroke-width="3"/><text x="100" y="165" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230f4c81" text-anchor="middle">NO IMAGE</text></svg>';
                      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
                      const coverUrl = ev.cover 
                        ? (ev.cover.startsWith("http") || ev.cover.startsWith("data:") || ev.cover.startsWith("linear-gradient") || ev.cover.startsWith("var(")
                            ? ev.cover 
                            : `${apiBase}/${ev.cover.startsWith('/') ? ev.cover.substring(1) : ev.cover}`)
                        : noImageUrl;
                      const coverBg = `url("${coverUrl}") center/cover no-repeat`;
                      return (
                        <button
                          key={ev.id}
                          onClick={() => handleResultClick("event", ev)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          <div style={{ width: "60px", height: "34px", borderRadius: "6px", background: coverBg, flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.title}</span>
                            <span style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "2px" }}>{ev.attendeeCount || 0} {ev.attendeeCount === 1 ? 'attendee' : 'attendees'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {searchResults.groups.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--ink-3)", padding: "4px 8px", letterSpacing: "0.5px" }}>
                      Groups
                    </div>
                    {searchResults.groups.map(grp => {
                      const noImageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="100%" height="100%" fill="%23f3f4f6" /><circle cx="100" cy="90" r="45" fill="none" stroke="%230f4c81" stroke-width="4"/><line x1="68" y1="58" x2="132" y2="122" stroke="%230f4c81" stroke-width="4"/><path d="M82 78h36v26H82zm7-8h22l2 4H87z" fill="none" stroke="%230f4c81" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="91" r="7" fill="none" stroke="%230f4c81" stroke-width="3"/><text x="100" y="165" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230f4c81" text-anchor="middle">NO IMAGE</text></svg>';
                      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                      const apiBase = isLocalhost ? 'http://localhost:3000' : window.location.origin;
                      const iconUrl = grp.icon 
                        ? (grp.icon.startsWith("http") || grp.icon.startsWith("data:") || grp.icon.startsWith("linear-gradient") || grp.icon.startsWith("var(")
                            ? grp.icon 
                            : `${apiBase}/${grp.icon.startsWith('/') ? grp.icon.substring(1) : grp.icon}`)
                        : noImageUrl;
                      const iconBg = `url("${iconUrl}") center/cover no-repeat`;
                      return (
                        <button
                          key={grp.id}
                          onClick={() => handleResultClick("group", grp)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            background: "none",
                            border: "none",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            color: "var(--ink)",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          <div style={{ width: "60px", height: "34px", borderRadius: "6px", background: iconBg, flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{grp.name}</span>
                            <span style={{ fontSize: "11px", color: "var(--ink-3)", marginTop: "2px" }}>{grp.memberCount || 0} {grp.memberCount === 1 ? 'member' : 'members'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {window.featureSettings?.location_active !== false && (
        <button className="tb-loc" onClick={onCity}>
          <I.pin style={{ color: 'var(--accent-2)' }} /> {city || 'Location'} <I.chevD style={{ color: 'var(--ink-3)' }} />
        </button>
      )}

      <div className="tb-spacer" />

      {/* Create — shown but guarded */}
      <button className="tb-icon" onClick={onCreateClick} title="Create">
        <I.plus />
      </button>

      {/* Auth CTAs */}
      <a
        href={`${AUTH_PATH}#login`}
        className="hbtn hbtn--ghost"
        style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', padding: '6px 14px' }}
        id="guest-topbar-login"
      >
        Log in
      </a>
      <a
        href={`${AUTH_PATH}#signup`}
        className="hbtn hbtn--primary"
        style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', padding: '6px 16px' }}
        id="guest-topbar-signup"
      >
        Sign up
      </a>
    </header>
  );
}
