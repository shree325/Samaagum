import React from "react";
import { Testimonial } from "../types/testimonial";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="testimonial-card glass-card" style={{ padding: 24, borderRadius: 20, display: "flex", flexDirection: "column", gap: 16, height: "100%", justifyContent: "space-between" }}>
      <div style={{ display: "flex", gap: 2, color: "#f59e0b" }}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
      <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
        "{testimonial.story}"
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid var(--card-border)", paddingTop: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6c4df6, #ff4d8d)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
          {testimonial.avatar}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{testimonial.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            Joined {testimonial.communityName} · {testimonial.location}
          </div>
        </div>
      </div>
    </div>
  );
}
