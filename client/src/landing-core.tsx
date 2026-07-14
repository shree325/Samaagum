// @ts-nocheck
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/* ============================================================
   Samaagum landing — core engine, atoms, data
   Scroll model mirrors Framer Motion: Reveal≈whileInView,
   useScrub≈useScroll+useTransform, useTilt≈motion 3D.
   ============================================================ */


export const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

declare const Lenis: any;

/* ---------- Smooth scroll (Native fallback) ---------- */
export function initLenis() {
  if (typeof document === "undefined") return null;
  // anchor links smooth scroll
  const handler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const a = target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({
        top,
        behavior: REDUCED ? "auto" : "smooth",
      });
    }
  };
  document.addEventListener("click", handler);
  return {
    destroy: () => {
      document.removeEventListener("click", handler);
    }
  };
}

/* ---------- Scrub engine (scroll-gated, rAF, imperative) ---------- */
export const scrubs = new Set<any>();
let isTickScheduled = false;

export function updateLayouts() {
  if (typeof window === 'undefined') return;
  scrubs.forEach((item) => {
    if (item.el) {
      const rect = item.el.getBoundingClientRect();
      item.top = rect.top + window.scrollY;
      item.height = rect.height;
    }
  });
}

function runScrubs() {
  if (typeof window === 'undefined') return;
  const vh = window.innerHeight;
  const sy = window.scrollY;

  const itemsWithRects: any[] = [];
  scrubs.forEach((item) => {
    if (!item.el) return;
    
    // Use pre-measured values if available
    const top = (typeof item.top === 'number' ? item.top : (item.el.getBoundingClientRect().top + sy)) - sy;
    const height = typeof item.height === 'number' ? item.height : item.el.getBoundingClientRect().height;
    const bottom = top + height;
    
    if (bottom < -vh || top > vh * 2) {
      return;
    }
    
    const p = Math.max(0, Math.min(1, (vh - top) / (vh + height)));
    const r = { top, bottom, height };
    itemsWithRects.push({ item, r, p });
  });

  itemsWithRects.forEach(({ item, r, p }) => {
    item.fn(p, r, vh, item.el);
  });
}

export function scheduleTick() {
  if (!isTickScheduled) {
    isTickScheduled = true;
    requestAnimationFrame(() => {
      runScrubs();
      isTickScheduled = false;
    });
  }
}

// Mark dirty and schedule tick only when actually scrolling or resizing
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', scheduleTick, { passive: true });
  window.addEventListener('resize', () => {
    updateLayouts();
    scheduleTick();
  }, { passive: true });
  window.addEventListener('load', () => {
    updateLayouts();
    scheduleTick();
  }, { passive: true });
}

export function useScrub(fn, deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED) return;
    
    const rect = el.getBoundingClientRect();
    const item = { 
      el, 
      fn,
      top: rect.top + window.scrollY,
      height: rect.height
    };
    scrubs.add(item);
    scheduleTick();
    
    // Recalculate shortly after mount in case layout shifted from dynamic content/fonts
    const timerId = setTimeout(() => {
      updateLayouts();
      scheduleTick();
    }, 450);
    
    return () => {
      scrubs.delete(item);
      clearTimeout(timerId);
    };
  }, deps);
  return ref;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
// map progress sub-range to 0..1
export const range = (p, a, b) => clamp((p - a) / (b - a));

