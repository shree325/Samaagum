import React, { useEffect, useState, useRef } from "react";
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
  const radius = Math.round((240 / 2) / Math.tan(Math.PI / count)) + 70;

  const handleNext = () => {
    setIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setIndex((prev) => prev - 1);
  };

  // Dragging states
  const [startX, setStartX] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number) => {
    setStartX(clientX);
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging || startX === null) return;
    const diff = clientX - startX;
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    // Determine card index displacement based on drag distance
    const deltaIndex = Math.round(dragOffset / 240);
    if (deltaIndex !== 0) {
      setIndex((prev) => prev - deltaIndex);
    } else {
      const threshold = 40;
      if (dragOffset > threshold) {
        handlePrev();
      } else if (dragOffset < -threshold) {
        handleNext();
      }
    }
    setStartX(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  // Wheel scrolling listener
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    let wheelAccumulator = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccumulator += e.deltaY || e.deltaX;

      const threshold = 100; // accumulator threshold to trigger slide
      if (Math.abs(wheelAccumulator) >= threshold) {
        if (wheelAccumulator > 0) {
          setIndex((prev) => prev + 1);
        } else {
          setIndex((prev) => prev - 1);
        }
        wheelAccumulator = 0;
      }
    };

    scene.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      scene.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Add the dragOffset factor to the rotation to follow the cursor during dragging
  const containerRotation = -index * theta + (dragOffset / 240) * theta;

  return (
    <div
      ref={sceneRef}
      className="carousel-3d-scene"
      style={{ cursor: isDragging ? "grabbing" : "grab", userSelect: "none" }}
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      {events.length > 1 && (
        <button
          className="carousel-3d-btn prev"
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          aria-label="Previous events"
          style={{ cursor: "pointer" }}
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
          transition: isDragging ? "none" : "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {list.map((ev, i) => {
          const cardRotation = i * theta;

          // Track relative angle including drag offset for smooth real-time visual transition
          let relativeAngle = ((i - index) * theta + (dragOffset / 240) * theta) % 360;
          if (relativeAngle > 180) relativeAngle -= 360;
          if (relativeAngle < -180) relativeAngle += 360;

          const absAngle = Math.abs(relativeAngle);
          
          // Center card is at 0deg. Side cards are at 45deg. Back cards are at 90deg, 135deg, 180deg.
          // Let's make anything beyond 50deg progressively transparent and glassy!
          const opacity = absAngle <= 50 ? 1 : Math.max(0.15, 1 - (absAngle - 50) / 110);
          const scale = absAngle <= 50 ? 1 : Math.max(0.72, 1 - (absAngle - 50) / 380);
          const blur = absAngle <= 50 ? 0 : Math.min(6, (absAngle - 50) / 18);

          return (
            <div
              key={`${ev.id}-${i}`}
              className="carousel-3d-card"
              style={{
                transform: `rotateY(${cardRotation}deg) translateZ(${radius}px) scale(${scale})`,
                opacity: opacity,
                filter: blur > 0 ? `blur(${blur}px)` : 'none',
                pointerEvents: absAngle > 80 ? "none" : "auto",
                transition: isDragging ? "none" : "transform 0.8s, opacity 0.8s, filter 0.8s",
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
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          aria-label="Next events"
          style={{ cursor: "pointer" }}
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
