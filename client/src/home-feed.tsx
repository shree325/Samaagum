// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DiscussionRow, EventCard, FeatureCard, GroupCard, GroupRow, PersonCard, WishlistBtn } from './home-cards';
import { CATS, DISCUSSIONS, EVENTS, FEATURED, GROUPS, ME, NEAR, PEOPLE, TRENDING, UPCOMING } from './home-data';
import { Empty, FilterChip, SectionBar } from './home-shell';
import { apiBase } from './home-subscription';
import { I, Grain, Avatar } from './home-icons';
import { Communities, Events } from './landing-features';
import { HtmlRenderer } from './components/HtmlRenderer';

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

/* Skeleton Card Loader */
function SkeletonCard({ type }: { type: 'event' | 'group-row' | 'person' | 'discussion' }) {
  if (type === 'event') {
    return (
      <div className="ecard skeleton-card" style={{ cursor: 'default' }}>
        <div className="cover skeleton" style={{ height: 140, borderRadius: '12px 12px 0 0' }} />
        <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16 }}>
          <div className="skeleton" style={{ height: 16, width: '80%' }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
          <div className="skeleton" style={{ height: 12, width: '60%' }} />
        </div>
      </div>
    );
  }
  if (type === 'group-row') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-2)' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '8px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ height: 14, width: '60%' }} />
          <div className="skeleton" style={{ height: 11, width: '30%' }} />
        </div>
        <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 16 }} />
      </div>
    );
  }
  if (type === 'person') {
    return (
      <div className="pcard skeleton-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
        <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
        <div className="skeleton" style={{ height: 14, width: '70%' }} />
        <div className="skeleton" style={{ height: 11, width: '50%' }} />
        <div className="skeleton" style={{ height: 28, width: '80%', borderRadius: 16 }} />
      </div>
    );
  }
  if (type === 'discussion') {
    return (
      <div className="disc skeleton-card" style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid var(--border-2)', width: '100%' }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="skeleton" style={{ height: 14, width: '40%' }} />
          <div className="skeleton" style={{ height: 16, width: '85%' }} />
          <div className="skeleton" style={{ height: 12, width: '95%' }} />
        </div>
      </div>
    );
  }
  return <div className="skeleton" style={{ height: 100, width: '100%', borderRadius: 8 }} />;
}

/* Error State block with Retry */
function ErrorBlock({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div className="error-state">
      <I.warning style={{ width: 28, height: 28, color: '#e5484d' }} />
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{message}</span>
      <button className="hbtn hbtn--soft hbtn--sm" onClick={onRetry} style={{ marginTop: 4 }}>
        Retry
      </button>
    </div>
  );
}

