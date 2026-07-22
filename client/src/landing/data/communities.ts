import { Community } from "../types/community";

export const COMMUNITIES: Community[] = [
  {
    id: "c1",
    name: "Founders Club BLR",
    logo: "FC",
    cover: "linear-gradient(135deg, #ff6b4a, #ff4d8d)",
    category: "Startups",
    members: 4200,
    isOnline: false,
    tags: ["Entrepreneurship", "VC", "Networking"],
    desc: "Weekly mixers, demo nights & warm intros for India's builders.",
    c1: "#ff6b4a",
    c2: "#ff4d8d"
  },
  {
    id: "c2",
    name: "Design Guild",
    logo: "DG",
    cover: "linear-gradient(135deg, #6d5efc, #2a7fff)",
    category: "Design",
    members: 8900,
    isOnline: false,
    tags: ["UI/UX", "Product Design", "Figma"],
    desc: "Critiques, portfolio nights and a directory of working designers.",
    c1: "#6d5efc",
    c2: "#2a7fff"
  },
  {
    id: "c3",
    name: "Indie Hackers",
    logo: "IH",
    cover: "linear-gradient(135deg, #10b981, #22d3ee)",
    category: "Product",
    members: 2100,
    isOnline: true,
    tags: ["SaaS", "Solopreneurs", "No-code"],
    desc: "Ship-in-public threads and accountability pods that actually meet.",
    c1: "#10b981",
    c2: "#22d3ee"
  },
  {
    id: "c4",
    name: "Sound & City",
    logo: "SC",
    cover: "linear-gradient(135deg, #f59e0b, #ef6f53)",
    category: "Music",
    members: 6500,
    isOnline: false,
    tags: ["Acoustic", "Electronic", "Live Events"],
    desc: "Rooftop sessions, open decks and a calendar that's always alive.",
    c1: "#f59e0b",
    c2: "#ef6f53"
  },
  {
    id: "c5",
    name: "Wellness Collective",
    logo: "WC",
    cover: "linear-gradient(135deg, #22c55e, #a3e635)",
    category: "Health",
    members: 3700,
    isOnline: false,
    tags: ["Yoga", "Running", "Mindfulness"],
    desc: "Morning runs, sound baths and a kinder way to network.",
    c1: "#22c55e",
    c2: "#a3e635"
  }
];
