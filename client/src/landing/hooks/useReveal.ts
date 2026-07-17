import { useState, useEffect, useRef } from "react";

export function useReveal(once = true) {
  const ref = useRef<HTMLElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setShow(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    // Direct trigger if already visible inside screen viewport height
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      const timer = setTimeout(() => setShow(true), 50);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setShow(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return { ref, show };
}
