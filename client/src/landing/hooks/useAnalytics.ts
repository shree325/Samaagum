import { useCallback } from "react";

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    // Placeholder for future analytics tools (e.g. Mixpanel, Google Analytics, Amplitude)
    console.log(`[Analytics Track] Event: ${eventName}`, properties || {});
  }, []);

  return { trackEvent };
}
