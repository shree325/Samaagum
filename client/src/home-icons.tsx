/* ============================================================
   Samaagum Home — icons, logo, avatar helpers
   Exports to window for use across view files.
   ============================================================ */
const { useState, useRef, useEffect, useCallback, useMemo, Fragment } = React;

/* ---------------- Icons (stroke 1.8, 24 grid) ---------------- */
const I = {
  home:    (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  compass: (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.8"/><path d="M15.5 8.5l-2.2 4.8L8.5 15.5l2.2-4.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  ticket:  (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 000 4 2 2 0 01-2 2H6a2 2 0 01-2-2 2 2 0 000-4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 6.5v11" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.6 2.4" strokeLinecap="round"/></svg>,
  groups:  (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><circle cx="9" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 19c.6-3 3-4.5 5.5-4.5s4.9 1.5 5.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 7.2a2.8 2.8 0 010 5.4M18 19c-.2-1.6-.9-2.9-1.9-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  chat:    (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3.5V16H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  bell:    (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M6 9a6 6 0 0112 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  user:    (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.8"/><path d="M5 19.5c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  search:  (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><circle cx="11" cy="11" r="6.3" stroke="currentColor" strokeWidth="1.9"/><path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"/></svg>,
  pin:     (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M12 21c4-4.5 7-8 7-11a7 7 0 10-14 0c0 3 3 6.5 7 11z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8"/></svg>,
  cal:     (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  clock:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  users:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.8 18c.5-2.6 2.6-4 5.2-4s4.7 1.4 5.2 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 6.4a2.6 2.6 0 010 5M18.5 18c-.2-1.5-.8-2.7-1.7-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  plus:    (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  arrowR:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowL:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M19 12H6M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevR:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevD:   (p) => <svg viewBox="0 0 24 24" fill="none" width="14" height="14" {...p}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  heart:   (p) => <svg viewBox="0 0 24 24" fill="none" width="17" height="17" {...p}><path d="M12 20s-7-4.3-7-9.2A4 4 0 0112 8a4 4 0 017 2.8C19 15.7 12 20 12 20z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  heartF:  (p) => <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" {...p}><path d="M12 20s-7-4.3-7-9.2A4 4 0 0112 8a4 4 0 017 2.8C19 15.7 12 20 12 20z"/></svg>,
  bookmark:(p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M6 4h12v16l-6-4-6 4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  bookmarkF:(p)=> <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...p}><path d="M6 4h12v16l-6-4-6 4z"/></svg>,
  share:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.8"/><path d="M8.2 11l6.6-3.6M8.2 13l6.6 3.6" stroke="currentColor" strokeWidth="1.8"/></svg>,
  check:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x:       (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  msg:     (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3.5V16H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  comment: (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9l-4 3.5V16H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  send:    (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><path d="M4 12l16-7-7 16-2.5-6.5L4 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/></svg>,
  globe:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.7 12h16.6M12 3.7c2.2 2.2 3.3 5 3.3 8.3S14.2 18.1 12 20.3c-2.2-2.2-3.3-5-3.3-8.3S9.8 5.9 12 3.7z" stroke="currentColor" strokeWidth="1.8"/></svg>,
  spark:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" {...p}><path d="M12 2l1.7 6.1L20 10l-6.3 1.9L12 18l-1.7-6.1L4 10l6.3-1.9z"/></svg>,
  fire:    (p) => <svg viewBox="0 0 24 24" fill="none" width="15" height="15" {...p}><path d="M12 3c1 3-1.5 4.5-1.5 6.5 0 1 .7 1.8 1.5 1.8s1.4-.6 1.4-1.6c1.6 1 2.6 2.8 2.6 4.8a6 6 0 11-12 0c0-3.4 2.6-5.6 4-7.5C9.7 5 11 4 12 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  grid:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>,
  image:   (p) => <svg viewBox="0 0 24 24" fill="none" width="17" height="17" {...p}><rect x="4" y="5" width="16" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7"/><circle cx="9" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.5"/><path d="M5 17l4.5-4 3 2.5L16 11l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  qr:      (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7"/><rect x="4" y="14" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.7"/><path d="M14 14h2v2M20 14v6M14 20h6M18 17v.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>,
  scan:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  download:(p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  link:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M9 15l6-6M8 9l-2 2a3.5 3.5 0 005 5l2-2M16 15l2-2a3.5 3.5 0 00-5-5l-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  mail:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  wallet:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/><path d="M22 13h-4v2h4v-2zM4 7V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  edit:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M5 19h14M7 15l9-9 3 3-9 9H7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  filter:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  crown:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" {...p}><path d="M3 8l3.5 3L12 5l5.5 6L21 8l-1.5 9h-15L3 8z"/></svg>,
  external:(p) => <svg viewBox="0 0 24 24" fill="none" width="14" height="14" {...p}><path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  more:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" {...p}><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>,
  moreV:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" {...p}><circle cx="12" cy="6" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="18" r="1.7"/></svg>,
  reply:   (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v.5"/></svg>,
  react:   (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  copy:    (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  forward: (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>,
  unsend:  (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
  phone:   (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="7" y="3" width="10" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8"/><path d="M11 18h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  online:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="3" y="5" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 20h8M12 16v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  trophy:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M7 4h10v4a5 5 0 01-10 0V4zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 14h6M10 18h4M9 20h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sun:     (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  moon:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M20 13a8 8 0 11-9-9 6 6 0 009 9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  google:  (p) => <svg viewBox="0 0 24 24" width="18" height="18" {...p}><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C17.1 2.6 14.8 1.6 12 1.6 6.7 1.6 2.4 5.9 2.4 12s4.3 10.4 9.6 10.4c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/></svg>,
  lock:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  eyeOff:  (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  lock:    (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M12 17v-2M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
};

/* brand icons (filled tiles) */
const Brand = {
  instagram: <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="#fff" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.8"/><circle cx="17" cy="7" r="1.2" fill="#fff"/></svg>,
  twitter:   <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff"><path d="M18.2 3h3.3l-7.2 8.3L22.8 21h-6.6l-5.2-6.8L5.1 21H1.8l7.7-8.8L1.5 3h6.8l4.7 6.2L18.2 3zm-1.2 16h1.8L7.1 4.8H5.2L17 19z"/></svg>,
  linkedin:  <svg viewBox="0 0 24 24" width="19" height="19" fill="#fff"><path d="M4.5 3.5a2 2 0 100 4 2 2 0 000-4zM3 9h3v11H3zM9 9h2.9v1.5h.04c.4-.76 1.4-1.56 2.86-1.56 3.06 0 3.62 2 3.62 4.6V20H18.5v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.58V20H12V9z"/></svg>,
  github:    <svg viewBox="0 0 24 24" width="19" height="19" fill="#fff"><path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z"/></svg>,
  dribbble:  <svg viewBox="0 0 24 24" width="19" height="19" fill="none"><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="1.8"/><path d="M5 8c4 1 9 1 13-1M3.5 13c5-1.5 9 0 11 4M9 4c3 3.5 5 8 5.5 16" stroke="#fff" strokeWidth="1.6"/></svg>,
  website:   <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><circle cx="12" cy="12" r="8.3" stroke="#fff" strokeWidth="1.8"/><path d="M3.7 12h16.6M12 3.7c2.2 2.2 3.3 5 3.3 8.3S14.2 18.1 12 20.3c-2.2-2.2-3.3-5-3.3-8.3S9.8 5.9 12 3.7z" stroke="#fff" strokeWidth="1.8"/></svg>,
};

/* ---------------- Logo mark ---------------- */
function Mark({ size = 28 }) {
  const id = "mk" + Math.round(size * 10);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--accent-1)"/><stop offset="1" stopColor="var(--accent-2)"/>
      </linearGradient></defs>
      <circle cx="15" cy="16" r="9.2" fill={`url(#${id})`} opacity="0.92"/>
      <circle cx="25" cy="16" r="9.2" fill={`url(#${id})`} opacity="0.6"/>
      <circle cx="20" cy="25" r="9.2" fill={`url(#${id})`} opacity="0.8"/>
    </svg>
  );
}
function Wordmark({ size = 20, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <Mark size={size * 1.3} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: size, letterSpacing: "-0.02em", color }}>samaagum</span>
    </span>
  );
}

/* ---------------- Avatar ---------------- */
function gradFor(seed) {
  const seedStr = typeof seed === 'string' ? seed : (seed ? String(seed) : "");
  let h = 0; for (let i = 0; i < seedStr.length; i++) h = seedStr.charCodeAt(i) + ((h << 5) - h);
  const a = Math.abs(h) % 360, b = (a + 38) % 360;
  return `linear-gradient(135deg, hsl(${a} 68% 60%), hsl(${b} 70% 50%))`;
}
function initials(name) {
  const nameStr = typeof name === 'string' ? name : (name ? String(name) : "");
  return nameStr.split(" ").map(w => w ? w[0] : "").join("").slice(0, 2).toUpperCase();
}
function Avatar({ name, size = 40, img, className = "", style = {} }) {
  return (
    <div className={`avatar av ${className}`} style={{
      width: size, height: size, fontSize: size * 0.36,
      background: img ? `url("${img}") center / cover no-repeat` : gradFor(name), ...style,
    }}>{!img && initials(name)}</div>
  );
}

/* grain layer helper */
function Grain() { return <span className="cv-grain" />; }

/* QR placeholder (deterministic) */
function QRCode({ seed = "samaagum", size = 76 }) {
  const cells = useMemo(() => {
    let h = 0; for (let i = 0; i < seed.length; i++) h = (seed.charCodeAt(i) * 31 + h * 17) >>> 0;
    const n = 11, out = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const corner = (x < 3 && y < 3) || (x > n-4 && y < 3) || (x < 3 && y > n-4);
      out.push({ x, y, on: corner ? ((x===0||x===n-1||x===n-4||y===0||y===n-1||y===n-4||(x>=1&&x<=1&&false)) ? false : ((x+y)%1===0)) : (h % 100 > 52) });
    }
    return out;
  }, [seed]);
  const n = 11, c = size / n;
  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      {cells.map((cell, i) => cell.on && <rect key={i} x={cell.x*c} y={cell.y*c} width={c*0.92} height={c*0.92} rx={c*0.18} fill="var(--ink)" />)}
      {[[0,0],[n-3,0],[0,n-3]].map(([fx,fy],i)=>(
        <Fragment key={"f"+i}>
          <rect x={fx*c} y={fy*c} width={c*3} height={c*3} rx={c*0.5} fill="none" stroke="var(--ink)" strokeWidth={c*0.45}/>
          <rect x={(fx+1)*c} y={(fy+1)*c} width={c} height={c} rx={c*0.3} fill="var(--accent-2)"/>
        </Fragment>
      ))}
    </svg>
  );
}

Object.assign(window, { I, Brand, Mark, Wordmark, Avatar, Grain, QRCode, gradFor, initials });
