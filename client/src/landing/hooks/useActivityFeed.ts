import { useState, useEffect } from "react";
import { ActivityItemData } from "../types/activity";

const ACTION_POOL = [
  { action: "joined", objects: ["Founders Club BLR", "Design Guild", "Indie Hackers", "Photography Club", "Chess Club"] },
  { action: "RSVP'd to", objects: ["Design Systems Night", "AI Demo Day", "Sunset Rooftop Sessions", "Morning Run + Coffee"] },
  { action: "started a discussion in", objects: ["Design Guild", "Founders Club BLR", "SaaS Founders"] },
  { action: "connected with", objects: ["Amit Sharma", "Pooja Patel", "Rohan Verma", "Karan Malhotra"] }
];

const NAMES_POOL = ["John Doe", "Aarav Mehta", "Siddharth Rao", "Priya Nair", "Tanvi Joshi", "Aditya Sen", "Vikram Singh", "Anjali Bose"];

export function useActivityFeed(initialActivities: ActivityItemData[]) {
  const [activities, setActivities] = useState<ActivityItemData[]>([]);

  useEffect(() => {
    // Populate initial items
    setActivities(initialActivities);
  }, [initialActivities]);

  useEffect(() => {
    if (activities.length === 0) return;

    const interval = setInterval(() => {
      // Append a new randomized event
      const name = NAMES_POOL[Math.floor(Math.random() * NAMES_POOL.length)];
      const poolItem = ACTION_POOL[Math.floor(Math.random() * ACTION_POOL.length)];
      const action = poolItem.action;
      const object = poolItem.objects[Math.floor(Math.random() * poolItem.objects.length)];

      const newEvent: ActivityItemData = {
        id: `dyn_${Date.now()}`,
        who: name,
        action,
        object,
        timestamp: "just now"
      };

      setActivities((prev) => {
        // Keep list capped at 10 items
        const updated = [newEvent, ...prev.map((act) => {
          // Increment ages roughly
          if (act.timestamp === "just now") return { ...act, timestamp: "9s ago" };
          if (act.timestamp.includes("s ago")) {
            const sec = parseInt(act.timestamp) + 10;
            return { ...act, timestamp: sec >= 60 ? "1m ago" : `${sec}s ago` };
          }
          if (act.timestamp.includes("m ago")) {
            const min = parseInt(act.timestamp) + 1;
            return { ...act, timestamp: `${min}m ago` };
          }
          return act;
        })];
        return updated.slice(0, 10);
      });
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [activities]);

  return activities;
}
