/* ============================================================
   Samaagum Home — sample data
   Bengaluru-centric community / events seed.
   ============================================================ */

const ME = {
  name: "", handle: "", role: "",
  bio: "",
  location: "Bengaluru, India",
  plan: "free", // "free", "pro", "enterprise"
  stats: { connections: 248, events: 36, groups: 7 },
};

const PLAN_CONFIG = {
  free: { maxGroups: 2, paid: false, customQuestions: false, advancedForums: false, premiumCovers: false },
  pro: { maxGroups: 999, paid: true, customQuestions: true, advancedForums: true, premiumCovers: true },
  enterprise: { maxGroups: 999, paid: true, customQuestions: true, advancedForums: true, premiumCovers: true, analytics: true }
};

// Derive initial ME values from the JWT token stored in localStorage
// so the profile shows the real user's email immediately on first render,
// before the async profile fetch completes.
(function seedMEFromToken() {
  try {
    const raw = localStorage.getItem('token');
    if (!raw) return;
    const parts = raw.split('.');
    if (parts.length < 2) return;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.email) {
      const localPart = payload.email.split('@')[0];
      // Capitalise each word: "shree.sharma" → "Shree Sharma"
      ME.name = localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      ME.handle = `@${localPart}`;
    }
  } catch (e) { /* ignore token parse errors */ }
})();

const CATS = [
  ["All", "grid"], ["Startups", "spark"], ["Design", "edit"], ["Music", "fire"],
  ["Tech", "online"], ["Wellness", "heart"], ["Food & Drink", "users"], ["Art", "image"],
];

const COVERS = {
  coral: "linear-gradient(135deg,#ff6b4a 0%,#ff4d8d 100%)",
  violet: "linear-gradient(135deg,#6d5efc 0%,#2a7fff 100%)",
  sunset: "linear-gradient(135deg,#f59e0b 0%,#ef6f53 60%,#ff5a7a 100%)",
  emerald: "linear-gradient(135deg,#10b981 0%,#22d3ee 100%)",
  plum: "linear-gradient(135deg,#8b5cf6 0%,#e5489d 100%)",
  dusk: "linear-gradient(135deg,#2a3fff 0%,#6d5efc 55%,#b15efc 100%)",
  ember: "linear-gradient(135deg,#ff9a6b 0%,#ff5a7a 100%)",
  ocean: "linear-gradient(135deg,#0ea5a4 0%,#3b82f6 100%)",
};

const FEATURED = {
  id: "ev-feat", title: "Founders & Funders Mixer — Summer Edition",
  desc: "An intimate evening connecting early-stage founders with operators and angels across Bengaluru's tech scene. Curated tables, no pitches — just real conversations over rooftop sunsets.",
  cover: COVERS.sunset, cat: "Startups", type: "Paid",
  month: "JUN", day: "18", date: "Thu, Jun 18", time: "6:30 PM – 9:30 PM",
  venue: "Skydeck, Indiranagar", city: "Bengaluru", host: "BLR Founders Collective",
  hostBy: "Kabir Anand", price: "₹499", going: 142, cap: 180, live: true,
};

