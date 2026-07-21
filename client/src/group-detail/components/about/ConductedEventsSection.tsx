import React from 'react';
import { Grain } from '../../../home-icons';
import { formatDate, formatTime } from '../../utils/date';

interface ConductedEventsSectionProps {
  groupId: string;
}

export function ConductedEventsSection({ groupId }: ConductedEventsSectionProps) {
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!groupId || groupId === 'newg') { setLoading(false); return; }
    const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`${apiBase}/api/groups/${groupId}/conducted-events`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => {
        const raw = (d.data || []);
        const past = raw.filter((ev: any) => {
          if (ev.status === 'completed' || ev.status === 'ended') return true;
          const end = ev.ends_at ? new Date(ev.ends_at) : (ev.starts_at ? new Date(new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000) : null);
          return end && end < new Date();
        });
        past.sort((a: any, b: any) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime());
        setEvents(past);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [groupId]);

  const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
  const resolveUrl = (u: string) => u && !u.startsWith('blob:') ? (u.startsWith('/api/') ? apiBase + u : u) : null;

  const cardStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '180px 1fr auto auto auto',
    gap: '20px',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 20px',
    cursor: 'default',
    userSelect: 'none',
    transition: 'background 0.15s',
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Conducted Events</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...cardStyle, animation: 'pulse 1.5s ease-in-out infinite' }}>
              <div style={{ width: 180, height: 101, borderRadius: 10, background: 'var(--surface-2)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 18, width: '60%', borderRadius: 6, background: 'var(--surface-2)' }} />
                <div style={{ height: 13, width: '80%', borderRadius: 6, background: 'var(--surface-2)' }} />
              </div>
              <div style={{ height: 40, width: 80, borderRadius: 8, background: 'var(--surface-2)' }} />
              <div style={{ height: 40, width: 80, borderRadius: 8, background: 'var(--surface-2)' }} />
              <div style={{ height: 40, width: 64, borderRadius: 8, background: 'var(--surface-2)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Conducted Events</h3>
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-3)' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ marginBottom: 16, opacity: 0.35 }}>
            <rect x="8" y="16" width="56" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            <path d="M8 28h56" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M24 8v12M48 8v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M22 42h10M22 52h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No Events Conducted Yet</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            This group hasn't organized any events yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px' }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
        Conducted Events
        <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 20 }}>
          {events.length}
        </span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((ev) => {
          const banner = resolveUrl(ev.cover || ev.banner || ev.image);
          const attendeeCount = ev.attendees_count ?? ev.attendee_count ?? ev.registrations_count ?? ev.checkin_count ?? ev.joined ?? 0;
          const category = ev.category || ev.cat || null;

          const coverBg = banner && (banner.startsWith("linear-gradient") || banner.startsWith("radial-gradient") || banner.startsWith("var(") || banner.startsWith("#") || banner.startsWith("rgb"))
            ? banner
            : (banner ? `url(${banner}) center/cover no-repeat` : 'var(--dusk)');

          return (
            <div
              key={ev.id}
              style={cardStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 80%, var(--ink) 3%)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
            >
              {/* Banner */}
              <div style={{
                width: 180,
                height: 101,
                borderRadius: 10,
                overflow: 'hidden',
                background: coverBg,
                flexShrink: 0,
                position: 'relative'
              }}>
                <Grain />
              </div>

              {/* Event info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.name || ev.title || 'Untitled Event'}
                </div>
                {(ev.description || ev.desc) && (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>
                    {ev.description || ev.desc}
                  </div>
                )}
                {category && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--accent-2)', background: 'color-mix(in srgb, var(--accent-2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-2) 25%, transparent)', borderRadius: 20, padding: '2px 9px' }}>
                    {category}
                  </span>
                )}
              </div>

              {/* Start */}
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Start</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(ev.starts_at)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatTime(ev.starts_at)}
                </div>
              </div>

              {/* End */}
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>End</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(ev.ends_at || ev.starts_at)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatTime(ev.ends_at || ev.starts_at)}
                </div>
              </div>

              {/* Attendees */}
              <div style={{ textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Attendees</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-2)', lineHeight: 1 }}>{attendeeCount.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>Joined</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
