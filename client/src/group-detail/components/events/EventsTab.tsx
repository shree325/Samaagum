import React from 'react';
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {isOwner && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            className="hbtn hbtn--primary hbtn--sm"
            onClick={() => go("create-event", { hostGroupId: g.id, hostGroupName: g.name })}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <I.plus style={{ width: 14 }} />
            Create Event
          </button>
        </div>
      )}

      {gEvents.length > 0 ? (
        <div className="ev-grid">
          {gEvents.map((ev: any) => (
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
          <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No events scheduled</h4>
          <p style={{ margin: 0 }}>
            {isOwner
              ? "Click \"Create Event\" above to host your first group event."
              : "There are currently no events scheduled for this group."}
          </p>
        </div>
      )}
    </div>
  );
}