const EVENTS = [
  {
    id: "e1", title: "Design Systems Night #12", cover: COVERS.violet, cat: "Design", type: "Free",
    month: "JUN", day: "21", date: "Sat, Jun 21", time: "5:00 PM", venue: "WeWork Galaxy", city: "Bengaluru",
    host: "Aanya Reddy", price: "Free", going: 86, cap: 120, attendees: ["Dev K", "Mira S", "Leo P", "Zoya N", "Ishaan M"]
  },
  {
    id: "e2", title: "Sunset Rooftop Sessions: Indie Live", cover: COVERS.ember, cat: "Music", type: "Paid",
    month: "JUN", day: "20", date: "Fri, Jun 20", time: "7:00 PM", venue: "Koramangala Social", city: "Bengaluru",
    host: "Echo Collective", price: "₹350", going: 204, cap: 250, attendees: ["Riya T", "Sana B", "Arjun V"]
  },
  {
    id: "e3", title: "Morning Flow + Community Brunch", cover: COVERS.emerald, cat: "Wellness", type: "Paid",
    month: "JUN", day: "22", date: "Sun, Jun 22", time: "7:30 AM", venue: "Cubbon Park", city: "Bengaluru",
    host: "Still Mind", price: "₹250", going: 48, cap: 60, attendees: ["Nina P", "Karan S"]
  },
  {
    id: "e4", title: "AI Builders Demo Day", cover: COVERS.dusk, cat: "Tech", type: "Free",
    month: "JUN", day: "25", date: "Wed, Jun 25", time: "6:00 PM", venue: "Online", city: "Online",
    host: "Bangalore AI", price: "Free", going: 312, cap: 500, online: true, attendees: ["Vivek R", "Tara N", "Sam K"]
  },
  {
    id: "e5", title: "Street Food Crawl: VV Puram", cover: COVERS.coral, cat: "Food & Drink", type: "Paid",
    month: "JUN", day: "28", date: "Sat, Jun 28", time: "6:30 PM", venue: "VV Puram", city: "Bengaluru",
    host: "Bites & Lanes", price: "₹600", going: 34, cap: 40, attendees: ["Meera J", "Dev K"]
  },
  {
    id: "e6", title: "Typography & Lettering Workshop", cover: COVERS.plum, cat: "Art", type: "Paid",
    month: "JUL", day: "02", date: "Wed, Jul 2", time: "11:00 AM", venue: "Rangoli Metro Art", city: "Bengaluru",
    host: "Letterform Lab", price: "₹1,200", going: 18, cap: 24, attendees: ["Zoya N", "Aanya R"]
  },
];

const UPCOMING = [EVENTS[0], EVENTS[1], EVENTS[3]]; // user is registered

const GROUPS = [
  {
    id: "g1", name: "BLR Founders Collective", icon: "🚀", cover: COVERS.sunset, cat: "Startups",
    desc: "3,400 founders building in Bengaluru. Weekly mixers, fundraising AMAs, and a no-BS peer network.",
    members: 3421, online: 128, posts: 842, trending: true,
    owner: "Kabir A",
    location: "Bengaluru, India", groupType: "paid", fee: "₹999/year", visibility: "public", joinMode: "approval",
    threadPerm: "selected", replyPerm: "everyone",
    memberNames: [
      { name: "Kabir A", role: "owner" }, { name: "Aanya Reddy", role: "member" }, { name: "Dev K", role: "moderator" }
    ]
  },
  {
    id: "g2", name: "Design Guild Bangalore", icon: "✺", cover: COVERS.violet, cat: "Design",
    desc: "Product & visual designers sharing critique, jobs, and monthly Design Systems Night.",
    members: 1890, online: 64, posts: 1203, trending: true,
    owner: "Aanya Reddy",
    location: "Bengaluru, India", groupType: "free", visibility: "public", joinMode: "open",
    threadPerm: "everyone", replyPerm: "everyone",
    banner: "url('https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=800&q=80')",
    memberNames: [
      { name: "Aanya Reddy", role: "owner" }, { name: "Mira S", role: "moderator" }, { name: "Leo P", role: "member" }
    ]
  },
  {
    id: "g3", name: "Sunrise Runners", icon: "🌅", cover: COVERS.ember, cat: "Wellness",
    desc: "5AM club. We run Cubbon & Lalbagh loops, then coffee. All paces welcome.",
    members: 642, online: 21, posts: 318, near: true,
    owner: "Nina P",
    location: "Bengaluru, India", groupType: "free", visibility: "public", joinMode: "open",
    threadPerm: "everyone", replyPerm: "everyone",
    memberNames: [
      { name: "Nina P", role: "owner" }, { name: "Karan S", role: "moderator" }, { name: "Meera J", role: "member" }
    ]
  },
  {
    id: "g4", name: "Bangalore AI", icon: "◆", cover: COVERS.dusk, cat: "Tech",
    desc: "Builders & researchers shipping with AI. Demo days, paper clubs, hack nights.",
    members: 5210, online: 243, posts: 2104, trending: true,
    owner: "Vivek R",
    location: "Online", groupType: "free", visibility: "public", joinMode: "open",
    threadPerm: "admins", replyPerm: "everyone",
    memberNames: [
      { name: "Vivek R", role: "owner" }, { name: "Tara N", role: "moderator" }, { name: "Sam K", role: "member" }
    ]
  },
  {
    id: "g5", name: "Indie Music Bengaluru", icon: "🎧", cover: COVERS.coral, cat: "Music",
    desc: "Gig discovery, open mics & a community of indie artists and listeners.",
    members: 2240, online: 88, posts: 967, near: true,
    owner: "Riya T",
    location: "Bengaluru, India", groupType: "free", visibility: "private", joinMode: "approval",
    threadPerm: "everyone", replyPerm: "everyone",
    memberNames: [
      { name: "Riya T", role: "owner" }, { name: "Sana B", role: "member" }, { name: "Arjun V", role: "member" }
    ]
  },
  {
    id: "g6", name: "Slow Food Society", icon: "🍲", cover: COVERS.emerald, cat: "Food & Drink",
    desc: "Supper clubs, market walks & a love for where food comes from.",
    members: 980, online: 33, posts: 421, near: true,
    owner: "Meera J",
    location: "Bengaluru, India", groupType: "paid", fee: "₹499/month", visibility: "public", joinMode: "open",
    threadPerm: "everyone", replyPerm: "everyone",
    memberNames: [
      { name: "Meera J", role: "owner" }, { name: "Nina P", role: "member" }
    ]
  },
];

