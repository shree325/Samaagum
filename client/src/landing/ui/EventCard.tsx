import React from "react";
import { Event } from "../types/event";
import { useAnalytics } from "../hooks/useAnalytics";
import { APP_ROUTES, navigateToApp } from "../constants/APP_ROUTES";

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const { trackEvent } = useAnalytics();

  const handleCardClick = () => {
    trackEvent("Event Card Clicked", { eventId: event.id, title: event.title });
    navigateToApp(APP_ROUTES.event(event.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const getBannerStyle = (banner: string) => {
    if (!banner) return { background: "linear-gradient(135deg, #6C4DF6, #FF4D8D)" };
    if (banner.startsWith("linear-gradient") || banner.startsWith("radial-gradient")) {
      return { background: banner };
    }
    return {
      backgroundImage: `url(${banner})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    };
  };

  const hasRealImage = event.banner && !event.banner.startsWith("linear-gradient") && !event.banner.startsWith("radial-gradient");

  return (
    <div
      className="event-card glass-card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      aria-label={`View event: ${event.title}`}
    >
      <div className="event-thumb" style={getBannerStyle(event.banner)}>
        {!hasRealImage && <div className="stripes" />}
        <div className="event-date">
          <div className="d">{event.day}</div>
          <div className="m">{event.mon}</div>
        </div>
        {event.isOnline && <div className="event-live"><i></i>Online</div>}
      </div>
      <div className="event-body">
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span className="tag-pill sm" style={{ background: "rgba(108, 77, 246, 0.08)", color: "var(--primary)" }}>{event.category}</span>
          <span className="tag-pill sm">{event.isFree ? "Free" : event.price || "Paid"}</span>
        </div>
        <h4>{event.title}</h4>
        <div className="org" style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 8 }}>
          Host: <strong>{event.host}</strong>
        </div>
        {event.isOnline && event.speaker && (
          <div className="speaker" style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
            🎙️ {event.speaker} {event.duration && `· ${event.duration}`}
          </div>
        )}
        <div className="loc" style={{ fontSize: 13, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 21c4-4.5 7-8 7-11a7 7 0 10-14 0c0 3 3 6.5 7 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          {event.loc}
        </div>
        <div className="event-foot" style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--card-border)", paddingTop: 12 }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
            👤 {event.going} registered
          </div>
          <button
            className="rsvp"
            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
            style={{ background: "var(--primary)", borderColor: "transparent", color: "#fff" }}
          >
            View Event
          </button>
        </div>
      </div>
    </div>
  );
}