/* ---------- Reveal (whileInView) ---------- */
export function Reveal({ children, y = 26, delay = 0, once = true, className = "", style, as = "div" }: any) {
  const ref = useRef(null);
  const [show, setShow] = useState(REDUCED);
  useEffect(() => {
    if (REDUCED) return;
    const el = ref.current; if (!el) return;
    const vh = window.innerHeight;
    // Initially in view (e.g. hero): guarantee reveal via timer so it never
    // depends on IntersectionObserver firing (which is throttled when the
    // page isn't actively painting).
    if (el.getBoundingClientRect().top < vh * 0.9) {
      const id = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(id);
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShow(true); if (once) io.unobserve(el); }
      else if (!once) setShow(false);
    }, { threshold: 0.15, rootMargin: "0px 0px -7% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = as;
  return (
    <Tag ref={ref} className={`reveal2 ${show ? "in" : ""} ${className}`}
      style={{ "--ry": y + "px", transitionDelay: delay + "ms", ...style }}>
      {children}
    </Tag>
  );
}
/* stagger helper: wraps an array of nodes each in Reveal with incremental delay */
export function Stagger({ items, step = 80, base = 0, y = 26, render }: any) {
  return items.map((it, i) => (
    <Reveal key={i} delay={base + i * step} y={y}>{render(it, i)}</Reveal>
  ));
}

/* ---------- 3D tilt ---------- */
export function useTilt(max = 10) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el || REDUCED) return;
    let raf;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
      });
    };
    const reset = () => { el.style.transform = "rotateX(0deg) rotateY(0deg)"; };
    const parent = el.parentElement;
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", reset);
    return () => { parent.removeEventListener("mousemove", onMove); parent.removeEventListener("mouseleave", reset); cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

/* ---------- CountUp ---------- */
export function CountUp({ to, dur = 1600, suffix = "", prefix = "", decimals = 0 }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (REDUCED) { setVal(to); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const t0 = performance.now();
        const step = (t) => {
          const k = clamp((t - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 3);
          setVal(to * eased);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  const display = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

/* ---------- Atoms ---------- */
export function Mark({ size = 26 }) {
  const id = "lm" + Math.round(size * 10);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--accent-1)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
      <circle cx="15" cy="16" r="9.2" fill={`url(#${id})`} opacity="0.92" />
      <circle cx="25" cy="16" r="9.2" fill={`url(#${id})`} opacity="0.6" />
      <circle cx="20" cy="25" r="9.2" fill={`url(#${id})`} opacity="0.8" />
    </svg>
  );
}
export function Wordmark({ size = 19, mark = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      {mark && <Mark size={size * 1.35} />}
      <span className="wm">samaagum</span>
    </span>
  );
}
export function gradFor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const a = Math.abs(h) % 360, b = (a + 42) % 360;
  return `linear-gradient(135deg, hsl(${a} 72% 64%), hsl(${b} 74% 52%))`;
}
export const initials = (n) => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

export const I = {
  arrow: (p = {}) => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  check: (p = {}) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  verify: (p = {}) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 1.8l2.5 1.8 3-.3 1 2.9 2.6 1.6-.9 2.9.9 2.9-2.6 1.6-1 2.9-3-.3L12 22.2 9.5 20.4l-3 .3-1-2.9L2.9 16.2l.9-2.9-.9-2.9L5.5 8.8l1-2.9 3 .3z" /><path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  pin: (p = {}) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 21c4-4.5 7-8 7-11a7 7 0 10-14 0c0 3 3 6.5 7 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" /></svg>,
  menu: (p = {}) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  spark: (p = {}) => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>,
};

/* ---------- Data ---------- */
export const PEOPLE = ["Aanya Rao", "Dev Kapoor", "Mira Shah", "Leo Park", "Zoya Nair", "Kabir Anand", "Sara Iyer", "Noah Field", "Tara Bose", "Ivan Cole"];
export const COMMUNITIES = [
  { name: "Founders Club BLR", members: "4.2k", tag: "Startups", desc: "Weekly mixers, demo nights & warm intros for India's builders.", c1: "#ff6b4a", c2: "#ff4d8d" },
  { name: "Design Guild", members: "8.9k", tag: "Design", desc: "Critiques, portfolio nights and a directory of working designers.", c1: "#6d5efc", c2: "#2a7fff" },
  { name: "Indie Hackers", members: "2.1k", tag: "Product", desc: "Ship-in-public threads and accountability pods that actually meet.", c1: "#10b981", c2: "#22d3ee" },
  { name: "Sound & City", members: "6.5k", tag: "Music", desc: "Rooftop sessions, open decks and a calendar that's always alive.", c1: "#f59e0b", c2: "#ef6f53" },
  { name: "Wellness Collective", members: "3.7k", tag: "Health", desc: "Morning runs, sound baths and a kinder way to network.", c1: "#22c55e", c2: "#a3e635" },
];
export const EVENTS = [
  { title: "Founders & Funders Mixer", day: "12", mon: "Jun", loc: "Indiranagar, Bengaluru", tag: "Networking", c1: "#ff6b4a", c2: "#6d5efc", going: 3, live: true },
  { title: "Design Systems Night", day: "15", mon: "Jun", loc: "WeWork Galaxy", tag: "Design", c1: "#6d5efc", c2: "#2a7fff", going: 5 },
  { title: "Sunset Rooftop Sessions", day: "18", mon: "Jun", loc: "Koramangala", tag: "Music", c1: "#f59e0b", c2: "#ef6f53", going: 4 },
  { title: "AI Builders Demo Day", day: "21", mon: "Jun", loc: "HSR Layout", tag: "Tech", c1: "#10b981", c2: "#22d3ee", going: 6 },
  { title: "Morning Run + Coffee", day: "23", mon: "Jun", loc: "Cubbon Park", tag: "Wellness", c1: "#22c55e", c2: "#a3e635", going: 2 },
];
export const ACTIVITY = [
  { who: "Aanya R", t: "joined", obj: "Founders Club BLR", ago: "2m" },
  { who: "Dev K", t: "is going to", obj: "Design Systems Night", ago: "5m" },
  { who: "Mira S", t: "started", obj: "a discussion in Design Guild", ago: "8m" },
  { who: "Leo P", t: "hosted", obj: "Sunset Rooftop Sessions", ago: "12m" },
  { who: "Zoya N", t: "connected with", obj: "Kabir Anand", ago: "18m" },
  { who: "Sara I", t: "joined", obj: "Indie Hackers", ago: "24m" },
  { who: "Noah F", t: "RSVP'd to", obj: "AI Builders Demo Day", ago: "31m" },
];
export const CITIES = []; // Dynamically fetched in Activity


