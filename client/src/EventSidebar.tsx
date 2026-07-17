import React from 'react';
import { OnlineMeetingCard } from './OnlineMeetingCard';

interface EventSidebarProps {
  e: any;
  currentEvent: any;
  isMember: boolean;
  confirmedCount: number;
  hostStats: any;
  attendees: any[];
  city: string;
  go: (view: string, params?: any) => void;
  ME: any;
  Avatar: React.ComponentType<any>;
}

export function EventSidebar({
  e,
  currentEvent,
  isMember,
  confirmedCount,
  hostStats,
  attendees,
  city,
  go,
  ME,
  Avatar
}: EventSidebarProps) {
  const isPast = e.ends_at
    ? new Date(e.ends_at) < new Date()
    : (e.starts_at ? new Date(e.starts_at) < new Date() : false);

  const confirmedList = hostStats?.confirmed || attendees || [];

  return (
    <div className="ev-aside" style={{ width: 280, marginLeft: 20 }}>
      {isMember && (
        <div className="ticket-box">
          {e.online ? (
            <OnlineMeetingCard
              url={e.online_link}
              banner={e.cover}
              status={currentEvent.status}
              isPast={isPast}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)", letterSpacing: "0.05em", marginBottom: 12 }}>
                Your Event Ticket
              </div>
              <div style={{ padding: 10, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {(() => {
                  const TicketQR = (window as any).TicketQR;
                  return TicketQR && <TicketQR token={e.qrToken || e.attendeeId || e.id || "test"} size={120} />;
                })()}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
                Scan QR at entry gate
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ev-block" style={{ marginTop: 16 }}>
        <h3 style={{ fontSize: 14, marginTop: 0 }}>{confirmedCount} attending</h3>
        <div className="att-grid">
          {confirmedList.slice(0, 8).map((a: any, i: number) => {
            const name = typeof a === 'object' ? (a.name || a.display_name) : a;
            const userId = typeof a === 'object' ? (a.userId || a.id || a.bookingId) : undefined;
            const picture = typeof a === 'object' ? a.picture : undefined;
            return (
              <div
                key={userId || i}
                className="att"
                style={{ cursor: userId ? "pointer" : "default" }}
                onClick={() => userId && go("profile", { id: userId })}
              >
                <Avatar name={name || "Guest"} userId={userId} img={picture} size={28} />
                <span className="nm">{name || "Guest"}</span>
              </div>
            );
          })}
          {confirmedCount > 8 && (
            <div className="att" style={{ paddingRight: 14 }}>
              <div className="av" style={{ width: 28, height: 28, fontSize: 11, background: "var(--surface-2)", color: "var(--ink-2)" }}>
                +{confirmedCount - 8}
              </div>
              <span className="nm">more</span>
            </div>
          )}
        </div>
      </div>

      <div className="host-card" style={{ marginTop: 16 }}>
        <div className="hh">
          <Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={46} />
          <div>
            <div className="n">{e.host}</div>
            <div className="r">{e.hostType === 'group' ? 'Group' : 'Organizer'}</div>
          </div>
        </div>
        <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss an update.</div>
      </div>
    </div>
  );
}
