import React, { useEffect, useState } from "react";
import { Event } from "../../types/event";
import { LandingService } from "../../services/landing.service";
import { EventCard } from "../../ui/EventCard";
import { SkeletonList } from "../../ui/Skeleton";
import { SectionHeader } from "../../ui/SectionHeader";
import { CTAButton, I_arrow } from "../../ui/CTAButton";

import { APP_ROUTES } from "../../constants/APP_ROUTES";

const AUTH_PATH = "/pages/Samaagum Auth.html";

function EventScroller({ events }: { events: Event[] }) {
  const [index, setIndex] = useState(0);
  const total = events.length;

  if (total === 0) return null;

  // We want to make sure there are at least 8 cards to look like a complete ring.
  let list = [...events];
  if (total > 0) {
    while (list.length < 8) {
      list = [...list, ...events];
    }
  }

  const count = list.length;
  const theta = 360 / count;
  // Push the radius slightly further back (+80px) to give breathing room for 4 cards
  const radius = Math.round((300 / 2) / Math.tan(Math.PI / count)) + 80;

  const handleNext = () => {
    setIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIndex((prev) => prev - 1);
  };

  // Offset by half-step (theta / 2) to display 2 centered cards and 2 side cards
  const containerRotation = -index * theta + (theta / 2);

  return (
    <div className="carousel-3d-scene">
      {events.length > 1 && (
        <button
          className="carousel-3d-btn prev"
          onClick={handlePrev}
          aria-label="Previous events"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      )}

      <div
        className="carousel-3d-container"
        style={{
          transform: `rotateY(${containerRotation}deg)`,
        }}
      >
        {list.map((ev, i) => {
          const cardRotation = i * theta;
          
          let relativeAngle = ((i - index) * theta + theta / 2) % 360;
          if (relativeAngle > 180) relativeAngle -= 360;
          if (relativeAngle < -180) relativeAngle += 360;
          
          const absAngle = Math.abs(relativeAngle);
          // Let the 4 front cards (at 22.5deg and 67.5deg) be fully visible
          const opacity = absAngle > 80 ? Math.max(0.05, 1 - (absAngle - 80) / 100) : 1;
          
          return (
            <div
              key={`${ev.id}-${i}`}
              className="carousel-3d-card"
              style={{
                transform: `rotateY(${cardRotation}deg) translateZ(${radius}px)`,
                opacity: opacity,
                pointerEvents: absAngle > 80 ? "none" : "auto",
              }}
            >
              <EventCard event={ev} />
            </div>
          );
        })}
      </div>

      {events.length > 1 && (
        <button
          className="carousel-3d-btn next"
          onClick={handleNext}
          aria-label="Next events"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LandingService.getFeaturedEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const localEvents = events.filter((e) => !e.isOnline);
  const onlineEvents = events.filter((e) => e.isOnline);

  return (
    <section className="section" id="events" style={{ background: "var(--bg)", overflow: "hidden" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Events"
          title={
            <span>
              Discover what's <span style={{ color: "var(--primary)" }}>happening near you.</span>
            </span>
          }
          subtitle="From rooftop meetups to founders mixers. Find your local community and register to attend."
        />

        {/* Local Events Grid */}
        <div style={{ marginTop: 40 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              <SkeletonList count={3} />
            </div>
          ) : (
            <EventScroller events={localEvents} />
          )}
        </div>

        {/* Upcoming Online Events Section */}
        <div style={{ marginTop: 80 }}>
          <SectionHeader
            title={
              <span>
                Join <span style={{ color: "var(--primary)" }}>Online Events</span>
              </span>
            }
            subtitle="Attend webinars, panel discussions, and workshop sessions from anywhere in the world."
          />

          <div style={{ marginTop: 40 }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                <SkeletonList count={2} />
              </div>
            ) : (
              <EventScroller events={onlineEvents} />
            )}
          </div>
        </div>

        {/* View all events CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <CTAButton
            href={APP_ROUTES.discover(undefined, "events")}
            variant="ghost"
            trackingName="View All Events Clicked"
          >
            See All Events
            <I_arrow style={{ marginLeft: 6 }} />
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
export default Events;
