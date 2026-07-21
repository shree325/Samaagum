import React from 'react';
import { Brand } from './home-icons';
import { I } from './landing-core';
import { Events } from './landing-features';

/* ============================================================
   Samaagum Home — sample data
   Bengaluru-centric community / events seed.
   ============================================================ */

export const ME = {
  name: "", handle: "", role: "",
  bio: "",
  location: "",
  plan: "free", // "free", "pro", "enterprise"
  stats: { connections: 248, events: 36, groups: 7 },
};

export const PLAN_CONFIG = {
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
    if (payload.id) {
      (ME as any).id = payload.id;
    }
  } catch (e) { /* ignore token parse errors */ }
})();

(window as any).ME = ME;


export const CATS = [
  ["All", "grid"], ["Startups", "spark"], ["Design", "edit"], ["Music", "fire"],
  ["Tech", "online"], ["Wellness", "heart"], ["Food & Drink", "users"], ["Art", "image"],
];

export const COVERS = {
  coral: "linear-gradient(135deg,#ff6b4a 0%,#ff4d8d 100%)",
  violet: "linear-gradient(135deg,#6d5efc 0%,#2a7fff 100%)",
  sunset: "linear-gradient(135deg,#f59e0b 0%,#ef6f53 60%,#ff5a7a 100%)",
  emerald: "linear-gradient(135deg,#10b981 0%,#22d3ee 100%)",
  plum: "linear-gradient(135deg,#8b5cf6 0%,#e5489d 100%)",
  dusk: "linear-gradient(135deg,#2a3fff 0%,#6d5efc 55%,#b15efc 100%)",
  ember: "linear-gradient(135deg,#ff9a6b 0%,#ff5a7a 100%)",
  ocean: "linear-gradient(135deg,#0ea5a4 0%,#3b82f6 100%)",
};

export const FEATURED = {};

export const EVENTS = [];

export const UPCOMING = []; // user is registered

export const GROUPS = [];

export const NEAR = [];
export const TRENDING = [];

export const PEOPLE = [];

export const DISCUSSIONS = [];

export const NOTIFS = [];

export const THREADS = [];

export const REQUESTS = [];

export const INTERESTS_ME = [
  ["Design", "#6d5efc"], ["Startups", "#ff6b4a"], ["Typography", "#e5489d"],
  ["Community", "#10b981"], ["Coffee", "#f59e0b"], ["City Walks", "#0ea5a4"], ["Product", "#2a7fff"],
];

export const LINKS_ME = [
  { t: "Portfolio", u: "aanya.design", icon: "website", c: "linear-gradient(135deg,#6d5efc,#2a7fff)" },
  { t: "Dribbble", u: "dribbble.com/aanya", icon: "dribbble", c: "linear-gradient(135deg,#ea4c89,#ff5a7a)" },
  { t: "LinkedIn", u: "in/aanyareddy", icon: "linkedin", c: "linear-gradient(135deg,#0a66c2,#2a7fff)" },
  { t: "GitHub", u: "github.com/aanya", icon: "github", c: "linear-gradient(135deg,#333,#666)" },
];

export const SOCIALS = [
  { icon: "twitter", c: "#000" }, { icon: "instagram", c: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" },
  { icon: "linkedin", c: "#0a66c2" }, { icon: "dribbble", c: "#ea4c89" },
];

export const JOIN_REQUESTS = [];

export const MY_TICKETS = [];

export const WAITLIST_ME = null;

// Robust clipboard copy: navigator.clipboard throws NotAllowedError when the
// document isn't focused (e.g. right after an alert/devtools), so fall back to
// the legacy execCommand path which works without focus.
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext && document.hasFocus()) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through to legacy path */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}


