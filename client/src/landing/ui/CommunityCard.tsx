import React from "react";
import { Community } from "../types/community";
import { useAnalytics } from "../hooks/useAnalytics";
import { APP_ROUTES, navigateToApp } from "../constants/APP_ROUTES";

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { trackEvent } = useAnalytics();

  const handleCardClick = () => {
    trackEvent("Community Card Clicked", { communityId: community.id, name: community.name });
    navigateToApp(APP_ROUTES.group(community.id));
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent("Community Join Clicked", { communityId: community.id, name: community.name });
    navigateToApp(APP_ROUTES.group(community.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const getCoverStyle = (cover: string) => {
    if (!cover) return { background: "linear-gradient(135deg, #8367FF, #6c4df6)" };
    if (cover.startsWith("linear-gradient") || cover.startsWith("radial-gradient")) {
      return { background: cover };
    }
    return {
      backgroundImage: `url(${cover})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    };
  };

  return (
    <div
      className="comm-card glass-card"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      aria-label={`View group: ${community.name}`}
    >
      <div className="cc-head">
        <div className="comm-cover" style={getCoverStyle(community.cover)}>
          {(() => {
            const isCustomIcon = community.logo && (community.logo.startsWith("http") || community.logo.startsWith("data:") || community.logo.includes("/"));
            return (
              <div className="comm-logo-circle" style={isCustomIcon ? { overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)" } : getCoverStyle(community.cover)}>
                {isCustomIcon ? (
                  <img src={community.logo} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : community.logo}
              </div>
            );
          })()}
        </div>
        <div style={{ padding: "40px 16px 12px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{community.name}</h4>
              <div className="meta" style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
                {community.members.toLocaleString()} members · {community.category}
              </div>
            </div>
            <button
              onClick={handleJoin}
              style={{
                padding: "6px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid var(--primary)",
                background: "transparent",
                color: "var(--primary)",
                cursor: "pointer",
                transition: "all 0.2s",
                flexShrink: 0
              }}
            >
              Join
            </button>
          </div>
          <div style={{
            fontSize: 13,
            color: "var(--ink-2)",
            margin: "10px 0 14px",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minHeight: "58px"
          }}>
            {community.desc}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {community.tags.map((tag) => (
              <span key={tag} className="tag-pill sm" style={{ fontSize: 11 }}>
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
