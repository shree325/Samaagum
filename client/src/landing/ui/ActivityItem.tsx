import React from "react";
import { ActivityItemData } from "../types/activity";

interface ActivityItemProps {
  activity: ActivityItemData;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  // Generate a hash-based gradient color for initials avatar
  const getAvatarGrad = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const a = Math.abs(hash) % 360;
    const b = (a + 40) % 360;
    return `linear-gradient(135deg, hsl(${a} 72% 64%), hsl(${b} 74% 52%))`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="activity-item" style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--card-border)" }}>
      <div
        className="ava"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: getAvatarGrad(activity.who),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 11.5,
          flexShrink: 0
        }}
      >
        {getInitials(activity.who)}
      </div>
      <div className="t" style={{ fontSize: 13, color: "var(--ink-2)", flexGrow: 1 }}>
        <strong style={{ color: "var(--ink)" }}>{activity.who}</strong> {activity.action}{" "}
        <strong style={{ color: "var(--primary)" }}>{activity.object}</strong>
      </div>
      <div className="ago" style={{ fontSize: 11.5, color: "var(--ink-3)", flexShrink: 0 }}>
        {activity.timestamp}
      </div>
    </div>
  );
}