const NEAR = [GROUPS[2], GROUPS[4], GROUPS[5]];
const TRENDING = [GROUPS[3], GROUPS[0], GROUPS[1], GROUPS[4]];

const PEOPLE = [
  { name: "Mira Shah", role: "Brand Designer", cover: COVERS.violet, mutual: 8, tags: ["Design", "Type"] },
  { name: "Vivek Rao", role: "ML Engineer · Bangalore AI", cover: COVERS.dusk, mutual: 12, tags: ["Tech", "AI"] },
  { name: "Riya Thomas", role: "Music Curator", cover: COVERS.coral, mutual: 5, tags: ["Music", "Events"] },
  { name: "Karan Sethi", role: "Founder · Still Mind", cover: COVERS.emerald, mutual: 3, tags: ["Wellness", "Startups"] },
];

const DISCUSSIONS = [
  {
    id: "d1", who: "Dev Kapoor", group: "BLR Founders Collective", pinned: true, time: "2h",
    q: "What's your honest take on raising a pre-seed in this market?",
    excerpt: "We're 4 months in, ~₹8L MRR, and torn between bootstrapping longer vs. taking a small angel round now. Curious what the room thinks…",
    likes: 64, comments: 38, cover: COVERS.sunset
  },
  {
    id: "d2", who: "Mira Shah", group: "Design Guild Bangalore", time: "5h",
    q: "Sharing my talk deck from Design Systems Night #11 →",
    excerpt: "For everyone who asked — slides + the Figma file for the token pipeline walkthrough. Happy to answer questions in the thread.",
    likes: 122, comments: 24, media: true, cover: COVERS.violet
  },
  {
    id: "d3", who: "Karan Sethi", group: "Sunrise Runners", time: "1d",
    q: "Sunday long run — Lalbagh, 6AM. Who's in?",
    excerpt: "Planning a relaxed 8K with a coffee stop after. Drop a 🏃 if you're coming so I can book the table.",
    likes: 31, comments: 19, cover: COVERS.ember
  },
];

