import React, { useEffect, useState } from "react";
import { Testimonial } from "../../types/testimonial";
import { LandingService } from "../../services/landing.service";
import { TestimonialCard } from "../../ui/TestimonialCard";
import { SectionHeader } from "../../ui/SectionHeader";

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    LandingService.getTestimonials().then((data) => {
      setTestimonials(data);
    });
  }, []);

  return (
    <section className="section" id="testimonials" style={{ background: "var(--border-2)", padding: "80px 0" }}>
      <div className="wrap">
        <SectionHeader
          eyebrow="Group Stories"
          title={
            <span>
              Loved by <span style={{ color: "var(--primary)" }}>thousands of builders.</span>
            </span>
          }
          subtitle="Read how creators, student leads, and startups use Samaagum to build thriving offline and online groups."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            marginTop: 48
          }}
        >
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
export default Testimonials;