/* Hero Carousel */
export function HeroCarousel({ events, go, wishlisted, wishlistCounts, toggleWishlist, registered }: any) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const touchStart = useRef(0);

  useEffect(() => {
    if (events.length <= 1 || hover) return;
    const timer = setInterval(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (!mediaQuery.matches) {
        setIndex((prev) => (prev + 1) % events.length);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [events, hover]);

  if (!events || events.length === 0) return null;

  const nextSlide = () => setIndex((prev) => (prev + 1) % events.length);
  const prevSlide = () => setIndex((prev) => (prev - 1 + events.length) % events.length);

  const handleTouchStart = (e: any) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: any) => {
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'ArrowRight') nextSlide();
    else if (e.key === 'ArrowLeft') prevSlide();
  };

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Featured events carousel"
      aria-roledescription="carousel"
    >
      <div className="hero-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {events.map((ev: any, idx: number) => {
          const coverBg = ev.cover && (ev.cover.startsWith("linear-gradient") || ev.cover.startsWith("radial-gradient") || ev.cover.startsWith("var("))
            ? ev.cover
            : (ev.cover ? `url(${ev.cover}) center/cover no-repeat` : 'var(--sunset)');

          const dateStr = ev.starts_at ? new Date(ev.starts_at).toLocaleDateString() : 'Date TBD';
          const timeStr = ev.starts_at ? new Date(ev.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD';
          const venueStr = ev.online ? 'Online' : ev.venue || 'Venue TBD';
          const isWish = wishlisted.has(ev.id);
          const wishCount = wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0);

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
            <div
              key={ev.id}
              className="hero-slide"
              aria-hidden={idx !== index}
              onClick={() => go('event', ev)}
              style={{ width: '100%' }}
            >
              <div className="feature" style={{ boxShadow: 'none', margin: 0 }}>
                <div className="fcover" style={{ background: coverBg }}>
                  <Grain />
                  <span className="ftag">{ev.online ? "Online" : "Featured"}</span>
                  <div style={{ position: 'absolute', top: 16, right: 16 }}>
                    {!registered?.has(ev.id) && !isRegistrationOpen && <WishlistBtn wishlisted={isWish} count={wishCount} onClick={() => toggleWishlist(ev.id, ev.wishlistCount)} Cls="save dark" />}
                  </div>
                </div>
                <div className="fbody">
                  <span className="eyebrow2">Featured Event</span>
                  <div className="ttl">{ev.title}</div>
                  <div className="dsc">{ev.description || ev.desc ? <HtmlRenderer content={ev.description || ev.desc} /> : 'No description available.'}</div>
                  <div className="fmeta">
                    <div className="row">
                      <span className="ico"><I.cal /></span>
                      <span>
                        <span className="k">When</span><br />
                        <span className="v">{dateStr} · {timeStr}</span>
                      </span>
                    </div>
                    <div className="row">
                      <span className="ico"><I.pin /></span>
                      <span>
                        <span className="k">Where</span><br />
                        <span className="v">{venueStr}</span>
                      </span>
                    </div>
                  </div>
                  <div className="factions">
                    <button className="hbtn hbtn--primary" onClick={(e) => { e.stopPropagation(); go('event', ev); }}>
                      View Details · {ev.price || (() => {
                        const isFree = ev.registration_mode === 'free' || 
                                       ev.registration_mode === 'free_rsvp' || 
                                       !ev.ticket_types || 
                                       ev.ticket_types.length === 0 || 
                                       !ev.ticket_types[0].price_minor || 
                                       Number(ev.ticket_types[0].price_minor) === 0;
                        if (isFree) return 'Free';
                        const basePrice = `₹${Number(ev.ticket_types[0].price_minor) / 100}`;
                        return ev.cash_enabled ? `${basePrice} in cash` : basePrice;
                      })()}
                    </button>
                    {ev.host?.name && (
                      <div className="att">
                        {ev.host.photo ? (
                          <img src={ev.host.photo} alt={ev.host.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface)' }} />
                        ) : (
                          <Avatar name={ev.host.name} size={26} style={{ border: '2px solid var(--surface)' }} />
                        )}
                        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500 }}>by {ev.host.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length > 1 && (
        <>
          <button className="hero-nav-btn prev" aria-label="Previous slide" onClick={(e) => { e.stopPropagation(); prevSlide(); }}><I.arrowL /></button>
          <button className="hero-nav-btn next" aria-label="Next slide" onClick={(e) => { e.stopPropagation(); nextSlide(); }}><I.arrowR /></button>

          <div className="hero-dots">
            {events.map((_: any, idx: number) => (
              <button
                key={idx}
                className={`hero-dot ${idx === index ? 'active' : ''}`}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={(e) => { e.stopPropagation(); setIndex(idx); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Hook to fetch and sync dashboard section data in parallel */
function useDashboard({ city, token }: { city: string, token: string | null }) {
  const [sections, setSections] = useState({
    hero:        { data: [], loading: true, error: null as string | null },
    recommended: { data: [], loading: true, error: null as string | null },
    upcoming:    { data: [], loading: true, error: null as string | null },
    discussions: { data: [], loading: true, error: null as string | null },
    trending:    { data: [], loading: true, error: null as string | null },
    nearby:      { data: [], loading: true, error: null as string | null },
    people:      { data: [], loading: true, error: null as string | null },
  });

  const fetchAll = useCallback(() => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const endpoints = [
      { key: 'hero', url: `${apiBase}/api/dashboard/hero-events` },
      { key: 'recommended', url: `${apiBase}/api/dashboard/recommended-events?city=${encodeURIComponent(city)}` },
      { key: 'upcoming', url: `${apiBase}/api/dashboard/upcoming-events` },
      { key: 'discussions', url: `${apiBase}/api/dashboard/recent-discussions` },
      { key: 'trending', url: `${apiBase}/api/dashboard/trending-groups` },
      { key: 'nearby', url: `${apiBase}/api/dashboard/nearby-communities?city=${encodeURIComponent(city)}` },
      { key: 'people', url: `${apiBase}/api/dashboard/people-you-may-know` },
    ];

    setSections(prev => {
      const copy = { ...prev } as any;
      for (const ep of endpoints) {
        copy[ep.key] = { ...copy[ep.key], loading: true, error: null };
      }
      return copy;
    });

    Promise.allSettled(
      endpoints.map(ep => fetch(ep.url, { headers }).then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(text || `HTTP ${r.status}`);
        }
        return r.json();
      }))
    ).then(results => {
      setSections(prev => {
        const next = { ...prev } as any;
        results.forEach((res, i) => {
          const key = endpoints[i].key;
          if (res.status === 'fulfilled') {
            next[key] = { data: res.value.data || [], loading: false, error: null };
          } else {
            console.error(`Dashboard fetch for ${key} failed:`, res.reason);
            next[key] = { data: [], loading: false, error: res.reason?.message || 'Failed to load' };
          }
        });
        return next;
      });
    });
  }, [city, token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Set up background refresh polling and event subscriptions
  useEffect(() => {
    // 30 seconds poll for discussions
    const discInterval = setInterval(() => {
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch(`${apiBase}/api/dashboard/recent-discussions`, { headers })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setSections(prev => ({
              ...prev,
              discussions: { data: res.data || [], loading: false, error: null }
            }));
          }
        })
        .catch(console.error);
    }, 30000);

    // 2 minutes poll for upcoming events
    const upcomingInterval = setInterval(() => {
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };
      fetch(`${apiBase}/api/dashboard/upcoming-events`, { headers })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setSections(prev => ({
              ...prev,
              upcoming: { data: res.data || [], loading: false, error: null }
            }));
          }
        })
        .catch(console.error);
    }, 120000);

    // 5 minutes poll for general metrics
    const generalInterval = setInterval(() => {
      fetchAll();
    }, 300000);

    // Bind WebSockets live refresh
    const socket = (window as any).chatSocket;
    const onSocketUpdate = () => {
      // Fetch fresh discussions
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      fetch(`${apiBase}/api/dashboard/recent-discussions`, { headers })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setSections(prev => ({
              ...prev,
              discussions: { data: res.data || [], loading: false, error: null }
            }));
          }
        })
        .catch(console.error);
    };

    if (socket) {
      socket.on('new_thread', onSocketUpdate);
      socket.on('events_updated', onSocketUpdate);
    }

    return () => {
      clearInterval(discInterval);
      clearInterval(upcomingInterval);
      clearInterval(generalInterval);
      if (socket) {
        socket.off('new_thread', onSocketUpdate);
        socket.off('events_updated', onSocketUpdate);
      }
    };
  }, [fetchAll, token]);

  return { sections, refetch: fetchAll };
}

