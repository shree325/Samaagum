import React from 'react';
import { Avatar, Grain } from './home-icons';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — shared cards (event, group, person, discussion)
   ============================================================ */

export function DateBadge({ month, day }) {
  return <div className="date-badge"><div className="m">{month}</div><div className="d">{day}</div></div>;
}

export function WishlistBtn({ wishlisted, onClick, count = 0, Cls = "save" }) {
  return (
    <button className={`${Cls} ${wishlisted?"on":""}`} onClick={(e)=>{ e.stopPropagation(); onClick(); }} title={wishlisted?"Remove from Wishlist":"Add to Wishlist"}>
      {wishlisted ? <I.heartF/> : <I.heart/>}
      {count > 0 && <span className="w-count">{count}</span>}
    </button>
  );
}

/* ---------------- Event card (rail / grid) ---------------- */
export const EventCard = React.memo(function EventCard({ ev, onOpen, wishlisted, wishlistCount, onWishlist, registered }: any) {
  const month = ev.month || (ev.starts_at ? new Date(ev.starts_at).toLocaleString('en-US', { month: 'short' }).toUpperCase() : 'TBD');
  const day = ev.day || (ev.starts_at ? new Date(ev.starts_at).getDate().toString() : '');
  const dateStr = ev.date || (ev.starts_at ? new Date(ev.starts_at).toLocaleDateString() : 'Date TBD');
  const timeStr = ev.time || (ev.starts_at ? new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD');
  const venueStr = ev.online ? 'Online' : (typeof ev.venue === 'object' && ev.venue !== null ? (ev.venue.name || ev.venue.address || 'Venue TBD') : (ev.venue || 'Venue TBD'));
  const coverBg = ev.cover && (ev.cover.startsWith("linear-gradient") || ev.cover.startsWith("radial-gradient") || ev.cover.startsWith("var(")) ? ev.cover : (ev.cover ? `url(${ev.cover}) center/cover no-repeat` : 'var(--dusk)');

  let regStatus = ev.registrationStatus || ev.registration_status || "OPEN";
  if (regStatus === "SCHEDULED" && (ev.registrationOpensAt || ev.registration_opens_at)) {
    const o = new Date(ev.registrationOpensAt || ev.registration_opens_at);
    if (new Date() >= o) regStatus = "OPEN";
  }
  if (regStatus !== "CLOSED" && (ev.registrationClosesAt || ev.registration_closes_at)) {
    const c = new Date(ev.registrationClosesAt || ev.registration_closes_at);
    if (new Date() >= c) regStatus = "CLOSED";
  }
  const isRegistrationOpen = regStatus === "OPEN";

  return (
    <div className="ecard rise" onClick={()=>onOpen(ev)}>
      <div className="cover" style={{ background: coverBg }}>
        <Grain/>
        <DateBadge month={month} day={day} />
        {!registered && !isRegistrationOpen && <WishlistBtn wishlisted={wishlisted} count={wishlistCount} onClick={onWishlist} />}
        <span className="cat">{ev.online ? "Online" : ev.cat}</span>
      </div>
      <div className="body">
        <div className="ttl">{ev.title}</div>
        {ev.hostType === 'group' && ev.hostName && (
          <div className="meta-row" style={{ color: "var(--brand-main)", fontWeight: 500 }}><span className="ic"><I.groups/></span>{ev.hostName}</div>
        )}
        <div className="meta-row"><span className="ic"><I.clock/></span>{dateStr} · {timeStr}</div>
        <div className="meta-row"><span className="ic">{ev.online?<I.online/>:<I.pin/>}</span>{venueStr}</div>
        <div className="foot">
          <div className="going">
            <div className="stack">
              {(ev.attendees||[]).slice(0,3).map((n,i)=><Avatar key={i} name={n} size={24}/>)}
            </div>
            <span className="lbl">{ev.going || 0} going</span>
          </div>
          {registered
            ? <span className="price" style={{ color:"var(--accent-2)", display:"inline-flex", alignItems:"center", gap:5 }}><I.check/>Going</span>
            : <span className={`price ${ev.type==="Free"?"free":""}`}>{ev.price || (ev.registration_mode === 'free' ? 'Free' : '')}</span>}
        </div>
      </div>
    </div>
  );
});

/* ---------------- Featured (hero) ---------------- */
export const FeatureCard = React.memo(function FeatureCard({ ev, onOpen, wishlisted, wishlistCount, onWishlist, registered }: any) {
  const dateStr = ev.date || (ev.starts_at ? new Date(ev.starts_at).toLocaleDateString() : 'Date TBD');
  const timeStr = ev.time || (ev.starts_at ? new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD');
  const venueStr = ev.online ? 'Online' : (typeof ev.venue === 'object' && ev.venue !== null ? (ev.venue.name || ev.venue.address || 'Venue TBD') : (ev.venue || 'Venue TBD'));
  const coverBg = ev.cover && (ev.cover.startsWith("linear-gradient") || ev.cover.startsWith("radial-gradient") || ev.cover.startsWith("var(")) ? ev.cover : (ev.cover ? `url(${ev.cover}) center/cover no-repeat` : 'var(--sunset)');

  let regStatus = ev.registrationStatus || ev.registration_status || "OPEN";
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  
  React.useEffect(() => {
    if (regStatus === "SCHEDULED" && (ev.registrationOpensAt || ev.registration_opens_at)) {
      const o = new Date(ev.registrationOpensAt || ev.registration_opens_at).getTime();
      const ms = o - Date.now();
      if (ms > 0 && ms <= 2147483647) {
        const timer = setTimeout(() => setRefreshTrigger(prev => prev + 1), ms);
        return () => clearTimeout(timer);
      }
    } else if (regStatus === "OPEN" && (ev.registrationClosesAt || ev.registration_closes_at)) {
      const c = new Date(ev.registrationClosesAt || ev.registration_closes_at).getTime();
      const ms = c - Date.now();
      if (ms > 0 && ms <= 2147483647) {
        const timer = setTimeout(() => setRefreshTrigger(prev => prev + 1), ms);
        return () => clearTimeout(timer);
      }
    }
  }, [regStatus, ev.registrationOpensAt, ev.registration_opens_at, ev.registrationClosesAt, ev.registration_closes_at]);

  if (regStatus === "SCHEDULED" && (ev.registrationOpensAt || ev.registration_opens_at)) {
    const o = new Date(ev.registrationOpensAt || ev.registration_opens_at);
    if (new Date() >= o) regStatus = "OPEN";
  }
  if (regStatus !== "CLOSED" && (ev.registrationClosesAt || ev.registration_closes_at)) {
    const c = new Date(ev.registrationClosesAt || ev.registration_closes_at);
    if (new Date() >= c) regStatus = "CLOSED";
  }
  const isClosed = regStatus === "CLOSED";
  const isScheduled = regStatus === "SCHEDULED";

  const isRegistrationOpen = regStatus === "OPEN";

  return (
    <div className="feature rise" onClick={()=>onOpen(ev)}>
      <div className="fcover" style={{ background: coverBg }}>
        <Grain/>
        {isScheduled ? <span className="live"><span className="pulse"/>Coming Soon</span> :
         isClosed ? <span className="live" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>Registration Closed</span> :
         ev.live ? <span className="live"><span className="pulse"/>Selling fast</span> : null}
        <span className="ftag">{ev.cat}</span>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          {!registered && !isRegistrationOpen && <WishlistBtn wishlisted={wishlisted} count={wishlistCount} onClick={onWishlist} Cls="save dark" />}
        </div>
      </div>
      <div className="fbody">
        <span className="eyebrow2">Featured this week</span>
        <div className="ttl">{ev.title}</div>
        <p className="dsc">{ev.desc}</p>
        <div className="fmeta">
          <div className="row"><span className="ico"><I.cal/></span><span><span className="k">When</span><br/><span className="v">{dateStr} · {timeStr}</span></span></div>
          <div className="row"><span className="ico"><I.pin/></span><span><span className="k">Where</span><br/><span className="v">{venueStr}, {ev.city || ''}</span></span></div>
        </div>
        <div className="factions">
          {(() => {
            const isSoldOut = ev.going >= (ev.cap || 9999) || ev.id === "ev-feat";
            const hasWaitlist = ev.waitlist !== undefined ? ev.waitlist : false;
            if (isSoldOut && !hasWaitlist) return <button className="hbtn hbtn--soft" disabled>Sold Out</button>;
            return <button className="hbtn hbtn--primary" onClick={(e)=>{ e.stopPropagation(); onOpen(ev); }}>Get tickets · {ev.price || 'Free'}</button>;
          })()}
          <div className="att"><div className="going"><div className="stack" style={{ display:"flex" }}>
            {["Kabir A","Dev K","Riya T","Sam K"].map((n,i)=><Avatar key={i} name={n} size={26} style={{ marginLeft: i? -9:0, border:"2px solid var(--surface)" }}/>)}
          </div></div><span>{ev.going || 0} going</span></div>
        </div>
      </div>
    </div>
  );
});

/* ---------------- Group card (grid) ---------------- */
export const GroupCard = React.memo(function GroupCard({ g, onOpen, joined, onJoin }: any) {
  const _apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const _resolveImg = (url) => url && !url.startsWith('blob:') ? (url.startsWith('/api/') ? _apiBase + url : url) : null;
  const bannerSrc = _resolveImg(g.banner);
  const iconSrc = _resolveImg(g.icon);
  const isCustomIcon = iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/"));
  
  let displayLocation = null;
  const loc = g.settings?.location;
  if (loc) {
    if (loc.city && loc.state && loc.country) displayLocation = `${loc.city}, ${loc.state}, ${loc.country}`;
    else if (loc.city && loc.state) displayLocation = `${loc.city}, ${loc.state}`;
    else if (loc.city && loc.country) displayLocation = `${loc.city}, ${loc.country}`;
    else if (loc.city) displayLocation = loc.city;
    else if (typeof loc === 'string') displayLocation = loc;
  } else if (g.settings?.city) {
    displayLocation = g.settings.city;
  }

  return (
    <div className="gcard rise" onClick={()=>onOpen(g)}>
      <div className="gcov" style={{
          backgroundImage: bannerSrc ? `url("${bannerSrc}")` : undefined,
          backgroundColor: g.cover,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}><Grain/></div>
      <div className="gicon" style={{ background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {isCustomIcon ? <img src={iconSrc} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : g.icon}
      </div>
      <div className="gbody">
        <div className="gname" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {g.name}
          {g.visibility === "private" && <I.lock style={{ width: 14, height: 14, color: "var(--ink-3)" }} title="Private Group" />}
          {g.visibility === "hidden" && <I.eyeOff style={{ width: 14, height: 14, color: "var(--ink-3)" }} title="Hidden Group" />}
        </div>
        <div className="gdsc">{g.description || g.desc}</div>
        {displayLocation && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", fontSize: 13, fontWeight: 500, margin: "8px 0", overflow: "hidden" }}>
            <I.pin style={{ width: 14, height: 14, flexShrink: 0, color: "var(--ink-2)" }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayLocation}</span>
          </div>
        )}
        <div className="gstats" style={{ display: "flex", flexWrap: "wrap", gap: "8px 12px", alignItems: "center" }}>
          <span><b style={{ color:"var(--ink-2)" }}>{(g.members || 0).toLocaleString()}</b> members</span>
          <span style={{ fontSize: 11, fontWeight: 600, background: "var(--surface-2)", color: "var(--ink-2)", padding: "2px 6px", borderRadius: 4 }}>Free</span>
        </div>
        <div className="gfoot">
          <div className="stack">{(g.memberNames || []).slice(0,4).map((m,i)=><Avatar key={i} name={typeof m === 'object' ? m.name : m} size={26}/>)}</div>
          <button className={`hbtn hbtn--sm ${joined ? "hbtn--ghost" : "hbtn--soft"}`} style={{ marginLeft:"auto" }}
            onClick={(e)=>{ e.stopPropagation(); onJoin(g); }}>
            {joined === "pending" ? <><I.clock style={{ width: 14, height: 14 }}/>Requested</> : joined ? <><I.check/>Joined</> : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ---------------- Group row (trending list) ---------------- */
export const GroupRow = React.memo(function GroupRow({ g, rank, onOpen, joined, onJoin }: any) {
  const _apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const _resolveImg = (url) => url && !url.startsWith('blob:') ? (url.startsWith('/api/') ? _apiBase + url : url) : null;
  const iconSrc = _resolveImg(g.icon);
  const isCustomIcon = iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/"));
  
  let displayLocation = null;
  const loc = g.settings?.location;
  if (loc) {
    if (loc.city && loc.state && loc.country) displayLocation = `${loc.city}, ${loc.state}, ${loc.country}`;
    else if (loc.city && loc.state) displayLocation = `${loc.city}, ${loc.state}`;
    else if (loc.city && loc.country) displayLocation = `${loc.city}, ${loc.country}`;
    else if (loc.city) displayLocation = loc.city;
    else if (typeof loc === 'string') displayLocation = loc;
  } else if (g.settings?.city) {
    displayLocation = g.settings.city;
  }

  return (
    <div className="grow" onClick={()=>onOpen(g)}>
      {rank!=null && <span className="rank">{rank}</span>}
      <div className="gicon2" style={{ background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {isCustomIcon ? <img src={iconSrc} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} /> : g.icon}
      </div>
      <div className="gi">
        <div className="n" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {g.name}
          {g.visibility === "private" && <I.lock style={{ width: 12, height: 12, color: "var(--ink-3)" }} />}
        </div>
        <div className="s" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {displayLocation && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><I.pin style={{ width: 12, height: 12 }} /> {displayLocation}</span>}
          <span>{(g.members || 1).toLocaleString()} members · {g.category || g.cat || "Community"}</span>
        </div>
      </div>
      <button className={`hbtn hbtn--sm ${joined ? "hbtn--ghost" : "hbtn--soft"}`}
        onClick={(e)=>{ e.stopPropagation(); onJoin(g); }}>
        {joined === "pending" ? <><I.clock style={{ width: 14, height: 14 }}/>Requested</> : joined ? <><I.check/>Joined</> : "Join"}
      </button>
    </div>
  );
});

/* ---------------- Person card (horizontal scroll) ---------------- */
export const PersonCard = React.memo(function PersonCard({ p, connected, onConnect }: any) {
  return (
    <div className="pcard rise">
      <div className="pc-cov" style={{ background: p.cover }} />
      <Avatar name={p.name} size={64} img={p.photo || p.img} />
      <div className="pn">{p.name}</div>
      <div className="ph">{p.role}</div>
      <div className="pmut"><I.users style={{ width:13, height:13 }}/>{p.mutual} mutual connections</div>
      <div className="ptags">{p.tags.map(t => <span key={t} className="ptag">{t}</span>)}</div>
      <div className="pacts">
        <button className={`hbtn hbtn--sm hbtn--block ${connected?"hbtn--ghost":"hbtn--primary"}`} onClick={()=>onConnect(p)}>
          {connected ? <><I.check/>Requested</> : <>Connect</>}
        </button>
        <button className="hbtn hbtn--sm hbtn--ghost" style={{ padding:"8px 12px" }}><I.msg/></button>
      </div>
    </div>
  );
});

/* ---------------- Discussion row (feed) ---------------- */
export const DiscussionRow = React.memo(function DiscussionRow({ d, onOpen }: any) {
  return (
    <div className="disc" onClick={onOpen}>
      <Avatar name={d.who} size={40} img={d.photo || d.img || d.cover} />
      <div className="dmain">
        <div className="dtop">
          {d.pinned && <span className="pin"><I.bookmarkF style={{ width:12, height:12 }}/>Pinned</span>}
          <span className="who">{d.who}</span> in <span className="grp">{d.group}</span> · <span>{d.time}</span>
        </div>
        <div className="dq">{d.q}</div>
        <div className="dex">{d.excerpt}</div>
        {d.media && <div className="pmedia" style={{ maxWidth:280, marginTop:10 }}><div className="pm" style={{ background:d.cover, borderRadius:10 }}/><div className="pm" style={{ background:"var(--surface-2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--ink-3)" }}><I.image/></div></div>}
        <div className="dstats">
          <span><I.heart/> {d.likes}</span>
          <span><I.comment/> {d.comments}</span>
          <span><I.share/> Share</span>
        </div>
      </div>
    </div>
  );
});


