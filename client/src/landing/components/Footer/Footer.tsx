import React from "react";

const AUTH_PATH = "/pages/Samaagum Auth.html";

export function Footer() {
  const columns = [
    {
      title: "Platform",
      links: [
        { label: "Discover", href: "#search" },
        { label: "Groups", href: "#communities" },
        { label: "Events", href: "#events" },
        { label: "Communities", href: "#communities" },
        { label: "Messaging", href: AUTH_PATH },
        { label: "Discussions", href: AUTH_PATH },
        { label: "Organizations", href: AUTH_PATH }
      ]
    },
    {
      title: "Resources",
      links: [
        { label: "Help center", href: AUTH_PATH },
        { label: "API Docs", href: AUTH_PATH },
        { label: "Developers", href: AUTH_PATH },
        { label: "Guidelines", href: AUTH_PATH },
        { label: "Privacy Policy", href: AUTH_PATH },
        { label: "Terms of Service", href: AUTH_PATH }
      ]
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: AUTH_PATH },
        { label: "Careers", href: AUTH_PATH },
        { label: "Blog", href: AUTH_PATH },
        { label: "Press Kit", href: AUTH_PATH },
        { label: "Contact Us", href: AUTH_PATH }
      ]
    }
  ];

  return (
    <footer className="footer" id="footer" style={{ background: "var(--border-2)", color: "var(--ink)", padding: "64px 0 32px", borderTop: "1px solid var(--card-border)" }}>
      <div className="wrap">
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr repeat(3, 1fr)", gap: 40, marginBottom: 48 }} className="footer-grid-layout">
          <div className="footer-brand" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 750, fontSize: 20 }}>
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="footerLogoGrad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6C4DF6" />
                    <stop offset="1" stopColor="#ff4d8d" />
                  </linearGradient>
                </defs>
                <circle cx="15" cy="16" r="9.2" fill="url(#footerLogoGrad)" opacity="0.92" />
                <circle cx="25" cy="16" r="9.2" fill="url(#footerLogoGrad)" opacity="0.6" />
                <circle cx="20" cy="25" r="9.2" fill="url(#footerLogoGrad)" opacity="0.8" />
              </svg>
              samaagum
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 280 }}>
              The premium home for communities, events, rich discussions, and the people who make them happen.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h5 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--ink-3)" }}>
                {col.title}
              </h5>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {col.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{ fontSize: 13.5, color: "var(--ink-2)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="footer-bottom"
          style={{
            borderTop: "1px solid var(--card-border)",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            fontSize: 13,
            color: "var(--ink-3)"
          }}
        >
          <span>© 2026 Samaagum. Crafted with care for communities.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <a href={AUTH_PATH} style={{ color: "var(--ink-3)", textDecoration: "none" }}>
              Privacy Policy
            </a>
            <a href={AUTH_PATH} style={{ color: "var(--ink-3)", textDecoration: "none" }}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
