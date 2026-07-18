import React, { useEffect, useState } from "react";
import { Event } from "../../types/event";
import { LandingService } from "../../services/landing.service";
import { EventCard } from "../../ui/EventCard";
import { SkeletonList } from "../../ui/Skeleton";
import { SectionHeader } from "../../ui/SectionHeader";
import { CTAButton, I_arrow } from "../../ui/CTAButton";

import { APP_ROUTES } from "../../constants/APP_ROUTES";

const AUTH_PATH = "/pages/Samaagum Auth.html";

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              {localEvents.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                {onlineEvents.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
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
