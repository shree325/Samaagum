import { ActivityItemData } from "../types/activity";

export const INITIAL_ACTIVITIES: ActivityItemData[] = [
  { id: "a1", who: "Aanya Rao", action: "joined", object: "Founders Club BLR", timestamp: "9s ago" },
  { id: "a2", who: "Dev Kapoor", action: "is going to", object: "Design Systems Night", timestamp: "15s ago" },
  { id: "a3", who: "Mira Shah", action: "started a discussion in", object: "Design Guild", timestamp: "42s ago" },
  { id: "a4", who: "Leo Park", action: "hosted", object: "Sunset Rooftop Sessions", timestamp: "2m ago" },
  { id: "a5", who: "Zoya Nair", action: "connected with", object: "Kabir Anand", timestamp: "5m ago" },
  { id: "a6", who: "Sara Iyer", action: "joined", object: "Indie Hackers", timestamp: "8m ago" },
  { id: "a7", who: "Noah Field", action: "RSVP'd to", object: "AI Builders Demo Day", timestamp: "12m ago" }
];

export interface Statistic {
  id: string;
  value: number;
  suffix: string;
  decimals: number;
  label: string;
  c1: string;
  c2: string;
}

export const STATISTICS: Statistic[] = [
  { id: "s1", value: 50, suffix: "K+", decimals: 0, label: "Members worldwide", c1: "#ff6b4a", c2: "#ff4d8d" },
  { id: "s2", value: 5, suffix: "K+", decimals: 0, label: "Active Groups", c1: "#6d5efc", c2: "#2a7fff" },
  { id: "s3", value: 20, suffix: "K+", decimals: 0, label: "Events hosted", c1: "#10b981", c2: "#22d3ee" },
  { id: "s4", value: 100, suffix: "+", decimals: 0, label: "Cities & growing", c1: "#f59e0b", c2: "#ef6f53" }
];