const NOTIFS = [
  {
    id: "n1", type: "join", who: "BLR Founders Collective", unread: true, day: "Today", time: "12 min ago",
    text: "<b>Your request to join</b> BLR Founders Collective was <b>approved</b>. Welcome aboard!", action: "view"
  },
  {
    id: "n2", type: "connect", who: "Vivek Rao", unread: true, day: "Today", time: "40 min ago",
    text: "<b>Vivek Rao</b> wants to connect with you.", action: "connect"
  },
  {
    id: "n3", type: "event", who: "Design Systems Night #12", unread: true, day: "Today", time: "1 hour ago",
    text: "Reminder: <b>Design Systems Night #12</b> starts in 3 days. Your ticket is ready.", action: "ticket"
  },
  {
    id: "n4", type: "message", who: "Mira Shah", unread: false, day: "Today", time: "3 hours ago",
    text: "<b>Mira Shah</b> sent you a message: \u201cLoved your talk — can we collab on…\u201d", action: "reply"
  },
  {
    id: "n5", type: "forum", who: "Dev Kapoor", unread: false, day: "Yesterday", time: "Tue 4:20 PM",
    text: "<b>Dev Kapoor</b> replied to your post in <b>BLR Founders Collective</b>.", action: "view"
  },
  {
    id: "n6", type: "registration", who: "Founders & Funders Mixer", unread: false, day: "Yesterday", time: "Tue 11:02 AM",
    text: "Registration confirmed for <b>Founders & Funders Mixer</b>. ₹499 paid · Ticket #BL-2291.", action: "ticket"
  },
  {
    id: "n7", type: "connect", who: "Riya Thomas", unread: false, day: "Yesterday", time: "Tue 9:15 AM",
    text: "You and <b>Riya Thomas</b> are now connected.", action: null
  },
];

const THREADS = [
  {
    id: "t1", name: "Mira Shah", online: true, time: "2m", unread: 2, connected: true,
    preview: "Loved your talk — can we collab on the token pipeline?",
    msgs: [
      { me: false, text: "Hey Aanya! Loved your talk at DSN last week 🙌", time: "10:02" },
      { me: false, text: "Can we collab on the token pipeline article?", time: "10:02" },
      { me: true, text: "Mira! Thank you — yes, I'd love that. Got a draft outline already.", time: "10:14" },
      { me: false, text: "Amazing. Coffee this week to map it out?", time: "10:15" },
    ]
  },
  {
    id: "t2", name: "Kabir Anand", online: false, time: "1h", unread: 0, connected: true,
    preview: "See you at the mixer on Thursday!",
    msgs: [
      { me: false, text: "Table's confirmed for the Founders Mixer — you're at T3.", time: "Mon" },
      { me: true, text: "Perfect, thank you Kabir. Bringing two founders from the design guild.", time: "Mon" },
      { me: false, text: "See you at the mixer on Thursday!", time: "Mon" },
    ]
  },
  {
    id: "t3", name: "Vivek Rao", online: true, time: "3h", unread: 0, connected: false, context: "Bangalore AI",
    preview: "Sure — sharing the demo day link.",
    msgs: [
      { me: false, text: "Hi! Saw you're in Bangalore AI. Are you coming to Demo Day?", time: "9:40" },
      { me: true, text: "Planning to! Is it still online only?", time: "9:48" },
      { me: false, text: "Sure — sharing the demo day link.", time: "9:50" },
    ]
  },
];

const REQUESTS = [
  { name: "Vivek Rao", role: "ML Engineer · Bangalore AI", mutual: 12 },
  { name: "Sana Begum", role: "Vocalist · Indie Music BLR", mutual: 4 },
];

const INTERESTS_ME = [
  ["Design", "#6d5efc"], ["Startups", "#ff6b4a"], ["Typography", "#e5489d"],
  ["Community", "#10b981"], ["Coffee", "#f59e0b"], ["City Walks", "#0ea5a4"], ["Product", "#2a7fff"],
];

