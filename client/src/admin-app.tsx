// @ts-nocheck
import React, { Fragment, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Field, Mark, ROLES } from './components';
import { Toggle, isChecked } from './create-event';
import { AdminApiClient } from './generated/api-client';
import { Discover } from './home-feed';
import { Sidebar, Topbar } from './home-shell';
import { apiBase } from './home-subscription';
import { Waitlist } from './home-waitlist';
import { Events } from './landing-features';
import { Networking } from './landing-features2';
import { AUTH } from './landing-hero';
import { ChatControlsView } from './admin/pages/ChatControls/ChatControlsView';
import { GeoIpv4View } from './admin/pages/GeoIpv4/GeoIpv4View';
import { GeoIpv6View } from './admin/pages/GeoIpv6/GeoIpv6View';
import { GeoLocationsView } from './admin/pages/GeoLocations/GeoLocationsView';

/* ============================================================
   Samaagum Admin Panel — React Application
   Requires React, ReactDOM, and Babel in browser.
   ============================================================ */



// --- INLINE SVG ICONS ---
export const Icons = {
  messageSquare: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  shield: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  users: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  alert: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  dispute: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  terminal: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
  key: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
  chevronUp: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="18 15 12 9 6 15" /></svg>,
  chevronDown: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="6 9 12 15 18 9" /></svg>,
  tag: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  credit: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  settings: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  dashboard: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>,
  tenant: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>,
  logout: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  doc: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  check: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="20 6 9 17 4 12" /></svg>,
  close: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  plus: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  globe: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
};

// --- INITIAL MOCK DATA ---
export const INITIAL_USERS = [
  { id: "usr-1", name: "Aanya Reddy", email: "aanya@samaagum.co", role: "Super Admin", status: "Active", joined: "1 month ago" },
  { id: "usr-2", name: "Dev Kapoor", email: "dev@samaagum.co", role: "Platform Admin", status: "Active", joined: "3 weeks ago" },
  { id: "usr-3", name: "Mira Shah", email: "mira@gmail.com", role: "Event Host", status: "Active", joined: "2 weeks ago" },
  { id: "usr-4", name: "Leo Patel", email: "leo@gmail.com", role: "Participant", status: "Active", joined: "1 week ago" },
  { id: "usr-5", name: "SpamBot99", email: "spambot99@scam.org", role: "Participant", status: "Suspended", joined: "3 days ago" },
];

export const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Technology', slug: 'technology', description: 'Software, AI, hardware, and digital innovation events', iconType: 'emoji', iconValue: '💻', displayOrder: 1, status: 'active', subcategoryCount: 6, eventCount: 142, isDeleted: false, createdAt: '2025-12-01T10:00:00Z' },
  { id: 'cat-2', name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Cricket, football, gym, running, and outdoor sports', iconType: 'emoji', iconValue: '🏏', displayOrder: 2, status: 'active', subcategoryCount: 5, eventCount: 89, isDeleted: false, createdAt: '2025-12-01T10:01:00Z' },
  { id: 'cat-3', name: 'Education', slug: 'education', description: 'Workshops, seminars, training, and learning events', iconType: 'emoji', iconValue: '🎓', displayOrder: 3, status: 'active', subcategoryCount: 4, eventCount: 67, isDeleted: false, createdAt: '2025-12-01T10:02:00Z' },
  { id: 'cat-4', name: 'Business & Startup', slug: 'business-startup', description: 'Entrepreneurship, marketing, finance, and leadership', iconType: 'emoji', iconValue: '🚀', displayOrder: 4, status: 'active', subcategoryCount: 4, eventCount: 54, isDeleted: false, createdAt: '2025-12-01T10:03:00Z' },
  { id: 'cat-5', name: 'Arts & Culture', slug: 'arts-culture', description: 'Theatre, painting, photography, and cultural events', iconType: 'emoji', iconValue: '🎨', displayOrder: 5, status: 'active', subcategoryCount: 0, eventCount: 28, isDeleted: false, createdAt: '2025-12-01T10:04:00Z' },
  { id: 'cat-6', name: 'Music & Entertainment', slug: 'music-entertainment', description: 'Live music, concerts, DJ nights, and performances', iconType: 'emoji', iconValue: '🎵', displayOrder: 6, status: 'inactive', subcategoryCount: 4, eventCount: 34, isDeleted: false, createdAt: '2025-12-01T10:05:00Z' },
  { id: 'cat-7', name: 'Travel & Adventure', slug: 'travel-adventure', description: 'Trekking, road trips, and adventure meetups', iconType: 'emoji', iconValue: '✈️', displayOrder: 7, status: 'active', subcategoryCount: 0, eventCount: 12, isDeleted: false, createdAt: '2025-12-01T10:06:00Z' },
  { id: 'cat-8', name: 'Food & Dining', slug: 'food-dining', description: 'Food festivals, cooking workshops, and dining events', iconType: 'emoji', iconValue: '🍕', displayOrder: 8, status: 'active', subcategoryCount: 0, eventCount: 19, isDeleted: false, createdAt: '2025-12-01T10:07:00Z' },
  { id: 'cat-9', name: 'Social & Networking', slug: 'social-networking', description: 'Professional meetups, mixers, and community gatherings', iconType: 'emoji', iconValue: '🤝', displayOrder: 9, status: 'active', subcategoryCount: 0, eventCount: 45, isDeleted: false, createdAt: '2025-12-01T10:08:00Z' },
  { id: 'cat-10', name: 'Health & Wellness', slug: 'health-wellness', description: 'Yoga, meditation, mental health, and wellness sessions', iconType: 'emoji', iconValue: '🧘', displayOrder: 10, status: 'active', subcategoryCount: 0, eventCount: 23, isDeleted: false, createdAt: '2025-12-01T10:09:00Z' },
];

export const INITIAL_TAGS = [
  { id: 'tag-1', name: 'Web3 & Crypto', slug: 'web3-crypto', category: 'Technology', status: 'active', eventCount: 24, isDeleted: false, createdAt: '2026-01-01T10:00:00Z' },
  { id: 'tag-2', name: 'Yoga Flow', slug: 'yoga-flow', category: 'Health & Wellness', status: 'active', eventCount: 15, isDeleted: false, createdAt: '2026-01-01T10:01:00Z' },
  { id: 'tag-3', name: 'SaaS & AI Startups', slug: 'saas-ai-startups', category: 'Business & Startup', status: 'active', eventCount: 42, isDeleted: false, createdAt: '2026-01-01T10:02:00Z' },
  { id: 'tag-4', name: 'Generative AI', slug: 'generative-ai', category: 'Technology', status: 'active', eventCount: 31, isDeleted: false, createdAt: '2026-01-01T10:03:00Z' },
  { id: 'tag-5', name: 'Indie Rock Concerts', slug: 'indie-rock-concerts', category: 'Music & Entertainment', status: 'active', eventCount: 19, isDeleted: false, createdAt: '2026-01-01T10:04:00Z' },
  { id: 'tag-6', name: 'Trekking & Hiking', slug: 'trekking-hiking', category: 'Travel & Adventure', status: 'active', eventCount: 8, isDeleted: false, createdAt: '2026-01-01T10:05:00Z' },
  { id: 'tag-7', name: 'UI/UX Design', slug: 'ui-ux-design', category: 'Arts & Culture', status: 'active', eventCount: 12, isDeleted: false, createdAt: '2026-01-01T10:06:00Z' },
  { id: 'tag-8', name: 'Fitness & Running', slug: 'fitness-running', category: 'Sports & Fitness', status: 'inactive', eventCount: 5, isDeleted: false, createdAt: '2026-01-01T10:07:00Z' }
];

export const EMOJI_SETS = {
  'Tech': ['💻', '🤖', '🔧', '⚡', '📱', '🌐', '🔬', '💡'],
  'Sports': ['🏏', '⚽', '🏀', '🎾', '🏃', '🏋️', '🚴', '⛳'],
  'Education': ['🎓', '📚', '✏️', '🏫', '📖', '🧪', '📐', '🎒'],
  'Business': ['🚀', '💼', '📊', '💰', '🏢', '📈', '🤝', '💎'],
  'Arts': ['🎨', '🎭', '📷', '🖌️', '🎪', '🎬', '✨', '🌈'],
  'Music': ['🎵', '🎶', '🎸', '🎤', '🎹', '🥁', '🎷', '🎻'],
  'Travel': ['✈️', '🗺️', '🏔️', '🏖️', '🧳', '🚗', '⛺', '🌍'],
  'Food': ['🍕', '🍔', '🍣', '☕', '🍰', '🥗', '🍳', '🌮'],
  'Social': ['🤝', '💬', '❤️', '🎉', '🥂', '🌟', '👥', '🎈'],
  'Health': ['🧘', '💪', '🏥', '💊', '🧠', '🌿', '🍎', '😌'],
};

export const INITIAL_KYC = [
  { id: "kyc-1", name: "Echo Collective", type: "Event Host", email: "echo@collective.in", submitted: "2 hours ago", docName: "Certificate of Incorporation & PAN", docNumber: "AAACE9912A", status: "Pending", notes: "" },
  { id: "kyc-2", name: "Letterform Lab", type: "Event Host", email: "admin@letterform.org", submitted: "1 day ago", docName: "Aadhaar Card & GST Registry", docNumber: "GST-29AAAAA1111A1Z1", status: "Pending", notes: "" },
  { id: "kyc-3", name: "Still Mind Collective", type: "Event Host", email: "shanti@stillmind.in", submitted: "3 days ago", docName: "PAN Card & Address Proof", docNumber: "BBBPX9012K", status: "Verified", notes: "Verified by admin on June 12" }
];

export const INITIAL_DISPUTES = [
  { id: "disp-1", user: "Arjun V", event: "Sunset Rooftop Sessions: Indie Live", amount: "₹350", reason: "Host cancelled but refund didn't trigger automatically.", submitted: "5 hours ago", status: "Open", maker: "", checker: "" },
  { id: "disp-2", user: "Meera J", event: "Street Food Crawl: VV Puram", amount: "₹600", reason: "Accidentally booked twice, requested cancellation.", submitted: "Yesterday", status: "Refund Requested", maker: "admin@samaagum.co", checker: "" },
  { id: "disp-3", user: "Karan Sethi", event: "Morning Flow + Community Brunch", amount: "₹250", reason: "Waitlist spot expired early due to system lag.", submitted: "4 days ago", status: "Closed", maker: "admin@samaagum.co", checker: "superadmin@samaagum.co" }
];

export const INITIAL_MODERATION = [
  { id: "mod-1", reporter: "Mira Shah", reportedUser: "SpamBot99", entityType: "Post", entityContent: "Invest ₹1000 and earn ₹10000 daily! Click here: bit.ly/spam-link", reason: "Spam / Financial scam", submitted: "3 hours ago", status: "Pending" },
  { id: "mod-2", reporter: "Zoya N", reportedUser: "AnonymousUser", entityType: "Comment", entityContent: "This event is garbage and the host is a crook.", reason: "Abusive language", submitted: "1 day ago", status: "Pending" },
  { id: "mod-3", reporter: "Nina P", reportedUser: "SpammyHost", entityType: "Event", entityContent: "Free Cryptocurrency Webinar", reason: "Scam / Commercial promo", submitted: "2 days ago", status: "Suspended" }
];

export const INITIAL_TENANTS = [
  { id: "ten-1", name: "Indiranagar Tech Hub", slug: "indiranagar-tech", plan: "Enterprise", entitlements: ["Waitlist Priority Boosts", "PWA Check-in"], status: "Active" },
  { id: "ten-2", name: "Koramangala Culturals", slug: "koramangala-culture", plan: "Standard", entitlements: ["Offline Cash Payments"], status: "Active" },
  { id: "ten-3", name: "Cubbon Athletic Collective", slug: "cubbon-athletics", plan: "Free Trial", entitlements: ["PWA Check-in"], status: "Pending Approval" }
];

export const INITIAL_RBAC = [
  { permission: "Book/RSVP/Waitlist", desc: "Discover, join, RSVP, waitlist and message on the end-user side", roles: ["Participant", "Event Host", "Group Organizer", "Community Admin", "Platform Admin", "Super Admin"] },
  { permission: "Create & Run Events", desc: "Manage event lifecycle, edit details, custom fields, waitlists", roles: ["Event Host", "Group Organizer", "Community Admin", "Platform Admin", "Super Admin"] },
  { permission: "Refund Bookings (Maker)", desc: "Initiate or request refunds for event tickets", roles: ["Event Host", "Platform Admin", "Super Admin"] },
  { permission: "Refund Approval (Checker)", desc: "Approve pending refunds to settle financial records", roles: ["Super Admin"] },
  { permission: "Manage Members & Groups", desc: "Approve/decline group requests, assign co-organizers, invite", roles: ["Group Organizer", "Community Admin", "Platform Admin", "Super Admin"] },
  { permission: "KYC Document Review", desc: "Review host verification docs, approve host credentials", roles: ["Platform Admin", "Super Admin"] },
  { permission: "Resolve Disputes & Tickets", desc: "Access read-only impersonation and support channels", roles: ["Platform Admin", "Super Admin"] },
  { permission: "Global Feature Flag Management", desc: "Toggle system-wide features and security restrictions", roles: ["Super Admin"] },
  { permission: "Tenant Provisioning & Entitlements", desc: "Approve, create, configure and entitle new tenants", roles: ["Super Admin"] },
];

export const INITIAL_AUDIT = [
  { time: "2026-06-15 10:14:02", actor: "System", action: "Tenant 'Indiranagar Tech Hub' successfully provisioned on Enterprise plan." },
  { time: "2026-06-15 11:02:15", actor: "superadmin@samaagum.co", action: "Updated global feature flag: Enabled 'Waitlist Boosts'." },
  { time: "2026-06-15 11:45:30", actor: "admin@samaagum.co", action: "Closed dispute ticket disp-3 and verified offline audit trail." },
  { time: "2026-06-15 12:12:08", actor: "superadmin@samaagum.co", action: "Role permission matrix initialized." }
];

export const FEATURE_FLAGS = [
  { id: "ff-1", name: "Waitlist Referral Boosts", desc: "Allows users to boost waitlist priority via sharing referrals.", active: true },
  { id: "ff-2", name: "Offline Proof Verification", desc: "Allows uploading cash payment proofs for event tickets.", active: true },
  { id: "ff-3", name: "PWA Check-in Gate", desc: "Enables host-side offline QR validation.", active: false },
  { id: "ff-4", name: "Maker-Checker Refunds", desc: "Enforces two-admin verification for any refund settlement.", active: true },
];

// --- UNIFIED API CLIENT FOR ADMIN PANEL ---
export const apiClient = new AdminApiClient();

export const adminApi = {
  // Provider settings from unified-admin-service.yaml configuration logic
  activeProviders: {
    categories: "database",
    tags: "database",
    cities: "database",
    rbac: "database",
    plans: "database",
    coupons: "database",
    users: "database",
    kyc: "localstorage",
    disputes: "localstorage",
    moderation: "localstorage",
    tenants: "localstorage",
    audit: "localstorage",
    featureFlags: "localstorage",
  },

  // Local storage cache key helper
  _getLocalStorageKey(key) {
    return `samaagum_admin_${key}`;
  },

  // Read local state from localStorage with fallback to initial mock data
  _getLocalState(key, fallback) {
    const cached = localStorage.getItem(this._getLocalStorageKey(key));
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error(`Error parsing localStorage key ${key}`, e);
      }
    }
    return fallback;
  },

  // Save state to localStorage
  _setLocalState(key, val) {
    localStorage.setItem(this._getLocalStorageKey(key), JSON.stringify(val));
  },

  // Users Service
  users: {
    getUsers: async () => {
      if (adminApi.activeProviders.users === "database") {
        return apiClient.users.getUsers();
      }
      const users = adminApi._getLocalState("users", INITIAL_USERS);
      return { success: true, data: users };
    },
    saveUser: async (userPayload) => {
      if (adminApi.activeProviders.users === "database") {
        return apiClient.users.saveUser(userPayload);
      }
      let users = adminApi._getLocalState("users", INITIAL_USERS);
      if (users.find(u => u.id === userPayload.id)) {
        users = users.map(u => u.id === userPayload.id ? { ...u, ...userPayload } : u);
      } else {
        users = [userPayload, ...users];
      }
      adminApi._setLocalState("users", users);
      return { success: true, data: userPayload };
    },
    deleteUser: async (id) => {
      if (adminApi.activeProviders.users === "database") {
        return apiClient.users.deleteUser(id);
      }
      let users = adminApi._getLocalState("users", INITIAL_USERS);
      users = users.filter(u => u.id !== id);
      adminApi._setLocalState("users", users);
      return { success: true };
    },
    inviteUser: async (payload) => {
      if (adminApi.activeProviders.users === "database") {
        return apiClient.users.inviteUser(payload);
      }
      return { success: true };
    }
  },

  // KYC Service
  kyc: {
    getKyc: async () => {
      if (adminApi.activeProviders.kyc === "database") {
        return apiClient.kyc.getKycRecords();
      }
      const kyc = adminApi._getLocalState("kyc", INITIAL_KYC);
      return { success: true, data: kyc };
    },
    saveKyc: async (kycPayload) => {
      if (adminApi.activeProviders.kyc === "database") {
        return apiClient.kyc.saveKyc(kycPayload);
      }
      let kyc = adminApi._getLocalState("kyc", INITIAL_KYC);
      kyc = kyc.map(k => k.id === kycPayload.id ? { ...k, ...kycPayload } : k);
      adminApi._setLocalState("kyc", kyc);
      return { success: true, data: kycPayload };
    }
  },

  // Disputes Service
  disputes: {
    getDisputes: async () => {
      if (adminApi.activeProviders.disputes === "database") {
        return apiClient.disputes.getDisputes();
      }
      const disputes = adminApi._getLocalState("disputes", INITIAL_DISPUTES);
      return { success: true, data: disputes };
    },
    saveDispute: async (disputePayload) => {
      if (adminApi.activeProviders.disputes === "database") {
        return apiClient.disputes.saveDispute(disputePayload);
      }
      let disputes = adminApi._getLocalState("disputes", INITIAL_DISPUTES);
      disputes = disputes.map(d => d.id === disputePayload.id ? { ...d, ...disputePayload } : d);
      adminApi._setLocalState("disputes", disputes);
      return { success: true, data: disputePayload };
    }
  },

  // Moderation Service
  moderation: {
    getModeration: async () => {
      if (adminApi.activeProviders.moderation === "database") {
        return apiClient.moderation.getModerationItems();
      }
      const moderation = adminApi._getLocalState("moderation", INITIAL_MODERATION);
      return { success: true, data: moderation };
    },
    saveModeration: async (modPayload) => {
      if (adminApi.activeProviders.moderation === "database") {
        return apiClient.moderation.saveModeration(modPayload);
      }
      let moderation = adminApi._getLocalState("moderation", INITIAL_MODERATION);
      moderation = moderation.map(m => m.id === modPayload.id ? { ...m, ...modPayload } : m);
      adminApi._setLocalState("moderation", moderation);
      return { success: true, data: modPayload };
    }
  },

  // Tenants Service
  tenants: {
    getTenants: async () => {
      if (adminApi.activeProviders.tenants === "database") {
        return apiClient.tenants.getTenants();
      }
      const tenants = adminApi._getLocalState("tenants", INITIAL_TENANTS);
      return { success: true, data: tenants };
    },
    saveTenant: async (tenantPayload) => {
      if (adminApi.activeProviders.tenants === "database") {
        return apiClient.tenants.saveTenant(tenantPayload);
      }
      let tenants = adminApi._getLocalState("tenants", INITIAL_TENANTS);
      if (tenants.find(t => t.id === tenantPayload.id)) {
        tenants = tenants.map(t => t.id === tenantPayload.id ? { ...t, ...tenantPayload } : t);
      } else {
        tenants = [...tenants, tenantPayload];
      }
      adminApi._setLocalState("tenants", tenants);
      return { success: true, data: tenantPayload };
    }
  },

  // Audit Logs Service
  audit: {
    getLogs: async () => {
      if (adminApi.activeProviders.audit === "database") {
        return apiClient.audit.getAuditLogs();
      }
      const logs = adminApi._getLocalState("audit", INITIAL_AUDIT);
      return { success: true, data: logs };
    },
    addLog: async (actor, action) => {
      if (adminApi.activeProviders.audit === "database") {
        return apiClient.audit.addLog({ actor, action });
      }
      const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const logObj = { time, actor, action };
      const logs = [logObj, ...adminApi._getLocalState("audit", INITIAL_AUDIT)];
      adminApi._setLocalState("audit", logs);
      return { success: true, data: logObj };
    }
  },

  // Feature Flags Service
  featureFlags: {
    getFlags: async () => {
      if (adminApi.activeProviders.featureFlags === "database") {
        return apiClient.featureFlags.getFeatureFlags();
      }
      const flags = adminApi._getLocalState("featureFlags", FEATURE_FLAGS);
      return { success: true, data: flags };
    },
    saveFlags: async (flagsPayload) => {
      if (adminApi.activeProviders.featureFlags === "database") {
        return apiClient.featureFlags.saveFeatureFlags(flagsPayload);
      }
      adminApi._setLocalState("featureFlags", flagsPayload);
      return { success: true, data: flagsPayload };
    }
  },

  // RBAC Service (real backend integration via generated apiClient)
  rbac: {
    getRoles: () => apiClient.rbac.getRoles(),
    getResponsibilities: () => apiClient.rbac.getResponsibilities(),
    getPositions: () => apiClient.rbac.getPositions(),
    saveRole: (payload, id) => apiClient.rbac.saveRole(payload, id),
    saveResponsibility: (payload, id) => apiClient.rbac.saveResponsibility(payload, id),
    savePosition: (payload, id) => apiClient.rbac.savePosition(payload, id),
    deleteRole: (id) => apiClient.rbac.deleteRole(id),
    deleteResponsibility: (id) => apiClient.rbac.deleteResponsibility(id),
    deletePosition: (id) => apiClient.rbac.deletePosition(id),
    getMatrix: async () => {
      const matrix = adminApi._getLocalState("rbacMatrix", INITIAL_RBAC);
      return { success: true, data: matrix };
    },
    saveMatrix: async (matrixPayload) => {
      adminApi._setLocalState("rbacMatrix", matrixPayload);
      return { success: true, data: matrixPayload };
    }
  },

  // Subscription Plans Service (real backend integration via generated apiClient)
  plans: {
    getPlans: () => apiClient.plans.getPlans(),
    getAvailableRoles: () => apiClient.plans.getAvailableRoles(),
    getAvailablePositions: () => apiClient.plans.getAvailablePositions(),
    savePlan: (payload, id) => apiClient.plans.savePlan(payload, id),
    deletePlan: (id) => apiClient.plans.deletePlan(id)
  },

  // Coupons Service (real backend integration via generated apiClient)
  coupons: {
    getCoupons: () => apiClient.coupons.getCoupons(),
    saveCoupon: (payload, id) => apiClient.coupons.saveCoupon(payload, id),
    deleteCoupon: (id) => apiClient.coupons.deleteCoupon(id)
  },

  // Categories Service
  categories: {
    getCategories: async () => {
      if (adminApi.activeProviders.categories === "database") {
        return apiClient.categories.getCategories();
      }
      const categories = adminApi._getLocalState("categories", INITIAL_CATEGORIES);
      return { success: true, data: categories };
    },
    saveCategory: async (catPayload, id) => {
      if (adminApi.activeProviders.categories === "database") {
        return apiClient.categories.saveCategory(catPayload, id);
      }
      let categories = adminApi._getLocalState("categories", INITIAL_CATEGORIES);
      if (id && categories.find(c => c.id === id)) {
        categories = categories.map(c => c.id === id ? { ...c, ...catPayload } : c);
      } else {
        categories = [catPayload, ...categories];
      }
      adminApi._setLocalState("categories", categories);
      return { success: true, data: catPayload };
    },
    deleteCategory: async (id) => {
      if (adminApi.activeProviders.categories === "database") {
        return apiClient.categories.deleteCategory(id);
      }
      let categories = adminApi._getLocalState("categories", INITIAL_CATEGORIES);
      categories = categories.filter(c => c.id !== id);
      adminApi._setLocalState("categories", categories);
      return { success: true };
    }
  },

  // Tags Service
  tags: {
    getTags: async () => {
      if (adminApi.activeProviders.tags === "database") {
        return apiClient.tags.getTags();
      }
      const tags = adminApi._getLocalState("tags", INITIAL_TAGS);
      return { success: true, data: tags };
    },
    saveTag: async (tagPayload, id) => {
      if (adminApi.activeProviders.tags === "database") {
        return apiClient.tags.saveTag(tagPayload, id);
      }
      let tags = adminApi._getLocalState("tags", INITIAL_TAGS);
      if (id && tags.find(t => t.id === id)) {
        tags = tags.map(t => t.id === id ? { ...t, ...tagPayload } : t);
      } else {
        tags = [tagPayload, ...tags];
      }
      adminApi._setLocalState("tags", tags);
      return { success: true, data: tagPayload };
    },
    deleteTag: async (id) => {
      if (adminApi.activeProviders.tags === "database") {
        return apiClient.tags.deleteTag(id);
      }
      let tags = adminApi._getLocalState("tags", INITIAL_TAGS);
      tags = tags.filter(t => t.id !== id);
      adminApi._setLocalState("tags", tags);
      return { success: true };
    },
  },
  // Cities Service (city_controls)
  cities: {
    getCities: async (params) => {
      if (adminApi.activeProviders.cities === "database") {
        return apiClient.cities.getCities(params);
      }
      const stored = localStorage.getItem('samaagum_admin_city_controls');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          return { success: true, data };
        } catch (e) {
          console.error('Error parsing city controls', e);
        }
      }
      return { success: true, data: [] };
    },
    getStats: async () => {
      if (adminApi.activeProviders.cities === "database") {
        return apiClient.cities.getStats();
      }
      const stored = localStorage.getItem('samaagum_admin_city_controls');
      const citiesList = stored ? JSON.parse(stored) : [];
      const active = citiesList.filter(c => c.is_active).length;
      return {
        success: true,
        data: {
          total: citiesList.length,
          active,
          inactive: citiesList.length - active,
          countries: new Set(citiesList.map(c => c.country_name)).size,
          states: new Set(citiesList.map(c => c.state_name)).size
        }
      };
    },
    getFilters: async (country) => {
      if (adminApi.activeProviders.cities === "database") {
        return apiClient.cities.getFilters(country);
      }
      const stored = localStorage.getItem('samaagum_admin_city_controls');
      const citiesList = stored ? JSON.parse(stored) : [];
      const countries = [...new Set(citiesList.map(c => c.country_name).filter(Boolean))].sort();
      const states = [...new Set(citiesList.filter(c => !country || c.country_name === country).map(c => c.state_name).filter(Boolean))].sort();
      return { success: true, data: { countries, states } };
    },
    toggleCity: async (geonameId, newActive) => {
      if (adminApi.activeProviders.cities === "database") {
        return apiClient.cities.toggleCity(geonameId, newActive);
      }
      const stored = localStorage.getItem('samaagum_admin_city_controls');
      let citiesList = stored ? JSON.parse(stored) : [];
      citiesList = citiesList.map(c => c.geoname_id === geonameId ? { ...c, is_active: newActive } : c);
      localStorage.setItem('samaagum_admin_city_controls', JSON.stringify(citiesList));
      return { success: true };
    },
  }
};