export function HomeFeed({ st, go }: any) {
  const [cat, setCat] = useState("All");
  const [quick, setQuick] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const { wishlisted, wishlistCounts, toggleWishlist, connected, toggleConnect, registered, city } = st;
  const token = localStorage.getItem('token');

  const { sections, refetch } = useDashboard({ city, token });

  const [localConnected, setLocalConnected] = useState<Set<string>>(new Set());

  const handleConnectPerson = async (personId: string, personName: string) => {
    if (localConnected.has(personId)) return;
    
    // Add to local state (optimistic)
    setLocalConnected(prev => {
      const next = new Set(prev);
      next.add(personId);
      return next;
    });
    
    // Also toggle the shell's connected set (compatibility fallback)
    toggleConnect(personName);

    try {
      const res = await fetch(`${apiBase}/api/connections/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ addresseeUserId: personId })
      });
      const data = await res.json();
      if (data.success) {
        if ((window as any).toast) (window as any).toast("Connection request sent! 🤝");
      } else {
        if ((window as any).toast) (window as any).toast(data.message || "Failed to send request.");
        // Revert on failure
        setLocalConnected(prev => {
          const next = new Set(prev);
          next.delete(personId);
          return next;
        });
        toggleConnect(personName);
      }
    } catch (err) {
      if ((window as any).toast) (window as any).toast("Network error. Please try again.");
      // Revert on failure
      setLocalConnected(prev => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
      toggleConnect(personName);
    }
  };


  // Fetch dynamic categories
  useEffect(() => {
    fetch(`${apiBase}/api/public/categories`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const active = res.data.filter((c: any) => c.status === 'active' && !c.is_deleted);
          setCategoriesList([{ id: 'all', name: 'All' }, ...active]);
        } else {
          throw new Error('Not success');
        }
      })
      .catch(() => {
        setCategoriesList([{ id: 'all', name: 'All' }, ...CATS.map(([name]) => ({ id: name, name }))]);
      });
  }, []);

  const filteredRecommended = sections.recommended.data.filter((e: any) => {
    if (cat !== "All" && e.category?.toLowerCase() !== cat.toLowerCase()) return false;
    
    // Quick filter match
    if (quick.includes("free")) {
      const isFree = e.registration_mode === 'free' || (e.ticket_types && e.ticket_types[0]?.price_minor === 0);
      if (!isFree) return false;
    }
    if (quick.includes("online") && e.location_type !== 'online') return false;
    
    return true;
  });

  return (
    <div className="scroll">
      <div className="page wide view-enter">
        <Greeting city={city} />
        


        {/* Hero carousel */}
        {sections.hero.loading ? (
          <div className="hero-carousel" style={{ height: 320, marginBottom: 28 }}>
            <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 20 }} />
          </div>
        ) : sections.hero.error ? (
          <ErrorBlock message={sections.hero.error} onRetry={refetch} />
        ) : (
          <HeroCarousel
            events={sections.hero.data}
            go={go}
            wishlisted={wishlisted}
            wishlistCounts={wishlistCounts}
            toggleWishlist={toggleWishlist}
            registered={registered}
          />
        )}

        {/* Recommended rail */}
        <div className="section">
          <SectionBar title="Recommended for you" onMore={() => go("discover", "events")} />
          {sections.recommended.loading ? (
            <div className="ev-rail" style={{ gap: 16 }}>
              {[1, 2, 3, 4].map(idx => <SkeletonCard key={idx} type="event" />)}
            </div>
          ) : sections.recommended.error ? (
            <ErrorBlock message={sections.recommended.error} onRetry={refetch} />
          ) : filteredRecommended.length ? (
            <div className="ev-rail">
              {filteredRecommended.map((ev: any) => (
                <EventCard
                  key={ev.id}
                  ev={ev}
                  onOpen={(e: any) => go("event", e)}
                  wishlisted={wishlisted.has(ev.id)}
                  wishlistCount={wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0)}
                  onWishlist={() => toggleWishlist(ev.id, ev.wishlistCount)}
                  registered={registered.has(ev.id)}
                />
              ))}
            </div>
          ) : (
            <Empty
              icon={<I.compass />}
              title="No events match those filters"
              text="Try widening your category or clearing a quick filter to see more of what's on."
              action={<button className="hbtn hbtn--soft hbtn--sm" onClick={() => { setCat("All"); setQuick([]); }}>Clear filters</button>}
            />
          )}
        </div>

        {/* Your upcoming */}
        {token && (
          <div className="section">
            <SectionBar title="Your upcoming events" count={sections.upcoming.data.length} onMore={() => go("events")} />
            {sections.upcoming.loading ? (
              <div className="ev-grid" style={{ gap: 16 }}>
                {[1, 2].map(idx => <SkeletonCard key={idx} type="event" />)}
              </div>
            ) : sections.upcoming.error ? (
              <ErrorBlock message={sections.upcoming.error} onRetry={refetch} />
            ) : sections.upcoming.data.length ? (
              <div className="ev-grid">
                {sections.upcoming.data.map((ev: any) => (
                  <div key={ev.id} style={{ position: 'relative' }}>
                    {ev.isLive && (
                      <span className="badge-live" style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
                        <span className="pulse" />Live Now
                      </span>
                    )}
                    {!ev.isLive && ev.isToday && (
                      <span style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, background: 'var(--accent-1)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                        Today
                      </span>
                    )}
                    <EventCard
                      ev={ev}
                      onOpen={(e: any) => go("event", e)}
                      wishlisted={wishlisted.has(ev.id)}
                      wishlistCount={wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0)}
                      onWishlist={() => toggleWishlist(ev.id, ev.wishlistCount)}
                      registered={true}
                    />
                    {ev.countdown_ms > 0 && ev.countdown_ms < 86400000 && (
                      <div style={{ padding: '0 8px 8px', marginTop: -6, fontSize: 12, color: 'var(--accent-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <I.clock style={{ width: 12, height: 12 }} /> Starts in {Math.round(ev.countdown_ms / 3600000)}h {Math.round((ev.countdown_ms % 3600000) / 60000)}m
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                icon={<I.cal />}
                title="No registered events"
                text="Browse recommended events or head to Discover to register for upcoming sessions."
                action={<button className="hbtn hbtn--soft hbtn--sm" onClick={() => go("discover", "events")}>Explore Events</button>}
              />
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 34, marginTop: 40, alignItems: "start" }} className="feed-split">
          {/* Recent discussions */}
          <div>
            <SectionBar title="Recent discussions" onMore={() => go("groups")} />
            {sections.discussions.loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2].map(idx => <SkeletonCard key={idx} type="discussion" />)}
              </div>
            ) : sections.discussions.error ? (
              <ErrorBlock message={sections.discussions.error} onRetry={refetch} />
            ) : sections.discussions.data.length ? (
              <div className="disc-list">
                {sections.discussions.data.slice(0, 4).map((d: any) => {
                  const mapped = {
                    id: d.id,
                    who: d.author?.name || 'Anonymous User',
                    group: d.group?.name || 'Community',
                    time: d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Just now',
                    pinned: d.pinned,
                    q: d.title,
                    excerpt: d.body ? d.body.slice(0, 100) + (d.body.length > 100 ? '...' : '') : '',
                    likes: d.vote_score || 0,
                    comments: d.comments_count || 0,
                    cover: d.author?.photo || undefined
                  };
                  return (
                    <DiscussionRow
                      key={d.id}
                      d={mapped}
                      onOpen={() => go("group", { id: d.group?.id, name: d.group?.name, postId: d.id })}
                    />
                  );
                })}
              </div>
            ) : (
              <Empty
                icon={<I.chat />}
                title="No discussions yet"
                text="Be the first to ask questions or share thoughts inside your community groups."
                action={<button className="hbtn hbtn--soft hbtn--sm" onClick={() => go("groups")}>Go to Groups</button>}
              />
            )}
          </div>

          {/* Trending groups */}
          <div>
            <SectionBar title="Trending groups" onMore={() => go("discover", "groups")} />
            {sections.trending.loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(idx => <SkeletonCard key={idx} type="group-row" />)}
              </div>
            ) : sections.trending.error ? (
              <ErrorBlock message={sections.trending.error} onRetry={refetch} />
            ) : sections.trending.data.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sections.trending.data.slice(0, 5).map((g: any, i: number) => (
                  <GroupRow
                    key={g.id}
                    g={{
                      ...g,
                      members: g.memberCount,
                      isJoined: st.joined?.has(g.id),
                      isPending: st.pending?.has(g.id)
                    }}
                    rank={i + 1}
                    onOpen={() => go("group", g)}
                    joined={st.joined?.has(g.id) ? true : st.pending?.has(g.id) ? "pending" : false}
                    onJoin={() => st.toggleJoin(g)}
                  />
                ))}
              </div>
            ) : (
              <Empty
                icon={<I.users />}
                title="No trending groups"
                text="Nothing trending yet! Invite members and publish posts to see groups rise here."
              />
            )}
          </div>
        </div>

        {/* Communities near me */}
        <div className="section">
          <SectionBar title="Communities near you" onMore={() => go("discover", "groups")} />
          {sections.nearby.loading ? (
            <div className="ev-grid" style={{ gap: 16 }}>
              {[1, 2, 3].map(idx => <SkeletonCard key={idx} type="event" />)}
            </div>
          ) : sections.nearby.error ? (
            <ErrorBlock message={sections.nearby.error} onRetry={refetch} />
          ) : sections.nearby.data.length ? (
            <div className="ev-grid">
              {sections.nearby.data.slice(0, 4).map((g: any) => {
                const distanceLabel = g.distance ? ` (${Math.round(g.distance * 10) / 10} km away)` : '';
                return (
                  <GroupCard
                    key={g.id}
                    g={{
                      ...g,
                      members: g.memberCount,
                      settings: {
                        ...g.settings,
                        city: `${city}${distanceLabel}`
                      }
                    }}
                    onOpen={() => go("group", g)}
                    joined={st.joined?.has(g.id) ? true : st.pending?.has(g.id) ? "pending" : false}
                    onJoin={() => st.toggleJoin(g)}
                  />
                );
              })}
            </div>
          ) : (
            <Empty
              icon={<I.pin />}
              title="No nearby communities"
              text="We couldn't find groups in your area. Create a group to start a local hub!"
              action={<button className="hbtn hbtn--primary hbtn--sm" onClick={() => go("create_group")}>Start a Group</button>}
            />
          )}
        </div>

        {/* Suggested connections */}
        {token && (
          <div className="section">
            <SectionBar title="People you may know" />
            {sections.people.loading ? (
              <div className="people-rail" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
                {[1, 2, 3, 4].map(idx => <SkeletonCard key={idx} type="person" />)}
              </div>
            ) : sections.people.error ? (
              <ErrorBlock message={sections.people.error} onRetry={refetch} />
            ) : sections.people.data.length ? (
              <div className="people-grid">
                {sections.people.data.slice(0, 6).map((p: any) => {
                  const mapped = {
                    id: p.id,
                    name: p.name,
                    cover: 'var(--dusk)',
                    role: p.headline,
                    mutual: p.mutualGroupsCount || 0,
                    tags: p.location ? [p.location] : ['Tech'],
                    photo: p.photo
                  };
                  return (
                    <PersonCard
                      key={p.id}
                      p={mapped}
                      connected={localConnected.has(p.id) || connected.has(p.name)}
                      onConnect={() => handleConnectPerson(p.id, p.name)}
                      onNavigate={(id) => go("public-profile", { id, displayName: p.name || p.display_name, profilePhoto: p.photo })}
                    />
                  );
                })}
              </div>
            ) : (
              <Empty
                icon={<I.users />}
                title="No suggestions at this time"
                text="Join more groups and check in to events to find mutual connections."
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Discover (browse) ---------------- */
export function Discover({ st, go, param }) {
  const [tab, setTab] = useState(param === "groups" ? "groups" : "events");

  useEffect(() => {
    if (param === "events" || param === "groups") {
      setTab(param);
    }
  }, [param]);

  const { wishlisted, wishlistCounts, toggleWishlist, registered, city, addJoined, addPending } = st;
  const [dbEvents, setDbEvents] = useState([]);
  const [dbGroups, setDbGroups] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  // Filter popup and configurations
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [filterMode, setFilterMode] = useState({ free: false, paid: false });
  const [filterFormat, setFilterFormat] = useState({ online: false, inPerson: false });
  const [filterTime, setFilterTime] = useState({ today: false, thisWeek: false, other: false });
  const [filterReg, setFilterReg] = useState({ joined: false, notJoined: false });
  const [selectedCats, setSelectedCats] = useState(new Set());

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (date: Date) => {
    const today = new Date();
    const currentDay = today.getDay();
    const firstDay = today.getDate() - currentDay;
    
    const first = new Date(new Date(today).setDate(firstDay));
    first.setHours(0,0,0,0);
    const last = new Date(new Date(today).setDate(firstDay + 6));
    last.setHours(23,59,59,999);
    
    return date >= first && date <= last;
  };

  const getEventCatCount = (catName: string) => {
    if (catName === "All") return dbEvents.filter(e => e.status === "published").length;
    return dbEvents.filter(e => e.status === "published" && (e.category?.toLowerCase() === catName.toLowerCase() || e.venue?.meta?.category?.toLowerCase() === catName.toLowerCase())).length;
  };

  const getGroupCatCount = (catName: string) => {
    if (catName === "All") return dbGroups.filter(g => g.visibility !== "hidden").length;
    return dbGroups.filter(g => g.visibility !== "hidden" && (g.category?.toLowerCase() === catName.toLowerCase() || g.cat?.toLowerCase() === catName.toLowerCase())).length;
  };

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
      
      socket.on('connect', () => {
        socket.emit('join_discover');
      });
      
      socket.on('groups_updated', () => fetchGroups(city));
      socket.on('events_updated', () => fetchEvents(city));
      
      socket.on('discover_event_removed', (payload: any) => {
        setDbEvents(prev => prev.filter(e => e.id !== payload.eventId));
      });

      return () => socket.disconnect();
    }
  }, [apiBase, city, fetchGroups, fetchEvents]);

  const grps = dbGroups.filter(g => {
    if (g.visibility === "hidden") return false;
    
    // Category check
    const gCat = g.category || g.cat || "General";
    if (selectedCats.size > 0 && !selectedCats.has("All") && !selectedCats.has(gCat)) return false;
    
    // Joined check
    const groupRegActive = filterReg.joined || filterReg.notJoined;
    if (groupRegActive) {
      const isJoined = g.isJoined || st.joined?.has(g.id);
      if (isJoined && !filterReg.joined) return false;
      if (!isJoined && !filterReg.notJoined) return false;
    }
    
    return true;
  });

  const evs = dbEvents.map(e => {
    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    let priceVal = '—';
    if (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') {
        priceVal = 'Free';
    } else if (e.tickets && e.tickets.length > 0) {
        const prices = e.tickets.map(t => t.price_minor ? t.price_minor / 100 : (t.price_amount_minor ? t.price_amount_minor / 100 : 0));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
            priceVal = minPrice === 0 ? 'Free' : `₹${minPrice.toFixed(0)}`;
        } else {
            priceVal = `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
        }
    }

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
      city: e.location_type === 'online' ? null : (venueObj.city || venueObj.address || venueObj.meta?.city || null),
      wishlistCount: e.wishlistCount,
      isWishlisted: e.isWishlisted
    };
  }).filter(e => {
    if (e.status !== "published") return false;
    
    // Category check
    if (selectedCats.size > 0 && !selectedCats.has("All") && !selectedCats.has(e.cat)) return false;
    
    // Only hide events that have already ended (or started > 24h ago if no ends_at)
    if (e.starts_at) {
      const endTime = e.ends_at ? new Date(e.ends_at) : new Date(new Date(e.starts_at).getTime() + 24 * 60 * 60 * 1000);
      if (endTime < new Date()) return false;
    }
    
    // Free / Paid check
    const costActive = filterMode.free || filterMode.paid;
    if (costActive) {
      if (e.type === "Free" && !filterMode.free) return false;
      if (e.type === "Paid" && !filterMode.paid) return false;
    }
    
    // Online / In-person check
    const formatActive = filterFormat.online || filterFormat.inPerson;
    if (formatActive) {
      if (e.online && !filterFormat.online) return false;
      if (!e.online && !filterFormat.inPerson) return false;
    }
    
    // Timing check
    if (e.starts_at) {
      const d = new Date(e.starts_at);
      const isEventToday = isToday(d);
      const isEventThisWeek = isThisWeek(d);
      
      const timingActive = filterTime.today || filterTime.thisWeek || filterTime.other;
      if (timingActive) {
        if (isEventToday && !filterTime.today) return false;
        if (isEventThisWeek && !isEventToday && !filterTime.thisWeek) return false;
        if (!isEventToday && !isEventThisWeek && !filterTime.other) return false;
      }
    }
    
    // Registration check
    const regActive = filterReg.joined || filterReg.notJoined;
    if (regActive) {
      const isRegistered = registered?.has(e.id);
      if (isRegistered && !filterReg.joined) return false;
      if (!isRegistered && !filterReg.notJoined) return false;
    }

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
          <button 
            className="hbtn hbtn--soft" 
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', height: 36, fontSize: 13, fontWeight: 600 }}
            onClick={() => setShowFilterPopup(true)}
          >
            <I.filter style={{ width: 14, height: 14 }} /> Filter
          </button>
        </div>

        {/* Filter Popup Overlay Modal */}
        {showFilterPopup && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: 'var(--sh-lg)'
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>Filters</h2>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button 
                    className="hbtn hbtn--ghost hbtn--sm"
                    style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 13 }}
                    onClick={() => {
                      setFilterMode({ free: true, paid: true });
                      setFilterFormat({ online: true, inPerson: true });
                      setFilterTime({ today: true, thisWeek: true, other: true });
                      setFilterReg({ joined: true, notJoined: true });
                      setSelectedCats(new Set(["All"]));
                    }}
                  >
                    Reset All
                  </button>
                  <button 
                    className="hbtn hbtn--ghost hbtn--sm" 
                    onClick={() => setShowFilterPopup(false)}
                    style={{ padding: '4px 8px', fontSize: 16 }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Scrollable Filters Content */}
              <div className="scroll" style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>                {tab === "events" && (
                  <>
                    {/* Timing filters */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timing</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                          { key: 'today', label: 'Today' },
                          { key: 'thisWeek', label: 'This Week' },
                          { key: 'other', label: 'Later / Other' }
                        ].map(item => {
                          const isChecked = filterTime[item.key as keyof typeof filterTime];
                          return (
                            <div 
                              key={item.key} 
                              onClick={() => setFilterTime(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isChecked ? 'rgba(109, 94, 252, 0.15)' : 'var(--surface-2)',
                                padding: '8px 16px', borderRadius: 8, 
                                border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)',
                                color: isChecked ? 'var(--accent)' : 'var(--ink-2)',
                                fontWeight: isChecked ? '600' : 'normal',
                                cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: 'all 0.2s'
                              }}
                            >
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cost filters */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { key: 'free', label: 'Free' },
                          { key: 'paid', label: 'Paid' }
                        ].map(item => {
                          const isChecked = filterMode[item.key as keyof typeof filterMode];
                          return (
                            <div 
                              key={item.key} 
                              onClick={() => setFilterMode(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isChecked ? 'rgba(109, 94, 252, 0.15)' : 'var(--surface-2)',
                                padding: '8px 16px', borderRadius: 8, 
                                border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)',
                                color: isChecked ? 'var(--accent)' : 'var(--ink-2)',
                                fontWeight: isChecked ? '600' : 'normal',
                                cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: 'all 0.2s'
                              }}
                            >
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Location Format filters */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location Format</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { key: 'online', label: 'Online' },
                          { key: 'inPerson', label: 'In-person' }
                        ].map(item => {
                          const isChecked = filterFormat[item.key as keyof typeof filterFormat];
                          return (
                            <div 
                              key={item.key} 
                              onClick={() => setFilterFormat(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isChecked ? 'rgba(109, 94, 252, 0.15)' : 'var(--surface-2)',
                                padding: '8px 16px', borderRadius: 8, 
                                border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)',
                                color: isChecked ? 'var(--accent)' : 'var(--ink-2)',
                                fontWeight: isChecked ? '600' : 'normal',
                                cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: 'all 0.2s'
                              }}
                            >
                              {item.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Registration / Membership Status */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {tab === "events" ? "Registration Status" : "Membership Status"}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { key: 'joined', label: tab === "events" ? 'Registered' : 'Joined' },
                      { key: 'notJoined', label: tab === "events" ? 'Not Registered' : 'Not Joined' }
                    ].map(item => {
                      const isChecked = filterReg[item.key as keyof typeof filterReg];
                      return (
                        <div 
                          key={item.key} 
                          onClick={() => setFilterReg(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isChecked ? 'rgba(109, 94, 252, 0.15)' : 'var(--surface-2)',
                            padding: '8px 16px', borderRadius: 8, 
                            border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)',
                            color: isChecked ? 'var(--accent)' : 'var(--ink-2)',
                            fontWeight: isChecked ? '600' : 'normal',
                            cursor: 'pointer', fontSize: 13, userSelect: 'none', transition: 'all 0.2s'
                          }}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Categories Selector */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</div>
                  <div 
                    onClick={() => setShowCategoryPopup(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13,
                      transition: 'border-color 0.2s', userSelect: 'none'
                    }}
                    onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <span style={{ color: 'var(--ink)', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedCats.has('All') ? 'All Categories' : Array.from(selectedCats).join(', ')}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Choose ❯</span>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div style={{
                padding: '16px 20px', borderTop: '1px solid var(--border-2)',
                display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-2)'
              }}>
                <button 
                  className="hbtn hbtn--primary" 
                  style={{ height: 38, padding: '0 24px', fontWeight: 600 }}
                  onClick={() => setShowFilterPopup(false)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Nested Popup */}
        {showCategoryPopup && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)', zIndex: 11000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '80vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: 'var(--sh-lg)'
            }}>
              {/* Header */}
              <div style={{
                padding: '16px 20px', borderBottom: '1px solid var(--border-2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Select Categories</h2>
                <button 
                  className="hbtn hbtn--ghost hbtn--sm" 
                  onClick={() => setShowCategoryPopup(false)}
                  style={{ padding: '4px 8px', fontSize: 15 }}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Categories List */}
              <div className="scroll" style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { id: 'All', name: 'All' },
                  ...categoriesList
                ].map((c: any) => {
                  const count = tab === "events" ? getEventCatCount(c.name) : getGroupCatCount(c.name);
                  const isChecked = c.name === 'All' ? (selectedCats.size === 0 || selectedCats.has('All')) : selectedCats.has(c.name);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCats(prev => {
                          const next = new Set(prev);
                          if (c.name === 'All') {
                            next.clear();
                          } else {
                            next.delete('All');
                            if (isChecked) {
                              next.delete(c.name);
                            } else {
                              next.add(c.name);
                            }
                          }
                          return next;
                        });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', 
                        background: isChecked ? 'rgba(109, 94, 252, 0.15)' : 'var(--surface-2)',
                        border: isChecked ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: isChecked ? 'var(--accent)' : 'var(--ink-2)',
                        fontWeight: isChecked ? '600' : 'normal',
                        borderRadius: 8, cursor: 'pointer', fontSize: 13.5, userSelect: 'none', transition: 'all 0.2s'
                      }}
                    >
                      <span>{c.icon_value ? `${c.icon_value} ` : ""}{c.name}</span>
                      <span style={{ fontSize: 12, color: isChecked ? 'var(--accent)' : 'var(--ink-3)', fontWeight: 500 }}>({count})</span>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px', borderTop: '1px solid var(--border-2)',
                display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-2)'
              }}>
                <button 
                  className="hbtn hbtn--primary" 
                  style={{ height: 36, padding: '0 20px', fontWeight: 600, fontSize: 13 }}
                  onClick={() => setShowCategoryPopup(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "events" ? (
          evs.length === 0 ? (
            <Empty icon={<I.ticket />} title="No events found" text="There are no events scheduled in this category matching the filters." />
          ) : (
            <div className="ev-grid">
              {evs.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)} wishlisted={wishlisted.has(ev.id)} wishlistCount={wishlistCounts[ev.id] !== undefined ? wishlistCounts[ev.id] : (ev.wishlistCount || 0)} onWishlist={() => toggleWishlist(ev.id, ev.wishlistCount)} registered={registered.has(ev.id)} />)}
            </div>
          )
        ) : (
          <div className="ev-grid">
            {loading ? <div style={{ color: "var(--ink-3)", padding: 20 }}>Loading groups...</div> : grps.length === 0 ? (
              <Empty icon={<I.groups />} title="No groups found" text="There are no groups scheduled in this category matching the filters." />
            ) : grps.map(g => <GroupCard key={g.id} g={g} onOpen={(g)=>go("group", g)} joined={g.isJoined || st.joined?.has(g.id) ? true : (g.isPending || st.pending?.has(g.id)) ? "pending" : false} onJoin={(g)=>{ st.toggleJoin(g); }} />)}
          </div>
        )}
      </div>
    </div>
  );
}


