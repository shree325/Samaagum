import React, { useState } from "react";
import { useAnalytics } from "../../hooks/useAnalytics";
import { APP_ROUTES, navigateToApp } from "../../constants/APP_ROUTES";

export function Search() {
  const [query, setQuery] = useState("");
  const { trackEvent } = useAnalytics();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("Search Submitted", { query });
    navigateToApp(APP_ROUTES.discover() + `?query=${encodeURIComponent(query)}`);
  };

  return (
    <section className="section" id="search" style={{ background: "var(--bg)", padding: "80px 0 60px" }}>
      <div className="wrap" style={{ maxWidth: 640, textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 800, color: "var(--ink)", marginBottom: 12 }}>
          Find Your Next Group
        </h2>
        <p style={{ fontSize: 15, color: "var(--ink-2)", marginBottom: 32 }}>
          Search for groups, topics, or events happening around you.
        </p>

        <form onSubmit={handleSearchSubmit} style={{ position: "relative", marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Search communities, topics, events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => {
              navigateToApp(APP_ROUTES.discover());
            }}
            style={{
              width: "100%",
              padding: "16px 20px 16px 52px",
              borderRadius: 20,
              border: "1px solid var(--card-border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
              fontSize: 15.5,
              background: "var(--card-bg)",
              color: "var(--ink)",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)" }}
          >
            <path
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </form>
      </div>
    </section>
  );
}
export default Search;