// --- APP COMPONENT ---
export function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('samaagum_admin_token');
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload && payload.email) {
            const roleLabel = payload.role === 'super_admin' ? 'Super Admin' : 'Platform Admin';
            return { email: payload.email, role: roleLabel, name: payload.name || roleLabel };
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore session:", e);
    }
    return null;
  }); // { email, role }
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('samaagum_tweaks');
    if (stored) {
      try {
        const tweaks = JSON.parse(stored);
        if (typeof tweaks.dark === 'boolean') {
          return tweaks.dark;
        }
      } catch (e) {}
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Lists powered by the unified API / local storage fallback
  const [kycList, setKycList] = useState(() => adminApi._getLocalState("kyc", INITIAL_KYC));
  const [disputesList, setDisputesList] = useState(() => adminApi._getLocalState("disputes", INITIAL_DISPUTES));
  const [moderationList, setModerationList] = useState(() => adminApi._getLocalState("moderation", INITIAL_MODERATION));
  const [tenantsList, setTenantsList] = useState(() => adminApi._getLocalState("tenants", INITIAL_TENANTS));
  const [rbacMatrix, setRbacMatrix] = useState(() => adminApi._getLocalState("rbacMatrix", INITIAL_RBAC));
  const [auditLogs, setAuditLogs] = useState(() => adminApi._getLocalState("audit", INITIAL_AUDIT));
  const [featureFlags, setFeatureFlags] = useState(() => adminApi._getLocalState("featureFlags", FEATURE_FLAGS));
  const [usersList, setUsersList] = useState(() => adminApi._getLocalState("users", INITIAL_USERS));
  const [categoriesList, setCategoriesList] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success") => {
    const id = Date.now() + "-" + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Logging utility
  const logAction = (actor, action) => {
    const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setAuditLogs(prev => {
      const next = [{ time, actor, action }, ...prev];
      adminApi._setLocalState("audit", next);
      return next;
    });
  };

  const handleUpdateUser = async (id, updates) => {
    setUsersList(prev => {
      const next = prev.map(u => u.id === id ? { ...u, ...updates } : u);
      const updatedUser = next.find(u => u.id === id);
      if (updatedUser) {
        if (updates.role) {
          logAction(user?.email || "Admin", `Changed user ${updatedUser.name} role to ${updates.role}.`);
          addToast(`Updated ${updatedUser.name}'s role to ${updates.role}.`);
        }
        if (updates.status) {
          logAction(user?.email || "Admin", `${updates.status === "Suspended" ? "Suspended" : "Activated"} user ${updatedUser.name}.`);
          addToast(`User ${updatedUser.name} is now ${updates.status.toLowerCase()}.`);
        }
        if (updates.name || updates.email) {
          logAction(user?.email || "Admin", `Updated user details for ${updatedUser.name || updatedUser.email}.`);
          addToast(`Successfully updated user details.`);
        }
        adminApi.users.saveUser(updatedUser);
      }
      return next;
    });
  };

  const handleAddUser = async (newUser) => {
    // Optimistically add with a temporary mock ID
    setUsersList(prev => [newUser, ...prev]);
    
    try {
      const res = await adminApi.users.saveUser(newUser);
      if (res.success && res.data) {
        // Replace temporary mock ID with actual database UUID
        setUsersList(prev => prev.map(u => u.email === newUser.email ? { ...u, id: res.data.id } : u));
      }
      await adminApi.users.inviteUser({ email: newUser.email, role: newUser.role });
      logAction(user?.email || "Admin", `Invited new user ${newUser.name} (${newUser.email}) with role ${newUser.role}.`);
      addToast(`Successfully invited ${newUser.name} and sent invitation email.`);
    } catch (err: any) {
      console.error(err);
      addToast("Failed to complete invitation.");
    }
  };

  const handleDeleteUser = async (id) => {
    const userToDelete = usersList.find(u => u.id === id);
    if (!userToDelete) return;
    
    // Optimistically remove from state
    setUsersList(prev => prev.filter(u => u.id !== id));
    
    try {
      await adminApi.users.deleteUser(id);
      logAction(user?.email || "Admin", `Deleted user ${userToDelete.name || userToDelete.email}.`);
      addToast(`User ${userToDelete.name || userToDelete.email} has been deleted.`);
    } catch (err: any) {
      console.error(err);
      addToast("Failed to delete user from database.");
      // Rollback to original state on error
      adminApi.users.getUsers().then(res => {
        if (res.success && res.data) {
          setUsersList(res.data);
        }
      });
    }
  };

  // Modals state
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Tenant form state
  const [newTenant, setNewTenant] = useState({ name: "", slug: "", plan: "Standard", entitlements: [] });

  // Toggle Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    try {
      const stored = localStorage.getItem('samaagum_tweaks') || '{}';
      const tweaks = JSON.parse(stored);
      tweaks.dark = darkMode;
      localStorage.setItem('samaagum_tweaks', JSON.stringify(tweaks));
      window.dispatchEvent(new CustomEvent('tweakchange', { detail: { dark: darkMode } }));
    } catch (e) {}
  }, [darkMode]);

  // Load categories and tags from database
  useEffect(() => {
    if (user) {
      adminApi.categories.getCategories().then(res => {
        if (res.success && res.data) {
          const raw = res.data;
          const nonDeleted = raw.filter(c => !c.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder);
          const deleted = raw.filter(c => c.isDeleted);
          const normalized = nonDeleted.map((c, idx) => ({ ...c, displayOrder: idx + 1 }));
          setCategoriesList([...normalized, ...deleted]);
        }
      }).catch(err => {
        addToast("Failed to fetch categories: " + err.message, "warning");
      });

      adminApi.tags.getTags().then(res => {
        if (res.success && res.data) {
          setTagsList(res.data);
        }
      }).catch(err => {
        addToast("Failed to fetch tags: " + err.message, "warning");
      });
    } else {
      setCategoriesList([]);
      setTagsList([]);
    }
  }, [user]);

  useEffect(() => {
    
    window.samaagum_admin_login = (email) => {
      handleLogin(email, "superadmin");
    };
    return () => {
      delete window.samaagum_admin_setActiveTab;
      delete window.samaagum_admin_login;
    };
  }, [setActiveTab]);

  useEffect(() => {
    if (user && activeTab === "users") {
      adminApi.users.getUsers().then(res => {
        if (res.success && res.data) {
          setUsersList(res.data);
        }
      }).catch(err => {
        addToast("Failed to load users from database.", "warning");
      });
    }
  }, [activeTab, user]);

  // Auth Handler — calls real backend, no OTP for admin
  const handleLogin = async (email, accessKey) => {
    try {
      const result = await apiClient.adminLogin(email, accessKey);
      if (result.success && result.token) {
        localStorage.setItem('samaagum_admin_token', result.token);
        const roleLabel = result.user?.role === 'super_admin' ? 'Super Admin' : 'Platform Admin';
        setUser({ email: result.user.email, role: roleLabel, name: result.user.name || roleLabel });
        addToast(`Welcome back, ${roleLabel}!`, 'success');
        logAction(result.user.email, `Logged in successfully (${roleLabel}).`);
      } else {
        addToast(result.message || 'Invalid email or access key.', 'warning');
      }
    } catch (err) {
      addToast('Login failed. Check server connection.', 'warning');
    }
  };


  const handleLogout = () => {
    logAction(user?.email || 'User', 'Logged out.');
    localStorage.removeItem('samaagum_admin_token');
    setUser(null);
    setActiveTab('dashboard');
  };


  // Helper for quick switching roles
  const handleQuickSwitch = (newRole) => {
    if (newRole === "Super Admin") {
      setUser({ email: "superadmin@samaagum.co", role: "Super Admin", name: "Ishaan Mehta" });
      addToast("Switched session to Super Admin", "info");
      logAction("System", "Session switched to Super Admin");
    } else if (newRole === "Platform Admin") {
      setUser({ email: "admin@samaagum.co", role: "Platform Admin", name: "Aanya Reddy" });
      addToast("Switched session to Platform Admin", "info");
      logAction("System", "Session switched to Platform Admin");
    }
  };

  // KYC Actions
  const approveKyc = (id) => {
    const item = kycList.find(k => k.id === id);
    setKycList(prev => {
      const next = prev.map(k => k.id === id ? { ...k, status: "Verified" } : k);
      const updated = next.find(k => k.id === id);
      adminApi.kyc.saveKyc(updated);
      return next;
    });
    addToast(`${item.name} has been verified successfully.`, "success");
    logAction(user.email, `Approved KYC credentials for '${item.name}'.`);
    setSelectedKyc(null);
  };

  const rejectKyc = (id) => {
    if (!rejectionReason.trim()) {
      addToast("Rejection notes are required.", "warning");
      return;
    }
    const item = kycList.find(k => k.id === id);
    setKycList(prev => {
      const next = prev.map(k => k.id === id ? { ...k, status: "Rejected", notes: rejectionReason } : k);
      const updated = next.find(k => k.id === id);
      adminApi.kyc.saveKyc(updated);
      return next;
    });
    addToast(`${item.name} KYC has been rejected.`, "info");
    logAction(user.email, `Rejected KYC credentials for '${item.name}'. Reason: ${rejectionReason}`);
    setRejectionReason("");
    setSelectedKyc(null);
  };

  // Dispute / Refund Actions (Maker-Checker Demo)
  const initiateRefund = (id) => {
    const item = disputesList.find(d => d.id === id);
    setDisputesList(prev => {
      const next = prev.map(d => d.id === id ? { ...d, status: "Refund Requested", maker: user.email } : d);
      const updated = next.find(d => d.id === id);
      adminApi.disputes.saveDispute(updated);
      return next;
    });
    addToast("Refund initiated. Awaiting Super Admin (Checker) approval.", "info");
    logAction(user.email, `Requested refund of ${item.amount} for user ${item.user} (Dispute ID: ${item.id}). Maker stage complete.`);
    setSelectedDispute(null);
  };

  const approveRefund = (id) => {
    const item = disputesList.find(d => d.id === id);
    setDisputesList(prev => {
      const next = prev.map(d => d.id === id ? { ...d, status: "Closed", checker: user.email } : d);
      const updated = next.find(d => d.id === id);
      adminApi.disputes.saveDispute(updated);
      return next;
    });
    addToast("Refund approved & settled.", "success");
    logAction(user.email, `Approved and finalized refund of ${item.amount} for user ${item.user} (Dispute ID: ${item.id}). Checker stage complete.`);
    setSelectedDispute(null);
  };

  // Moderation Actions
  const handleModAction = (id, actionType) => {
    const item = moderationList.find(m => m.id === id);
    setModerationList(prev => {
      const next = prev.map(m => m.id === id ? { ...m, status: actionType } : m);
      const updated = next.find(m => m.id === id);
      adminApi.moderation.saveModeration(updated);
      return next;
    });
    addToast(`Content flag resolved: Marked as ${actionType}.`, "success");
    logAction(user.email, `Resolved content flag on ${item.entityType} by user ${item.reportedUser}. Action taken: ${actionType}`);
  };

  // Tenant Creation Actions
  const handleTenantCheckboxChange = (entitlement) => {
    setNewTenant(prev => {
      const alreadyChecked = prev.entitlements.includes(entitlement);
      return {
        ...prev,
        entitlements: alreadyChecked
          ? prev.entitlements.filter(e => e !== entitlement)
          : [...prev.entitlements, entitlement]
      };
    });
  };

  const createTenant = (e) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.slug) {
      addToast("Tenant Name and Slug are required.", "warning");
      return;
    }
    const tenantObj = {
      id: `ten-${tenantsList.length + 1}`,
      name: newTenant.name,
      slug: newTenant.slug,
      plan: newTenant.plan,
      entitlements: newTenant.entitlements,
      status: "Active"
    };
    setTenantsList(prev => {
      const next = [...prev, tenantObj];
      adminApi.tenants.saveTenant(tenantObj);
      return next;
    });
    addToast(`Tenant '${newTenant.name}' has been successfully provisioned.`, "success");
    logAction(user.email, `Provisioned new white-label tenant '${newTenant.name}' with entitlements: [${newTenant.entitlements.join(', ')}]`);
    setNewTenant({ name: "", slug: "", plan: "Standard", entitlements: [] });
  };

  // Feature Flag Toggle
  const toggleFeatureFlag = (id) => {
    const item = featureFlags.find(f => f.id === id);
    setFeatureFlags(prev => {
      const next = prev.map(f => f.id === id ? { ...f, active: !f.active } : f);
      adminApi.featureFlags.saveFlags(next);
      return next;
    });
    addToast(`Feature flag '${item.name}' toggled to ${!item.active ? 'ENABLED' : 'DISABLED'}`, "info");
    logAction(user.email, `Toggled feature flag '${item.name}' to ${!item.active ? 'active' : 'inactive'}`);
  };

  // Toggle RBAC Permission Checkbox
  const toggleRbacPermission = (permissionName, roleName) => {
    setRbacMatrix(prev => {
      const next = prev.map(item => {
        if (item.permission === permissionName) {
          const hasRole = item.roles.includes(roleName);
          const updatedRoles = hasRole
            ? item.roles.filter(r => r !== roleName)
            : [...item.roles, roleName];
          return { ...item, roles: updatedRoles };
        }
        return item;
      });
      adminApi.rbac.saveMatrix(next);
      return next;
    });
    logAction(user.email, `Updated RBAC: Granted/Removed permission '${permissionName}' for role '${roleName}'`);
    addToast(`Permission list updated.`, "info");
  };

  // Login view component
  if (!user) {
    return (
      <div className="login-wrap">
        <div className="login-bg-glows">
          <div className="glow-1"></div>
          <div className="glow-2"></div>
        </div>
        <div className="login-card">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 40 40">
              <defs>
                <linearGradient id="lg-admin" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="var(--accent-1)" /><stop offset="1" stopColor="var(--accent-2)" />
                </linearGradient>
              </defs>
              <circle cx="15" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.92" />
              <circle cx="25" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.62" />
              <circle cx="20" cy="25" r="9.2" fill="url(#lg-admin)" opacity="0.8" />
            </svg>
            <span className="wordmark">samaagum</span>
            <span style={{ fontSize: "12px", color: "var(--accent-2)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em" }}>Admin Console</span>
          </div>

          <h3 style={{ textAlign: "center", marginBottom: "24px" }}>Administrative Authentication</h3>
          <p style={{ fontSize: "14px", color: "var(--ink-2)", textAlign: "center", marginBottom: "24px" }}>
            Verify platform entities, manage dispute claims, and configure tenants.
          </p>

          <LoginForm onSubmit={handleLogin} />

          <p style={{ fontSize: '12px', color: 'var(--ink-3)', textAlign: 'center', marginTop: '16px' }}>
            Use your Samaagum admin email and access key to log in.<br />
            Keys are set during <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>npm run seed</code>.
          </p>
        </div>

        {/* Toasts */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.type}`}>
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active role variables
  const isSuperAdmin = user.role === "Super Admin";
  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <svg width="28" height="28" viewBox="0 0 40 40">
            <circle cx="15" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.92" />
            <circle cx="25" cy="16" r="9.2" fill="url(#lg-admin)" opacity="0.62" />
            <circle cx="20" cy="25" r="9.2" fill="url(#lg-admin)" opacity="0.8" />
          </svg>
          <span className="wordmark">samaagum</span>
          <span className="badge">Admin</span>
        </div>

        <nav className="sidebar-menu">
          <button className={`sidebar-item ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
            <Icons.dashboard /> Dashboard
          </button>

          <button className={`sidebar-item ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>
            <Icons.tag /> Categories
          </button>

          <button className={`sidebar-item ${activeTab === "tags" ? "active" : ""}`} onClick={() => setActiveTab("tags")}>
            <Icons.tag style={{ transform: "rotate(-10deg)" }} /> Tags
          </button>

          <button className={`sidebar-item ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
            <Icons.users /> User Management
          </button>

          <button className={`sidebar-item ${activeTab === "kyc" ? "active" : ""}`} onClick={() => setActiveTab("kyc")}>
            <Icons.shield /> KYC Verification
            {kycList.filter(k => k.status === "Pending").length > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--accent-1)", color: "#fff", fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px" }}>
                {kycList.filter(k => k.status === "Pending").length}
              </span>
            )}
          </button>

          <button className={`sidebar-item ${activeTab === "disputes" ? "active" : ""}`} onClick={() => setActiveTab("disputes")}>
            <Icons.dispute /> Dispute Resolution
            {disputesList.filter(d => d.status === "Open" || d.status === "Refund Requested").length > 0 && (
              <span style={{ marginLeft: "auto", background: "var(--accent-2)", color: "#fff", fontSize: "11px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px" }}>
                {disputesList.filter(d => d.status === "Open" || d.status === "Refund Requested").length}
              </span>
            )}
          </button>

          <button className={`sidebar-item ${activeTab === "moderation" ? "active" : ""}`} onClick={() => setActiveTab("moderation")}>
            <Icons.alert /> Content Moderation
          </button>

          {isSuperAdmin && (
            <button className={`sidebar-item ${activeTab === "tenants" ? "active" : ""}`} onClick={() => setActiveTab("tenants")}>
              <Icons.tenant /> Tenant Provisioning
            </button>
          )}

          <button className={`sidebar-item ${activeTab === "subscriptions" ? "active" : ""}`} onClick={() => setActiveTab("subscriptions")}>
            <Icons.credit /> Subscription Plans
          </button>

          <button className={`sidebar-item ${activeTab === "billing" ? "active" : ""}`} onClick={() => setActiveTab("billing")}>
            <Icons.credit style={{ stroke: "var(--accent-2)" }} /> Billing &amp; Revenue
          </button>

          <button className={`sidebar-item ${activeTab === "coupons" ? "active" : ""}`} onClick={() => setActiveTab("coupons")}>
            <Icons.tag /> Coupon Management
          </button>

          <button className={`sidebar-item ${activeTab === "rbac" ? "active" : ""}`} onClick={() => setActiveTab("rbac")}>
            <Icons.key /> RBAC Governance
          </button>

          <button className={`sidebar-item ${activeTab === "audit" ? "active" : ""}`} onClick={() => setActiveTab("audit")}>
            <Icons.terminal /> System Audit Logs
          </button>


          <button className={`sidebar-item ${activeTab === "geo-locations" ? "active" : ""}`} onClick={() => setActiveTab("geo-locations")}>
            {Icons.globe({ className: "icon" })} Geo Locations
          </button>
          <button className={`sidebar-item ${activeTab === "geo-ipv4" ? "active" : ""}`} onClick={() => setActiveTab("geo-ipv4")}>
            {Icons.globe({ className: "icon" })} Geo IPv4
          </button>
          <button className={`sidebar-item ${activeTab === "geo-ipv6" ? "active" : ""}`} onClick={() => setActiveTab("geo-ipv6")}>
            {Icons.globe({ className: "icon" })} Geo IPv6
          </button>

          <button className={`sidebar-item ${activeTab === "chat-controls" ? "active" : ""}`} onClick={() => setActiveTab("chat-controls")}>
            <Icons.messageSquare /> Chat Governance
          </button>

          <button className={`sidebar-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
            <Icons.settings /> System Settings
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar" style={isSuperAdmin ? { background: "linear-gradient(135deg, #8b5cf6, #e5489d)" } : {}}>
            {isSuperAdmin ? "SA" : "PA"}
          </div>
          <div className="user-info">
            <span className="name">{user.name}</span>
            <span className="role-badge">{user.role}</span>
          </div>
          <button onClick={handleLogout} style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--ink-3)", cursor: "pointer" }} title="Log Out">
            <Icons.logout style={{ width: "20px", height: "20px" }} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Topbar Selector Banner for evaluators */}
        <div className="quick-switch-banner">
          <span>💡 <b>Interactive Demo Sandbox:</b> Swap roles on-the-fly to test role permissions (RBAC) & Maker-Checker limits:</span>
          <select value={user.role} onChange={(e) => handleQuickSwitch(e.target.value)}>
            <option value="Platform Admin">Platform Admin (Maker)</option>
            <option value="Super Admin">Super Admin (Checker / Global)</option>
          </select>
        </div>

        <header className="admin-topbar">
          <span className="page-title" style={{ textTransform: "capitalize" }}>
            {activeTab} Management
          </span>
          <div className="topbar-actions">
            <button className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
              <span>{darkMode ? "◐" : "◑"}</span><span>{darkMode ? "Dark Mode" : "Light Mode"}</span>
            </button>
          </div>
        </header>

        <div className="admin-content">
          {activeTab === "dashboard" && (
            <DashboardView
              kyc={kycList}
              disputes={disputesList}
              moderation={moderationList}
              tenants={tenantsList}
              user={user}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "categories" && (
            <CategoriesView
              categories={categoriesList}
              setCategories={setCategoriesList}
              tags={tagsList}
              setTags={setTagsList}
              showToast={addToast}
              logAction={logAction}
              user={user}
            />
          )}

          {activeTab === "tags" && (
            <TagsView
              tags={tagsList}
              setTags={setTagsList}
              categories={categoriesList}
              showToast={addToast}
              logAction={logAction}
              user={user}
            />
          )}

          {activeTab === "users" && (
            <UsersView 
              users={usersList} 
              onUpdateUser={handleUpdateUser} 
              onAddUser={handleAddUser} 
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === "kyc" && (
            <KycView
              kyc={kycList}
              onView={(item) => setSelectedKyc(item)}
            />
          )}

          {activeTab === "disputes" && (
            <DisputesView
              disputes={disputesList}
              onView={(item) => setSelectedDispute(item)}
              user={user}
            />
          )}

          {activeTab === "moderation" && (
            <ModerationView
              moderation={moderationList}
              onAction={handleModAction}
            />
          )}

          {activeTab === "tenants" && isSuperAdmin && (
            <TenantsView
              tenants={tenantsList}
              newTenant={newTenant}
              onFormChange={setNewTenant}
              onCheckboxChange={handleTenantCheckboxChange}
              onSubmit={createTenant}
              featureFlags={featureFlags}
              onToggleFlag={toggleFeatureFlag}
            />
          )}

          {activeTab === "subscriptions" && (
            <SubscriptionPlansView user={user} apiBase={apiBase} />
          )}

          {activeTab === "billing" && (
            <BillingDashboardView apiBase={apiBase} />
          )}

          {activeTab === "coupons" && (
            <CouponsView user={user} apiBase={apiBase} />
          )}

          {activeTab === "rbac" && (
            <RbacView
              matrix={rbacMatrix}
              user={user}
              onToggle={toggleRbacPermission}
            />
          )}

          {activeTab === "audit" && (
            <AuditView
              logs={auditLogs}
            />
          )}

          {activeTab === "chat-controls" && (
            <ChatControlsView user={user} logAction={logAction} addToast={addToast} />
          )}

          {activeTab === "settings" && (
            <SettingsView user={user} logAction={logAction} addToast={addToast} />
          )}



          {activeTab === "geo-locations" && GeoLocationsView && (
            <GeoLocationsView user={user} logAction={logAction} addToast={addToast} />
          )}

          {activeTab === "geo-ipv4" && GeoIpv4View && (
            <GeoIpv4View user={user} logAction={logAction} addToast={addToast} />
          )}

          {activeTab === "geo-ipv6" && GeoIpv6View && (
            <GeoIpv6View user={user} logAction={logAction} addToast={addToast} />
          )}
        </div>
      </main>

      {/* --- KYC DETAIL MODAL --- */}
      {selectedKyc && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>KYC Application: {selectedKyc.name}</h3>
              <button onClick={() => setSelectedKyc(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Applicant Name</span>
                  <span className="value">{selectedKyc.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Requested Account Type</span>
                  <span className="value">{selectedKyc.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Contact Email</span>
                  <span className="value">{selectedKyc.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Submission Date</span>
                  <span className="value">{selectedKyc.submitted}</span>
                </div>
              </div>

              <div className="detail-item" style={{ marginTop: "16px" }}>
                <span className="label">Submitted Document</span>
                <span className="value" style={{ fontWeight: "600", color: "var(--accent-2)" }}>{selectedKyc.docName}</span>
              </div>

              <div className="doc-preview-box">
                <Icons.doc />
                <div>
                  <div style={{ fontWeight: "600", fontSize: "14px" }}>{selectedKyc.docName}.pdf</div>
                  <div style={{ fontSize: "12px", marginTop: "4px" }}>Reference Registration ID: <b>{selectedKyc.docNumber}</b></div>
                </div>
                <span className="badge-status pending" style={{ marginTop: "8px" }}>Secure OCR Handshake Valid</span>
              </div>

              {selectedKyc.status === "Pending" && (
                <div style={{ marginTop: "24px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", color: "var(--ink-3)", display: "block", marginBottom: "8px" }}>
                    Reason for rejection (Only required if rejecting)
                  </label>
                  <textarea
                    className="form-control"
                    placeholder="Enter notes why document is rejected..."
                    style={{ width: "100%", height: "80px", resize: "none", boxSizing: "border-box" }}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-sm-ghost" onClick={() => setSelectedKyc(null)}>Cancel</button>
              {selectedKyc.status === "Pending" && (
                <React.Fragment>
                  <button className="btn-sm btn-sm-danger" onClick={() => rejectKyc(selectedKyc.id)}>Reject Verification</button>
                  <button className="btn-sm btn-sm-primary" onClick={() => approveKyc(selectedKyc.id)}><Icons.check />Approve Verified</button>
                </React.Fragment>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- DISPUTE DETAIL MODAL --- */}
      {selectedDispute && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Support Ticket &amp; Dispute: {selectedDispute.id}</h3>
              <button onClick={() => setSelectedDispute(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Attendee Name</span>
                  <span className="value">{selectedDispute.user}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Refund Amount</span>
                  <span className="value" style={{ fontWeight: "700", color: "var(--accent-1)" }}>{selectedDispute.amount}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Target Event</span>
                  <span className="value">{selectedDispute.event}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Report Time</span>
                  <span className="value">{selectedDispute.submitted}</span>
                </div>
              </div>

              <div className="detail-item" style={{ marginTop: "16px" }}>
                <span className="label">Reason / Dispute Claim</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "var(--ink-2)", lineHeight: "1.5" }}>
                  {selectedDispute.reason}
                </p>
              </div>

              <div className="maker-checker-alert">
                <Icons.shield />
                <div>
                  <div style={{ fontWeight: "600" }}>Maker-Checker Financial Safety Protocol</div>
                  <div>
                    Samaagum ledger requires one Platform Admin to initiate/request a refund, and a different Super Admin to confirm and settle the transaction.
                  </div>
                </div>
              </div>

              {selectedDispute.maker && (
                <div style={{ marginTop: "16px", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--r-md)" }}>
                  <div style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--ink-3)" }}>Maker Audit</div>
                  <div style={{ fontSize: "13px", color: "var(--ink)", marginTop: "4px" }}>
                    Refund requested by: <b>{selectedDispute.maker}</b>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-sm btn-sm-ghost" onClick={() => setSelectedDispute(null)}>Close</button>

              {selectedDispute.status === "Open" && (
                <button className="btn-sm btn-sm-primary" onClick={() => initiateRefund(selectedDispute.id)}>
                  Initiate Refund (Maker Request)
                </button>
              )}

              {selectedDispute.status === "Refund Requested" && (
                isSuperAdmin ? (
                  <button className="btn-sm btn-sm-primary" style={{ background: "linear-gradient(135deg, #10b981, #0ea5a4)" }} onClick={() => approveRefund(selectedDispute.id)}>
                    <Icons.check /> Approve &amp; Settle Refund (Checker Approval)
                  </button>
                ) : (
                  <button className="btn-sm btn-sm-primary" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
                    Awaiting Super Admin Checker Approval
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS & VIEWS ---

// Login Form Component
export function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="form-group">
        <label>Administrative Email</label>
        <input
          type="email"
          className="form-control"
          placeholder="admin@samaagum.co"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Administrative Key/Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn-sm btn-sm-primary" style={{ width: "100%", padding: "12px", justifyContent: "center", fontSize: "14px", marginTop: "8px" }}>
        Authenticate &amp; Launch Console
      </button>
    </form>
  );
}

// Dashboard Home View
export function DashboardView({ kyc, disputes, moderation, tenants, user, setActiveTab }) {
  const pendingKyc = kyc.filter(k => k.status === "Pending").length;
  const unresolvedDisputes = disputes.filter(d => d.status === "Open" || d.status === "Refund Requested").length;
  const pendingMod = moderation.filter(m => m.status === "Pending").length;
  const activeTenants = tenants.filter(t => t.status === "Active").length;

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "28px", margin: "0 0 8px 0" }}>
          Welcome back, {(user?.name || user?.email || "Admin").split("@")[0].split(" ")[0]}
        </h2>
        <p style={{ color: "var(--ink-2)", margin: 0, fontSize: "15px" }}>
          Here is the security and operational overview of Samaagum network.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab("kyc")} style={{ cursor: "pointer" }}>
          <div className="header">
            <span>Pending KYC Reviews</span>
            <Icons.shield style={{ color: "var(--accent-2)" }} />
          </div>
          <div className="value">{pendingKyc}</div>
          <div className="trend" style={{ color: pendingKyc > 0 ? "#f59e0b" : "#10b981", fontWeight: "600" }}>
            {pendingKyc > 0 ? "⚠️ Requires Triage" : "✓ Clear queue"}
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab("disputes")} style={{ cursor: "pointer" }}>
          <div className="header">
            <span>Open Support &amp; Disputes</span>
            <Icons.dispute style={{ color: "var(--accent-1)" }} />
          </div>
          <div className="value">{unresolvedDisputes}</div>
          <div className="trend" style={{ color: unresolvedDisputes > 0 ? "#ff6b4a" : "#10b981", fontWeight: "600" }}>
            {unresolvedDisputes > 0 ? "⚙ Awaiting Maker/Checker" : "✓ Settle Complete"}
          </div>
        </div>

        <div className="stat-card" onClick={() => setActiveTab("moderation")} style={{ cursor: "pointer" }}>
          <div className="header">
            <span>Moderation Flags</span>
            <Icons.alert style={{ color: "#ef4444" }} />
          </div>
          <div className="value">{pendingMod}</div>
          <div className="trend" style={{ color: pendingMod > 0 ? "#ef4444" : "#10b981", fontWeight: "600" }}>
            {pendingMod > 0 ? "🔥 Unresolved reports" : "✓ Safe space"}
          </div>
        </div>

        <div className="stat-card" onClick={() => user.role === "Super Admin" ? setActiveTab("tenants") : null} style={user.role === "Super Admin" ? { cursor: "pointer" } : {}}>
          <div className="header">
            <span>Active Tenants</span>
            <Icons.tenant style={{ color: "#10b981" }} />
          </div>
          <div className="value">{activeTenants}</div>
          <div className="trend up" style={{ fontWeight: "600" }}>
            ↑ Provisioned hubs
          </div>
        </div>
      </div>

      <div className="data-panel">
        <div className="panel-header">
          <h3>Recent Operations Pending Action</h3>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Age</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {kyc.filter(k => k.status === "Pending").slice(0, 2).map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "600" }}>{item.id}</td>
                  <td>{item.name}</td>
                  <td>Host KYC Document Review</td>
                  <td>{item.submitted}</td>
                  <td><span className="badge-status pending">Pending</span></td>
                  <td><button className="btn-sm btn-sm-ghost" onClick={() => setActiveTab("kyc")}>Review</button></td>
                </tr>
              ))}
              {disputes.filter(d => d.status === "Open" || d.status === "Refund Requested").slice(0, 2).map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "600" }}>{item.id}</td>
                  <td>{item.user} ({item.amount})</td>
                  <td>Ticket Refund &amp; Dispute</td>
                  <td>{item.submitted}</td>
                  <td>
                    <span className={`badge-status ${item.status === 'Refund Requested' ? 'pending' : 'open'}`}>
                      {item.status === 'Refund Requested' ? 'Refund Req' : 'Open'}
                    </span>
                  </td>
                  <td><button className="btn-sm btn-sm-ghost" onClick={() => setActiveTab("disputes")}>Investigate</button></td>
                </tr>
              ))}
              {kyc.filter(k => k.status === "Pending").length === 0 && disputes.filter(d => d.status === "Open" || d.status === "Refund Requested").length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}>
                    No pending operational issues. Samaagum is running smoothly.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// KYC Verification View
export function KycView({ kyc, onView }) {
  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>KYC Verification Queue</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>Verify identification records for onboarding hosts.</p>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Document Type</th>
              <th>Document Number</th>
              <th>Submission Date</th>
              <th>Verification Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {kyc.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: "600" }}>{item.id}</td>
                <td>
                  <div>
                    <span style={{ fontWeight: "600", display: "block" }}>{item.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{item.email}</span>
                  </div>
                </td>
                <td>{item.docName}</td>
                <td className="mono">{item.docNumber}</td>
                <td>{item.submitted}</td>
                <td>
                  <span className={`badge-status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="btn-sm btn-sm-ghost" onClick={() => onView(item)}>
                    {item.status === "Pending" ? "Review Docs" : "View Details"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Disputes & Refunds View
export function DisputesView({ disputes, onView, user }) {
  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>Support &amp; Refund Disputes</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>Maker-Checker dual authorization matrix for settlements.</p>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Event Ticket</th>
              <th>Amount</th>
              <th>Dispute Case Reason</th>
              <th>Maker</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: "600" }}>{item.id}</td>
                <td>{item.user}</td>
                <td>{item.event}</td>
                <td style={{ fontWeight: "600", color: "var(--accent-1)" }}>{item.amount}</td>
                <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.reason}
                </td>
                <td style={{ fontSize: "12px", color: "var(--ink-2)" }}>{item.maker || "—"}</td>
                <td>
                  <span className={`badge-status ${item.status.replace(" ", "-").toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  <button className="btn-sm btn-sm-ghost" onClick={() => onView(item)}>
                    {item.status === "Closed" ? "Details" : "Process Action"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Moderation View
export function ModerationView({ moderation, onAction }) {
  return (
    <div className="data-panel">
      <div className="panel-header">
        <h3>Trust &amp; Safety Moderation</h3>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>Triage flags reported by participants and community admins.</p>
      </div>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Reporter</th>
              <th>Reported User</th>
              <th>Type</th>
              <th>Reported Content Preview</th>
              <th>Claim Reason</th>
              <th>Resolution Status</th>
              <th>Resolve Actions</th>
            </tr>
          </thead>
          <tbody>
            {moderation.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: "600" }}>{item.id}</td>
                <td>{item.reporter}</td>
                <td style={{ fontWeight: "600" }}>{item.reportedUser}</td>
                <td><span className="badge-status open" style={{ background: "rgba(109, 94, 252, 0.08)", color: "var(--accent-2)" }}>{item.entityType}</span></td>
                <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <i>"{item.entityContent}"</i>
                </td>
                <td>{item.reason}</td>
                <td>
                  <span className={`badge-status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === "Pending" ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn-sm btn-sm-ghost" onClick={() => onAction(item.id, "Dismissed")}>
                        Dismiss
                      </button>
                      <button className="btn-sm btn-sm-danger" onClick={() => onAction(item.id, "Suspended")}>
                        Remove &amp; Ban
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Tenants View (Super Admin only)
export function TenantsView({ tenants, newTenant, onFormChange, onCheckboxChange, onSubmit, featureFlags, onToggleFlag }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "32px" }}>
      {/* List */}
      <div className="data-panel">
        <div className="panel-header">
          <h3>Provisioned Tenants</h3>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sub-Domain</th>
                <th>Plan tier</th>
                <th>Entitlements</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(item => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <span style={{ fontWeight: "600", display: "block" }}>{item.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--ink-3)", fontFamily: "monospace" }}>{item.slug}.samaagum.co</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: "600", fontSize: "12px" }}>{item.plan}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {item.entitlements.map(e => (
                        <span key={e} className="mini-chip" style={{ fontSize: "10px", padding: "2px 6px" }}>{e}</span>
                      ))}
                      {item.entitlements.length === 0 && <span style={{ color: "var(--ink-3)", fontSize: "12px" }}>None</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-status ${item.status === 'Active' ? 'verified' : 'pending'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forms & Feature flags */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Form */}
        <div className="data-panel" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Provision New Tenant Hub</h3>
          <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="form-group">
              <label>Tenant Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Indiranagar Tech Hub"
                value={newTenant.name}
                onChange={(e) => onFormChange({ ...newTenant, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Subdomain Slug</label>
              <input
                type="text"
                className="form-control"
                placeholder="indiranagar-tech"
                value={newTenant.slug}
                onChange={(e) => onFormChange({ ...newTenant, slug: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Plan Tier</label>
              <select
                className="form-control"
                value={newTenant.plan}
                onChange={(e) => onFormChange({ ...newTenant, plan: e.target.value })}
              >
                <option value="Enterprise">Enterprise Tier</option>
                <option value="Standard">Standard Tier</option>
                <option value="Free Trial">Free Trial</option>
              </select>
            </div>

            <div className="form-group">
              <label>Entitled Services</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newTenant.entitlements.includes("Waitlist Priority Boosts")}
                    onChange={() => onCheckboxChange("Waitlist Priority Boosts")}
                  />
                  Waitlist Priority
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newTenant.entitlements.includes("Offline Cash Payments")}
                    onChange={() => onCheckboxChange("Offline Cash Payments")}
                  />
                  Offline Cash proof
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newTenant.entitlements.includes("PWA Check-in")}
                    onChange={() => onCheckboxChange("PWA Check-in")}
                  />
                  Offline PWA QR
                </label>
              </div>
            </div>

            <button type="submit" className="btn-sm btn-sm-primary" style={{ padding: "10px", justifyContent: "center", marginTop: "8px" }}>
              <Icons.plus /> Provision Workspace
            </button>
          </form>
        </div>

        {/* Feature flags */}
        <div className="data-panel" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>System-Wide Feature Flags</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {featureFlags.map(flag => (
              <div key={flag.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: "600" }}>{flag.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>{flag.desc}</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={flag.active}
                    onChange={() => onToggleFlag(flag.id)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// RBAC View (Dynamic PostgreSQL Integration)
export function RbacView({ user }) {
  const isSuper = user.role === "Super Admin" || user.role === "Platform Admin"; // Let both view; super admin can modify.
  const isSuperAdmin = user.role === "Super Admin";

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  const [activeSubTab, setActiveSubTab] = React.useState("roles");
  const [roles, setRoles] = React.useState([]);
  const [responsibilities, setResponsibilities] = React.useState([]);
  const [positions, setPositions] = React.useState([]);
  const [makerCheckerRequests, setMakerCheckerRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Search filter
  const [search, setSearch] = React.useState("");

  const handleMakerCheckerAction = async (requestId, action) => {
    try {
      const res = await fetch(`${apiBase}/api/admin/rbac/maker-checker/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('samaagum_admin_token')}`
        }
      }).then(r => r.json());
      if (res.success) {
        alert(res.message || `Request ${action}ed successfully`);
        loadData();
      } else {
        alert(res.message || `Failed to ${action} request`);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Modals & Form States
  const [modalOpen, setModalOpen] = React.useState(null); // 'role' | 'responsibility' | 'position' | null
  const [editItem, setEditItem] = React.useState(null); // Item being edited, null for create

  // Form Fields
  const [roleForm, setRoleForm] = React.useState({
    name: "",
    displayName: "",
    description: "",
    responsibilities: [],
    defaultPosition: "",
    hierarchyLevel: 100,
    isActive: true,
    isDefault: false
  });

  const [respForm, setRespForm] = React.useState({
    name: "",
    displayName: "",
    description: "",
    category: "dashboard",
    routePath: "",
    componentName: "",
    iconName: "Circle",
    requiredFeatures: "[]",
    sortOrder: 0,
    isActive: true
  });

  const [posForm, setPosForm] = React.useState({
    name: "",
    displayName: "",
    description: "",
    hierarchyLevel: 100,
    dataAccessLevel: "individual",
    customConditions: "[]",
    dataAccessLimits: "{}",
    isActive: true
  });

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, respRes, pRes, mcRes] = await Promise.all([
        adminApi.rbac.getRoles(),
        adminApi.rbac.getResponsibilities(),
        adminApi.rbac.getPositions(),
        fetch(`${apiBase}/api/admin/rbac/maker-checker/requests`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('samaagum_admin_token')}`
          }
        }).then(r => r.json())
      ]);

      if (rRes.success) setRoles(rRes.data.roles || rRes.data);
      if (respRes.success) setResponsibilities(respRes.data);
      if (pRes.success) setPositions(pRes.data);
      if (mcRes.success) setMakerCheckerRequests(mcRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch RBAC configuration from backend API.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // API Call Helpers
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleForm.name || !roleForm.displayName) return;

    try {
      const payload = {
        name: roleForm.name,
        displayName: roleForm.displayName,
        description: roleForm.description,
        responsibilities: roleForm.responsibilities,
        defaultPosition: roleForm.defaultPosition || null,
        hierarchyLevel: Number(roleForm.hierarchyLevel),
        isActive: roleForm.isActive,
        isDefault: roleForm.isDefault
      };

      await adminApi.rbac.saveRole(payload, editItem?.id);
      setModalOpen(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRespSubmit = async (e) => {
    e.preventDefault();
    if (!respForm.name || !respForm.displayName || !respForm.routePath || !respForm.componentName) return;

    let parsedFeatures = [];
    try {
      parsedFeatures = JSON.parse(respForm.requiredFeatures || "[]");
    } catch {
      alert("Required Features must be a valid JSON array.");
      return;
    }

    try {
      const payload = {
        name: respForm.name,
        displayName: respForm.displayName,
        description: respForm.description,
        category: respForm.category,
        routePath: respForm.routePath,
        componentName: respForm.componentName,
        iconName: respForm.iconName,
        requiredFeatures: parsedFeatures,
        sortOrder: Number(respForm.sortOrder),
        isActive: respForm.isActive
      };

      await adminApi.rbac.saveResponsibility(payload, editItem?.id);
      setModalOpen(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePosSubmit = async (e) => {
    e.preventDefault();
    if (!posForm.name || !posForm.displayName) return;

    let parsedConditions = [];
    let parsedLimits = {};
    try {
      parsedConditions = JSON.parse(posForm.customConditions || "[]");
    } catch {
      alert("Custom Conditions must be a valid JSON array.");
      return;
    }
    try {
      parsedLimits = JSON.parse(posForm.dataAccessLimits || "{}");
    } catch {
      alert("Data Access Limits must be a valid JSON object.");
      return;
    }

    try {
      const payload = {
        name: posForm.name,
        displayName: posForm.displayName,
        description: posForm.description,
        hierarchyLevel: Number(posForm.hierarchyLevel),
        dataAccessLevel: posForm.dataAccessLevel,
        customConditions: parsedConditions,
        dataAccessLimits: parsedLimits,
        isActive: posForm.isActive
      };

      await adminApi.rbac.savePosition(payload, editItem?.id);
      setModalOpen(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      if (type === "role") await adminApi.rbac.deleteRole(id);
      else if (type === "responsibility") await adminApi.rbac.deleteResponsibility(id);
      else if (type === "position") await adminApi.rbac.deletePosition(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Matrix toggle permission
  const handleMatrixToggle = async (role, respId) => {
    if (!isSuperAdmin) {
      alert("Access Denied: Only Super Admin can modify system policies.");
      return;
    }

    const currentIds = Array.isArray(role.responsibility_ids) ? role.responsibility_ids : [];
    const isLinked = currentIds.includes(respId);
    const updatedIds = isLinked
      ? currentIds.filter(id => id !== respId)
      : [...currentIds, respId];

    try {
      await adminApi.rbac.saveRole({ responsibilities: updatedIds }, role.id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Open modals with prefilled values
  const openEditRole = (role) => {
    setEditItem(role);
    setRoleForm({
      name: role.name,
      displayName: role.display_name,
      description: role.description || "",
      responsibilities: Array.isArray(role.responsibility_ids) ? role.responsibility_ids : [],
      defaultPosition: role.default_position_id || "",
      hierarchyLevel: role.hierarchy_level,
      isActive: role.is_active,
      isDefault: role.is_default
    });
    setModalOpen("role");
  };

  const openCreateRole = () => {
    setEditItem(null);
    setRoleForm({
      name: "",
      displayName: "",
      description: "",
      responsibilities: [],
      defaultPosition: "",
      hierarchyLevel: 100,
      isActive: true,
      isDefault: false
    });
    setModalOpen("role");
  };

  const openEditResp = (resp) => {
    setEditItem(resp);
    setRespForm({
      name: resp.name,
      displayName: resp.display_name,
      description: resp.description || "",
      category: resp.category,
      routePath: resp.route_path,
      componentName: resp.component_name,
      iconName: resp.icon_name || "Circle",
      requiredFeatures: JSON.stringify(resp.required_features || []),
      sortOrder: resp.sort_order,
      isActive: resp.is_active
    });
    setModalOpen("responsibility");
  };

  const openCreateResp = () => {
    setEditItem(null);
    setRespForm({
      name: "",
      displayName: "",
      description: "",
      category: "dashboard",
      routePath: "",
      componentName: "",
      iconName: "Circle",
      requiredFeatures: "[]",
      sortOrder: 0,
      isActive: true
    });
    setModalOpen("responsibility");
  };

  const openEditPos = (pos) => {
    setEditItem(pos);
    setPosForm({
      name: pos.name,
      displayName: pos.display_name,
      description: pos.description || "",
      hierarchyLevel: pos.hierarchy_level,
      dataAccessLevel: pos.data_access_level,
      customConditions: JSON.stringify(pos.custom_conditions || []),
      dataAccessLimits: JSON.stringify(pos.data_access_limits || {}),
      isActive: pos.is_active
    });
    setModalOpen("position");
  };

  const openCreatePos = () => {
    setEditItem(null);
    setPosForm({
      name: "",
      displayName: "",
      description: "",
      hierarchyLevel: 1000,
      dataAccessLevel: "individual",
      customConditions: "[]",
      dataAccessLimits: "{}",
      isActive: true
    });
    setModalOpen("position");
  };

  return (
    <div className="data-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>PostgreSQL Role-Based Access Control (RBAC)</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--ink-3)" }}>
            Configure and govern system identities, granular routes, operational responsibilities, and access bounds.
          </p>
        </div>
        {!isSuperAdmin && (
          <span style={{ fontSize: "12px", color: "var(--ink-3)", background: "var(--surface-2)", padding: "6px 12px", borderRadius: "20px", border: "1px solid var(--border)" }}>
            🔒 Read-only (Super Admin privileges required)
          </span>
        )}
      </div>

      {/* Sub tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
        <button className={`btn-sm ${activeSubTab === "roles" ? "btn-sm-primary" : "btn-sm-ghost"}`} onClick={() => { setActiveSubTab("roles"); setSearch(""); }}>
          Roles ({roles.length})
        </button>
        <button className={`btn-sm ${activeSubTab === "responsibilities" ? "btn-sm-primary" : "btn-sm-ghost"}`} onClick={() => { setActiveSubTab("responsibilities"); setSearch(""); }}>
          Responsibilities ({responsibilities.length})
        </button>
        <button className={`btn-sm ${activeSubTab === "positions" ? "btn-sm-primary" : "btn-sm-ghost"}`} onClick={() => { setActiveSubTab("positions"); setSearch(""); }}>
          Positions ({positions.length})
        </button>
        <button className={`btn-sm ${activeSubTab === "matrix" ? "btn-sm-primary" : "btn-sm-ghost"}`} onClick={() => { setActiveSubTab("matrix"); setSearch(""); }}>
          Permissions Matrix
        </button>
        <button className={`btn-sm ${activeSubTab === "maker-checker" ? "btn-sm-primary" : "btn-sm-ghost"}`} onClick={() => { setActiveSubTab("maker-checker"); setSearch(""); }}>
          Maker-Checker Requests ({makerCheckerRequests.length})
        </button>
      </div>

      {loading && (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-3)" }}>
          🔄 Loading RBAC policies...
        </div>
      )}

      {error && (
        <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "6px", color: "#ef4444", marginBottom: "20px" }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          {/* SEARCH & ADD BAR (except for Matrix) */}
          {activeSubTab !== "matrix" && (
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder={`Search ${activeSubTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", outline: "none" }}
              />
              {isSuperAdmin && activeSubTab === "roles" && (
                <button className="btn-sm btn-sm-primary" onClick={openCreateRole}>+ Create Role</button>
              )}
              {isSuperAdmin && activeSubTab === "responsibilities" && (
                <button className="btn-sm btn-sm-primary" onClick={openCreateResp}>+ Add Responsibility</button>
              )}
              {isSuperAdmin && activeSubTab === "positions" && (
                <button className="btn-sm btn-sm-primary" onClick={openCreatePos}>+ Add Position</button>
              )}
            </div>
          )}

          {/* ── ROLES SUB TAB ────────────────────────────────────────────────── */}
          {activeSubTab === "roles" && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Role Info</th>
                    <th>Type</th>
                    <th>Hierarchy</th>
                    <th>Default Position</th>
                    <th>Responsibilities Linked</th>
                    <th>Status</th>
                    {isSuperAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {roles.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.display_name.toLowerCase().includes(search.toLowerCase())).map(role => (
                    <tr key={role.id}>
                      <td>
                        <div>
                          <span style={{ fontWeight: "600", display: "block" }}>{role.display_name}</span>
                          <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{role.name} {role.is_default && <span style={{ color: "var(--accent-1)", fontWeight: "bold" }}>(Default)</span>}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`pill ${role.is_system_role ? 'blue' : 'gray'}`}>
                          {role.is_system_role ? "System" : "Custom"}
                        </span>
                      </td>
                      <td>
                        <span className="badge-status pending" style={{ background: "transparent", border: "1px solid var(--border)" }}>
                          Level {role.hierarchy_level}
                        </span>
                      </td>
                      <td>
                        {role.position?.display_name || <span style={{ color: "var(--ink-3)" }}>— None</span>}
                      </td>
                      <td>
                        <span style={{ fontWeight: "600" }}>
                          {Array.isArray(role.responsibility_ids) ? role.responsibility_ids.length : 0} items
                        </span>
                      </td>
                      <td>
                        <span className={`pill ${role.is_active ? 'green' : 'red'}`}>
                          {role.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button className="btn-sm btn-sm-ghost" onClick={() => openEditRole(role)}>Edit</button>
                            {!role.is_system_role && (
                              <button className="btn-sm btn-sm-danger" onClick={() => handleDelete("role", role.id)}>Delete</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── RESPONSIBILITIES SUB TAB ─────────────────────────────────────── */}
          {activeSubTab === "responsibilities" && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Display Name / Path</th>
                    <th>Category</th>
                    <th>Component Name</th>
                    <th>Icon</th>
                    <th>Sort Order</th>
                    <th>Status</th>
                    {isSuperAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {responsibilities.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.display_name.toLowerCase().includes(search.toLowerCase())).map(resp => (
                    <tr key={resp.id}>
                      <td>
                        <div>
                          <span style={{ fontWeight: "600", display: "block" }}>{resp.display_name}</span>
                          <span style={{ fontSize: "11px", color: "var(--ink-3)", fontFamily: "monospace" }}>{resp.route_path}</span>
                        </div>
                      </td>
                      <td>
                        <span className="pill blue" style={{ textTransform: "uppercase", fontSize: "10px" }}>{resp.category}</span>
                      </td>
                      <td className="mono">{resp.component_name}</td>
                      <td>
                        <span style={{ fontFamily: "monospace", color: "var(--accent-2)" }}>{resp.icon_name}</span>
                      </td>
                      <td style={{ fontWeight: "bold" }}>{resp.sort_order}</td>
                      <td>
                        <span className={`pill ${resp.is_active ? 'green' : 'red'}`}>
                          {resp.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button className="btn-sm btn-sm-ghost" onClick={() => openEditResp(resp)}>Edit</button>
                            <button className="btn-sm btn-sm-danger" onClick={() => handleDelete("responsibility", resp.id)}>Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── POSITIONS SUB TAB ────────────────────────────────────────────── */}
          {activeSubTab === "positions" && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Position Info</th>
                    <th>Data Access Level</th>
                    <th>Hierarchy</th>
                    <th>Limits Count</th>
                    <th>Status</th>
                    {isSuperAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {positions.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.display_name.toLowerCase().includes(search.toLowerCase())).map(pos => {
                    const limits = pos.data_access_limits || {};
                    const limitKeys = Object.keys(limits);
                    return (
                      <tr key={pos.id}>
                        <td>
                          <div>
                            <span style={{ fontWeight: "600", display: "block" }}>{pos.display_name}</span>
                            <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{pos.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="pill green" style={{ textTransform: "capitalize" }}>{pos.data_access_level}</span>
                        </td>
                        <td>Level {pos.hierarchy_level}</td>
                        <td>
                          <span style={{ fontWeight: "600" }}>{limitKeys.length} thresholds</span>
                        </td>
                        <td>
                          <span className={`pill ${pos.is_active ? 'green' : 'red'}`}>
                            {pos.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                              <button className="btn-sm btn-sm-ghost" onClick={() => openEditPos(pos)}>Edit</button>
                              <button className="btn-sm btn-sm-danger" onClick={() => handleDelete("position", pos.id)}>Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── PERMISSIONS MATRIX SUB TAB ──────────────────────────────────── */}
          {activeSubTab === "matrix" && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: "300px" }}>Granular Responsibility</th>
                    {roles.map(role => (
                      <th key={role.id} style={{ textAlign: "center", fontSize: "11px" }}>{role.display_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {responsibilities.map(resp => (
                    <tr key={resp.id}>
                      <td>
                        <div>
                          <span style={{ fontWeight: "600", display: "block" }}>{resp.display_name}</span>
                          <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{resp.description || `Allows routing to ${resp.route_path}`}</span>
                        </div>
                      </td>
                      {roles.map(role => {
                        const currentIds = Array.isArray(role.responsibility_ids) ? role.responsibility_ids : [];
                        const allowed = currentIds.includes(resp.id);
                        return (
                          <td key={role.id} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={allowed}
                              disabled={!isSuperAdmin}
                              onChange={() => handleMatrixToggle(role, resp.id)}
                              style={{
                                width: "16px",
                                height: "16px",
                                accentColor: "var(--accent-2)",
                                cursor: isSuperAdmin ? "pointer" : "not-allowed",
                                opacity: allowed ? 1 : 0.25
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === "maker-checker" && (
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Request Info</th>
                    <th>Maker</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {makerCheckerRequests.map(req => (
                    <tr key={req.id}>
                      <td>
                        <div>
                          <span style={{ fontWeight: "600", display: "block" }}>{req.action_type}</span>
                          <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>
                            Payload: {JSON.stringify(req.payload)}
                          </span>
                        </div>
                      </td>
                      <td>{req.maker_email}</td>
                      <td>
                        <span className={`pill ${req.status === 'pending' ? 'yellow' : req.status === 'approved' ? 'green' : 'red'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>{new Date(req.created_at).toLocaleString()}</td>
                      <td style={{ textAlign: "right" }}>
                        {req.status === 'pending' && (
                          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button className="btn-sm btn-sm-ghost" onClick={() => handleMakerCheckerAction(req.id, 'reject')}>Reject</button>
                            <button className="btn-sm btn-sm-primary" onClick={() => handleMakerCheckerAction(req.id, 'approve')}>Approve</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {makerCheckerRequests.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "var(--ink-3)" }}>
                        No pending maker-checker requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ROLE FORM DIALOG ───────────────────────────────────────────────── */}
      {modalOpen === "role" && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>{editItem ? "Modify Custom Role" : "Provision New Role"}</h3>
              <button onClick={() => setModalOpen(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleRoleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label>Role Name (Unique Identifier)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. support_staff"
                    disabled={!!editItem}
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Support Staff"
                    value={roleForm.displayName}
                    onChange={(e) => setRoleForm({ ...roleForm, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    placeholder="Describe context & boundaries..."
                    style={{ height: "60px", resize: "none" }}
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Hierarchy Level (1-1000)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="1000"
                    value={roleForm.hierarchyLevel}
                    onChange={(e) => setRoleForm({ ...roleForm, hierarchyLevel: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Default Position Access Bounds</label>
                  <select
                    className="form-control"
                    value={roleForm.defaultPosition}
                    onChange={(e) => setRoleForm({ ...roleForm, defaultPosition: e.target.value })}
                  >
                    <option value="">— No default position bounds</option>
                    {positions.map(p => (
                      <option key={p.id} value={p.id}>{p.display_name} (Level: {p.hierarchy_level})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: "600", marginBottom: "8px", display: "block" }}>Link Responsibilities</label>
                  <div style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "10px",
                    background: "var(--surface-2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px"
                  }}>
                    {responsibilities.map(r => {
                      const isChecked = roleForm.responsibilities.includes(r.id);
                      return (
                        <label key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "var(--ink)" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...roleForm.responsibilities, r.id]
                                : roleForm.responsibilities.filter(id => id !== r.id);
                              setRoleForm({ ...roleForm, responsibilities: updated });
                            }}
                            style={{ accentColor: "var(--accent-2)" }}
                          />
                          <div>
                            <span style={{ fontWeight: "600" }}>{r.display_name}</span>
                            <span style={{ fontSize: "10px", color: "var(--ink-3)", marginLeft: "6px" }}>({r.name})</span>
                          </div>
                        </label>
                      );
                    })}
                    {responsibilities.length === 0 && (
                      <span style={{ fontSize: "12px", color: "var(--ink-3)", textAlign: "center" }}>No responsibilities found. Define some first.</span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={roleForm.isActive}
                      onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                    />
                    Is Active Role
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={roleForm.isDefault}
                      onChange={(e) => setRoleForm({ ...roleForm, isDefault: e.target.checked })}
                    />
                    Is Tenant Default
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESPONSIBILITY FORM DIALOG ────────────────────────────────────── */}
      {modalOpen === "responsibility" && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Responsibility" : "Define Responsibility"}</h3>
              <button onClick={() => setModalOpen(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleRespSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label>Identifier Name (Unique)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. analytics_view"
                    disabled={!!editItem}
                    value={respForm.name}
                    onChange={(e) => setRespForm({ ...respForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. View Analytics Dashboard"
                    value={respForm.displayName}
                    onChange={(e) => setRespForm({ ...respForm, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Briefly state target capability..."
                    value={respForm.description}
                    onChange={(e) => setRespForm({ ...respForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="form-control"
                    value={respForm.category}
                    onChange={(e) => setRespForm({ ...respForm, category: e.target.value })}
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="trading">Trading</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="options">Options</option>
                    <option value="futures">Futures</option>
                    <option value="fii_dii">FII/DII</option>
                    <option value="screeners">Screeners</option>
                    <option value="research">Research</option>
                    <option value="pair_trading">Pair Trading</option>
                    <option value="reports">Reports</option>
                    <option value="account">Account</option>
                    <option value="admin">Admin</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Frontend Route Path</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. /admin/analytics"
                    value={respForm.routePath}
                    onChange={(e) => setRespForm({ ...respForm, routePath: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Component Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. AnalyticsConsole"
                    value={respForm.componentName}
                    onChange={(e) => setRespForm({ ...respForm, componentName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Lucide Icon Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. BarChart3"
                    value={respForm.iconName}
                    onChange={(e) => setRespForm({ ...respForm, iconName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Required Platform Features (JSON Array)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder='e.g. ["analytics_engine"]'
                    value={respForm.requiredFeatures}
                    onChange={(e) => setRespForm({ ...respForm, requiredFeatures: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={respForm.sortOrder}
                    onChange={(e) => setRespForm({ ...respForm, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", marginTop: "6px" }}>
                  <input
                    type="checkbox"
                    checked={respForm.isActive}
                    onChange={(e) => setRespForm({ ...respForm, isActive: e.target.checked })}
                  />
                  Is Active Policy
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── POSITION FORM DIALOG ──────────────────────────────────────────── */}
      {modalOpen === "position" && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Access Position" : "Define Access Position"}</h3>
              <button onClick={() => setModalOpen(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handlePosSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label>Identifier Name (Unique)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. regional_director"
                    disabled={!!editItem}
                    value={posForm.name}
                    onChange={(e) => setPosForm({ ...posForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Regional Director"
                    value={posForm.displayName}
                    onChange={(e) => setPosForm({ ...posForm, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Describe position context..."
                    value={posForm.description}
                    onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Hierarchy level (1-1000)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="1"
                    max="1000"
                    value={posForm.hierarchyLevel}
                    onChange={(e) => setPosForm({ ...posForm, hierarchyLevel: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data Access Scope</label>
                  <select
                    className="form-control"
                    value={posForm.dataAccessLevel}
                    onChange={(e) => setPosForm({ ...posForm, dataAccessLevel: e.target.value })}
                  >
                    <option value="individual">Individual (Only own records)</option>
                    <option value="team">Team (Records of immediate team)</option>
                    <option value="department">Department (All department records)</option>
                    <option value="regional">Regional (Records within assigned region)</option>
                    <option value="organization">Organization (Full organizational tenant read/write)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Custom Conditions (JSON Array)</label>
                  <textarea
                    className="form-control mono"
                    placeholder='e.g. [{"field": "region", "operator": "equals", "value": "South"}]'
                    style={{ height: "60px", fontSize: "11px", resize: "none" }}
                    value={posForm.customConditions}
                    onChange={(e) => setPosForm({ ...posForm, customConditions: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Data Access Limits / Thresholds (JSON Object)</label>
                  <textarea
                    className="form-control mono"
                    placeholder='e.g. {"maxPortfolios": 10, "sla": "4 hours"}'
                    style={{ height: "80px", fontSize: "11px", resize: "none" }}
                    value={posForm.dataAccessLimits}
                    onChange={(e) => setPosForm({ ...posForm, dataAccessLimits: e.target.value })}
                  />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", marginTop: "6px" }}>
                  <input
                    type="checkbox"
                    checked={posForm.isActive}
                    onChange={(e) => setPosForm({ ...posForm, isActive: e.target.checked })}
                  />
                  Is Active Position
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setModalOpen(null)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


// System Audit Logs View
export function AuditView({ logs }) {
  return (
    <div className="data-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>System Audit Logs Terminal</h3>
        <span style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--accent-1)" }}>● LIVE MONITOR FEED</span>
      </div>

      <div className="audit-terminal">
        {logs.map((log, idx) => (
          <div key={idx} className="log-line">
            <span className="time">[{log.time}]</span>
            <span className="actor">{log.actor}</span>:
            <span className="action"> {log.action}</span>
          </div>
        ))}
        <div style={{ color: "#10b981", fontSize: "11px", marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "12px" }}>
          * End of real-time stream. Awaiting administrative state changes.
        </div>
      </div>
    </div>
  );
}

// User Management View
export function UsersView({ users, onUpdateUser, onAddUser, onDeleteUser }) {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add User Form States
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Participant");

  // Edit User Form States
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("Participant");
  const [editStatus, setEditStatus] = useState("Active");

  const filtered = users.filter(u => {
    const name = u.name || "";
    const email = u.email || "";
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "All" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const allRoles = ["Participant", "Event Host", "Group Organizer", "Community Admin", "Platform Admin", "Super Admin"];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;
    onAddUser({
      id: "usr-" + Math.floor(1000 + Math.random() * 9000),
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Invited",
      joined: new Date().toLocaleDateString()
    });
    setNewName("");
    setNewEmail("");
    setNewRole("Participant");
    setShowAddModal(false);
  };

  const handleStartEdit = (u) => {
    setEditingUser(u);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setEditRole(u.role || "Participant");
    setEditStatus(u.status || "Active");
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName || !editEmail) return;
    onUpdateUser(editingUser.id, {
      name: editName,
      email: editEmail,
      role: editRole,
      status: editStatus
    });
    setEditingUser(null);
  };

  return (
    <div className="data-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Manage Registered Users</h3>
        <button className="hbtn hbtn--primary" onClick={() => setShowAddModal(true)} style={{ background: "var(--accent-2)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
          + Invite User
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", outline: "none" }}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", outline: "none" }}
        >
          <option value="All">All Roles</option>
          {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Info</th>
              <th>System Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div>
                    <span style={{ fontWeight: "600", display: "block" }}>{u.name}</span>
                    <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>{u.email}</span>
                  </div>
                </td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => onUpdateUser(u.id, { role: e.target.value })}
                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", fontSize: "12.5px", outline: "none" }}
                  >
                    {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <span className={`pill ${u.status === "Active" ? "green" : u.status === "Invited" ? "orange" : "red"}`} style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "600", borderRadius: "12px", background: u.status === "Invited" ? "rgba(245, 158, 11, 0.15)" : undefined, color: u.status === "Invited" ? "#f59e0b" : undefined }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ fontSize: "13px", color: "var(--ink-3)" }}>{u.joined}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", alignItems: "center" }}>
                    <button 
                      onClick={() => onUpdateUser(u.id, { status: u.status === "Active" ? "Suspended" : "Active" })}
                      style={{ background: "transparent", border: "none", color: u.status === "Active" ? "#ef4444" : "#10b981", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                    >
                      {u.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                    <button 
                      onClick={() => handleStartEdit(u)}
                      style={{ background: "transparent", border: "none", color: "var(--accent-2)", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete user ${u.name}?`)) {
                          onDeleteUser(u.id);
                        }
                      }}
                      style={{ background: "transparent", border: "none", color: "#f43f5e", cursor: "pointer", fontSize: "12.5px", fontWeight: "600" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Invite New User</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleAdd} className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Initial Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                >
                  {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="hbtn hbtn--ghost" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="hbtn hbtn--primary" style={{ background: "var(--accent-2)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-card" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Edit User Info</h3>
              <button onClick={() => setEditingUser(null)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Name</label>
                <input 
                  type="text" 
                  required 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={editEmail} 
                  onChange={(e) => setEditEmail(e.target.value)} 
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Role</label>
                <select 
                  value={editRole} 
                  onChange={(e) => setEditRole(e.target.value)} 
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                >
                  {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "600" }}>Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)} 
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)" }}
                >
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="hbtn hbtn--ghost" onClick={() => setEditingUser(null)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--ink)", cursor: "pointer" }}>Cancel</button>
                <button type="submit" className="hbtn hbtn--primary" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "var(--accent-2)", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUBSCRIPTION PLANS VIEW ─────────────────────────────────────────────────
export function SubscriptionPlansView({ user, apiBase }) {
  const isSuperAdmin = user.role === "Super Admin";
  const [plans, setPlans] = useState([]);
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const emptyForm = {
    name: "", displayName: "", description: "", category: "individual",
    planType: "monthly", isActive: true, isPopular: false, isDefault: false, groupName: "",
    pricing: { monthly: 0, yearly: 0, yearlyDiscount: 0 },
    metadata: { maxEvents: 5, maxAttendees: 100, maxGroups: 1, supportLevel: "basic", customBranding: false, whiteLabel: false },
    features: [],
    trial: { enabled: false, duration: 14 },
    visibility: { availableForSignup: true, hideFromPricing: false },
    rbac: { assignedRole: "", assignedPosition: "", autoAssignRole: true }
  };
  const [form, setForm] = useState({ ...emptyForm });
  const [entitlementsOpen, setEntitlementsOpen] = useState(false);
  const [entitlementsPlan, setEntitlementsPlan] = useState(null);
  const [entForm, setEntForm] = useState({
    group_max_groups: -1,
    group_allowed_visibility: [],
    group_allowed_join_modes: [],
    group_max_capacity: 25,
    group_can_restricted_access: false,
    event_allowed_registration_modes: [],
    event_allowed_visibility: [],
    event_allowed_join_modes: [],
    event_max_participants: 100,
    event_checkin_methods: [],
    event_can_create_paid_tickets: false
  });

  const openEntitlements = (p) => {
    setEntitlementsPlan(p);
    const limits = p.limits || {};
    setEntForm({
      group_max_groups: typeof limits.group_max_groups === 'number' ? limits.group_max_groups : -1,
      group_allowed_visibility: Array.isArray(limits.group_allowed_visibility) ? limits.group_allowed_visibility : ['unlisted'],
      group_allowed_join_modes: Array.isArray(limits.group_allowed_join_modes) ? limits.group_allowed_join_modes : ['open', 'invite_only'],
      group_max_capacity: typeof limits.group_max_capacity === 'number' ? limits.group_max_capacity : 25,
      group_can_restricted_access: typeof limits.group_can_restricted_access === 'boolean' ? limits.group_can_restricted_access : false,
      event_allowed_registration_modes: Array.isArray(limits.event_allowed_registration_modes) ? limits.event_allowed_registration_modes : ['free', 'cash'],
      event_allowed_visibility: Array.isArray(limits.event_allowed_visibility) ? limits.event_allowed_visibility : ['unlisted', 'custom'],
      event_allowed_join_modes: Array.isArray(limits.event_allowed_join_modes) ? limits.event_allowed_join_modes : ['restricted', 'invite'],
      event_max_participants: typeof limits.event_max_participants === 'number' ? limits.event_max_participants : 100,
      event_checkin_methods: Array.isArray(limits.event_checkin_methods) ? limits.event_checkin_methods : ['scanner'],
      event_can_create_paid_tickets: typeof limits.event_can_create_paid_tickets === 'boolean' ? limits.event_can_create_paid_tickets : false
    });
    setEntitlementsOpen(true);
  };

  const handleSaveEntitlements = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/admin/plans/${entitlementsPlan.id}/entitlements`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ entitlements: entForm })
      });
      const data = await res.json();
      if (data.success) {
        alert("Plan entitlements updated successfully!");
        setEntitlementsOpen(false);
        load();
      } else {
        alert(data.message || "Failed to update entitlements.");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [pRes, rRes, posRes] = await Promise.all([
        adminApi.plans.getPlans(),
        adminApi.plans.getAvailableRoles(),
        adminApi.plans.getAvailablePositions(),
      ]);
      if (pRes.success) setPlans(pRes.data?.plans || []);
      if (rRes.success) setRoles(rRes.data?.roles || []);
      if (posRes.success) setPositions(posRes.data?.positions || []);
    } catch (e) { setError("Failed to load subscription plans."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setF = (path, value) => {
    setForm(prev => {
      const keys = path.split(".");
      const next = { ...prev };
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) { cur[keys[i]] = { ...cur[keys[i]] }; cur = cur[keys[i]]; }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const openCreate = () => { setEditItem(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (p) => {
    setEditItem(p);
    setForm({
      name: p.name, displayName: p.display_name, description: p.description || "",
      category: p.category, planType: p.plan_type, isActive: p.is_active, isPopular: p.is_popular, isDefault: p.is_default || false,
      groupName: p.group_name || "",
      pricing: {
        monthly: p.pricing?.monthly?.amount ?? p.pricing?.monthly ?? 0,
        yearly: p.pricing?.yearly?.amount ?? p.pricing?.yearly ?? 0,
        yearlyDiscount: p.pricing?.yearly?.discount ?? 0
      },
      metadata: p.metadata || emptyForm.metadata,
      features: Array.isArray(p.features) ? p.features.map(f => typeof f === 'object' ? (f.name || "") : f) : [],
      trial: p.trial || emptyForm.trial,
      visibility: p.visibility || emptyForm.visibility,
      rbac: { assignedRole: p.rbac_role_id || "", assignedPosition: p.rbac_position_id || "", autoAssignRole: p.rbac_auto_assign ?? true }
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name, displayName: form.displayName, description: form.description,
        category: form.category, planType: form.planType, isActive: form.isActive, isPopular: form.isPopular, isDefault: form.isDefault,
        groupName: form.groupName,
        pricing: { monthly: { amount: Number(form.pricing.monthly), currency: "INR" }, yearly: { amount: Number(form.pricing.yearly), currency: "INR", discount: Number(form.pricing.yearlyDiscount) } },
        metadata: form.metadata,
        features: (form.features || []).map(f => typeof f === 'object' ? f : { name: f }),
        trial: form.trial,
        visibility: form.visibility,
        rbac: { assignedRole: form.rbac.assignedRole || null, assignedPosition: form.rbac.assignedPosition || null, autoAssignRole: form.rbac.autoAssignRole }
      };
      await adminApi.plans.savePlan(payload, editItem?.id);
      setModalOpen(false); load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this plan?")) return;
    try {
      await adminApi.plans.deletePlan(id);
      load();
    } catch (err) { alert(err.message); }
  };

  const handleSetDefault = async (plan) => {
    if (!confirm(`Set "${plan.display_name}" as the default plan for all new users?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/admin/plans/${plan.id}/set-default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        load();
      } else {
        alert(json.message || 'Failed to set default plan');
      }
    } catch (err) { alert(err.message); }
  };

  const priceDisplay = (p) => {
    const amt = p.pricing?.monthly?.amount ?? p.pricing?.monthly;
    if (amt === 0 || amt === undefined) return "Free";
    return `₹${Number(amt).toLocaleString()}/mo`;
  };

  return (
    <div className="data-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Subscription Plans</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--ink-3)" }}>Manage pricing tiers with RBAC role & position assignments.</p>
        </div>
        {isSuperAdmin && <button className="btn-sm btn-sm-primary" onClick={openCreate}>+ Create Plan</button>}
      </div>

      {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-3)" }}>🔄 Loading plans...</div>}
      {error && <div style={{ padding: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "6px", color: "#ef4444", marginBottom: "20px" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Plan</th><th>Category</th><th>Type</th><th>Price</th>
                <th>Assigned Role</th><th>Assigned Position</th><th>Status</th>
                {isSuperAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id}>
                  <td>
                    <div>
                      <span style={{ fontWeight: "600", display: "block" }}>
                        {p.display_name}
                        {p.is_popular && <span style={{ color: "var(--accent-1)", fontSize: "11px", marginLeft: 4 }}>★ Popular</span>}
                        {p.is_default && <span style={{ background: "#059669", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "10px", marginLeft: 6 }}>⭐ Default</span>}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{p.name}</span>
                    </div>
                  </td>
                  <td><span className="pill blue" style={{ textTransform: "capitalize" }}>{p.category}</span></td>
                  <td><span className="pill gray">{p.plan_type}</span></td>
                  <td style={{ fontWeight: "700", color: "var(--accent-1)" }}>{priceDisplay(p)}</td>
                  <td style={{ fontSize: "12px" }}>{roles.find(r => r.id === p.rbac_role_id)?.display_name || <span style={{ color: "var(--ink-3)" }}>—</span>}</td>
                  <td style={{ fontSize: "12px" }}>{positions.find(pos => pos.id === p.rbac_position_id)?.display_name || <span style={{ color: "var(--ink-3)" }}>—</span>}</td>
                  <td><span className={`pill ${p.is_active ? "green" : "red"}`}>{p.is_active ? "Active" : "Inactive"}</span></td>
                  {isSuperAdmin && (
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button className="btn-sm btn-sm-ghost" onClick={() => openEntitlements(p)}>Entitlements</button>
                        {!p.is_default && <button className="btn-sm btn-sm-ghost" style={{ color: "#059669", borderColor: "#059669" }} onClick={() => handleSetDefault(p)}>Set Default</button>}
                        <button className="btn-sm btn-sm-ghost" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn-sm btn-sm-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {plans.length === 0 && (
                <tr><td colSpan="8" style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}>No subscription plans yet. Create your first plan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Plan" : "Create Subscription Plan"}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Plan Name (Identifier)</label>
                    <input className="form-control" placeholder="e.g. basic" disabled={!!editItem} value={form.name} onChange={e => setF("name", e.target.value.toLowerCase())} required />
                  </div>
                  <div className="form-group">
                    <label>Display Name</label>
                    <input className="form-control" placeholder="e.g. Basic Plan" value={form.displayName} onChange={e => setF("displayName", e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" style={{ height: "56px", resize: "none" }} value={form.description} onChange={e => setF("description", e.target.value)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select className="form-control" value={form.category} onChange={e => setF("category", e.target.value)}>
                      <option value="individual">Individual</option>
                      <option value="team">Team</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Plan Type</label>
                    <select className="form-control" value={form.planType} onChange={e => setF("planType", e.target.value)}>
                      <option value="free">Free</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Group</label>
                    <input className="form-control" placeholder="standard" value={form.groupName} onChange={e => setF("groupName", e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Monthly Price (₹)</label>
                    <input type="number" min="0" className="form-control" value={form.pricing.monthly} onChange={e => setF("pricing.monthly", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Yearly Price (₹)</label>
                    <input type="number" min="0" className="form-control" value={form.pricing.yearly} onChange={e => setF("pricing.yearly", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Yearly Discount (%)</label>
                    <input type="number" min="0" max="100" className="form-control" value={form.pricing.yearlyDiscount} onChange={e => setF("pricing.yearlyDiscount", e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Max Events</label>
                    <input type="number" min="0" className="form-control" value={form.metadata.maxEvents} onChange={e => setF("metadata.maxEvents", Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Max Attendees/Event</label>
                    <input type="number" min="0" className="form-control" value={form.metadata.maxAttendees} onChange={e => setF("metadata.maxAttendees", Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label>Max Groups</label>
                    <input type="number" min="0" className="form-control" value={form.metadata.maxGroups} onChange={e => setF("metadata.maxGroups", Number(e.target.value))} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Support Level</label>
                    <select className="form-control" value={form.metadata.supportLevel} onChange={e => setF("metadata.supportLevel", e.target.value)}>
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.metadata.customBranding} onChange={e => setF("metadata.customBranding", e.target.checked)} />
                    Custom Branding
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.metadata.whiteLabel} onChange={e => setF("metadata.whiteLabel", e.target.checked)} />
                    White Label Domain
                  </label>
                </div>

                {/* Included Features */}
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Included Features (Pricing Card Bullets)</span>
                    <button type="button" className="btn-sm btn-sm-ghost" onClick={() => {
                      const updated = [...(form.features || []), ""];
                      setForm({ ...form, features: updated });
                    }}>+ Add Feature</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(form.features || []).map((feat, index) => (
                      <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          className="form-control"
                          placeholder="e.g. Access to 10 active communities"
                          value={feat}
                          onChange={(e) => {
                            const updated = [...form.features];
                            updated[index] = e.target.value;
                            setForm({ ...form, features: updated });
                          }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = form.features.filter((_, idx) => idx !== index);
                            setForm({ ...form, features: updated });
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                            fontSize: "14px",
                            fontWeight: "bold"
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {(form.features || []).length === 0 && (
                      <div style={{ textAlign: "center", fontSize: "11px", color: "var(--ink-3)", padding: "10px" }}>
                        No features added yet. Click "+ Add Feature".
                      </div>
                    )}
                  </div>
                </div>

                {/* RBAC Assignment */}
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icons.shield style={{ width: "16px", height: "16px", color: "var(--accent-2)" }} /> RBAC Assignment
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--ink-3)", margin: "0 0 12px 0" }}>
                    When a user subscribes, they auto-receive this role & position.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Assign Role</label>
                      <select className="form-control" value={form.rbac.assignedRole} onChange={e => setF("rbac.assignedRole", e.target.value)}>
                        <option value="">— No Role</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.display_name} (L{r.hierarchy_level})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assign Position</label>
                      <select className="form-control" value={form.rbac.assignedPosition} onChange={e => setF("rbac.assignedPosition", e.target.value)}>
                        <option value="">— No Position</option>
                        {positions.map(p => (
                          <option key={p.id} value={p.id}>{p.display_name} ({p.data_access_level})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", marginTop: "8px" }}>
                    <input type="checkbox" checked={form.rbac.autoAssignRole} onChange={e => setF("rbac.autoAssignRole", e.target.checked)} />
                    Auto-assign role on subscription
                  </label>
                </div>

                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                  {[{ k: "isActive", l: "Active" }, { k: "isPopular", l: "Mark as Popular" }].map(item => (
                    <label key={item.k} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="checkbox" checked={form[item.k]} onChange={e => setF(item.k, e.target.checked)} />
                      {item.l}
                    </label>
                  ))}
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", color: form.isDefault ? "#059669" : undefined }}>
                    <input type="checkbox" checked={form.isDefault} onChange={e => setF("isDefault", e.target.checked)} />
                    ⭐ Set as Default Plan (auto-assigned to new users)
                  </label>
                </div>

                <div style={{ display: "flex", gap: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={form.trial.enabled} onChange={e => setF("trial.enabled", e.target.checked)} />
                    Enable Free Trial
                  </label>
                  {form.trial.enabled && (
                    <div className="form-group" style={{ margin: 0 }}>
                      <input type="number" min="1" className="form-control" style={{ width: "100px" }} placeholder="Days" value={form.trial.duration} onChange={e => setF("trial.duration", Number(e.target.value))} />
                    </div>
                  )}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">{editItem ? "Update Plan" : "Create Plan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {entitlementsOpen && entitlementsPlan && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>Manage Entitlements: {entitlementsPlan.display_name}</h3>
              <button onClick={() => setEntitlementsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleSaveEntitlements}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-3)" }}>
                  Configure the technical validation limits and locked features associated with this subscription tier.
                </p>

                {/* Groups Section */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", background: "var(--surface-2)" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "var(--accent-2)" }}>👥 Group Entitlements</h4>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div className="form-group">
                      <label>Max Groups (-1 = unlimited)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={entForm.group_max_groups} 
                        onChange={e => setEntForm({ ...entForm, group_max_groups: Number(e.target.value) })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Max Capacity per Group (-1 = unlimited)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={entForm.group_max_capacity} 
                        onChange={e => setEntForm({ ...entForm, group_max_capacity: Number(e.target.value) })} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontWeight: "600" }}>Allowed Visibilities</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                      {['public', 'unlisted', 'restricted'].map(vis => (
                        <label key={vis} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={entForm.group_allowed_visibility.includes(vis)} 
                            onChange={e => {
                              const list = e.target.checked 
                                ? [...entForm.group_allowed_visibility, vis]
                                : entForm.group_allowed_visibility.filter(x => x !== vis);
                              setEntForm({ ...entForm, group_allowed_visibility: list });
                            }}
                          />
                          {vis === 'public' ? 'Public' : vis === 'unlisted' ? 'Unlisted' : 'Restricted-Access'}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontWeight: "600" }}>Allowed Join Modes</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
                      {['open', 'invite_only', 'restricted_access'].map(mode => (
                        <label key={mode} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={entForm.group_allowed_join_modes.includes(mode)} 
                            onChange={e => {
                              const list = e.target.checked 
                                ? [...entForm.group_allowed_join_modes, mode]
                                : entForm.group_allowed_join_modes.filter(x => x !== mode);
                              setEntForm({ ...entForm, group_allowed_join_modes: list });
                            }}
                          />
                          {mode === 'open' ? 'Public' : mode === 'invite_only' ? 'Invite Only' : 'Restricted Access'}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={entForm.group_can_restricted_access} 
                      onChange={e => setEntForm({ ...entForm, group_can_restricted_access: e.target.checked })} 
                    />
                    Enable Restricted Group Access Controls
                  </label>
                </div>

                {/* Events Section */}
                <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", background: "var(--surface-2)" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "var(--accent-2)" }}>📅 Event Entitlements</h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "12px" }}>
                    <div className="form-group">
                      <label>Max Participants per Event (-1 = unlimited)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={entForm.event_max_participants} 
                        onChange={e => setEntForm({ ...entForm, event_max_participants: Number(e.target.value) })} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontWeight: "600" }}>Allowed Visibilities</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                      {['public', 'unlisted', 'custom'].map(vis => (
                        <label key={vis} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={entForm.event_allowed_visibility.includes(vis)} 
                            onChange={e => {
                              const list = e.target.checked 
                                ? [...entForm.event_allowed_visibility, vis]
                                : entForm.event_allowed_visibility.filter(x => x !== vis);
                              setEntForm({ ...entForm, event_allowed_visibility: list });
                            }}
                          />
                          {vis === 'custom' ? 'Custom Access' : vis}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontWeight: "600" }}>Allowed Join Modes</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                      {['public', 'restricted', 'invite'].map(mode => (
                        <label key={mode} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={entForm.event_allowed_join_modes && entForm.event_allowed_join_modes.includes(mode)} 
                            onChange={e => {
                              const joinModes = entForm.event_allowed_join_modes || [];
                              const list = e.target.checked 
                                ? [...joinModes, mode]
                                : joinModes.filter(x => x !== mode);
                              setEntForm({ ...entForm, event_allowed_join_modes: list });
                            }}
                          />
                          {mode === 'public' ? 'Public Event' : mode === 'restricted' ? 'Restricted Access' : 'Invite Only'}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontWeight: "600" }}>Allowed Registration / Payment Modes</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                      {['free', 'cash', 'paid'].map(mode => (
                        <label key={mode} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", textTransform: "capitalize", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={entForm.event_allowed_registration_modes.includes(mode)} 
                            onChange={e => {
                              const list = e.target.checked 
                                ? [...entForm.event_allowed_registration_modes, mode]
                                : entForm.event_allowed_registration_modes.filter(x => x !== mode);
                              setEntForm({ ...entForm, event_allowed_registration_modes: list });
                            }}
                          />
                          {mode}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label style={{ fontWeight: "600" }}>Ticket Check-in Options</label>
                    <div style={{ display: "flex", gap: "16px", marginTop: "6px" }}>
                      {['scanner', 'manual', 'gate'].map(method => (
                        <label key={method} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", textTransform: "capitalize", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={entForm.event_checkin_methods.includes(method)} 
                            onChange={e => {
                              const list = e.target.checked 
                                ? [...entForm.event_checkin_methods, method]
                                : entForm.event_checkin_methods.filter(x => x !== method);
                              setEntForm({ ...entForm, event_checkin_methods: list });
                            }}
                          />
                          {method}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={entForm.event_can_create_paid_tickets} 
                      onChange={e => setEntForm({ ...entForm, event_can_create_paid_tickets: e.target.checked })} 
                    />
                    Allow Paid Ticket Creations
                  </label>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setEntitlementsOpen(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">Save Entitlements</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── COUPONS VIEW ──────────────────────────────────────────────────────────────
export function CouponsView({ user, apiBase }) {
  const isSuperAdmin = user.role === "Super Admin";
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [copied, setCopied] = useState(null);

  const emptyForm = {
    code: "", description: "", discountType: "percent", amount: 0,
    dateExpires: "", isActive: true, freeShipping: false,
    usageRestrictions: { minimumAmount: 0, individualUse: false, excludeSaleItems: false },
    usageLimits: { usageLimit: "", usageLimitPerUser: 1 },
    emailSettings: { sendNotificationEmail: false, notifyOnUsage: false, notifyOnExpiry: false }
  };
  const [form, setForm] = useState({ ...emptyForm });

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.coupons.getCoupons();
      if (res.success) setCoupons(res.data?.coupons || []);
    } catch (e) { setError("Failed to load coupons."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (c) => {
    setEditItem(c);
    setForm({
      code: c.code, description: c.description || "", discountType: c.discount_type,
      amount: c.amount, dateExpires: c.date_expires ? new Date(c.date_expires).toISOString().split("T")[0] : "",
      isActive: c.is_active, freeShipping: c.free_shipping || false,
      usageRestrictions: { minimumAmount: c.usage_restrictions?.minimumAmount || 0, individualUse: c.usage_restrictions?.individualUse || false, excludeSaleItems: c.usage_restrictions?.excludeSaleItems || false },
      usageLimits: { usageLimit: c.usage_limits?.usageLimit || "", usageLimitPerUser: c.usage_limits?.usageLimitPerUser || 1 },
      emailSettings: { sendNotificationEmail: c.email_settings?.sendNotificationEmail || false, notifyOnUsage: c.email_settings?.notifyOnUsage || false, notifyOnExpiry: c.email_settings?.notifyOnExpiry || false }
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code, description: form.description, discountType: form.discountType,
        amount: Number(form.amount), dateExpires: form.dateExpires || null,
        isActive: form.isActive, freeShipping: form.freeShipping,
        usageRestrictions: { ...form.usageRestrictions, minimumAmount: Number(form.usageRestrictions.minimumAmount) },
        usageLimits: { usageLimit: form.usageLimits.usageLimit ? Number(form.usageLimits.usageLimit) : undefined, usageLimitPerUser: Number(form.usageLimits.usageLimitPerUser) },
        emailSettings: form.emailSettings
      };
      await adminApi.coupons.saveCoupon(payload, editItem?.id);
      setModalOpen(false); load();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await adminApi.coupons.deleteCoupon(id);
      load();
    } catch (err) { alert(err.message); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => { });
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (c) => c.date_expires && new Date(c.date_expires) < new Date();
  const fmtDiscount = (c) => c.discount_type === "percent" ? `${c.amount}%` : `₹${c.amount}`;

  const filtered = coupons.filter(c =>
    (typeFilter === "all" || c.discount_type === typeFilter) &&
    (c.code.toLowerCase().includes(search.toLowerCase()) || (c.description || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="data-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>Coupon Management</h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--ink-3)" }}>Percentage and fixed-amount discount codes.</p>
        </div>
        {isSuperAdmin && <button className="btn-sm btn-sm-primary" onClick={openCreate}>+ Add Coupon</button>}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input type="text" placeholder="Search code or description..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", outline: "none" }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--field)", color: "var(--ink)", outline: "none" }}>
          <option value="all">All Types</option>
          <option value="percent">Percentage</option>
          <option value="fixed_cart">Fixed Cart</option>
          <option value="fixed_product">Fixed Product</option>
        </select>
      </div>

      {loading && <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-3)" }}>🔄 Loading coupons...</div>}
      {error && <div style={{ padding: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "6px", color: "#ef4444", marginBottom: "20px" }}>⚠️ {error}</div>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th><th>Type</th><th>Discount</th><th>Used</th>
                <th>Expires</th><th>Status</th>
                {isSuperAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <code style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "13px" }}>{c.code}</code>
                      <button onClick={() => copyCode(c.code)} style={{ background: "transparent", border: "none", cursor: "pointer", color: copied === c.code ? "#10b981" : "var(--ink-3)", fontSize: "12px" }}>
                        {copied === c.code ? "✓" : "⎘"}
                      </button>
                    </div>
                    {c.description && <div style={{ fontSize: "11px", color: "var(--ink-3)" }}>{c.description}</div>}
                  </td>
                  <td><span className="pill blue" style={{ fontSize: "10px", textTransform: "uppercase" }}>{c.discount_type.replace("_", " ")}</span></td>
                  <td style={{ fontWeight: "700", color: "var(--accent-1)" }}>{fmtDiscount(c)}</td>
                  <td>{c.usage_count ?? 0}{c.usage_limits?.usageLimit ? ` / ${c.usage_limits.usageLimit}` : ""}</td>
                  <td style={{ fontSize: "12px", color: isExpired(c) ? "#ef4444" : "inherit" }}>
                    {c.date_expires ? new Date(c.date_expires).toLocaleDateString() : "Never"}{isExpired(c) ? " ⚠" : ""}
                  </td>
                  <td>
                    <span className={`pill ${c.is_active && !isExpired(c) ? "green" : "red"}`}>
                      {isExpired(c) ? "Expired" : c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button className="btn-sm btn-sm-ghost" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn-sm btn-sm-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}>No coupons found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header">
              <h3>{editItem ? `Edit Coupon: ${editItem.code}` : "Create Coupon"}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--ink)", cursor: "pointer" }}><Icons.close /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Coupon Code</label>
                    <input className="form-control" placeholder="e.g. SAVE20" disabled={!!editItem}
                      value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required />
                  </div>
                  <div className="form-group">
                    <label>Discount Type</label>
                    <select className="form-control" value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}>
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed_cart">Fixed Cart (₹)</option>
                      <option value="fixed_product">Fixed Product (₹)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" style={{ height: "56px", resize: "none" }} value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Amount ({form.discountType === "percent" ? "%" : "₹"})</label>
                    <input type="number" min="0" className="form-control" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input type="date" className="form-control" value={form.dateExpires}
                      onChange={e => setForm(p => ({ ...p, dateExpires: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Total Usage Limit</label>
                    <input type="number" min="0" className="form-control" placeholder="Unlimited"
                      value={form.usageLimits.usageLimit}
                      onChange={e => setForm(p => ({ ...p, usageLimits: { ...p.usageLimits, usageLimit: e.target.value } }))} />
                  </div>
                  <div className="form-group">
                    <label>Per User Limit</label>
                    <input type="number" min="1" className="form-control" value={form.usageLimits.usageLimitPerUser}
                      onChange={e => setForm(p => ({ ...p, usageLimits: { ...p.usageLimits, usageLimitPerUser: e.target.value } }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Minimum Spend (₹)</label>
                  <input type="number" min="0" className="form-control" value={form.usageRestrictions.minimumAmount}
                    onChange={e => setForm(p => ({ ...p, usageRestrictions: { ...p.usageRestrictions, minimumAmount: e.target.value } }))} />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                  {[
                    { k: "isActive", l: "Active", top: true },
                    { k: "freeShipping", l: "Free Shipping", top: true },
                    { k: "usageRestrictions.individualUse", l: "Individual Use Only", top: false },
                    { k: "usageRestrictions.excludeSaleItems", l: "Exclude Sale Items", top: false },
                  ].map(item => {
                    const val = item.top ? form[item.k] : form.usageRestrictions[item.k.split(".")[1]];
                    const onChange = item.top
                      ? (e) => setForm(p => ({ ...p, [item.k]: e.target.checked }))
                      : (e) => setForm(p => ({ ...p, usageRestrictions: { ...p.usageRestrictions, [item.k.split(".")[1]]: e.target.checked } }));
                    return (
                      <label key={item.k} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                        <input type="checkbox" checked={val} onChange={onChange} />{item.l}
                      </label>
                    );
                  })}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn-sm btn-sm-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-sm btn-sm-primary">{editItem ? "Update Coupon" : "Create Coupon"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




export function SettingsView({ user, logAction, addToast }) {
  const [authSettings, setAuthSettings] = React.useState({
    google: { enabled: false, clientId: '', clientSecret: '' },
    linkedin: { enabled: false, clientId: '', clientSecret: '' }
  });

  const addCustomProvider = () => {
    const key = `custom_${Date.now()}`;
    setAuthSettings(prev => ({
      ...prev,
      [key]: {
        enabled: false,
        clientId: '',
        clientSecret: '',
        displayName: 'Custom Provider',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userEndpoint: '',
        scope: 'openid email profile',
        emailField: 'email',
        nameField: 'name',
        isCustom: true
      }
    }));
  };

  const removeCustomProvider = (key) => {
    setAuthSettings(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateProviderField = (providerKey, field, value) => {
    setAuthSettings(prev => ({
      ...prev,
      [providerKey]: {
        ...prev[providerKey],
        [field]: value
      }
    }));
  };

  const updateProviderKey = (oldKey, newKey) => {
    if (!newKey) return;
    setAuthSettings(prev => {
      const next = { ...prev };
      if (next[newKey]) return prev;
      next[newKey] = next[oldKey];
      delete next[oldKey];
      return next;
    });
  };
  const [authLoading, setAuthLoading] = React.useState(true);
  const [authSaving, setAuthSaving] = React.useState(false);
  const [authError, setAuthError] = React.useState(null);

  const [commSettings, setCommSettings] = React.useState({
    provider: 'brevo',
    enabled: false,
    senderEmail: '',
    senderName: '',
    brevoApiKey: '',
    brevoTemplateId: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPass: ''
  });
  const [commLoading, setCommLoading] = React.useState(true);
  const [commSaving, setCommSaving] = React.useState(false);
  const [commError, setCommError] = React.useState(null);

  const [testEmail, setTestEmail] = React.useState('');
  const [testLoading, setTestLoading] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState(null);

  React.useEffect(() => {
    loadAuthSettings();
    loadCommSettings();
  }, []);

  const loadAuthSettings = async () => {
    try {
      setAuthLoading(true);
      const res = await apiClient.settings.getAuthSettings();
      if (res.success) {
        setAuthSettings(res.data);
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to load authentication settings');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadCommSettings = async () => {
    try {
      setCommLoading(true);
      const res = await apiClient.settings.getCommunicationSettings();
      if (res.success) {
        setCommSettings(res.data);
      }
    } catch (err) {
      setCommError(err.message || 'Failed to load communication settings');
    } finally {
      setCommLoading(false);
    }
  };

  const handleSaveAuth = async (e) => {
    e.preventDefault();
    try {
      setAuthSaving(true);
      setAuthError(null);
      const res = await apiClient.settings.saveAuthSettings(authSettings);
      if (res.success) {
        addToast(res.message || 'Authentication settings saved successfully', 'success');
        logAction(user.email, 'Updated OAuth settings configuration.');
        await loadAuthSettings();
      }
    } catch (err) {
      setAuthError(err.message || 'Failed to save authentication settings');
    } finally {
      setAuthSaving(false);
    }
  };

  const handleSaveComm = async (e) => {
    e.preventDefault();
    try {
      setCommSaving(true);
      setCommError(null);
      const res = await apiClient.settings.saveCommunicationSettings(commSettings);
      if (res.success) {
        addToast(res.message || 'Communication settings saved successfully', 'success');
        logAction(user.email, 'Updated Communication credentials.');
        await loadCommSettings();
      }
    } catch (err) {
      setCommError(err.message || 'Failed to save communication settings');
    } finally {
      setCommSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testEmail) {
      setTestStatus({ success: false, message: 'Please enter a recipient email address' });
      return;
    }
    try {
      setTestLoading(true);
      setTestStatus(null);
      const res = await apiClient.settings.testCommunication({ email: testEmail });
      if (res.success) {
        setTestStatus({ success: true, message: res.message || 'Test email sent successfully!' });
      } else {
        setTestStatus({ success: false, message: res.message || 'Failed to send test email' });
      }
    } catch (err) {
      setTestStatus({ success: false, message: err.message || 'Error occurred while testing connection' });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "28px", margin: "0 0 8px 0" }}>
          System Settings
        </h2>
        <p style={{ color: "var(--ink-2)", margin: 0, fontSize: "15px" }}>
          Configure third-party integrations, OAuth providers, and transactional communication credentials.
        </p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', alignItems: 'start', cursor: 'default' }}>

        {/* Auth settings card */}
        <div className="stat-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', paddingBottom: '12px' }}>
            <Icons.shield style={{ color: 'var(--accent-1)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Admin Auth Integration</h3>
          </div>

          {authLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-2)' }}>Loading auth settings...</div>
          ) : (
            <form onSubmit={handleSaveAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {authError && <div className="alert-badge text-danger" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgb(239,68,68)', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>{authError}</div>}

              {/* GOOGLE AUTH */}
              <div style={{ padding: '16px', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.04))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    Google OAuth
                  </span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={authSettings.google.enabled}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        google: { ...authSettings.google, enabled: e.target.checked }
                      })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: authSettings.google.enabled ? 'var(--accent-1)' : '#555', transition: '0.3s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', height: '16px', width: '16px', left: authSettings.google.enabled ? '20px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '0.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: authSettings.google.enabled ? 1 : 0.6 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>Client ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={authSettings.google.clientId}
                      disabled={!authSettings.google.enabled}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        google: { ...authSettings.google, clientId: e.target.value }
                      })}
                      placeholder="Enter Google Client ID"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>Client Secret</label>
                    <input
                      type="password"
                      className="form-control"
                      value={authSettings.google.clientSecret}
                      disabled={!authSettings.google.enabled}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        google: { ...authSettings.google, clientSecret: e.target.value }
                      })}
                      placeholder="Enter Google Client Secret"
                    />
                  </div>
                </div>
              </div>

              {/* LINKEDIN AUTH */}
              <div style={{ padding: '16px', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.04))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                    LinkedIn OAuth
                  </span>
                  <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={authSettings.linkedin.enabled}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        linkedin: { ...authSettings.linkedin, enabled: e.target.checked }
                      })}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: authSettings.linkedin.enabled ? 'var(--accent-1)' : '#555', transition: '0.3s', borderRadius: '22px' }}>
                      <span style={{ position: 'absolute', height: '16px', width: '16px', left: authSettings.linkedin.enabled ? '20px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '0.3s', borderRadius: '50%' }}></span>
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: authSettings.linkedin.enabled ? 1 : 0.6 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>Client ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={authSettings.linkedin.clientId}
                      disabled={!authSettings.linkedin.enabled}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        linkedin: { ...authSettings.linkedin, clientId: e.target.value }
                      })}
                      placeholder="Enter LinkedIn Client ID"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>Client Secret</label>
                    <input
                      type="password"
                      className="form-control"
                      value={authSettings.linkedin.clientSecret}
                      disabled={!authSettings.linkedin.enabled}
                      onChange={(e) => setAuthSettings({
                        ...authSettings,
                        linkedin: { ...authSettings.linkedin, clientSecret: e.target.value }
                      })}
                      placeholder="Enter LinkedIn Client Secret"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC CUSTOM OAUTH PROVIDERS */}
              {Object.keys(authSettings).filter(key => key !== 'google' && key !== 'linkedin').map(key => {
                const provider = authSettings[key] || {};
                return (
                  <div key={key} style={{ padding: '16px', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.04))', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--accent-2)' }}>
                        Custom: {provider.displayName || key}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                          type="button" 
                          onClick={() => removeCustomProvider(key)}
                          style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                          title="Delete Provider"
                        >
                          <Icons.close style={{ width: '16px', height: '16px' }} />
                        </button>
                        <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                          <input 
                            type="checkbox" 
                            checked={provider.enabled || false} 
                            onChange={(e) => updateProviderField(key, 'enabled', e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }} 
                          />
                          <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: provider.enabled ? 'var(--accent-1)' : '#555', transition: '0.3s', borderRadius: '22px' }}>
                            <span style={{ position: 'absolute', height: '16px', width: '16px', left: provider.enabled ? '20px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '0.3s', borderRadius: '50%' }}></span>
                          </span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: provider.enabled ? 1 : 0.6 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Provider Key (ID)</label>
                          <input 
                            type="text" 
                            className="form-control"
                            defaultValue={key}
                            onBlur={(e) => {
                              const newKey = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
                              if (newKey && newKey !== key) {
                                if (authSettings[newKey]) {
                                  addToast('Provider key already exists', 'warning');
                                  e.target.value = key;
                                } else {
                                  updateProviderKey(key, newKey);
                                }
                              }
                            }}
                            placeholder="e.g. github"
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Display Name</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={provider.displayName || ''}
                            onChange={(e) => updateProviderField(key, 'displayName', e.target.value)}
                            placeholder="e.g. GitHub"
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Client ID</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={provider.clientId || ''}
                            onChange={(e) => updateProviderField(key, 'clientId', e.target.value)}
                            placeholder="Enter Client ID"
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Client Secret</label>
                          <input 
                            type="password" 
                            className="form-control"
                            value={provider.clientSecret || ''}
                            onChange={(e) => updateProviderField(key, 'clientSecret', e.target.value)}
                            placeholder="Enter Client Secret"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '12px', marginBottom: '4px' }}>Authorization Endpoint</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={provider.authorizationEndpoint || ''}
                          onChange={(e) => updateProviderField(key, 'authorizationEndpoint', e.target.value)}
                          placeholder="e.g. https://github.com/login/oauth/authorize"
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '12px', marginBottom: '4px' }}>Token Endpoint</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={provider.tokenEndpoint || ''}
                          onChange={(e) => updateProviderField(key, 'tokenEndpoint', e.target.value)}
                          placeholder="e.g. https://github.com/login/oauth/access_token"
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '12px', marginBottom: '4px' }}>User Info Endpoint</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={provider.userEndpoint || ''}
                          onChange={(e) => updateProviderField(key, 'userEndpoint', e.target.value)}
                          placeholder="e.g. https://api.github.com/user"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Scope</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={provider.scope || ''}
                            onChange={(e) => updateProviderField(key, 'scope', e.target.value)}
                            placeholder="e.g. read:user user:email"
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Email Field</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={provider.emailField || ''}
                            onChange={(e) => updateProviderField(key, 'emailField', e.target.value)}
                            placeholder="email"
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: '12px', marginBottom: '4px' }}>Name Field</label>
                          <input 
                            type="text" 
                            className="form-control"
                            value={provider.nameField || ''}
                            onChange={(e) => updateProviderField(key, 'nameField', e.target.value)}
                            placeholder="name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button 
                type="button" 
                onClick={addCustomProvider}
                className="btn-sm"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  height: 'auto', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px dashed var(--border-color, rgba(255,255,255,0.15))', 
                  color: 'var(--ink-1)', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: '0.2s'
                }}
              >
                <Icons.plus style={{ width: '16px', height: '16px' }} />
                Add Custom Login Method
              </button>

              <button 
                type="submit" 
                disabled={authSaving}
                className="btn-sm btn-sm-primary"
                style={{ width: '100%', padding: '10px', height: 'auto' }}
              >
                {authSaving ? 'Saving Auth Settings...' : 'Save Auth Configuration'}
              </button>
            </form>
          )}
        </div>

        {/* Communication credentials card */}
        <div className="stat-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', cursor: 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.06))', paddingBottom: '12px' }}>
            <Icons.terminal style={{ color: 'var(--accent-2)' }} />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Communication Credentials</h3>
          </div>

          {commLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-2)' }}>Loading communication settings...</div>
          ) : (
            <form onSubmit={handleSaveComm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {commError && <div className="alert-badge text-danger" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgb(239,68,68)', color: '#f87171', padding: '10px', borderRadius: '6px', fontSize: '13px' }}>{commError}</div>}

              {/* Main Enable Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card, rgba(255,255,255,0.02))', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.04))' }}>
                <div>
                  <span style={{ display: 'block', fontWeight: 500 }}>Enable System Emails</span>
                  <span style={{ fontSize: '11px', color: 'var(--ink-2)' }}>Allow app to send transactional notifications</span>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                  <input
                    type="checkbox"
                    checked={commSettings.enabled}
                    onChange={(e) => setCommSettings({ ...commSettings, enabled: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span className="slider round" style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: commSettings.enabled ? 'var(--accent-2)' : '#555', transition: '0.3s', borderRadius: '22px' }}>
                    <span style={{ position: 'absolute', height: '16px', width: '16px', left: commSettings.enabled ? '20px' : '3px', bottom: '3px', backgroundColor: 'white', transition: '0.3s', borderRadius: '50%' }}></span>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: commSettings.enabled ? 1 : 0.6 }}>
                {/* Provider Picker */}
                <div className="form-group">
                  <label style={{ fontSize: '12px', marginBottom: '4px' }}>Email Provider</label>
                  <select
                    className="form-control"
                    value={commSettings.provider}
                    disabled={!commSettings.enabled}
                    onChange={(e) => setCommSettings({ ...commSettings, provider: e.target.value })}
                  >
                    <option value="brevo">Sendinblue / Brevo API</option>
                    <option value="smtp">Custom SMTP Server</option>
                  </select>
                </div>

                {/* Sender Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>Sender Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={commSettings.senderName}
                      disabled={!commSettings.enabled}
                      onChange={(e) => setCommSettings({ ...commSettings, senderName: e.target.value })}
                      placeholder="e.g. Samaagum Alerts"
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', marginBottom: '4px' }}>Sender Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={commSettings.senderEmail}
                      disabled={!commSettings.enabled}
                      onChange={(e) => setCommSettings({ ...commSettings, senderEmail: e.target.value })}
                      placeholder="alerts@domain.com"
                    />
                  </div>
                </div>

                {/* BREVO CONFIG */}
                {commSettings.provider === 'brevo' && (
                  <div style={{ padding: '16px', background: 'rgba(109,94,252,0.04)', borderRadius: '8px', border: '1px solid rgba(109,94,252,0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--accent-2)' }}>Brevo API Configuration</div>
                    <div className="form-group">
                      <label style={{ fontSize: '12px', marginBottom: '4px' }}>Brevo API Key v3</label>
                      <input
                        type="password"
                        className="form-control"
                        value={commSettings.brevoApiKey}
                        disabled={!commSettings.enabled}
                        onChange={(e) => setCommSettings({ ...commSettings, brevoApiKey: e.target.value })}
                        placeholder="xkeysib-..."
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '12px', marginBottom: '4px' }}>Brevo Template ID (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={commSettings.brevoTemplateId || ''}
                        disabled={!commSettings.enabled}
                        onChange={(e) => setCommSettings({ ...commSettings, brevoTemplateId: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="e.g. 1"
                      />
                    </div>
                  </div>
                )}

                {/* SMTP CONFIG */}
                {commSettings.provider === 'smtp' && (
                  <div style={{ padding: '16px', background: 'var(--bg-card, rgba(255,255,255,0.02))', borderRadius: '8px', border: '1px solid var(--border-color, rgba(255,255,255,0.05))', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontWeight: 500, fontSize: '13px' }}>SMTP Configuration</div>

                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', marginBottom: '4px' }}>SMTP Host</label>
                        <input
                          type="text"
                          className="form-control"
                          value={commSettings.smtpHost}
                          disabled={!commSettings.enabled}
                          onChange={(e) => setCommSettings({ ...commSettings, smtpHost: e.target.value })}
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', marginBottom: '4px' }}>Port</label>
                        <input
                          type="number"
                          className="form-control"
                          value={commSettings.smtpPort}
                          disabled={!commSettings.enabled}
                          onChange={(e) => setCommSettings({ ...commSettings, smtpPort: e.target.value ? Number(e.target.value) : 587 })}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', marginBottom: '4px' }}>SMTP User</label>
                        <input
                          type="text"
                          className="form-control"
                          value={commSettings.smtpUser}
                          disabled={!commSettings.enabled}
                          onChange={(e) => setCommSettings({ ...commSettings, smtpUser: e.target.value })}
                          placeholder="Username/Email"
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: '11px', marginBottom: '4px' }}>SMTP Password</label>
                        <input
                          type="password"
                          className="form-control"
                          value={commSettings.smtpPass}
                          disabled={!commSettings.enabled}
                          onChange={(e) => setCommSettings({ ...commSettings, smtpPass: e.target.value })}
                          placeholder="Password"
                        />
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={commSettings.smtpSecure}
                        disabled={!commSettings.enabled}
                        onChange={(e) => setCommSettings({ ...commSettings, smtpSecure: e.target.checked })}
                      />
                      Use SSL/TLS (Secure Connection)
                    </label>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={commSaving}
                className="btn-sm btn-sm-primary"
                style={{ width: '100%', padding: '10px', height: 'auto', background: 'var(--accent-2)' }}
              >
                {commSaving ? 'Saving Credentials...' : 'Save Communication Configuration'}
              </button>
            </form>
          )}

          {/* Connection Test Sub-card */}
          {commSettings.enabled && (
            <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: 500, fontSize: '13px' }}>Test Communication Integration</div>
              <p style={{ fontSize: '11px', color: 'var(--ink-2)', margin: 0 }}>Send a quick validation email to verify your configured Brevo or SMTP credentials.</p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="email"
                  placeholder="recipient@test.com"
                  value={testEmail}
                  className="form-control"
                  onChange={(e) => setTestEmail(e.target.value)}
                  style={{ flex: 1, fontSize: '13px' }}
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testLoading || !testEmail}
                  className="btn-sm"
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', height: 'auto' }}
                >
                  {testLoading ? 'Testing...' : 'Send Test'}
                </button>
              </div>

              {testStatus && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: testStatus.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `1px solid ${testStatus.success ? 'rgb(16,185,129)' : 'rgb(239,68,68)'}`,
                  color: testStatus.success ? '#34d399' : '#f87171'
                }}>
                  {testStatus.message}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- TAGS VIEW ---
export function TagsView({ tags, setTags, categories, showToast, logAction, user }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // SlideOver Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formStatus, setFormStatus] = useState('active');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState(null);

  // Simple helpers
  const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const copySlug = (slug) => {
    navigator.clipboard.writeText(slug).then(() => {
      showToast(`Slug "${slug}" copied to clipboard`, 'info');
    }).catch(() => {
      showToast(`Slug: ${slug}`, 'info');
    });
  };

  const toggleStatus = (id, e) => {
    e.stopPropagation();
    const tag = tags.find(t => t.id === id);
    if (!tag) return;

    const parentCat = categories.find(c => c.name === tag.category);
    if (parentCat && parentCat.status === 'inactive') {
      showToast('Cannot activate a tag under an inactive category', 'warning');
      return;
    }

    const nextStatus = tag.status === 'active' ? 'inactive' : 'active';
    adminApi.tags.saveTag({ status: nextStatus }, id).then(() => {
      const updated = tags.map(t => t.id === id ? { ...t, status: nextStatus } : t);
      setTags(updated);
      logAction(user?.email || 'Admin', `Updated tag "${tag.name}" status to ${nextStatus}.`);
      showToast(`"${tag.name}" is now ${nextStatus}`, 'success');
    }).catch(err => {
      showToast('Failed to update tag status: ' + err.message, 'warning');
    });
  };

  const openPanel = (tag = null) => {
    // Get active categories list to pre-populate category dropdown
    const activeCats = categories.filter(c => !c.isDeleted && c.status === 'active');

    if (tag) {
      setEditingTag(tag);
      setFormName(tag.name);
      setFormSlug(tag.slug);
      setFormCategory(tag.category);
      setFormStatus(tag.status);
    } else {
      setEditingTag(null);
      setFormName('');
      setFormSlug('');
      setFormCategory(activeCats[0]?.name || '');
      setFormStatus('active');
    }
    setIsPanelOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) {
      showToast('Tag name is required', 'warning');
      return;
    }

    const slug = editingTag ? (formSlug.trim() || slugify(formName)) : slugify(formName);

    const parentCat = categories.find(c => c.name === formCategory);
    const isParentInactive = parentCat && parentCat.status === 'inactive';
    const finalStatus = isParentInactive ? 'inactive' : formStatus;

    if (editingTag) {
      const newVal = {
        name: formName,
        slug,
        category: formCategory,
        status: finalStatus
      };
      adminApi.tags.saveTag(newVal, editingTag.id).then(() => {
        const updatedList = tags.map(t => t.id === editingTag.id ? { ...t, ...newVal } : t);
        setTags(updatedList);
        logAction(user?.email || 'Admin', `Updated tag "${formName}" details.`);
        showToast(`Tag "${formName}" updated successfully`, 'success');
      }).catch(err => {
        showToast('Failed to update tag: ' + err.message, 'warning');
      });
    } else {
      const newTagId = uuid();
      const newTag = {
        id: newTagId,
        name: formName,
        slug,
        category: formCategory,
        status: finalStatus,
        eventCount: 0,
        isDeleted: false,
        createdAt: new Date().toISOString()
      };
      adminApi.tags.saveTag(newTag).then(() => {
        const updatedList = [newTag, ...tags];
        setTags(updatedList);
        logAction(user?.email || 'Admin', `Created tag "${formName}".`);
        showToast(`Tag "${formName}" created successfully`, 'success');
      }).catch(err => {
        showToast('Failed to create tag: ' + err.message, 'warning');
      });
    }

    setIsPanelOpen(false);
  };

  const openDelete = (tag, e) => {
    e.stopPropagation();
    setDeletingTag(tag);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deletingTag) return;
    adminApi.tags.deleteTag(deletingTag.id).then(() => {
      const updatedList = tags.map(t => t.id === deletingTag.id ? { ...t, isDeleted: true } : t);
      setTags(updatedList);
      logAction(user?.email || 'Admin', `Deleted tag "${deletingTag.name}".`);
      showToast(`Tag "${deletingTag.name}" has been deleted`, 'success');
    }).catch(err => {
      showToast('Failed to delete tag: ' + err.message, 'warning');
    });
    setIsDeleteOpen(false);
    setDeletingTag(null);
  };

  // Filter & sort
  let filtered = tags.filter(t => !t.isDeleted);
  if (search) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()));
  }
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(t => t.category === categoryFilter);
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter);
  }

  // Active categories list
  const activeCategories = categories.filter(c => !c.isDeleted);

  return (
    <div className="data-panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Tag Master List</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--ink-3)' }}>Manage event discovery tags, search keywords, and categories.</p>
        </div>
        <div>
          <button className="btn-sm btn-sm-primary" onClick={() => openPanel()}>
            + Add Tag
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-2)', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '300px', flex: 1 }}
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {activeCategories.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select
          className="form-control"
          style={{ maxWidth: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="table-wrapper">
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-3)' }}>
            No tags found. Click "+ Add Tag" to create one.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Usages</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tag, idx) => {
                const parentCat = categories.find(c => c.name === tag.category);
                const isParentInactive = parentCat && parentCat.status === 'inactive';
                return (
                  <tr key={tag.id}>
                    <td className="mono" style={{ fontWeight: '600', textAlign: 'center' }}>{idx + 1}</td>
                    <td>
                      <span style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => openPanel(tag)}>
                        {tag.name}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', opacity: 0.8 }}
                        onClick={() => copySlug(tag.slug)}
                        title="Click to copy"
                      >
                        {tag.slug} 📋
                      </span>
                    </td>
                    <td>
                      <span className="mini-chip" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                        {tag.category} {isParentInactive && <span style={{ color: '#ef4444', fontWeight: '600', fontSize: '10px' }}> (Inactive)</span>}
                      </span>
                    </td>
                    <td>{tag.eventCount || 0} events</td>
                    <td>
                      <label className="switch" style={isParentInactive ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                        <input
                          type="checkbox"
                          checked={tag.status === 'active' && !isParentInactive}
                          disabled={isParentInactive}
                          onChange={(e) => toggleStatus(tag.id, e)}
                        />
                        <span className="slider"></span>
                      </label>
                      {isParentInactive && (
                        <span style={{ display: 'block', fontSize: '10px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                          Category Inactive
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-sm btn-sm-ghost" onClick={() => openPanel(tag)}>Edit</button>
                        <button className="btn-sm btn-sm-danger" onClick={(e) => openDelete(tag, e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD/EDIT SLIDE OVER PANEL --- */}
      {isPanelOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal-card" style={{ maxWidth: '460px', height: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>{editingTag ? 'Edit Tag' : 'Add Tag'}</h3>
              <button onClick={() => setIsPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="form-group">
                <label>Tag Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Web3"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Tag Slug</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="auto-generated"
                  value={editingTag ? formSlug : (formName ? slugify(formName) : '')}
                  disabled={!editingTag}
                  onChange={(e) => setFormSlug(e.target.value)}
                  style={!editingTag ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--surface-2)' } : {}}
                />
              </div>

              <div className="form-group">
                <label>Associated Category</label>
                <select
                  className="form-control"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  {activeCategories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name} {c.status === 'inactive' ? '(Inactive)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {(() => {
                const isFormParentInactive = categories.find(c => c.name === formCategory)?.status === 'inactive';
                const displayStatus = isFormParentInactive ? 'inactive' : formStatus;
                return (
                  <div className="form-group">
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', display: 'block', marginBottom: '6px' }}>Status</label>
                    {isFormParentInactive && (
                      <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', fontSize: '12.5px', color: '#ef4444', marginBottom: '12px', fontWeight: '500' }}>
                        ⚠️ Associated category is inactive. This tag will be automatically disabled.
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={isFormParentInactive}
                        onClick={() => setFormStatus('active')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          height: '38px',
                          borderRadius: '6px',
                          fontSize: '13.5px',
                          fontWeight: '500',
                          cursor: isFormParentInactive ? 'not-allowed' : 'pointer',
                          opacity: isFormParentInactive ? 0.5 : 1,
                          border: displayStatus === 'active' ? '1.5px solid #10b981' : '1px solid var(--border)',
                          background: displayStatus === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                          color: displayStatus === 'active' ? '#10b981' : 'var(--ink-3)',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          border: displayStatus === 'active' ? '2.5px solid #10b981' : '1.5px solid var(--ink-3)',
                          background: displayStatus === 'active' ? '#10b981' : 'transparent',
                          boxShadow: displayStatus === 'active' ? 'inset 0 0 0 2px var(--surface)' : 'none',
                          boxSizing: 'border-box'
                        }} />
                        Active
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormStatus('inactive')}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          height: '38px',
                          borderRadius: '6px',
                          fontSize: '13.5px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          border: displayStatus === 'inactive' ? '1.5px solid #ef4444' : '1px solid var(--border)',
                          background: displayStatus === 'inactive' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                          color: displayStatus === 'inactive' ? '#ef4444' : 'var(--ink-3)',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          border: displayStatus === 'inactive' ? '2.5px solid #ef4444' : '1.5px solid var(--ink-3)',
                          background: displayStatus === 'inactive' ? '#ef4444' : 'transparent',
                          boxShadow: displayStatus === 'inactive' ? 'inset 0 0 0 2px var(--surface)' : 'none',
                          boxSizing: 'border-box'
                        }} />
                        Inactive
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn-sm btn-sm-ghost" onClick={() => setIsPanelOpen(false)}>Cancel</button>
              <button className="btn-sm btn-sm-primary" onClick={handleSave}>Save Tag</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE DIALOG --- */}
      {isDeleteOpen && deletingTag && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', color: '#ff6b4a' }}>⚠️</span>
              <h3 style={{ margin: '8px 0 0 0' }}>Delete Tag "{deletingTag.name}"?</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-2)', textAlign: 'center', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              This tag has been used in <strong>{deletingTag.eventCount || 0}</strong> events. Deleting it will remove it from discovery search queries.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-sm btn-sm-danger" style={{ justifyContent: 'center' }} onClick={handleDelete}>
                Delete Tag permanently
              </button>
              <button className="btn-sm btn-sm-ghost" style={{ justifyContent: 'center' }} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- CATEGORIES VIEW ---
export function CategoriesView({ categories, setCategories, tags, setTags, showToast, logAction, user }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCats, setExpandedCats] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingToggles, setLoadingToggles] = useState({});

  // SlideOver Form State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIcon, setFormIcon] = useState('💻');
  const [formOrder, setFormOrder] = useState(1);
  const [formStatus, setFormStatus] = useState('active');

  // Icon Picker tab state
  const [activeIconTab, setActiveIconTab] = useState('emoji');
  const [librarySearch, setLibrarySearch] = useState('');
  const [isTranslationsOpen, setIsTranslationsOpen] = useState(false);

  // Hindi, Marathi, Tamil translations inputs
  const [transHindi, setTransHindi] = useState('');
  const [transMarathi, setTransMarathi] = useState('');
  const [transTamil, setTransTamil] = useState('');

  // Delete Dialog State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCat, setDeletingCat] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = categories.findIndex(c => c.id === draggedId);
    const targetIndex = categories.findIndex(c => c.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newList = [...categories];
    const [draggedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, draggedItem);

    const updatedList = newList.map((c, index) => ({
      ...c,
      displayOrder: index + 1
    }));

    setCategories(updatedList);
    if (adminApi.activeProviders.categories === 'database') {
      await Promise.all(updatedList.map(cat => adminApi.categories.saveCategory({ displayOrder: cat.displayOrder }, cat.id)));
    } else {
      adminApi._setLocalState('categories', updatedList);
    }
    logAction(user?.email || 'Admin', `Reordered category "${draggedItem.name}" to position ${targetIndex + 1}.`);
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  // Simple uuid generator
  const uuid = () => 'cat-' + Math.random().toString(36).substr(2, 9);

  // Simple slugify helper
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const getSubcategories = (catId) => {
    return [];
  };

  const toggleExpand = (id) => {
    const next = new Set(expandedCats);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedCats(next);
  };

  const copySlug = (slug) => {
    navigator.clipboard.writeText(slug).then(() => {
      showToast(`Slug "${slug}" copied to clipboard`, 'info');
    }).catch(() => {
      showToast(`Slug: ${slug}`, 'info');
    });
  };

  const toggleStatus = async (id, e) => {
    e.stopPropagation();
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    setLoadingToggles(prev => ({ ...prev, [id]: true }));

    const oldStatus = cat.status;
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';

    try {
      const res = await adminApi.categories.saveCategory({ status: nextStatus }, id);
      if (res && res.success) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
        logAction(user?.email || 'Admin', `Updated category ${cat.name} status from ${oldStatus} to ${nextStatus}`);
        showToast(`${cat.name} is now ${nextStatus}`, 'success');

        const updatedList = categories.map(c => c.id === id ? { ...c, status: nextStatus } : c);
        localStorage.setItem('samaagum_admin_categories', JSON.stringify(updatedList));
        if (nextStatus === 'inactive' && tags && setTags) {
          const updatedTags = tags.map(t => t.category === cat.name ? { ...t, status: 'inactive' } : t);
          setTags(updatedTags);
          localStorage.setItem('samaagum_admin_tags', JSON.stringify(updatedTags));
          logAction('System', `Disabled all child tags under inactive category "${cat.name}".`);
        }
      } else {
        showToast("Failed to update status in database", "warning");
      }
    } catch (err) {
      showToast("Error updating category: " + err.message, "danger");
    } finally {
      setLoadingToggles(prev => ({ ...prev, [id]: false }));
    }
  };

  const openPanel = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormName(cat.name);
      setFormSlug(cat.slug);
      setFormDesc(cat.description || '');
      setFormIcon(cat.iconValue || '💻');
      setFormOrder(cat.displayOrder || 1);
      setFormStatus(cat.status || 'active');
      const isImg = typeof cat.iconValue === 'string' && (cat.iconValue.startsWith('data:image/') || cat.iconValue.startsWith('http'));
      setActiveIconTab(isImg ? 'upload' : 'emoji');
    } else {
      setEditingCategory(null);
      setFormName('');
      setFormSlug('');
      setFormDesc('');
      setFormIcon('💻');
      setFormOrder(categories.filter(c => !c.isDeleted).length + 1);
      setFormStatus('active');
      setActiveIconTab('emoji');
    }
    setIsTranslationsOpen(false);
    setTransHindi('');
    setTransMarathi('');
    setTransTamil('');
    setIsPanelOpen(true);
  };

  const handleNameChange = (val) => {
    setFormName(val);
    if (!editingCategory) {
      setFormSlug(slugify(val));
    }
  };

  const normalizeOrders = (list) => {
    const nonDeleted = list.filter(c => !c.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder);
    const deleted = list.filter(c => c.isDeleted);
    const updatedNonDeleted = nonDeleted.map((c, idx) => ({
      ...c,
      displayOrder: idx + 1
    }));
    return [...updatedNonDeleted, ...deleted];
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }
    const slug = editingCategory ? (formSlug.trim() || slugify(formName)) : slugify(formName);

    let updatedList;
    if (editingCategory) {
      const newVal = {
        name: formName,
        slug,
        description: formDesc,
        iconValue: formIcon,
        displayOrder: Number(formOrder),
        status: formStatus,
      };

      const saveRes = await adminApi.categories.saveCategory(newVal, editingCategory.id);
      if (!saveRes.success) {
        showToast(`Failed to save category: ${saveRes.message || 'Unknown error'}`, 'warning');
        return;
      }

      const savedCategory = saveRes.data ? { ...editingCategory, ...saveRes.data } : { ...editingCategory, ...newVal };
      const targetOrder = Number(formOrder);
      let listWithoutSelf = categories.filter(c => c.id !== editingCategory.id && !c.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder);
      const insertIndex = Math.max(0, Math.min(listWithoutSelf.length, targetOrder - 1));
      listWithoutSelf.splice(insertIndex, 0, savedCategory);

      if (formStatus === 'inactive' && editingCategory.status === 'active' && tags && setTags) {
        const updatedTags = tags.map(t => t.category === editingCategory.name ? { ...t, status: 'inactive' } : t);
        setTags(updatedTags);
        localStorage.setItem('samaagum_admin_tags', JSON.stringify(updatedTags));
        logAction('System', `Disabled child tags under inactive category "${editingCategory.name}".`);
      }

      if (editingCategory.name !== formName && tags && setTags) {
        const updatedTags = tags.map(t => t.category === editingCategory.name ? { ...t, category: formName } : t);
        setTags(updatedTags);
        localStorage.setItem('samaagum_admin_tags', JSON.stringify(updatedTags));
        logAction('System', `Updated child tags category association from "${editingCategory.name}" to "${formName}".`);
      }

      updatedList = normalizeOrders([...listWithoutSelf, ...categories.filter(c => c.isDeleted)]);
      setCategories(updatedList);
      logAction(user?.email || 'Admin', `Updated category "${formName}" details and normalized display order.`);
      showToast(`Category "${formName}" updated successfully`, 'success');
    } else {
      const newCat = {
        id: uuid(),
        name: formName,
        slug,
        description: formDesc,
        iconType: 'emoji',
        iconValue: formIcon,
        displayOrder: Number(formOrder),
        status: formStatus,
        subcategoryCount: 0,
        eventCount: 0,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      const saveRes = await adminApi.categories.saveCategory(newCat);
      if (!saveRes.success) {
        showToast(`Failed to save category: ${saveRes.message || 'Unknown error'}`, 'warning');
        return;
      }

      const savedCategory = saveRes.data ? { ...newCat, ...saveRes.data } : newCat;
      const targetOrder = Number(formOrder);
      let listWithoutSelf = categories.filter(c => !c.isDeleted).sort((a, b) => a.displayOrder - b.displayOrder);
      const insertIndex = Math.max(0, Math.min(listWithoutSelf.length, targetOrder - 1));
      listWithoutSelf.splice(insertIndex, 0, savedCategory);

      updatedList = normalizeOrders([...listWithoutSelf, ...categories.filter(c => c.isDeleted)]);
      setCategories(updatedList);
      logAction(user?.email || 'Admin', `Created category "${formName}" and normalized display order.`);
      showToast(`Category "${formName}" created successfully`, 'success');
    }

    localStorage.setItem('samaagum_admin_categories', JSON.stringify(updatedList));
    setIsPanelOpen(false);
  };

  const openDelete = (cat, e) => {
    e.stopPropagation();
    setDeletingCat(cat);
    setIsDeleteOpen(true);
  };

  const handleArchive = async () => {
    if (!deletingCat) return;
    const oldStatus = deletingCat.status;
    const updatedList = categories.map(c => c.id === deletingCat.id ? { ...c, status: 'inactive' } : c);

    const normalized = normalizeOrders(updatedList);
    setCategories(normalized);
    if (adminApi.activeProviders.categories === 'database') {
      await adminApi.categories.saveCategory({ status: 'inactive' }, deletingCat.id);
    } else {
      adminApi._setLocalState('categories', normalized);
    }
    logAction(user?.email || 'Admin', `Archived category "${deletingCat.name}".`);
    showToast(`"${deletingCat.name}" has been archived`, 'warning');
    setIsDeleteOpen(false);
    setDeletingCat(null);
  };

  const handleDelete = async () => {
    if (!deletingCat) return;
    const updatedList = categories.map(c => c.id === deletingCat.id ? { ...c, isDeleted: true } : c);

    const normalized = normalizeOrders(updatedList);
    setCategories(normalized);
    if (adminApi.activeProviders.categories === 'database') {
      await adminApi.categories.saveCategory({ isDeleted: true }, deletingCat.id);
    } else {
      adminApi._setLocalState('categories', normalized);
    }
    logAction(user?.email || 'Admin', `Deleted category "${deletingCat.name}".`);
    showToast(`"${deletingCat.name}" has been deleted`, 'success');
    setIsDeleteOpen(false);
    setDeletingCat(null);
  };

  // Filter & sort
  let filtered = categories.filter(c => !c.isDeleted);
  if (search) {
    filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()));
  }
  if (statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === statusFilter);
  }
  filtered.sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="data-panel">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Category Master List</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--ink-3)' }}>Manage event categories, display orders, and icons.</p>
        </div>
        <div>
          <button className="btn-sm btn-sm-primary" onClick={() => openPanel()}>
            + Add Category
          </button>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-2)' }}>
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: '300px', flex: 1 }}
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="table-wrapper">
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ink-3)' }}>
            No categories found. Click "+ Add Category" to create one.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th style={{ width: '60px' }}>Icon</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Events</th>
                <th>Status</th>
                <th>Order</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cat => {
                const isToggleLoading = !!loadingToggles[cat.id];
                return (
                  <tr
                    key={cat.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cat.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, cat.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      opacity: draggedId === cat.id ? 0.4 : 1,
                      cursor: 'grab',
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <td style={{ width: '40px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <div style={{ color: 'var(--ink-3)', opacity: 0.5, fontSize: '18px', userSelect: 'none', cursor: 'grab' }} title="Drag to reorder">
                        ⠿
                      </div>
                    </td>
                    <td>
                      <div
                        style={{ fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'var(--surface-2)', borderRadius: '6px' }}
                        onClick={() => openPanel(cat)}
                      >
                        {typeof cat.iconValue === 'string' && (cat.iconValue.startsWith('data:image/') || cat.iconValue.startsWith('http')) ? (
                          <img src={cat.iconValue} style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '4px' }} />
                        ) : (
                          cat.iconValue
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600', cursor: 'pointer' }} onClick={() => openPanel(cat)}>
                        {cat.name}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ cursor: 'pointer', opacity: 0.8 }}
                        onClick={() => copySlug(cat.slug)}
                        title="Click to copy"
                      >
                        {cat.slug} 📋
                      </span>
                    </td>
                    <td>{cat.eventCount || 0}</td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={cat.status === 'active'}
                          onChange={(e) => toggleStatus(cat.id, e)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                    <td>{cat.displayOrder}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-sm btn-sm-ghost" onClick={() => openPanel(cat)}>Edit</button>
                        <button className="btn-sm btn-sm-danger" onClick={(e) => openDelete(cat, e)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* --- ADD/EDIT SLIDE OVER PANEL --- */}
      {isPanelOpen && (
        <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal-card" style={{ maxWidth: '460px', height: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => setIsPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>

            <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Technology"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Category Slug</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="auto-generated"
                  value={editingCategory ? formSlug : (formName ? slugify(formName) : '')}
                  disabled={!editingCategory}
                  onChange={(e) => setFormSlug(e.target.value)}
                  style={!editingCategory ? { opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--surface-2)' } : {}}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-control"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="Describe this category..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', display: 'block', marginBottom: '6px' }}>Display Order</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formOrder}
                    onChange={(e) => setFormOrder(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', display: 'block', marginBottom: '6px' }}>Status</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setFormStatus('active')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        height: '38px',
                        borderRadius: '6px',
                        fontSize: '13.5px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        border: formStatus === 'active' ? '1.5px solid #10b981' : '1px solid var(--border)',
                        background: formStatus === 'active' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                        color: formStatus === 'active' ? '#10b981' : 'var(--ink-3)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: formStatus === 'active' ? '2.5px solid #10b981' : '1.5px solid var(--ink-3)',
                        background: formStatus === 'active' ? '#10b981' : 'transparent',
                        boxShadow: formStatus === 'active' ? 'inset 0 0 0 2px var(--surface)' : 'none',
                        boxSizing: 'border-box'
                      }} />
                      Active
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormStatus('inactive')}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        height: '38px',
                        borderRadius: '6px',
                        fontSize: '13.5px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        border: formStatus === 'inactive' ? '1.5px solid #ef4444' : '1px solid var(--border)',
                        background: formStatus === 'inactive' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                        color: formStatus === 'inactive' ? '#ef4444' : 'var(--ink-3)',
                        transition: 'all 0.15s'
                      }}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        border: formStatus === 'inactive' ? '2.5px solid #ef4444' : '1.5px solid var(--ink-3)',
                        background: formStatus === 'inactive' ? '#ef4444' : 'transparent',
                        boxShadow: formStatus === 'inactive' ? 'inset 0 0 0 2px var(--surface)' : 'none',
                        boxSizing: 'border-box'
                      }} />
                      Inactive
                    </button>
                  </div>
                </div>
              </div>

              {/* Icon Picker section */}
              <div className="form-group">
                <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-3)', display: 'block', marginBottom: '8px' }}>Icon</label>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-2)', padding: '4px', borderRadius: '8px', marginBottom: '12px', width: 'fit-content' }}>
                  <button
                    type="button"
                    onClick={() => setActiveIconTab('emoji')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: activeIconTab === 'emoji' ? 'var(--accent-soft)' : 'transparent',
                      color: activeIconTab === 'emoji' ? 'var(--accent-2)' : 'var(--ink-3)',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>🤪</span> Emoji
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIconTab('upload')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: activeIconTab === 'upload' ? 'var(--accent-soft)' : 'transparent',
                      color: activeIconTab === 'upload' ? 'var(--accent-2)' : 'var(--ink-3)',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span>📤</span> Upload
                  </button>
                </div>

                {/* Tab Contents */}
                {activeIconTab === 'emoji' ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'var(--surface-2)', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {Object.entries(EMOJI_SETS).map(([group, emojis]) => (
                      <div key={group} style={{ width: '100%' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ink-3)', margin: '4px 0' }}>{group}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {emojis.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setFormIcon(emoji)}
                              style={{
                                fontSize: '20px',
                                padding: '6px',
                                background: formIcon === emoji ? 'var(--accent-2)' : 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--surface-2)', borderRadius: '6px', border: '1px dashed var(--border)', minHeight: '120px' }}>
                    {typeof formIcon === 'string' && (formIcon.startsWith('data:image/') || formIcon.startsWith('http')) ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '56px', height: '56px', background: 'var(--surface)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-2)', boxShadow: 'var(--sh-md)' }}>
                          <img src={formIcon} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--ink-2)' }}>Custom Icon Loaded</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label className="btn-sm btn-sm-ghost" style={{ cursor: 'pointer', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                            Replace Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setFormIcon(reader.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="btn-sm btn-sm-ghost"
                            style={{ color: '#ef4444', border: '1px solid var(--border)', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}
                            onClick={() => setFormIcon('💻')}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '32px', color: 'var(--ink-3)' }}>📁</div>
                        <label className="btn-sm btn-sm-primary" style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                          Upload Image
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormIcon(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>PNG, JPG or SVG up to 2MB</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn-sm btn-sm-ghost" onClick={() => setIsPanelOpen(false)}>Cancel</button>
              <button className="btn-sm btn-sm-primary" onClick={handleSave}>Save Category</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM ARCHIVE/DELETE DIALOG --- */}
      {isDeleteOpen && deletingCat && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px', padding: '24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '36px', color: '#ff6b4a' }}>⚠️</span>
              <h3 style={{ margin: '8px 0 0 0' }}>Delete "{deletingCat.name}"?</h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--ink-2)', textAlign: 'center', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              This category has <strong>{deletingCat.subcategoryCount || 0}</strong> subcategories and <strong>{deletingCat.eventCount || 0}</strong> events. Consider archiving instead.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-sm btn-sm-primary" style={{ background: '#f59e0b', justifyContent: 'center' }} onClick={handleArchive}>
                Archive Instead (Mark Inactive)
              </button>
              <button className="btn-sm btn-sm-danger" style={{ justifyContent: 'center' }} onClick={handleDelete}>
                Delete Category permanently
              </button>
              <button className="btn-sm btn-sm-ghost" style={{ justifyContent: 'center' }} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BILLING & REVENUE VIEW ──────────────────────────────────────────────────
export function BillingDashboardView({ apiBase }) {
  const [data, setData] = useState({
    metrics: { totalRevenue: 0, totalOrders: 0, activeSubscriptions: 0, inactiveSubscriptions: 0 },
    plansBreakdown: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/admin/billing/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (err) {
      console.error("Error loading billing summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadInvoice = async (orderId, orderNumber) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/subscription/orders/${orderId}/invoice`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        alert("Failed to download invoice");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Error downloading invoice: " + err.message);
    }
  };

  const filteredTransactions = data.transactions.filter(t => {
    const matchesSearch = 
      t.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.planName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && t.subscriptionStatus === "active";
    if (statusFilter === "inactive") return matchesSearch && t.subscriptionStatus === "inactive";
    if (statusFilter === "failed") return matchesSearch && t.paymentStatus === "failed";
    return matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <div style={{ color: "var(--ink-2)", fontSize: "16px" }}>Loading Billing Ledger & Metrics...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: "600", fontSize: "24px", margin: "0 0 4px 0" }}>
            Billing &amp; Revenue Operations
          </h2>
          <p style={{ color: "var(--ink-2)", margin: 0, fontSize: "14px" }}>
            Monitor subscription revenue, active license distributions, and invoices.
          </p>
        </div>
        <button onClick={load} className="btn-sm btn-sm-ghost" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          🔄 Refresh Ledger
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="header">
            <span>Total Gross Revenue</span>
            <Icons.credit style={{ color: "var(--accent-1)" }} />
          </div>
          <div className="value">₹{data.metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="trend" style={{ color: "#10b981", fontWeight: "600" }}>
            ✓ Fully Cleared &amp; Settled
          </div>
        </div>

        <div className="stat-card">
          <div className="header">
            <span>Active Paid Licenses</span>
            <Icons.users style={{ color: "var(--accent-2)" }} />
          </div>
          <div className="value">{data.metrics.activeSubscriptions}</div>
          <div className="trend" style={{ color: "var(--accent-2)", fontWeight: "600" }}>
            ⚡ Real-Time User sessions
          </div>
        </div>

        <div className="stat-card">
          <div className="header">
            <span>Inactive/Expired accounts</span>
            <Icons.alert style={{ color: "#ef4444" }} />
          </div>
          <div className="value">{data.metrics.inactiveSubscriptions}</div>
          <div className="trend" style={{ color: "var(--ink-3)", fontWeight: "600" }}>
            Churned or downgraded users
          </div>
        </div>

        <div className="stat-card">
          <div className="header">
            <span>Total Invoice Orders</span>
            <Icons.doc style={{ color: "#10b981" }} />
          </div>
          <div className="value">{data.metrics.totalOrders}</div>
          <div className="trend" style={{ color: "#10b981", fontWeight: "600" }}>
            🧾 Lifetime transactions
          </div>
        </div>
      </div>

      {/* Plans breakdown progress bars */}
      <div className="data-panel" style={{ marginBottom: "24px", padding: "24px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "600" }}>Subscription Tier Breakdown</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
          {data.plansBreakdown.length === 0 ? (
            <div style={{ color: "var(--ink-3)", fontSize: "14px" }}>No active subscriptions to display breakdown.</div>
          ) : (
            data.plansBreakdown.map(p => {
              const totalActive = data.metrics.activeSubscriptions || 1;
              const percentage = Math.round((p.activeCount / totalActive) * 100);
              return (
                <div key={p.planId} style={{ background: "var(--surface-2)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "600", fontSize: "14px" }}>{p.displayName}</span>
                    <span style={{ fontSize: "12px", color: "var(--ink-2)" }}>{p.activeCount} active ({percentage}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface-3)", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ width: `${percentage}%`, height: "100%", background: "linear-gradient(90deg, var(--accent-1), var(--accent-2))", borderRadius: "4px" }}></div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                    Revenue Contribution: <b style={{ color: "var(--ink)" }}>₹{p.revenue.toLocaleString('en-IN')}</b>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Transaction List Panel */}
      <div className="data-panel" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Transaction Ledger &amp; Invoices</h3>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search order #, email, name..."
              className="form-control"
              style={{ width: "220px", fontSize: "13px", padding: "6px 12px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <select
              className="form-control"
              style={{ width: "160px", fontSize: "13px", padding: "6px 12px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active Plans</option>
              <option value="inactive">Inactive Plans</option>
              <option value="failed">Failed Payments</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>User / Email</th>
                <th>Plan Name</th>
                <th>Billing Cycle</th>
                <th>Revenue (Gross)</th>
                <th>Payment</th>
                <th>Subscription</th>
                <th>Date Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--ink-3)" }}>
                    No matching billing records found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: "600" }}>{t.orderNumber}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: "600", display: "block" }}>{t.userName}</span>
                        <span style={{ fontSize: "11px", color: "var(--ink-3)" }}>{t.userEmail}</span>
                      </div>
                    </td>
                    <td><span className="badge" style={{ background: "var(--surface-3)", color: "var(--ink)" }}>{t.planName}</span></td>
                    <td style={{ textTransform: "capitalize" }}>{t.planType}</td>
                    <td style={{ fontWeight: "600" }}>
                      ₹{t.total.toFixed(2)}
                      {t.taxTotal > 0 && (
                        <span style={{ display: "block", fontSize: "10px", color: "var(--ink-3)", fontWeight: "normal" }}>
                          Incl. ₹{t.taxTotal.toFixed(2)} GST
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge-status ${t.paymentStatus === 'completed' ? 'active' : t.paymentStatus === 'failed' ? 'inactive' : 'pending'}`}>
                        {t.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-status ${t.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
                        {t.subscriptionStatus}
                      </span>
                    </td>
                    <td>{t.completedAt ? new Date(t.completedAt).toLocaleDateString('en-IN') : 'Pending'}</td>
                    <td>
                      {t.paymentStatus === 'completed' ? (
                        <button
                          onClick={() => downloadInvoice(t.id, t.orderNumber)}
                          className="btn-sm btn-sm-ghost"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px" }}
                        >
                          📄 Download Invoice
                        </button>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}

