import React, { useEffect, useState } from "react";
import { Category } from "../../types/category";
import { LandingService } from "../../services/landing.service";
import { useHorizontalScroll } from "../../hooks/useHorizontalScroll";
import { SectionHeader } from "../../ui/SectionHeader";
import { APP_ROUTES, navigateToApp } from "../../constants/APP_ROUTES";

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useHorizontalScroll();

  useEffect(() => {
    LandingService.getCategories().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  return (
    <section className="section" id="categories" style={{ background: "var(--border-2)", padding: "80px 0", overflow: "hidden" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Explore Interests"
          title={
            <span>
              Explore by <span style={{ color: "var(--primary)" }}>Categories</span>
            </span>
          }
          subtitle="Find exactly what you love. From tech startups to hiking trails and book clubs."
        />

        <div
          ref={scrollRef as React.RefObject<HTMLDivElement>}
          className="horizontal-scroll-container"
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            padding: "24px 8px 12px",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {!loading &&
            categories.map((cat) => (
              <div
                key={cat.id}
                className="glass-card category-scroll-card"
                role="button"
                tabIndex={0}
                aria-label={`Browse ${cat.name} category`}
                style={{
                  flexShrink: 0,
                  width: 160,
                  padding: 20,
                  borderRadius: 20,
                  textAlign: "center",
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                }}
                onClick={() => navigateToApp(APP_ROUTES.discover(cat.name))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigateToApp(APP_ROUTES.discover(cat.name));
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(108, 77, 246, 0.06)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--card-border)";
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{cat.icon}</div>
                <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{cat.name}</h4>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{cat.communityCount} groups</div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
export default Categories;
