import React, { useState } from 'react';
import { I } from '../../../home-icons';
import { EventCard } from '../../../home-cards';

interface EventsTabProps {
  gEvents: any[];
  isOwner: boolean;
  g: any;
  go: (dest: string, arg?: any) => void;
  st: any;
}

export function EventsTab({ gEvents, isOwner, g, go, st }: EventsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'upcoming' | 'past'>('upcoming');

  const now = new Date();

  // Categorize events
  const upcomingEvents = gEvents.filter((ev: any) => {
    const end = ev.ends_at ? new Date(ev.ends_at) : (ev.starts_at ? new Date(new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000) : null);
    return !end || end >= now;
  });

  const pastEvents = gEvents.filter((ev: any) => {
    const end = ev.ends_at ? new Date(ev.ends_at) : (ev.starts_at ? new Date(new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000) : null);
    return end && end < now;
  });

  // Sort upcoming ascending (soonest first), past descending (most recent first)
  upcomingEvents.sort((a: any, b: any) => new Date(a.starts_at || 0).getTime() - new Date(b.starts_at || 0).getTime());
  pastEvents.sort((a: any, b: any) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime());

  const currentList = activeSubTab === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div className="seg-tabs">
          <button className={activeSubTab === 'upcoming' ? 'on' : ''} onClick={() => setActiveSubTab('upcoming')}>
            Upcoming ({upcomingEvents.length})
          </button>
          <button className={activeSubTab === 'past' ? 'on' : ''} onClick={() => setActiveSubTab('past')}>
            Past ({pastEvents.length})
          </button>
        </div>
        {isOwner && (
          <button
            className="hbtn hbtn--primary hbtn--sm"
            onClick={() => go("create-event", { hostGroupId: g.id, hostGroupName: g.name })}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <I.plus style={{ width: 14 }} />
            Create Event
          </button>
        )}
      </div>

      {currentList.length > 0 ? (
        <div className="ev-grid">
          {currentList.map((ev: any) => (
            <EventCard
              key={ev.id}
              ev={ev}
              onOpen={(e) => go("event", e)}
              wishlisted={st.wishlisted?.has(ev.id)}
              wishlistCount={st.wishlistCounts?.[ev.id] !== undefined ? st.wishlistCounts[ev.id] : (ev.wishlistCount || 0)}
              onWishlist={() => st.toggleWishlist(ev.id, ev.wishlistCount)}
              registered={st.registered.has(ev.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
          <I.cal style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
          <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>
            {activeSubTab === 'upcoming' ? "No upcoming events" : "No past events"}
          </h4>
          <p style={{ margin: 0 }}>
            {activeSubTab === 'upcoming'
              ? (isOwner ? "Click \"Create Event\" above to host your first group event." : "There are currently no upcoming events scheduled for this group.")
              : "No past events have been conducted by this group yet."}
          </p>
        </div>
      )}
    </div>
  );
}
