// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DiscussionRow, EventCard, FeatureCard, GroupCard, GroupRow, PersonCard } from './home-cards';
import { CATS, DISCUSSIONS, EVENTS, FEATURED, GROUPS, ME, NEAR, PEOPLE, TRENDING, UPCOMING } from './home-data';
import { Empty, FilterChip, SectionBar } from './home-shell';
import { apiBase } from './home-subscription';
import { I } from './home-icons';
import { Communities, Events } from './landing-features';

/* ============================================================
   Samaagum Home — Home feed + Discover
   ============================================================ */

export function Greeting({ city }) {
  const hr = new Date().getHours();
  const part = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const first = ME.name.split(" ")[0];
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="eyebrow2">{part}, {first}</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 30, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 8, lineHeight: 1.1 }}>
        What's happening in <span className="grad-text">{city}</span>
      </h1>
    </div>
  );
}

/* category + quick filter bar */
export function FeedFilters({ cat, setCat, quick, setQuick }) {
  const quicks = [
    { k: "trending", ic: <I.fire />, label: "Trending" },
    { k: "nearby", ic: <I.pin />, label: "Nearby" },
    { k: "upcoming", ic: <I.cal />, label: "This week" },
    { k: "free", ic: <I.ticket />, label: "Free" },
    { k: "online", ic: <I.online />, label: "Online" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 26 }}>
      <div className="filterbar">
        {CATS.map(([name]) => (
          <FilterChip key={name} active={cat === name} onClick={() => setCat(name)}>{name}</FilterChip>
        ))}
      </div>
      <div className="filterbar">
        {quicks.map(q => (
          <FilterChip key={q.k} active={quick.includes(q.k)} icon={q.ic}
            onClick={() => setQuick(quick.includes(q.k) ? quick.filter(x => x !== q.k) : [...quick, q.k])}>
            {q.label}
          </FilterChip>
        ))}
        <div className="fdiv" />
        <button className="fchip"><span className="cv"><I.filter /></span>All filters</button>
      </div>
    </div>
  );
}