const LINKS_ME = [
  { t: "Portfolio", u: "aanya.design", icon: "website", c: "linear-gradient(135deg,#6d5efc,#2a7fff)" },
  { t: "Dribbble", u: "dribbble.com/aanya", icon: "dribbble", c: "linear-gradient(135deg,#ea4c89,#ff5a7a)" },
  { t: "LinkedIn", u: "in/aanyareddy", icon: "linkedin", c: "linear-gradient(135deg,#0a66c2,#2a7fff)" },
  { t: "GitHub", u: "github.com/aanya", icon: "github", c: "linear-gradient(135deg,#333,#666)" },
];

const SOCIALS = [
  { icon: "twitter", c: "#000" }, { icon: "instagram", c: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" },
  { icon: "linkedin", c: "#0a66c2" }, { icon: "dribbble", c: "#ea4c89" },
];

const JOIN_REQUESTS = [
  { id: "r1", groupId: "g2", user: { name: "Anil K", role: "UI Engineer" }, date: "Oct 24", status: "pending", answers: { "Why do you want to join?": "I'm looking to learn more about design systems.", "Portfolio link": "anil.design" } },
  { id: "r2", groupId: "g2", user: { name: "Tara N", role: "Product Manager" }, date: "Oct 23", status: "pending", answers: { "Why do you want to join?": "Hoping to collaborate with designers on my next project." } },
  { id: "r3", groupId: "g1", user: { name: "Sam K", role: "Founder" }, date: "Oct 21", status: "pending", answers: { "Startup stage?": "Pre-seed" } }
];

const MY_TICKETS = [
  { id: "BL-2291", ev: "Founders & Funders Mixer — Summer Edition", cover: COVERS.sunset, tier: "VIP · Front tables", date: "Thu, Jun 18", time: "6:30 PM", venue: "Skydeck, Indiranagar", online: false, paid: "₹1,099", qty: 1, attendee: "Aanya Reddy", status: "confirmed" },
  { id: "BL-2244", ev: "Design Systems Night #12", cover: COVERS.violet, tier: "General RSVP", date: "Sat, Jun 21", time: "5:00 PM", venue: "WeWork Galaxy", online: false, paid: "Free", qty: 1, attendee: "Aanya Reddy", status: "confirmed" },
  { id: "BL-2102", ev: "AI Builders Demo Day", cover: COVERS.dusk, tier: "General RSVP", date: "Wed, Jun 25", time: "6:00 PM", venue: "Online", online: true, paid: "Free", qty: 1, attendee: "Aanya Reddy", status: "confirmed" },
  { id: "BL-1998", ev: "Typography & Lettering Workshop", cover: COVERS.plum, tier: "General RSVP", date: "Wed, Jul 2", time: "11:00 AM", venue: "Rangoli Metro Art", online: false, paid: "₹1,200", qty: 1, attendee: "Aanya Reddy", status: "used" },
];

const WAITLIST_ME = {
  ev: "Founders & Funders Mixer — Summer Edition",
  cover: COVERS.sunset,
  date: "Thu, Jun 18",
  time: "6:30 PM",
  venue: "Skydeck, Indiranagar",
  position: 42,
  total: 180,
  boostPerRef: 5,
  boostCap: 20,
  claimWindowMins: 15,
};

Object.assign(window, {
  ME, PLAN_CONFIG, CATS, COVERS, FEATURED, EVENTS, UPCOMING, GROUPS, NEAR, TRENDING,
  PEOPLE, DISCUSSIONS, NOTIFS, THREADS, REQUESTS, JOIN_REQUESTS, INTERESTS_ME, LINKS_ME, SOCIALS,
  ME, CATS, COVERS, FEATURED, EVENTS, UPCOMING, GROUPS, NEAR, TRENDING,
  PEOPLE, DISCUSSIONS, NOTIFS, THREADS, REQUESTS, INTERESTS_ME, LINKS_ME, SOCIALS,
  MY_TICKETS, WAITLIST_ME,
});
