import { useEffect, useRef } from "react";

export function useScrub(
  fn: (p: number, r: { top: number; bottom: number; height: number }, vh: number, el: HTMLElement) => void,
  deps: any[] = []
) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const top = rect.top;
      const height = rect.height;
      const bottom = top + height;

      // Skip elements fully out of bounds
      if (bottom < -vh || top > vh * 2) {
        return;
      }

      // Calculate progress between 0 and 1
      const progress = Math.max(0, Math.min(1, (vh - top) / (vh + height)));
      fn(progress, { top, bottom, height }, vh, el);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    
    // Initial run
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, deps);

  return ref;
}