export function HomeFeed({ st, go }) {
  const [cat, setCat] = useState("All");
  const [quick, setQuick] = useState([]);
  const { wishlisted, wishlistCounts, toggleWishlist, connected, toggleConnect, registered, city } = st;

  const filtered = EVENTS.filter(e => {
    if (cat !== "All" && e.cat !== cat) return false;
    if (quick.includes("free") && e.type !== "Free") return false;
    if (quick.includes("online") && !e.online) return false;
    return true;
  });

  return (
    <div className="scroll">
      <div className="page wide view-enter">
        <Greeting city={city} />
        <FeedFilters cat={cat} setCat={setCat} quick={quick} setQuick={setQuick} />

        {/* Featured */}
        <FeatureCard ev={FEATURED} onOpen={(e) => go("event", e)} wishlisted={wishlisted.has(FEATURED.id)} wishlistCount={wishlistCounts[FEATURED.id] !== undefined ? wishlistCounts[FEATURED.id] : (FEATURED.wishlistCount || 0)} onWishlist={() => toggleWishlist(FEATURED.id)} />

        {/* Recommended rail */}
        <div className="section">
          <SectionBar title="Recommended for you" onMore={() => go("discover")} />
          {filtered.length ? (
            <div className="ev-rail">
              {filtered.map(ev => (
                <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)}
                  wishlisted={wishlisted.has(ev.id)} wishlistCount={wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0)} onWishlist={() => toggleWishlist(ev.id)} registered={registered.has(ev.id)} />
              ))}
            </div>
          ) : (
            <Empty icon={<I.compass />} title="No events match those filters"
              text="Try widening your category or clearing a quick filter to see more of what's on."
              action={<button className="hbtn hbtn--soft hbtn--sm" onClick={() => { setCat("All"); setQuick([]); }}>Clear filters</button>} />
          )}
        </div>

        {/* Your upcoming */}
        <div className="section">
          <SectionBar title="Your upcoming events" count={UPCOMING.length} onMore={() => go("events")} />
          <div className="ev-grid">
            {UPCOMING.map(ev => (
              <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)}
                wishlisted={wishlisted.has(ev.id)} wishlistCount={wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0)} onWishlist={() => toggleWishlist(ev.id)} registered={true} />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 34, marginTop: 40, alignItems: "start" }} className="feed-split">
          {/* Recent discussions */}
          <div>
            <SectionBar title="Recent discussions" onMore={() => go("groups")} />
            <div className="disc-list">
              {DISCUSSIONS.map(d => <DiscussionRow key={d.id} d={d} onOpen={() => go("group", GROUPS.find(g => g.name === d.group))} />)}
            </div>
          </div>
          {/* Trending groups */}
          <div>
            <SectionBar title="Trending groups" onMore={()=>go("discover")} />
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {TRENDING.filter(g => g.visibility !== "hidden").map((g,i) => (
                <GroupRow key={g.id} g={g} rank={i+1} onOpen={(g)=>go("group", g)}
                  joined={g.isJoined || st.joined?.has(g.id) ? true : (g.isPending || st.pending?.has(g.id)) ? "pending" : false} onJoin={(g)=>{ st.toggleJoin(g); }} />
              ))}
            </div>
          </div>
        </div>

        {/* Communities near me */}
        <div className="section">
          <SectionBar title="Communities near you" onMore={() => go("discover")} />
          <div className="ev-grid">
            {NEAR.filter(g => g.visibility !== "hidden").map(g => <GroupCard key={g.id} g={g} onOpen={(g)=>go("group", g)} joined={g.isJoined || st.joined?.has(g.id) ? true : (g.isPending || st.pending?.has(g.id)) ? "pending" : false} onJoin={(g)=>{ st.toggleJoin(g); }} />)}
          </div>
        </div>

        {/* Suggested connections */}
        <div className="section">
          <SectionBar title="People you may know" onMore={() => go("messages")} moreLabel="View all" />
          <div className="people-grid">
            {PEOPLE.map(p => <PersonCard key={p.name} p={p} connected={connected.has(p.name)} onConnect={() => toggleConnect(p.name)} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Discover (browse) ---------------- */
export function Discover({ st, go }) {
  const [tab, setTab] = useState("groups");
  const [cat, setCat] = useState("All");
  const [groupFilter, setGroupFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const { wishlisted, wishlistCounts, toggleWishlist, registered, city, addJoined, addPending } = st;
  const [dbEvents, setDbEvents] = useState([]);

  const [dbGroups, setDbGroups] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  const cityRef = React.useRef(city);
  React.useEffect(() => { cityRef.current = city; }, [city]);

  const fetchGroups = React.useCallback(async (currentCity) => {
    try {
      const token = localStorage.getItem('token');
      const cityQuery = currentCity && currentCity !== "Global" ? `?city=${encodeURIComponent(currentCity)}` : '';
      const res = await fetch(`${apiBase}/api/groups${cityQuery}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const groups = data.data || [];
        setDbGroups(groups);
        // Seed joined/pending sets from server so cards show correct state on load
        groups.forEach(g => {
          if (g.isJoined) addJoined && addJoined(g.id);
          else if (g.isPending) addPending && addPending(g.id);
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${apiBase}/api/public/categories`);
        const data = await res.json();
        if (data.success && data.data) {
          setCategoriesList(data.data.filter((c: any) => c.status === 'active' && !c.is_deleted));
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCategories();
  }, [apiBase]);

  const fetchEvents = React.useCallback(async (currentCity?: string) => {
    try {
      const token = localStorage.getItem('token');
      const cityQuery = currentCity && currentCity !== "Global" ? `?city=${encodeURIComponent(currentCity)}` : '';
      const res = await fetch(`${apiBase}/api/events${cityQuery}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setDbEvents(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchEvents(city);
    fetchGroups(city);
  }, [city, fetchEvents, fetchGroups]);

  React.useEffect(() => {
    if (window.io) {
      const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
      const socket = window.io(socketUrl, { transports: ['websocket'] });
      socket.on('groups_updated', () => fetchGroups(city));
      socket.on('events_updated', () => fetchEvents(city));
      return () => socket.disconnect();
    }
  }, [apiBase, city, fetchGroups, fetchEvents]);

  const grps = dbGroups.filter(g => {
    if (g.visibility === "hidden") return false;
    if (cat !== "All" && g.category !== cat && g.cat !== cat) return false;
    
    const isJoined = g.isJoined || st.joined?.has(g.id);
    if (groupFilter === "joined" && !isJoined) return false;
    if (groupFilter === "unjoined" && isJoined) return false;
    
    return true;
  });

  const evs = dbEvents.map(e => {
    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const priceVal = e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : (e.registration_mode === 'free' ? 'Free' : '—');

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      cover: meta.cover || "",
      cat: meta.category || "General",
      type: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
      online: e.location_type === 'online',
      month,
      day,
      date: dateStr,
      time,
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || 'Venue TBD'),
      going: 0,
      price: priceVal,
      attendees: [],
      status: e.status,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      hostName: e.hostName,
      hostType: e.hostType,
      hostId: e.hostId,
      city: e.location_type === 'online' ? null : (venueObj.city || venueObj.address || venueObj.meta?.city || null)
    };
  }).filter(e => {
    if (e.status !== "published") return false;
    if (cat !== "All" && e.cat !== cat) return false;
    
    // Only hide events that have already ended (or started > 24h ago if no ends_at)
    if (e.starts_at) {
      const endTime = e.ends_at ? new Date(e.ends_at) : new Date(new Date(e.starts_at).getTime() + 24 * 60 * 60 * 1000);
      if (endTime < new Date()) return false;
    }
    
    const isRegistered = registered?.has(e.id);
    if (eventFilter === "joined" && !isRegistered) return false;
    if (eventFilter === "unjoined" && isRegistered) return false;
    if (eventFilter === "paid" && e.type !== "Paid") return false;
    if (eventFilter === "free" && e.type !== "Free") return false;

    return true;
  });

  return (
    <div className="scroll">
      <div className="page wide view-enter">
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow2">Discover</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 28, letterSpacing: "-0.02em", color: "var(--ink)", marginTop: 8 }}>
            Explore everything happening
          </h1>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div className="msg-seg" style={{ maxWidth: 280, margin: 0 }}>
            <button className={tab === "events" ? "on" : ""} onClick={() => setTab("events")}>Events</button>
            <button className={tab === "groups" ? "on" : ""} onClick={() => setTab("groups")}>Groups</button>
          </div>
          {tab === "groups" && (
            <select className="h-input" style={{ width: "auto", padding: "6px 12px", height: "32px", fontSize: 13, background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 8 }} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <option value="all" style={{ background: "var(--surface)", color: "var(--ink)" }}>All Groups</option>
              <option value="joined" style={{ background: "var(--surface)", color: "var(--ink)" }}>Joined</option>
              <option value="unjoined" style={{ background: "var(--surface)", color: "var(--ink)" }}>Not Joined</option>
            </select>
          )}
          {tab === "events" && (
            <select className="h-input" style={{ width: "auto", padding: "6px 12px", height: "32px", fontSize: 13, background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--border)", borderRadius: 8 }} value={eventFilter} onChange={e => setEventFilter(e.target.value)}>
              <option value="all" style={{ background: "var(--surface)", color: "var(--ink)" }}>All Events</option>
              <option value="joined" style={{ background: "var(--surface)", color: "var(--ink)" }}>Registered</option>
              <option value="unjoined" style={{ background: "var(--surface)", color: "var(--ink)" }}>Not Registered</option>
              <option value="free" style={{ background: "var(--surface)", color: "var(--ink)" }}>Free</option>
              <option value="paid" style={{ background: "var(--surface)", color: "var(--ink)" }}>Paid</option>
            </select>
          )}
        </div>
        <div className="filterbar" style={{ marginBottom: 24 }}>
          <FilterChip active={cat === "All"} onClick={() => setCat("All")}>All</FilterChip>
          {categoriesList.map((c: any) => (
            <FilterChip key={c.id} active={cat === c.name} onClick={() => setCat(c.name)}>
              {c.icon_value ? `${c.icon_value} ` : ""}{c.name}
            </FilterChip>
          ))}
        </div>
        {tab === "events" ? (
          evs.length === 0 ? (
            <Empty icon={<I.ticket />} title="No events found" text="There are no events scheduled in this category." />
          ) : (
            <div className="ev-grid">
              {evs.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)} wishlisted={wishlisted.has(ev.id)} wishlistCount={wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0)} onWishlist={() => toggleWishlist(ev.id)} registered={registered.has(ev.id)} />)}
            </div>
          )
        ) : (
          <div className="ev-grid">
            {loading ? <div style={{ color: "var(--ink-3)", padding: 20 }}>Loading groups...</div> : grps.map(g => <GroupCard key={g.id} g={g} onOpen={(g)=>go("group", g)} joined={g.isJoined || st.joined?.has(g.id) ? true : (g.isPending || st.pending?.has(g.id)) ? "pending" : false} onJoin={(g)=>{ st.toggleJoin(g); }} />)}
          </div>
        )}
      </div>
    </div>
  );
}


