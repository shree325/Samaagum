import React, { useEffect, useState } from "react";

const AUTH_PATH = "/pages/Samaagum Auth.html";
const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

export function Navbar() {
  const [stuck, setStuck] = useState(false);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const currentTheme = (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "dark";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  useEffect(() => {
    const handleScroll = () => {
      setStuck(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      let found = false;
      try {
        const res = await fetch(`${apiBase}/api/public/detect-location`);
        const result = await res.json();
        if (result.success && result.data) {
          const loc = result.data;
          const displayLoc = loc.state_name 
            ? `${loc.city_name}, ${loc.state_name}` 
            : `${loc.city_name}, ${loc.country_name}`;
          setLocation(displayLoc);
          found = true;
        }
      } catch (err) {
        console.error("Local IP location detection failed:", err);
      }

      if (!found) {
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
          if (data && data.city) {
            const displayLoc = data.region 
              ? `${data.city}, ${data.region}` 
              : `${data.city}, ${data.country_name}`;
            setLocation(displayLoc);
          }
        } catch (err) {
          console.error("Public IP location detection failed:", err);
        }
      }
    };
    fetchLocation();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `${AUTH_PATH}#discover?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
  };

  return (
    <nav className={`nav ${stuck ? "stuck" : ""}`} style={{ transition: "all 0.3s ease" }}>
      <div className="nav-inner" style={{ maxWidth: 1280, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0 24px" }}>
        
        {/* Left: Search pill */}
        <form onSubmit={handleSearch} style={{
          display: "flex",
          alignItems: "center",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 99,
          padding: "4px 4px 4px 16px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}>
          <input
            type="text"
            placeholder="Search events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--ink)",
              fontSize: 13.5,
              width: "50%",
              padding: "4px 0",
            }}
          />
          <div style={{ height: 18, width: 1, background: "var(--card-border)", margin: "0 12px" }} />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--ink)",
              fontSize: 13.5,
              width: "35%",
              padding: "4px 0",
            }}
          />
          <button type="submit" style={{
            background: "#1E202B",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            cursor: "pointer",
            marginLeft: "auto",
            transition: "background 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "#1E202B"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        {/* Right: Log in, Sign up */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          <a href={`${AUTH_PATH}#login`} style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--ink-2)",
            textDecoration: "none",
            transition: "color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-2)"}
          >
            Log in
          </a>

          <a href={`${AUTH_PATH}#signup`} style={{
            background: "#1E202B",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            padding: "8px 20px",
            borderRadius: 99,
            textDecoration: "none",
            transition: "all 0.2s",
            border: "1px solid var(--card-border)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--primary)";
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1E202B";
            e.currentTarget.style.borderColor = "var(--card-border)";
          }}
          >
            Sign up
          </a>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
