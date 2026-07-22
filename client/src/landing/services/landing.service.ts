import { EVENTS } from "../data/events";
import { COMMUNITIES } from "../data/communities";
import { STATISTICS, INITIAL_ACTIVITIES, Statistic } from "../data/activity";
import { TESTIMONIALS } from "../data/testimonials";
import { CATEGORIES } from "../data/categories";
import { Event } from "../types/event";
import { Community } from "../types/community";
import { Testimonial } from "../types/testimonial";
import { Category } from "../types/category";
import { ActivityItemData } from "../types/activity";

const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const apiBase = isLocalhost ? "http://localhost:3000" : "";

const delay = <T>(value: T, ms = 300): Promise<T> => {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
};

export const LandingService = {
  getFeaturedEvents: async (): Promise<Event[]> => {
    try {
      const res = await fetch(`${apiBase}/api/public/featured-events`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        return result.data.map((ev: any) => {
          const date = new Date(ev.starts_at);
          const day = date.getDate().toString();
          const mon = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
          return {
            id: ev.id,
            title: ev.title,
            host: ev.host,
            banner: ev.cover || "linear-gradient(135deg, #6C4DF6, #FF4D8D)",
            day,
            mon,
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            loc: ev.loc,
            going: ev.attendeeCount || 0,
            interested: ev.attendeeCount || 0,
            registered: ev.attendeeCount || 0,
            isFree: ev.isFree,
            price: ev.isFree ? "Free" : "Paid",
            category: ev.category,
            isOnline: ev.location_type === "online",
            speaker: ev.speaker || undefined,
            duration: ev.duration || undefined,
            c1: "var(--primary)",
            c2: "var(--accent-2)"
          };
        });
      }
    } catch (err) {
      console.error("Failed to fetch featured events from DB:", err);
    }
    return delay(EVENTS);
  },

  getPopularCommunities: async (): Promise<Community[]> => {
    try {
      const res = await fetch(`${apiBase}/api/public/popular-groups`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        return result.data.map((g: any) => {
          const resolveUrl = (url: string) => {
            if (!url) return url;
            if (url.startsWith('/api/')) return apiBase + url;
            return url;
          };
          return {
            id: g.id,
            name: g.name,
            desc: g.desc,
            logo: resolveUrl(g.logo),
            cover: resolveUrl(g.cover) || "linear-gradient(135deg, #8367FF, #6c4df6)",
            members: g.members,
            category: g.category,
            tags: g.tags
          };
        });
      }
    } catch (err) {
      console.error("Failed to fetch popular groups from DB:", err);
    }
    return delay(COMMUNITIES);
  },

  getStatistics: async (): Promise<Statistic[]> => {
    try {
      const res = await fetch(`${apiBase}/api/public/statistics`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        return result.data;
      }
    } catch (err) {
      console.error("Failed to fetch statistics from DB:", err);
    }
    return delay(STATISTICS);
  },

  getTestimonials: (): Promise<Testimonial[]> => {
    return delay(TESTIMONIALS);
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await fetch(`${apiBase}/api/public/categories`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        return result.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || "📁",
          communityCount: c.groupCount || 0
        }));
      }
    } catch (err) {
      console.error("Failed to fetch categories from DB:", err);
    }
    return delay(CATEGORIES);
  },

  getInitialActivities: (): Promise<ActivityItemData[]> => {
    return delay(INITIAL_ACTIVITIES);
  }
};
