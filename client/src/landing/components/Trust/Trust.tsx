import React, { useEffect, useState } from "react";
import { StatisticCard } from "../../ui/StatisticCard";
import { LandingService } from "../../services/landing.service";
import { Statistic } from "../../data/activity";

export function Trust() {
  const [stats, setStats] = useState<Statistic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LandingService.getStatistics().then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const ORGS = [
    "College Clubs",
    "NGOs",
    "Companies",
    "Groups",
    "Tech Meetups",
    "Student Chapters",
    "Professional Organizations"
  ];

  return (
    <section className="section-tight" style={{ padding: "60px 0", background: "var(--bg)", borderBottom: "1px solid var(--card-border)" }}>
      <div className="wrap">
        {/* Statistics Subsection */}
        {!loading && (
          <div
            className="stats-row"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 24,
              marginBottom: 56
            }}
          >
            {stats.map((s) => (
              <StatisticCard
                key={s.id}
                value={s.value}
                suffix={s.suffix}
                decimals={s.decimals}
                label={s.label}
                c1={s.c1}
                c2={s.c2}
              />
            ))}
          </div>
        )}

        {/* Trusted By Organizations Subsection */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              color: "var(--ink-3)",
              display: "block",
              marginBottom: 24
            }}
          >
            Trusted by diverse organizations
          </span>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "16px 32px",
              flexWrap: "wrap",
              opacity: 0.85
            }}
          >
            {ORGS.map((org, index) => (
              <span
                key={index}
                style={{
                  fontSize: "clamp(13px, 2vw, 15px)",
                  fontWeight: 600,
                  color: "var(--ink-2)",
                  background: "var(--card-bg)",
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--card-border)"
                }}
              >
                {org}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export default Trust;
