import React, { useEffect, useState } from "react";
import { Community } from "../../types/community";
import { LandingService } from "../../services/landing.service";
import { CommunityCard } from "../../ui/CommunityCard";
import { SkeletonList } from "../../ui/Skeleton";
import { SectionHeader } from "../../ui/SectionHeader";
import { CTAButton, I_arrow } from "../../ui/CTAButton";

const AUTH_PATH = "/pages/Samaagum Auth.html";

export function Communities() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LandingService.getPopularCommunities().then((data) => {
      setCommunities(data);
      setLoading(false);
    });
  }, []);

  return (
    <section className="section" id="communities" style={{ background: "var(--border-2)", padding: "80px 0" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Popular Groups"
          title={
            <span>
              Spaces where people <span style={{ color: "var(--primary)" }}>actually belong.</span>
            </span>
          }
          subtitle="Start a group in minutes. Host events, organize discussions, and grow your local network."
        />

        <div style={{ marginTop: 48 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              <SkeletonList count={3} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
              {communities.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 48 }}>
          <CTAButton
            href={AUTH_PATH}
            variant="primary"
            trackingName="View All Groups Clicked"
          >
            Explore All Groups
            <I_arrow style={{ marginLeft: 6 }} />
          </CTAButton>
        </div>
      </div>
    </section>
  );
}
export default Communities;
