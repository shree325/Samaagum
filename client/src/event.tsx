import React, { useState, useRef, useEffect } from 'react';
import { I, Avatar } from './home-icons';
import { EventDashboard } from './event-dashboard';
import DiscussionPanel from './discussion-panel';
import { isRealEventId, normalizeEventData, getQuestionLabel } from './event-utils';
import { EventRolesModal } from './EventRolesModal';
import { EventMemberResponseModal } from './EventMemberResponseModal';
import { EventSidebar } from './EventSidebar';
import { EventInviteTab } from './EventInviteTab';
import { EventAboutTab } from './EventAboutTab';
import { EventSettingsTab } from './EventSettingsTab';
import { EventHeaderSection } from './EventHeaderSection';
import { EventMembersTab } from './EventMembersTab';
import { EventGalleryTab } from './EventGalleryTab';
import { EventTicketingTab } from './EventTicketingTab';

// Mock featured event structure if no ev is provided
const FEATURED: any = {
  id: "ev-feat",
  title: "Featured Gatherings",
  cover: "",
  cat: "General",
  registration_mode: "free",
  location_type: "online",
  attendees: []
};

// Dummy context user for fallback purposes
const ME = (window as any).ME || { name: "User", id: "me-id", role: "admin" };

export function EventPage({ ev, st, go }: { ev: any; st: any; go: (view: string, params?: any) => void }) {
  let initialNormalized = ev || FEATURED;
  if (initialNormalized && (initialNormalized.starts_at || typeof initialNormalized.venue === 'object' || typeof initialNormalized.venue === 'string')) {
    initialNormalized = normalizeEventData(initialNormalized, ME, st.city);
  } else if (initialNormalized && typeof initialNormalized.venue === 'object' && initialNormalized.venue !== null) {
    initialNormalized = {
      ...initialNormalized,
      venue: initialNormalized.venue.name || initialNormalized.venue.address || 'Venue TBD',
      gallery: initialNormalized.venue.meta?.gallery || {
import { OnlineMeetingCard } from './OnlineMeetingCard';

function Toggle({ on, onClick }) { return <button type="button" className={`tg ${on ? "on" : ""}`} onClick={onClick} />; }

// Demo/placeholder events (e.g. FEATURED, id "ev-feat") aren't real DB rows —
// their id isn't a UUID, so backend calls with it 500. Treat any non-UUID id
// like the "new" preview mode instead of hitting the API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isRealEventId(id) { return typeof id === "string" && UUID_RE.test(id); }

export function EventPage({ ev, st, go }) {
  let e = ev || FEATURED;
  const claimToken = typeof window !== 'undefined' ? (window.location.hash.split('claim=')[1]?.split('&')[0] || new URLSearchParams(window.location.search).get("claim") || e.inviteToken) : null;

  // Normalize if it's a database event
  if (e && (e.starts_at || typeof e.venue === 'object' || typeof e.venue === 'string')) {
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : (e.month || "TBD");
    const day = startsAt ? startsAt.getDate().toString() : (e.day || "TBD");
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : (e.time || "Time TBD");
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : (e.date || "Date TBD");

    let venueObj: any = {};
    if (typeof e.venue === 'string') {
      const trimmed = e.venue.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          venueObj = JSON.parse(e.venue);
        } catch (err) {
          console.error("Error parsing venue JSON", err);
          venueObj = { name: e.venue, address: e.venue };
        }
      } else {
        venueObj = { name: e.venue, address: e.venue };
      }
    } else if (typeof e.venue === 'object' && e.venue !== null) {
      venueObj = e.venue;
    }

    let meta: any = {};
    if (venueObj && venueObj.meta) {
      if (typeof venueObj.meta === 'string') {
        try {
          meta = JSON.parse(venueObj.meta);
        } catch (err) {
          console.error("Error parsing meta JSON", err);
        }
      } else if (typeof venueObj.meta === 'object') {
        meta = venueObj.meta;
      }
    }

    let priceVal = '—';
    if (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') {
        priceVal = 'Free';
    } else if (e.tickets && e.tickets.length > 0) {
        const prices = e.tickets.map((t: any) => t.price_minor ? t.price_minor / 100 : (t.price_amount_minor ? t.price_amount_minor / 100 : 0));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
            priceVal = minPrice === 0 ? 'Free' : `₹${minPrice.toFixed(0)}`;
        } else {
            priceVal = `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
        }
    } else if (e.price) {
        priceVal = e.price;
    }

    e = {
      ...e,
      desc: e.description || e.desc,
      cover: e.cover || meta.cover || "",
      cat: meta.category || e.cat || "General",
      type: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
      online: e.location_type === 'online',
      month,
      day,
      date: dateStr,
      time,
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
      city: e.city || (e.location_type === 'online' ? 'Online' : (venueObj.address ? (typeof venueObj.address === 'string' ? venueObj.address.split(',').pop().trim() : '') : '')),
      going: e.going || 0,
      cap: e.capacity_total || e.cap || 9999,
      price: priceVal,
      host: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostName || e.host || ME.name || "Organizer"),
      hostBy: typeof e.host === 'object' && e.host !== null ? (e.host.name || "Organizer") : (e.hostName || e.hostBy || ME.name || "Organizer"),
      hostPhoto: typeof e.host === 'object' && e.host !== null ? (e.host.photo || "") : (e.hostPhoto || ""),
      hostBanner: typeof e.host === 'object' && e.host !== null ? (e.host.banner || "") : (e.hostBanner || ""),
      hostType: e.hostType || null,
      attendees: e.attendees || [],
      instructions: e.instruction || e.instructions || meta.instructions || "",
      formFields: e.formFields || meta.formFields || [],
      gallery: meta.gallery || e.gallery || {
        enabled: false,
        uploadRoles: { owner: true, admin: true, moderator: true, public: false },
        viewRoles: { owner: true, admin: true, moderator: true, public: true },
        approvalRequired: false,
        videoOnly: false,
        imageOnly: false
      }
    };
  }

  const { wishlisted, toggleWishlist, city } = st;
  const isSaved = wishlisted ? wishlisted.has(initialNormalized.id) : false;

  const [currentEvent, setCurrentEvent] = useState(initialNormalized);
  const e = { ...initialNormalized, ...currentEvent };
  const isSaved = wishlisted ? wishlisted.has(e.id) : false;

  const [currentEvent, setCurrentEvent] = useState(e);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  // Once fetchEventDetails() resolves with the real server record (including the resolved
  // hostName/location_type), let it override the initial prop-derived snapshot so the header
  // (title/host/online-in-person/price badges) reflects the latest saved state, not just
  // whatever was passed in via navigation.
  e = { ...e, ...currentEvent };
  const attendees = currentEvent.attendees || [];

  const [hostStats, setHostStats] = useState<any>(null);
  const [eventMembers, setEventMembers] = useState<any[] | null>(null);
  const [availableRoles, setAvailableRoles] = useState<any[] | null>(null);
  const isSavingRef = useRef(false);

  const isOwner = (
    (e.created_by && e.created_by === ME.id) ||
    (currentEvent.created_by && currentEvent.created_by === ME.id) ||
    e.id === "new"
  );
  const isAdmin = ME.role && ME.role.toLowerCase().includes("admin");
  const isModerator = ME.role && ME.role.toLowerCase().includes("moderator");
  const bookingStatusProp = currentEvent.bookingStatus || e.bookingStatus || null;
  const isJoined = bookingStatusProp === 'confirmed' || bookingStatusProp === 'pending_payment';
  const isPending = bookingStatusProp === 'pending_approval';
  const isMember = isOwner || isAdmin || isModerator || isJoined;

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  const saveEventSettings = async (updatedVenueMeta: any) => {
    try {
      const token = localStorage.getItem('token');
      const rawVenue = currentEvent.venue_raw;
      const currentVenue = (typeof rawVenue === 'object' && rawVenue !== null) ? rawVenue : {};
      const currentMeta = currentVenue.meta || {};

      const newMeta = { ...currentMeta, ...updatedVenueMeta };
      const newVenue = { ...currentVenue, meta: newMeta };

      const res = await fetch(`${apiBase}/api/events/${e.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: currentEvent.title,
          description: currentEvent.description,
          status: currentEvent.status,
          starts_at: currentEvent.starts_at,
          ends_at: currentEvent.ends_at,
          capacity_total: currentEvent.capacity_total,
          registration_mode: currentEvent.registration_mode,
          approval_required: currentEvent.approval_required,
          location_type: currentEvent.location_type,
          venue: newVenue,
          online_link: currentEvent.online_link,
          instruction: currentEvent.instruction
        })
      });
      const data = await res.json();
      if (data.success) {
        isSavingRef.current = true;
        setCurrentEvent((prev: any) => ({
          ...prev,
          venue_raw: newVenue
        }));
        if (window.toast) window.toast("Settings updated! ✓", "success");
      } else {
        if (window.toast) window.toast("Failed to save settings", "warning");
      }
    } catch (err) {
      console.error(err);
      if (window.toast) window.toast("Failed to save settings", "warning");
    }
  };

  const fetchEventDetails = async () => {
    if (e.id === "new" || !isRealEventId(e.id)) {
      const normalized = normalizeEventData(e, ME, st.city);
      setCurrentEvent(normalized);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.data) {
        const normalized = normalizeEventData(data.data.event, ME, st.city);
        normalized.attendees = data.data.attendees || [];
        normalized.bookingStatus = data.data.bookingStatus;
        normalized.bookingId = data.data.bookingId;
        normalized.attendeeId = data.data.attendeeId;
        normalized.ticketId = data.data.ticketId;
        normalized.qrToken = data.data.qrToken;
        normalized.checkinStatus = data.data.checkinStatus;
        let ev = data.data.event;
        const venueObj = ev.venue || {};
        const meta = venueObj.meta || {};
        const dateObj = ev.starts_at ? new Date(ev.starts_at) : new Date();
        const month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
        const day = dateObj.getDate();
        const dateStr = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();

        let priceVal = '—';
        if (ev.registration_mode === 'free' || ev.registration_mode === 'free_rsvp') {
            priceVal = 'Free';
        } else if (data.data.tickets && data.data.tickets.length > 0) {
            const prices = data.data.tickets.map((t: any) => t.price_minor ? t.price_minor / 100 : (t.price_amount_minor ? t.price_amount_minor / 100 : 0));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            if (minPrice === maxPrice) {
                priceVal = minPrice === 0 ? 'Free' : `₹${minPrice.toFixed(0)}`;
            } else {
                priceVal = `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`;
            }
        } else if (ev.price) {
            priceVal = ev.price;
        }

        const normalized = {
          ...ev,
          desc: ev.description || ev.desc,
          cover: ev.cover || meta.cover || "",
          cat: meta.category || ev.cat || "General",
          type: (ev.registration_mode === 'free' || ev.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
          online: ev.location_type === 'online',
          online_link: ev.online_link || null,
          month,
          day,
          date: dateStr,
          time,
          venue: ev.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
          city: ev.city || (ev.location_type === 'online' ? 'Online' : (venueObj.address ? (typeof venueObj.address === 'string' ? venueObj.address.split(',').pop().trim() : '') : '')),
          going: ev.going || 0,
          cap: ev.capacity_total || ev.cap || 9999,
          price: priceVal,
          host: typeof ev.host === 'object' && ev.host !== null ? (ev.host.name || "Organizer") : (ev.hostName || ev.host || ME.name || "Organizer"),
          hostBy: typeof ev.host === 'object' && ev.host !== null ? (ev.host.name || "Organizer") : (ev.hostName || ev.hostBy || ME.name || "Organizer"),
          hostPhoto: typeof ev.host === 'object' && ev.host !== null ? (ev.host.photo || "") : (ev.hostPhoto || ""),
          hostBanner: typeof ev.host === 'object' && ev.host !== null ? (ev.host.banner || "") : (ev.hostBanner || ""),
          hostType: ev.hostType || null,
          attendees: data.data.attendees || [],
          instructions: ev.instruction || ev.instructions || meta.instructions || "",
          formFields: ev.formFields || meta.formFields || [],
          bookingStatus: data.data.bookingStatus,
          bookingId: data.data.bookingId,
          paymentProofUrl: data.data.paymentProofUrl,
          holdExpiresAt: data.data.holdExpiresAt,
          payment_instructions: ev.payment_instructions,
          attendeeId: data.data.attendeeId,
          ticketId: data.data.ticketId,
          qrToken: data.data.qrToken,
          checkinStatus: data.data.checkinStatus,
          gallery: meta.gallery || ev.gallery || {
            enabled: false,
            uploadRoles: { owner: true, admin: true, moderator: true, public: false },
            viewRoles: { owner: true, admin: true, moderator: true, public: true },
            approvalRequired: false,
            videoOnly: false,
            imageOnly: false
          },
          venue_raw: venueObj  // preserve full venue object including meta
        };
        setCurrentEvent(normalized);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const [transactionId, setTransactionId] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        if (window.toast) window.toast("File is too large (max 5MB)", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setTransactionId(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitTransactionId = async () => {
    if (!currentEvent.bookingId) return;
    setUploadingProof(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/bookings/${currentEvent.bookingId}/payment-proof`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId: transactionId || 'N/A' })
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.success && data.paymentProofUrl) {
        setCurrentEvent((prev: any) => ({ ...prev, paymentProofUrl: data.paymentProofUrl }));
        if (window.toast) window.toast('Payment proof uploaded successfully', 'success');
      }
    } catch (err) {
      if (window.toast) window.toast('Failed to upload payment proof', 'warning');
    }
    setUploadingProof(false);
  };

  const fetchHostStats = async () => {
    if (e.id === "new" || !isRealEventId(e.id)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/dashboard-stats`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setHostStats(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventMembers = async () => {
    if (e.id === "new" || !isRealEventId(e.id)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/members`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setEventMembers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHostRequestAction = async (bookingId: string, action: 'accept' | 'decline') => {
  const handleHostRequestAction = async (attendeeId, action) => {
    if (e.id === "new" || !isRealEventId(e.id)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/requests/attendees/${attendeeId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        fetchHostStats();
        fetchEventDetails();
        fetchEventMembers();
        if (window.toast) {
          const msg = action === 'accept' ? "Request approved! 🎉" : "Request declined.";
          window.toast(msg, action === 'accept' ? "success" : "warning");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const fetchEventGallery = async () => {
    if (e.id === "new" || !isRealEventId(e.id)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/gallery`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGalleryItems(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveEventMember = async (userId: string) => {
    if (!userId) return;
    if (!confirm('Are you sure you want to remove this member from the event?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/memberships/${userId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        if (window.toast) window.toast('Member removed from event', 'success');
        fetchEventMembers();
        fetchHostStats();
      } else {
        if (window.toast) window.toast(data.message || 'Failed to remove member', 'error');
      }
    } catch (err) {
      if (window.toast) window.toast('Error removing member', 'error');
    }
  };

  useEffect(() => {
    fetchEventDetails();
    fetchEventMembers();
    fetchEventGallery();
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${apiBase}/api/events/available-roles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAvailableRoles(data.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [e.id]);

  useEffect(() => {
    if (isOwner || isAdmin || isModerator) {
      fetchHostStats();
    }
  }, [e.id, isOwner, isAdmin, isModerator]);

  useEffect(() => {
    if (!e?.id || !(window as any).io) return;
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = (window as any).io(socketUrl, { transports: ['websocket'] });
    socket.emit('join_event', e.id);
    socket.on('dashboard_updated', () => {
      fetchEventDetails();
      fetchEventMembers();
      if (isOwner || isAdmin || isModerator) {
        fetchHostStats();
      }
      if (st.fetchJoinedEvents) st.fetchJoinedEvents();
    });
    socket.on('gallery_updated', () => {
      fetchEventGallery();
    });
    return () => {
      socket.emit('leave_event', e.id);
      socket.disconnect();
    };
  }, [e.id, isOwner, isAdmin, isModerator]);

  const initialGallery = e.gallery || {
    enabled: false,
    uploadRoles: { roles: ['event_owner'] },
    viewRoles: { roles: ['event_owner'] },
    approvalRequired: false,
    videoOnly: false,
    imageOnly: false
  };

  const [galleryEnabled, setGalleryEnabled] = useState(initialGallery.enabled);
  const [galleryUploadRoles, setGalleryUploadRoles] = useState(initialGallery.uploadRoles);
  const [galleryViewRoles, setGalleryViewRoles] = useState(initialGallery.viewRoles);
  const [galleryApprovalRequired, setGalleryApprovalRequired] = useState(initialGallery.approvalRequired);
  const [galleryVideoOnly, setGalleryVideoOnly] = useState(initialGallery.videoOnly);
  const [galleryImageOnly, setGalleryImageOnly] = useState(initialGallery.imageOnly);

  const [uploadRolesModalOpen, setUploadRolesModalOpen] = useState(false);
  const [viewRolesModalOpen, setViewRolesModalOpen] = useState(false);

  const [discussionEnabled, setDiscussionEnabled] = useState(false);
  const [discussionThreadRoles, setDiscussionThreadRoles] = useState<any>({ roles: ['event_owner'] });
  const [discussionReplyRoles, setDiscussionReplyRoles] = useState<any>({ roles: ['event_owner'] });
  const [discussionApprovalRequired, setDiscussionApprovalRequired] = useState(false);
  const [threadRolesModalOpen, setThreadRolesModalOpen] = useState(false);
  const [replyRolesModalOpen, setReplyRolesModalOpen] = useState(false);

  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [regToggleLoading, setRegToggleLoading] = useState(false);
  const [refreshRegStatus, setRefreshRegStatus] = useState(0);

  useEffect(() => {
    const s = currentEvent?.registrationStatus || currentEvent?.registration_status || e.registrationStatus || e.registration_status || 'OPEN';
    const opensAt = currentEvent?.registrationOpensAt || currentEvent?.registration_opens_at || e.registrationOpensAt || e.registration_opens_at;
    const closesAt = currentEvent?.registrationClosesAt || currentEvent?.registration_closes_at || e.registrationClosesAt || e.registration_closes_at;

    let eff = s !== 'CLOSED';
    let timer: any = null;

    if (s === 'SCHEDULED') {
      const now = new Date();
      const o = opensAt ? new Date(opensAt) : null;
      const c = closesAt ? new Date(closesAt) : null;

      if (o && now < o) {
        eff = false;
        const ms = o.getTime() - now.getTime();
        if (ms <= 2147483647) timer = setTimeout(() => setRefreshRegStatus(prev => prev + 1), ms);
      } else if (c && now < c) {
        const ms = c.getTime() - now.getTime();
        if (ms <= 2147483647) timer = setTimeout(() => setRefreshRegStatus(prev => prev + 1), ms);
      } else if (c && now >= c) {
        eff = false;
      }
    } else if (s === 'OPEN') {
      const now = new Date();
      const c = closesAt ? new Date(closesAt) : null;
      if (c && now < c) {
        const ms = c.getTime() - now.getTime();
        if (ms <= 2147483647) timer = setTimeout(() => setRefreshRegStatus(prev => prev + 1), ms);
      } else if (c && now >= c) {
        eff = false;
      }
    }

    if (timer) return () => clearTimeout(timer);
    setRegistrationOpen(eff);
    setIsScheduled(s === 'SCHEDULED' && eff !== false);
  }, [currentEvent, e, refreshRegStatus]);

  const handleToggleRegistration = async () => {
    if (!isRealEventId(e.id) || regToggleLoading) return;
    const newStatus = registrationOpen ? 'CLOSED' : 'OPEN';
    setRegToggleLoading(true);
    try {
      const tok = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/registration`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(tok ? { 'Authorization': `Bearer ${tok}` } : {})
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setRegistrationOpen(!registrationOpen);
        setIsScheduled(false);
        setCurrentEvent((prev: any) => ({
          ...prev,
          registration_status: newStatus,
          registrationStatus: newStatus
        }));
        if (window.toast) window.toast(`Registration is now ${newStatus === 'OPEN' ? 'Open 🟢' : 'Closed 🔴'}`, newStatus === 'OPEN' ? 'success' : 'warning');
      } else {
        if (window.toast) window.toast(data.message || 'Failed to update registration status', 'warning');
      }
    } catch (err) {
      console.error(err);
      if (window.toast) window.toast('Failed to update registration status', 'warning');
    } finally {
      setRegToggleLoading(false);
    }
  };

  useEffect(() => {
    if (isSavingRef.current) {
      isSavingRef.current = false;
      return;
    }
    if (currentEvent && currentEvent.venue_raw) {
      const meta = currentEvent.venue_raw.meta || {};
      const disc = meta.discussion || {};
      setDiscussionEnabled(!!disc.enabled);
      if (disc.threadRoles) setDiscussionThreadRoles(disc.threadRoles);
      if (disc.replyRoles) setDiscussionReplyRoles(disc.replyRoles);
      setDiscussionApprovalRequired(!!disc.approvalRequired);

      const gall = meta.gallery || {};
      setGalleryEnabled(!!gall.enabled);
      if (gall.uploadRoles) setGalleryUploadRoles(gall.uploadRoles);
      if (gall.viewRoles) setGalleryViewRoles(gall.viewRoles);
      setGalleryApprovalRequired(!!gall.approvalRequired);
      setGalleryVideoOnly(!!gall.videoOnly);
      setGalleryImageOnly(!!gall.imageOnly);
    }
  }, [currentEvent]);

  const token = localStorage.getItem('token');
  let currentUserId: string | null = null;
  if (token) {
    try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (err) { }
  }

  const roleHasCap = (roleKey: string, cap: string) => (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes(cap);

  const myMemberEntry = eventMembers ? eventMembers.find(m => m.id === currentUserId || (window.ME && m.id === window.ME.id)) : null;
  const isHostOrCoHost = isOwner || !!(myMemberEntry && roleHasCap(myMemberEntry.role, 'event.manage'));
  const isTicketManager = isHostOrCoHost || !!(myMemberEntry && roleHasCap(myMemberEntry.role, 'event.configure_tickets'));
  const isScanner = !isTicketManager && !!(myMemberEntry && roleHasCap(myMemberEntry.role, 'checkin.gate_staff'));
  const effectiveIsMember = isMember || !!myMemberEntry;

  const myRoleKey = isOwner ? (availableRoles || [])[0]?.key : (myMemberEntry?.role || (effectiveIsMember ? 'member' : null));

  const checkRoleBucket = (bucket: any, bypass: boolean) => {
    if (bucket && Array.isArray(bucket.roles)) {
      return !!bypass || bucket.public === true || (!!myRoleKey && bucket.roles.includes(myRoleKey));
    }
    return !!bucket && (
      bucket.public ||
      (effectiveIsMember && bucket.member) ||
      (isTicketManager && (bucket.owner !== false || bucket.admin !== false)) ||
      (isScanner && bucket.moderator !== false) ||
      (isOwner && bucket.owner !== false) ||
      (isAdmin && bucket.admin !== false) ||
      (isModerator && bucket.moderator !== false)
    );
  };

  const canViewGallery = galleryEnabled && checkRoleBucket(galleryViewRoles, isTicketManager);
  const canUploadToGallery = galleryEnabled && checkRoleBucket(galleryUploadRoles, isTicketManager);
  const canAccessDiscussion = effectiveIsMember ||
    checkRoleBucket(discussionThreadRoles, isTicketManager) ||
    checkRoleBucket(discussionReplyRoles, isTicketManager);

  const [tab, setTab] = useState(ev?.initialTab || "about");

  useEffect(() => {
    if (ev?.initialTab) {
      setTab(ev.initialTab);
    }
  }, [ev?.initialTab]);

  useEffect(() => {
    if (tab === "dashboard" && !isOwner) {
      setTab("about");
    }
  }, [tab, isOwner]);

  const pendingCount = (hostStats?.requests || []).length;
  const confirmedCount = (hostStats?.confirmed || attendees || []).length;
  const isPaidEvent = currentEvent.registration_mode === 'paid' || e.registration_mode === 'paid';
  const venueRaw = (typeof currentEvent.venue_raw === 'object' && currentEvent.venue_raw !== null) ? currentEvent.venue_raw : {};
  const eventVisibility = venueRaw.visibility || 'public';
  const eventJoinEligibility = (venueRaw.meta || {}).joinEligibility || 'public';

  const tabs = e.id === "new" ? [["about", "About"]] : [
    ["about", "About"],
    ...(isOwner ? [["dashboard", "Dashboard"]] : []),
    ...(effectiveIsMember ? [["members", `Members${pendingCount > 0 && (isTicketManager || isAdmin || isModerator) ? ` · 🔴${pendingCount}` : ""}`]] : []),
    ...(canViewGallery ? [["gallery", "Gallery"]] : []),
    ...(discussionEnabled && canAccessDiscussion ? [["discussion", "Discussion"]] : []),
    ...(isTicketManager && isPaidEvent ? [["ticketing", "🎟 Ticketing"]] : []),
    ...(isTicketManager ? [["invite", "Invite"]] : []),
    ...(isTicketManager ? [["settings", "Advance setting"]] : [])
  ];

  const [inviteLinks, setInviteLinks] = useState<{ view: string | null; join: string[] }>({ view: null, join: [] });
  const [inviteLoading, setInviteLoading] = useState({ view: false, join: false });

  const generateInviteLink = async (purpose: 'view' | 'join') => {
    setInviteLoading(prev => ({ ...prev, [purpose]: true }));
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ purpose })
      });
      const data = await res.json();
      if (data.success) {
        if (purpose === 'view') {
          setInviteLinks(prev => ({ ...prev, view: data.data.url }));
        } else {
          setInviteLinks(prev => ({ ...prev, join: [data.data.url, ...prev.join] }));
        }
      } else if (window.toast) {
        window.toast(data.message || "Failed to generate link", "warning");
      }
    } catch (err) {
      console.error(err);
      if (window.toast) window.toast("Failed to generate link", "warning");
    } finally {
      setInviteLoading(prev => ({ ...prev, [purpose]: false }));
    }
  };

  useEffect(() => {
    if (tab === "invite" && isTicketManager && eventVisibility === "unlisted" && inviteLinks.view === null) {
      fetch(`${apiBase}/api/events/${e.id}/invites/view`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setInviteLinks(prev => ({ ...prev, view: data.data.url }));
          }
        })
        .catch(err => console.error(err));
    }
  }, [tab, isTicketManager, eventVisibility, e.id]);

  const copyInviteLink = (url: string) => {
    if (navigator.clipboard) navigator.clipboard.writeText(url);
    if (window.toast) window.toast("Link copied! ✓", "success");
  };

  const handleLeaveEvent = async () => {
    if (!confirm("Are you sure you want to leave this event?")) return;
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("You have left the event successfully.");
        if (st.unregister) {
          st.unregister(e.id);
        }
        if (st.setMyTickets) {
          st.setMyTickets((prev: any[]) => prev.filter((t: any) => t.eventId !== e.id && t.ev !== e.title));
        }
        if (st.fetchJoinedEvents) {
          st.fetchJoinedEvents();
        }
        go("home");
      } else {
        alert(data.message || "Failed to leave event");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to leave event due to a network error.");
    }
  };

  const legacyBucketToRoleKeys = (bucket: any) => {
    const keys: string[] = [];
    if (bucket?.owner) keys.push('event_owner', 'event_manager');
    if (bucket?.admin) keys.push('co_host');
    if (bucket?.moderator) keys.push('checkin_lead', 'gate_staff', 'session_gate_staff', 'ticket_scanner');
    if (bucket?.member) keys.push('member');
    const validKeys = new Set((availableRoles || []).map(r => r.key));
    return keys.filter(k => validKeys.has(k));
  };

  const getRolesSummary = (bucket: any) => {
    if (!bucket) return "No one";
    if (bucket.public) return "Public";
    if (Array.isArray(bucket.roles)) {
      if (bucket.roles.length === 0) return "No one";
      const names = bucket.roles.map(k => (availableRoles || []).find(r => r.key === k)?.display_name || k);
      if (names.length === 1) return names[0] + " only";
      if (names.length === 2) return names.join(" and ") + " only";
      const last = names.pop();
      return names.join(", ") + " and " + last + " only";
    }
    const selected = [];
    if (bucket.owner) selected.push("Host");
    if (bucket.admin) selected.push("Co-Host");
    if (bucket.moderator) selected.push("Scanner");
    if (bucket.member) selected.push("Member");

    if (selected.length === 0) return "No one";
    if (selected.length === 1) return selected[0] + " only";
    if (selected.length === 2) return selected.join(" and ") + " only";
    const last = selected.pop();
    return selected.join(", ") + " and " + last + " only";
  };

  const [responseMember, setResponseMember] = useState<any>(null);

  return (
    <div className="scroll">
      <div className="view-enter">
        <EventHeaderSection
          e={e}
          ev={ev}
          st={st}
          go={go}
          attendees={attendees}
          bookingStatusProp={bookingStatusProp}
          registrationOpen={registrationOpen}
          isScheduled={isScheduled}
          regToggleLoading={regToggleLoading}
          isHostOrCoHost={isHostOrCoHost}
          effectiveIsMember={effectiveIsMember}
          isSaved={isSaved}
          toggleWishlist={toggleWishlist}
          handleToggleRegistration={handleToggleRegistration}
          handleLeaveEvent={handleLeaveEvent}
          currentEvent={currentEvent}
          tabs={tabs as Array<[string, string]>}
          tab={tab}
          setTab={setTab}
        />

        <div className="grp-cols" style={{ marginTop: 20, gridTemplateColumns: tab === "about" ? "1fr 300px" : "1fr", paddingBottom: 80 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {tab === "about" && (
              <EventAboutTab
                e={e}
                currentEvent={currentEvent}
                registrationOpen={registrationOpen}
                isHostOrCoHost={isHostOrCoHost}
                isPending={isPending}
              />
            )}

            {tab === "dashboard" && (
              <EventDashboard ev={currentEvent || e} st={st} go={go} embedded={true} />
            )}

            {tab === "members" && (
              <EventMembersTab
                e={e}
                hostStats={hostStats}
                eventMembers={eventMembers}
                availableRoles={availableRoles}
                isTicketManager={isTicketManager}
                isAdmin={isAdmin}
                isModerator={isModerator}
                isHostOrCoHost={isHostOrCoHost}
                isOwner={isOwner}
                ME={ME}
                apiBase={apiBase}
                token={token}
                go={go}
                getQuestionLabel={(fieldId) => getQuestionLabel(currentEvent.formFields || [], fieldId)}
                fetchEventMembers={fetchEventMembers}
                fetchHostStats={fetchHostStats}
                handleHostRequestAction={handleHostRequestAction}
                handleRemoveEventMember={handleRemoveEventMember}
                setResponseMember={setResponseMember}
                Avatar={Avatar}
              />
            )}

            {tab === "gallery" && (
              <EventGalleryTab
                e={e}
                galleryItems={galleryItems}
                galleryEnabled={galleryEnabled}
                galleryVideoOnly={galleryVideoOnly}
                galleryImageOnly={galleryImageOnly}
                canUploadToGallery={canUploadToGallery}
                isTicketManager={isTicketManager}
                isScanner={isScanner}
                isOwner={isOwner}
                isAdmin={isAdmin}
                isModerator={isModerator}
                ME={ME}
                apiBase={apiBase}
                token={token}
                fetchEventGallery={fetchEventGallery}
              />
          {/* Grp Columns (Main content split) */}
          <div className="grp-cols" style={{ marginTop: 20, gridTemplateColumns: tab === "about" ? "1fr 300px" : "1fr" }}>
            <div style={{ minWidth: 0, flex: 1 }}>

              {/* Tab 1: About */}
              {tab === "about" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Archived banner */}
                  {currentEvent?.status === 'cancelled' && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(107,114,128,0.12)", border: "1px solid rgba(107,114,128,0.35)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
                      <span style={{ fontSize: 22 }}>🗄️</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>This event has been archived</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>This event was cancelled and is no longer active. It now appears in the Archived section of My Events.</div>
                      </div>
                    </div>
                  )}

                  {/* Registration closed banner — visible to non-host members/visitors */}
                  {!registrationOpen && !isHostOrCoHost && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
                      <span style={{ fontSize: 22 }}>🔒</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#ef4444" }}>Registration is currently closed</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>The host has temporarily closed registration. Add to your wishlist to get notified when it reopens.</div>
                      </div>
                    </div>
                  )}

                  {/* Pending approval banner */}
                  {isPending && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "var(--r-md)", padding: "14px 16px" }}>
                      <span style={{ fontSize: 22 }}>⏳</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>Your request is pending approval</div>
                        <div style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>The host will review and accept or decline your request. You'll be notified.</div>
                      </div>
                    </div>
                  )}

                  <div className="ev-block">
                    <div className="ev-when">
                      <div className="ev-fact"><span className="ico"><I.cal /></span><div><div className="k">Date & Time</div><div className="v">{e.date}</div><div className="v2">{e.time}</div></div></div>
                      <div className="ev-fact"><span className="ico">{e.online ? <I.online /> : <I.pin />}</span><div><div className="k">{e.online ? "Online Link" : "Venue"}</div><div className="v">{e.venue}</div><div className="v2">{e.city}</div></div></div>
                    </div>
                  </div>

                  <div className="ev-block">
                    <h3>About this event</h3>
                    <div className="ev-about">
                      <p>{e.desc || "No description provided."}</p>
                    </div>
                  </div>

                  {e.online ? (
                    <div className="ev-block">
                      <h3>Location</h3>
                      <div className="ev-map" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-2)', color: 'var(--ink-2)', fontSize: 16, fontWeight: 500, height: 120, border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                        <span style={{ marginRight: 8, fontSize: 24 }}>🌐</span> Online Event
                      </div>
                    </div>
                  ) : e.venue ? (
                    <div className="ev-block">
                      <h3>Location</h3>
                      <div className="ev-map">
                        <iframe
                          title="Event location map"
                          width="100%"
                          height="100%"
                          style={{ border: 0, display: "block" }}
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(`${e.venue}${e.city ? ", " + e.city : ""}`)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          allowFullScreen
                        />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13.5, color: "var(--ink-2)" }}>
                        <I.pin style={{ color: "var(--accent-2)" }} /> {e.venue}{e.city ? `, ${e.city}` : ""}
                        <a
                          className="hbtn hbtn--ghost hbtn--sm"
                          style={{ marginLeft: "auto", textDecoration: "none" }}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${e.venue}${e.city ? ", " + e.city : ""}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get directions
                        </a>
                      </div>
                    </div>
                  ) : null}

                  {e.instructions && (
                    <div className="ev-block" style={{ background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px" }}>
                      <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 700 }}>📢 Special Instructions</h3>
                      <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)" }}>{e.instructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Dashboard — Premium Event Control Center */}
              {tab === "dashboard" && (
                <EventDashboard ev={currentEvent || e} st={st} go={go} embedded={true} />
              )}

              {/* Tab 2: Members — consolidated (pending requests + confirmed list) */}
              {tab === "members" && (() => {
                const confirmedAttendees = hostStats?.confirmed || attendees || [];
                const pendingRequests = hostStats?.requests || [];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Pending join requests — host only */}
                    {/* Pending join requests — host only */}
                    {(isTicketManager || isAdmin || isModerator) && pendingRequests.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6d5efc", flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Pending Approvals ({pendingRequests.length})</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {pendingRequests.map((r) => (
                            <div key={r.id || r.bookingId} style={{
                              padding: "16px 20px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--r-md)",
                              background: "var(--surface)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 12
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                                  onClick={() => r.userId && go("profile", { id: r.userId })}>
                                  <Avatar name={r.name || "User"} userId={r.userId} img={r.picture} size={38} />
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>{r.name || "Unknown"}</div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{r.email || ""}</div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button className="hbtn hbtn--ghost hbtn--sm"
                                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "20px", padding: "6px 16px", fontSize: 13, fontWeight: 600 }}
                                    onClick={() => handleHostRequestAction(r.id, 'decline')}>
                                    Decline
                                  </button>
                                  <button className="hbtn hbtn--primary hbtn--sm"
                                    style={{ background: "linear-gradient(135deg,#ff6b4a,#ff4d8d)", border: "none", borderRadius: "20px", padding: "6px 18px", fontSize: 13, fontWeight: 600, color: "#fff" }}
                                    onClick={() => handleHostRequestAction(r.id, 'accept')}>
                                    Approve
                                  </button>
                                </div>
                              </div>
                              {/* Questionnaire answers box */}
                              {r.answers && Object.keys(r.answers).length > 0 && (
                                <div style={{
                                  padding: "16px",
                                  background: "var(--bg-2)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--r-md)",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 12
                                }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    Questionnaire Answers
                                  </div>
                                  {Object.entries(r.answers).filter(([k]) => !['ticketTypeId', 'qty', 'ticketName', 'isQuestionnaireSubmit', 'registration_location'].includes(k)).map(([key, val]) => {
                                    const label = getQuestionLabel(key);
                                    return (
                                      <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                        <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>Q: {label}</div>
                                        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>A: {String(val)}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confirmed members */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                          Members
                          {eventMembers && eventMembers.filter(m => m.state === 'active').length > 0 && (
                            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", background: "var(--border)", padding: "2px 8px", borderRadius: 999 }}>
                              {eventMembers.filter(m => m.state === 'active').length}
                            </span>
                          )}
                        </h3>
                        <div style={{ display: "flex", gap: 8 }}>
                          <select
                            className="cinput"
                            value={memberRoleFilter}
                            onChange={ev => setMemberRoleFilter(ev.target.value)}
                            style={{ fontSize: 12, background: "var(--field)", border: "1px solid var(--border)", padding: "6px 28px 6px 12px", height: "auto", minHeight: "32px" }}
                          >
                            <option value="all">All Roles</option>
                            {(availableRoles || []).map(r => (
                              <option key={r.key} value={r.key}>{r.display_name}</option>
                            ))}
                          </select>
                          <input
                            className="cinput"
                            placeholder="Search members…"
                            value={memberSearch}
                            onChange={ev => setMemberSearch(ev.target.value)}
                            style={{ width: 170, fontSize: 12, background: "var(--field)", border: "1px solid var(--border)", minHeight: "32px" }}
                          />
                        </div>
                      </div>
                      {!eventMembers ? (
                        <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--ink-3)" }}>Loading members...</div>
                      ) : eventMembers.filter(m => m.state === 'active').length === 0 ? (
                        <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
                          No confirmed members yet.
                        </div>
                      ) : (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                          {eventMembers
                            .filter(m => m.state === 'active')
                            .filter(m => memberRoleFilter === 'all' || m.role === memberRoleFilter)
                            .filter(m => !memberSearch || (m.name || m.display_name || "").toLowerCase().includes(memberSearch.toLowerCase()))
                            .map((a, i, arr) => {
                              const name = a.name || a.display_name || "Member";
                              const userId = a.id;
                              const email = a.email || "";
                              const isLast = i === arr.length - 1;

                              const roleMeta = (key) => (availableRoles || []).find(r => r.key === key);
                              const ROLE_BADGE_COLORS = ['#9333ea', '#2563eb', '#ea580c', '#0891b2', '#4338ca', '#be185d'];

                              const handleRoleChange = async (newRole) => {
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${apiBase}/api/events/${e.id}/memberships/${userId}/role`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                    },
                                    body: JSON.stringify({ role: newRole })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    if (window.toast) window.toast("Role updated successfully!", "success");
                                    fetchEventMembers();
                                  } else {
                                    if (window.toast) window.toast(data.message || "Failed to update role", "error");
                                  }
                                } catch (err) {
                                  if (window.toast) window.toast("Error updating role", "error");
                                }
                              };

                              // Calculate if current user can change this person's role
                              const myRoleKey = isOwner ? (availableRoles || [])[0]?.key : (eventMembers.find(m => m.id === ME?.id)?.role || 'member');
                              const myLevel = roleMeta(myRoleKey)?.hierarchy_level ?? Infinity;
                              const theirLevel = roleMeta(a.role)?.hierarchy_level ?? Infinity;
                              const canChangeRole = isHostOrCoHost && myLevel < theirLevel;
                              const canRemoveMember = userId !== ME?.id && (isOwner || (isHostOrCoHost && myLevel < theirLevel));

                              // Questionnaire answers this member submitted at registration
                              // (sourced from their booking's notes, via dashboard-stats).
                              const memberBooking = (hostStats?.confirmed || []).find(c => c.userId === userId);
                              const memberAnswers = memberBooking?.answers || null;
                              const hasAnswers = memberAnswers && Object.keys(memberAnswers).length > 0;
                              const statsLoaded = !!hostStats;

                              return (
                                <div key={userId || name + i}
                                  style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "11px 16px",
                                    borderBottom: isLast ? "none" : "1px solid var(--border)",
                                    cursor: userId ? "pointer" : "default",
                                    transition: "background 0.15s"
                                  }}
                                  onClick={() => userId && go("profile", { id: userId })}
                                  onMouseEnter={ev => { if (userId) ev.currentTarget.style.background = "var(--field)"; }}
                                  onMouseLeave={ev => { ev.currentTarget.style.background = ""; }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <Avatar name={name} userId={userId} img={a.picture} size={32} />
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
                                      {email && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{email}</div>}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={ev => ev.stopPropagation()}>
                                    {canChangeRole ? (
                                      <select
                                        className="cselect"
                                        value={a.role}
                                        onChange={(e) => handleRoleChange(e.target.value)}
                                        style={{ fontSize: 12, padding: "4px 24px 4px 8px", background: "var(--field)", border: "1px solid var(--border)" }}
                                      >
                                        {(availableRoles || []).filter(r => r.hierarchy_level > myLevel).map(r => (
                                          <option key={r.key} value={r.key}>{r.display_name}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span style={{ fontSize: 11, fontWeight: 600, color: a.role === 'member' ? "#1f9d57" : (ROLE_BADGE_COLORS[(availableRoles || []).findIndex(r => r.key === a.role) % ROLE_BADGE_COLORS.length] || "#1f9d57"), background: "rgba(0,0,0,0.05)", padding: "3px 8px", borderRadius: 999 }}>
                                        {roleMeta(a.role)?.display_name || 'Member'}
                                      </span>
                                    )}
                                    {canRemoveMember && (
                                      <button
                                        className="hbtn hbtn--soft hbtn--sm"
                                        style={{ fontSize: 11.5, padding: "4px 10px", color: "#ef4444" }}
                                        onClick={(ev) => { ev.stopPropagation(); handleRemoveEventMember(userId); }}
                                      >
                                        Remove
                                      </button>
                                    )}
                                    {(isHostOrCoHost || isAdmin || isModerator) && (
                                      <button
                                        className="hbtn hbtn--soft hbtn--sm"
                                        style={{ fontSize: 11.5, padding: "4px 10px" }}
                                        onClick={() => setResponseMember({ ...a, name, email, answers: memberAnswers })}
                                      >
                                        Response{!statsLoaded ? "…" : (hasAnswers ? "" : " (none)")}
                                      </button>
                                    )}
                                    {userId && <I.arrowR style={{ width: 14, color: "var(--ink-3)" }} />}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Tab 3: Gallery */}
              {tab === "gallery" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Media Gallery</h3>
                      <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Images & videos</div>
                    </div>
                    {canUploadToGallery && (
                      <div>
                        <input
                          type="file"
                          ref={galleryInputRef}
                          style={{ display: "none" }}
                          accept={galleryVideoOnly ? "video/*" : (galleryImageOnly ? "image/*" : "image/*,video/*")}
                          onChange={(evt) => {
                            const file = evt.target.files?.[0];
                            if (!file) return;

                            // Validate media type
                            const isVideo = file.type.startsWith("video/");
                            const isImage = file.type.startsWith("image/");

                            if (galleryVideoOnly && !isVideo) {
                              alert("Only video uploads are allowed for this gallery.");
                              return;
                            }
                            if (galleryImageOnly && !isImage) {
                              alert("Only image uploads are allowed for this gallery.");
                              return;
                            }

                            const reader = new FileReader();
                            reader.onload = async (uploadEvt) => {
                              try {
                                const token = localStorage.getItem('token');
                                const res = await fetch(`${apiBase}/api/events/${e.id}/gallery`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                  },
                                  body: JSON.stringify({
                                    url: uploadEvt.target.result,
                                    type: isVideo ? "video" : "image"
                                  })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  fetchEventGallery();
                                  if (!data.data.approved) {
                                    alert("Upload successful! Your media is pending approval from organizers.");
                                  } else {
                                    alert("Upload successful!");
                                  }
                                } else {
                                  alert(data.message || "Failed to upload media.");
                                }
                              } catch (err) {
                                console.error(err);
                                alert("An error occurred during upload.");
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <button 
                          onClick={() => galleryInputRef.current?.click()}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "rgba(124, 58, 237, 0.1)",
                            color: "var(--primary, #7c3aed)",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 999,
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(124, 58, 237, 0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"}
                        >
                          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Media
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pending Approval Section */}
                  {(isTicketManager || isScanner || isOwner || isAdmin || isModerator) && galleryItems.some(item => !item.approved) && (
                    <div style={{ background: "rgba(120,90,255,.05)", border: "1px solid rgba(120,90,255,.15)", borderRadius: "var(--r-md)", padding: "16px" }}>
                      <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--accent-2)" }}>Pending Approval</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                        {galleryItems.filter(item => !item.approved).map(item => (
                          <div key={item.id} style={{ borderRadius: "var(--r-md)", overflow: "hidden", height: 110, border: "1px solid var(--border)", position: "relative", background: "var(--surface)" }}>
                            {item.type === "video" ? (
                              <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
                            ) : (
                              <div style={{ width: "100%", height: "100%", background: `url(${item.url}) center/cover no-repeat` }} />
                            )}
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "6px", display: "flex", gap: "6px", justifyContent: "space-between" }}>
                              <button
                                className="hbtn hbtn--primary"
                                style={{ padding: "2px 6px", fontSize: 10, height: 20 }}
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`${apiBase}/api/events/${e.id}/gallery/${item.id}/approve`, {
                                      method: 'PATCH',
                                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      fetchEventGallery();
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="hbtn"
                                style={{ padding: "2px 6px", fontSize: 10, height: 20, background: "#e5484d", color: "#fff" }}
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`${apiBase}/api/events/${e.id}/gallery/${item.id}`, {
                                      method: 'DELETE',
                                      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      fetchEventGallery();
                                    }
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approved Gallery Section */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {galleryItems.filter(item => item.approved).map(item => (
                      <div key={item.id} style={{ borderRadius: "var(--r-md)", overflow: "hidden", height: 130, border: "1px solid var(--border)", position: "relative", background: "var(--surface)" }}>
                        {item.type === "video" ? (
                          <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
                        ) : (
                          <div 
                            onClick={() => {
                              setViewerItem(item);
                              setZoomScale(1);
                              setPanOffset({ x: 0, y: 0 });
                              setHandModeActive(true);
                            }}
                            style={{ cursor: "pointer", width: "100%", height: "100%", background: item.url && (item.url.startsWith("linear-gradient") || item.url.startsWith("radial-gradient") || item.url.startsWith("var(")) ? item.url : `url(${item.url}) center/cover no-repeat` }} 
                          />
                        )}

                        {/* Delete button for allowed users */}
                        {(isTicketManager || isScanner || isOwner || isAdmin || isModerator || item.uploadedBy === ME.name) && (
                          <button
                            style={{
                              position: "absolute", top: 6, right: 6,
                              background: "rgba(0, 0, 0, 0.6)", color: "#fff",
                              border: "none", borderRadius: "50%",
                              width: 24, height: 24, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              cursor: "pointer", fontSize: 12
                            }}
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this media?")) {
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${apiBase}/api/events/${e.id}/gallery/${item.id}`, {
                                    method: 'DELETE',
                                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    fetchEventGallery();
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {galleryItems.filter(item => item.approved).length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
                      No media uploaded yet.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Discussion */}
              {tab === "discussion" && discussionEnabled && (
                <DiscussionPanel
                  entityType="event"
                  entityId={e.id}
                  token={token}
                  currentUserId={currentUserId}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  isModerator={isModerator}
                  isMember={effectiveIsMember}
                  myRoleKey={myRoleKey}
                  availableRoles={availableRoles}
                  isTicketManager={isTicketManager}
                  isScanner={isScanner}
                  forumsEnabled={discussionEnabled}
                  threadPerm={discussionThreadRoles}
                  replyPerm={discussionReplyRoles}
                  approvalRequired={discussionApprovalRequired}
                  ME={ME}
                />
              )}

              {/* Tab: Ticketing & Coupons */}
              {tab === "ticketing" && isTicketManager && isPaidEvent && (() => {
                const TC_ACCENT = "var(--accent-2)";
                const fieldStyle = { display: "flex", flexDirection: "column" as const, gap: 4 };
                const labelStyle = { fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase" as const, letterSpacing: "0.05em" };

                // ── Helper: submit ticket ──
                const handleTicketSubmit = async () => {
                  if (!ticketForm.name.trim()) { if (window.toast) window.toast("Ticket name is required", "warning"); return; }
                  if (!ticketForm.description.trim()) { if (window.toast) window.toast("Description is required", "warning"); return; }
                  if (!ticketForm.price || String(ticketForm.price).trim() === "") { if (window.toast) window.toast("Price is required", "warning"); return; }
                  try {
                    const url = editingTicket
                      ? `${apiBase}/api/events/${e.id}/ticket-types/${editingTicket.id}`
                      : `${apiBase}/api/events/${e.id}/ticket-types`;
                    const method = editingTicket ? "PUT" : "POST";
                    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: JSON.stringify(ticketForm) });
                    const data = await res.json();
                    if (data.success) {
                      if (window.toast) window.toast(editingTicket ? "Ticket updated ✓" : "Ticket created ✓", "success");
                      setTicketModalOpen(false); setEditingTicket(null);
                      setTicketForm({ name: "", description: "", price: "", currency: "INR", capacity: "", max_per_booking: "", sale_start: "", sale_end: "", early_bird_price: "", early_bird_currency: "INR", early_bird_ends_at: "", visibility: "public" });
                      await fetchTicketTypes();
                    } else { if (window.toast) window.toast(data.message || "Error saving ticket", "error"); }
                  } catch (err) { if (window.toast) window.toast("Network error", "error"); }
                };

                // ── Helper: delete ticket ──
                const handleTicketDelete = async (tt) => {
                  if (!confirm(`Delete ticket "${tt.name}"?`)) return;
                  try {
                    const res = await fetch(`${apiBase}/api/events/${e.id}/ticket-types/${tt.id}`, { method: "DELETE", headers: token ? { "Authorization": `Bearer ${token}` } : {} });
                    const data = await res.json();
                    if (data.success) { if (window.toast) window.toast("Ticket deleted", "success"); await fetchTicketTypes(); }
                    else { if (window.toast) window.toast(data.message || "Error deleting ticket", "error"); }
                  } catch (err) { if (window.toast) window.toast("Network error", "error"); }
                };

                // ── Helper: submit coupon ──
                const handleCouponSubmit = async () => {
                  if (!couponForm.code.trim()) { if (window.toast) window.toast("Coupon code is required", "warning"); return; }
                  if (!couponForm.discount_value || String(couponForm.discount_value).trim() === "") { if (window.toast) window.toast("Discount value is required", "warning"); return; }
                  try {
                    const url = editingCoupon
                      ? `${apiBase}/api/events/${e.id}/coupons/${editingCoupon.id}`
                      : `${apiBase}/api/events/${e.id}/coupons`;
                    const method = editingCoupon ? "PUT" : "POST";
                    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: JSON.stringify(couponForm) });
                    const data = await res.json();
                    if (data.success) {
                      if (window.toast) window.toast(editingCoupon ? "Coupon updated ✓" : "Coupon created ✓", "success");
                      setCouponModalOpen(false); setEditingCoupon(null);
                      setCouponForm({ code: "", discount_type: "percent", discount_value: "", currency: "INR", valid_from: "", valid_to: "", max_total: "", max_per_user: "", status: "active" });
                      await fetchTcCoupons();
                    } else { if (window.toast) window.toast(data.message || "Error saving coupon", "error"); }
                  } catch (err) { if (window.toast) window.toast("Network error", "error"); }
                };

                // ── Helper: delete coupon ──
                const handleCouponDelete = async (c) => {
                  if (!confirm(`Delete coupon "${c.code}"?`)) return;
                  try {
                    const res = await fetch(`${apiBase}/api/events/${e.id}/coupons/${c.id}`, { method: "DELETE", headers: token ? { "Authorization": `Bearer ${token}` } : {} });
                    const data = await res.json();
                    if (data.success) { if (window.toast) window.toast("Coupon deleted", "success"); await fetchTcCoupons(); }
                    else { if (window.toast) window.toast(data.message || "Error deleting coupon", "error"); }
                  } catch (err) { if (window.toast) window.toast("Network error", "error"); }
                };

                // ── Helper: submit referral ──
                const handleReferralSubmit = async () => {
                  if (!referralForm.code.trim()) { if (window.toast) window.toast("Referral code is required", "warning"); return; }
                  if (!referralForm.affiliate_id) { if (window.toast) window.toast("Affiliate is required", "warning"); return; }
                  try {
                    const url = editingReferral
                      ? `${apiBase}/api/events/${e.id}/referrals/${editingReferral.id}`
                      : `${apiBase}/api/events/${e.id}/referrals`;
                    const method = editingReferral ? "PUT" : "POST";
                    const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "Authorization": `Bearer ${token}` } : {}) }, body: JSON.stringify(referralForm) });
                    const data = await res.json();
                    if (data.success) {
                      if (window.toast) window.toast(editingReferral ? "Referral updated ✓" : "Referral created ✓", "success");
                      setReferralModalOpen(false); setEditingReferral(null);
                      setReferralForm({ code: "", affiliate_id: "", commission_rule: "" });
                      await fetchTcReferrals();
                    } else { if (window.toast) window.toast(data.message || "Error saving referral", "error"); }
                  } catch (err) { if (window.toast) window.toast("Network error", "error"); }
                };

                // ── Helper: delete referral ──
                const handleReferralDelete = async (r) => {
                  if (!confirm(`Delete referral link "${r.code}"?`)) return;
                  try {
                    const res = await fetch(`${apiBase}/api/events/${e.id}/referrals/${r.id}`, { method: "DELETE", headers: token ? { "Authorization": `Bearer ${token}` } : {} });
                    const data = await res.json();
                    if (data.success) { if (window.toast) window.toast("Referral deleted", "success"); await fetchTcReferrals(); }
                    else { if (window.toast) window.toast(data.message || "Error deleting referral", "error"); }
                  } catch (err) { if (window.toast) window.toast("Network error", "error"); }
                };

                const fmtPrice = (minor, currency) => minor != null ? `${currency || "INR"} ${(minor / 100).toFixed(2)}` : "—";
                const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

                const filteredTickets = ticketTypes.filter(t => t.name?.toLowerCase().includes(ticketSearch.toLowerCase()));
                const filteredCoupons = tcCoupons.filter(c => c.code?.toLowerCase().includes(couponSearch.toLowerCase()));
                const filteredReferrals = tcReferrals.filter(r =>
                  r.code?.toLowerCase().includes(referralSearch.toLowerCase()) ||
                  r.affiliate_name?.toLowerCase().includes(referralSearch.toLowerCase())
                );

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {/* Section Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🎟 Ticketing & Coupons</h3>
                      {tcLoading && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Loading...</span>}
                    </div>

                    {/* Inner Sub-Tab Bar */}
                    <div style={{ display: "flex", gap: 0, background: "var(--bg-2)", borderRadius: "var(--r-md)", padding: 4, marginBottom: 20, border: "1px solid var(--border)" }}>
                      {[["tickets", "🎫 Tickets"], ["coupons", "🏷 Coupons"], ["referrals", "🔗 Referrals"]].map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setTcTab(key)}
                          style={{
                            flex: 1, padding: "8px 0", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                            borderRadius: "var(--r-sm)", transition: "all 0.15s",
                            background: tcTab === key ? TC_ACCENT : "transparent",
                            color: tcTab === key ? "#fff" : "var(--ink-3)"
                          }}
                        >{label}</button>
                      ))}
                    </div>

                    {/* ── Tickets Sub-Tab ── */}
                    {tcTab === "tickets" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* Search + Add */}
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input className="cinput" placeholder="Search tickets..." value={ticketSearch} onChange={ev => setTicketSearch(ev.target.value)} style={{ flex: 1, height: 38 }} />
                          <button className="hbtn hbtn--primary hbtn--sm" onClick={() => { setEditingTicket(null); setTicketForm({ name: "", description: "", price: "", currency: "INR", capacity: "", max_per_booking: "", sale_start: "", sale_end: "", early_bird_price: "", early_bird_currency: "INR", early_bird_ends_at: "", visibility: "public" }); setTicketModalOpen(true); }}>+ Add Ticket</button>
                        </div>

                        {/* List */}
                        {filteredTickets.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🎫</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>No ticket types yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Create your first ticket type to get started.</div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {filteredTickets.map(tt => (
                              <div key={tt.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700 }}>{tt.name}</span>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: tt.visibility === "public" ? "rgba(34,197,94,0.15)" : "rgba(139,92,246,0.15)", color: tt.visibility === "public" ? "#16a34a" : "#7c3aed", fontWeight: 600, textTransform: "capitalize" }}>{tt.visibility}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                                    <span>💰 {fmtPrice(tt.price_amount_minor, tt.price_currency)}</span>
                                    {tt.capacity && <span>👥 Cap: {tt.capacity}</span>}
                                    {tt.sale_start && <span>📅 {fmtDate(tt.sale_start)} – {fmtDate(tt.sale_end)}</span>}
                                    <span>Created {fmtDate(tt.created_at)}</span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                                    setEditingTicket(tt);
                                    setTicketForm({ name: tt.name || "", description: tt.description || "", price: tt.price_amount_minor != null ? String(tt.price_amount_minor / 100) : "", currency: tt.price_currency || "INR", capacity: tt.capacity ? String(tt.capacity) : "", max_per_booking: tt.max_per_booking ? String(tt.max_per_booking) : "", sale_start: tt.sale_start ? tt.sale_start.replace("Z", "").slice(0, 16) : "", sale_end: tt.sale_end ? tt.sale_end.replace("Z", "").slice(0, 16) : "", early_bird_price: tt.early_bird_price_amount_minor != null ? String(tt.early_bird_price_amount_minor / 100) : "", early_bird_currency: tt.early_bird_price_currency || "INR", early_bird_ends_at: tt.early_bird_ends_at ? tt.early_bird_ends_at.replace("Z", "").slice(0, 16) : "", visibility: tt.visibility || "public" });
                                    setTicketModalOpen(true);
                                  }}>Edit</button>
                                  <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#ef4444" }} onClick={() => handleTicketDelete(tt)}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Coupons Sub-Tab ── */}
                    {tcTab === "coupons" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input className="cinput" placeholder="Search coupons..." value={couponSearch} onChange={ev => setCouponSearch(ev.target.value)} style={{ flex: 1, height: 38 }} />
                          <button className="hbtn hbtn--primary hbtn--sm" onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discount_type: "percent", discount_value: "", currency: "INR", valid_from: "", valid_to: "", max_total: "", max_per_user: "", status: "active" }); setCouponModalOpen(true); }}>+ Add Coupon</button>
                        </div>

                        {filteredCoupons.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🏷</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>No coupons yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Create discount coupons for your attendees.</div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {filteredCoupons.map(c => (
                              <div key={c.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", background: "var(--bg-2)", padding: "2px 8px", borderRadius: 6 }}>{c.code}</span>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: c.status === "active" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: c.status === "active" ? "#16a34a" : "#ef4444", fontWeight: 600, textTransform: "capitalize" }}>{c.status}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                                    <span>💸 {c.discount_type === "percent" ? `${c.discount_percent}% off` : fmtPrice(c.discount_amount_minor, c.discount_currency)}</span>
                                    {c.valid_from && <span>📅 {fmtDate(c.valid_from)} – {fmtDate(c.valid_to)}</span>}
                                    {c.max_total && <span>🔢 Max {c.max_total} uses</span>}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                                    setEditingCoupon(c);
                                    setCouponForm({ code: c.code || "", discount_type: c.discount_type || "percent", discount_value: c.discount_type === "percent" ? String(c.discount_percent || "") : String((c.discount_amount_minor || 0) / 100), currency: c.discount_currency || "INR", valid_from: c.valid_from ? c.valid_from.replace("Z", "").slice(0, 16) : "", valid_to: c.valid_to ? c.valid_to.replace("Z", "").slice(0, 16) : "", max_total: c.max_total ? String(c.max_total) : "", max_per_user: c.max_per_user ? String(c.max_per_user) : "", status: c.status || "active" });
                                    setCouponModalOpen(true);
                                  }}>Edit</button>
                                  <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#ef4444" }} onClick={() => handleCouponDelete(c)}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Referrals Sub-Tab ── */}
                    {tcTab === "referrals" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <input className="cinput" placeholder="Search referrals..." value={referralSearch} onChange={ev => setReferralSearch(ev.target.value)} style={{ flex: 1, height: 38 }} />
                          <button className="hbtn hbtn--primary hbtn--sm" onClick={() => { setEditingReferral(null); setReferralForm({ code: "", affiliate_id: affiliates[0]?.id || "", commission_rule: "" }); setReferralModalOpen(true); }}>+ Add Referral</button>
                        </div>

                        {filteredReferrals.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>No referral links yet</div>
                            <div style={{ fontSize: 12, marginTop: 4 }}>Create affiliate referral links to track registrations.</div>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {filteredReferrals.map(r => (
                              <div key={r.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 16px", background: "var(--surface)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", background: "var(--bg-2)", padding: "2px 8px", borderRadius: 6 }}>{r.code}</span>
                                  </div>
                                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--ink-3)", flexWrap: "wrap" }}>
                                    <span>👤 {r.affiliate_name}</span>
                                    <span>📅 Created {fmtDate(r.created_at)}</span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => {
                                    setEditingReferral(r);
                                    setReferralForm({ code: r.code || "", affiliate_id: r.affiliate_id || "", commission_rule: r.commission_rule ? (typeof r.commission_rule === "string" ? r.commission_rule : JSON.stringify(r.commission_rule, null, 2)) : "" });
                                    setReferralModalOpen(true);
                                  }}>Edit</button>
                                  <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#ef4444" }} onClick={() => handleReferralDelete(r)}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        MODALS
                        ══════════════════════════════════════════════ */}

                    {/* Ticket Type Modal */}
                    {ticketModalOpen && (
                      <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ background: "var(--surface)", width: "min(560px,95vw)", maxHeight: "88vh", overflowY: "auto", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingTicket ? "Edit Ticket" : "Create Ticket"}</h2>
                            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setTicketModalOpen(false)} style={{ border: "none" }}>✕</button>
                          </div>
                          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={fieldStyle}><label style={labelStyle}>Ticket Name *</label><input className="cinput" value={ticketForm.name} onChange={ev => setTicketForm(f => ({...f, name: ev.target.value}))} placeholder="e.g. General Admission" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>Description *</label><textarea className="cinput" value={ticketForm.description} onChange={ev => setTicketForm(f => ({...f, description: ev.target.value}))} placeholder="What's included..." rows={2} style={{ resize: "vertical" }} /></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Price *</label><input className="cinput" type="number" min="0" step="0.01" value={ticketForm.price} onChange={ev => setTicketForm(f => ({...f, price: ev.target.value}))} placeholder="0.00" /></div>
                              <div style={fieldStyle}><label style={labelStyle}>Currency</label><input className="cinput" value={ticketForm.currency} onChange={ev => setTicketForm(f => ({...f, currency: ev.target.value}))} placeholder="INR" /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Capacity</label><input className="cinput" type="number" min="1" value={ticketForm.capacity} onChange={ev => setTicketForm(f => ({...f, capacity: ev.target.value}))} placeholder="Unlimited" /></div>
                              <div style={fieldStyle}><label style={labelStyle}>Max per Booking</label><input className="cinput" type="number" min="1" value={ticketForm.max_per_booking} onChange={ev => setTicketForm(f => ({...f, max_per_booking: ev.target.value}))} placeholder="No limit" /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Sale Start</label><input className="cinput" type="datetime-local" value={ticketForm.sale_start} onChange={ev => setTicketForm(f => ({...f, sale_start: ev.target.value}))} /></div>
                              <div style={fieldStyle}><label style={labelStyle}>Sale End</label><input className="cinput" type="datetime-local" value={ticketForm.sale_end} onChange={ev => setTicketForm(f => ({...f, sale_end: ev.target.value}))} /></div>
                            </div>

                            <div style={fieldStyle}>
                              <label style={labelStyle}>Visibility</label>
                              <div style={{ display: "flex", gap: 16 }}>
                                {["public", "private"].map(v => (
                                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                    <input type="radio" name="tt_vis" value={v} checked={ticketForm.visibility === v} onChange={() => setTicketForm(f => ({...f, visibility: v}))} style={{ accentColor: TC_ACCENT }} />
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                            <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setTicketModalOpen(false)}>Cancel</button>
                            <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={handleTicketSubmit}>{editingTicket ? "Save Changes" : "Create Ticket"}</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Coupon Modal */}
                    {couponModalOpen && (
                      <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ background: "var(--surface)", width: "min(520px,95vw)", maxHeight: "88vh", overflowY: "auto", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingCoupon ? "Edit Coupon" : "New Coupon"}</h2>
                            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setCouponModalOpen(false)} style={{ border: "none" }}>✕</button>
                          </div>
                          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={fieldStyle}><label style={labelStyle}>Coupon Code *</label><input className="cinput" value={couponForm.code} onChange={ev => setCouponForm(f => ({...f, code: ev.target.value.toUpperCase()}))} placeholder="e.g. EARLY20" style={{ textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }} /></div>
                            <div style={fieldStyle}>
                              <label style={labelStyle}>Discount Type *</label>
                              <div style={{ display: "flex", gap: 16 }}>
                                {[["percent", "Percentage (%)"], ["flat", "Fixed Amount"]].map(([v, l]) => (
                                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                    <input type="radio" name="coup_type" value={v} checked={couponForm.discount_type === v} onChange={() => setCouponForm(f => ({...f, discount_type: v}))} style={{ accentColor: TC_ACCENT }} />
                                    {l}
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: couponForm.discount_type === "flat" ? "1fr 1fr" : "1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Discount Value *</label><input className="cinput" type="number" min="0" step="0.01" value={couponForm.discount_value} onChange={ev => setCouponForm(f => ({...f, discount_value: ev.target.value}))} placeholder={couponForm.discount_type === "percent" ? "e.g. 20" : "e.g. 500"} /></div>
                              {couponForm.discount_type === "flat" && <div style={fieldStyle}><label style={labelStyle}>Currency</label><input className="cinput" value={couponForm.currency} onChange={ev => setCouponForm(f => ({...f, currency: ev.target.value}))} placeholder="INR" /></div>}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Valid From</label><input className="cinput" type="datetime-local" value={couponForm.valid_from} onChange={ev => setCouponForm(f => ({...f, valid_from: ev.target.value}))} /></div>
                              <div style={fieldStyle}><label style={labelStyle}>Valid To</label><input className="cinput" type="datetime-local" value={couponForm.valid_to} onChange={ev => setCouponForm(f => ({...f, valid_to: ev.target.value}))} /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Max Total Uses</label><input className="cinput" type="number" min="1" value={couponForm.max_total} onChange={ev => setCouponForm(f => ({...f, max_total: ev.target.value}))} placeholder="Unlimited" /></div>
                              <div style={fieldStyle}><label style={labelStyle}>Max Per User</label><input className="cinput" type="number" min="1" value={couponForm.max_per_user} onChange={ev => setCouponForm(f => ({...f, max_per_user: ev.target.value}))} placeholder="Unlimited" /></div>
                            </div>
                            <div style={fieldStyle}>
                              <label style={labelStyle}>Status</label>
                              <div style={{ display: "flex", gap: 16 }}>
                                {["active", "inactive"].map(v => (
                                  <label key={v} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                                    <input type="radio" name="coup_status" value={v} checked={couponForm.status === v} onChange={() => setCouponForm(f => ({...f, status: v}))} style={{ accentColor: TC_ACCENT }} />
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                            <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setCouponModalOpen(false)}>Cancel</button>
                            <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={handleCouponSubmit}>{editingCoupon ? "Save Changes" : "Create Coupon"}</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Referral Modal */}
                    {referralModalOpen && (
                      <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ background: "var(--surface)", width: "min(480px,95vw)", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingReferral ? "Edit Referral Link" : "New Referral Link"}</h2>
                            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setReferralModalOpen(false)} style={{ border: "none" }}>✕</button>
                          </div>
                          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={fieldStyle}><label style={labelStyle}>Referral Code *</label><input className="cinput" value={referralForm.code} onChange={ev => setReferralForm(f => ({...f, code: ev.target.value.toUpperCase()}))} placeholder="e.g. JOHN2024" style={{ textTransform: "uppercase", fontFamily: "monospace", letterSpacing: "0.1em" }} /></div>
                            <div style={fieldStyle}>
                              <label style={labelStyle}>Affiliate *</label>
                              {affiliates.length === 0 ? (
                                <div style={{ fontSize: 13, color: "var(--ink-3)", padding: 12, border: "1px dashed var(--border)", borderRadius: "var(--r-md)", textAlign: "center" }}>No affiliates found in your account.</div>
                              ) : (
                                <select className="cselect" value={referralForm.affiliate_id} onChange={ev => setReferralForm(f => ({...f, affiliate_id: ev.target.value}))} style={{ background: "var(--field)", border: "1px solid var(--border)" }}>
                                  <option value="">Select affiliate...</option>
                                  {affiliates.map(a => <option key={a.id} value={a.id}>{a.name} {a.email ? `(${a.email})` : ""}</option>)}
                                </select>
                              )}
                            </div>
                            <div style={fieldStyle}><label style={labelStyle}>Commission Rule (JSON / Text)</label><textarea className="cinput" value={referralForm.commission_rule} onChange={ev => setReferralForm(f => ({...f, commission_rule: ev.target.value}))} placeholder='{"type":"percent","value":10} or "10% per booking"' rows={3} style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }} /></div>
                          </div>
                          <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                            <button className="hbtn hbtn--ghost" style={{ flex: 1 }} onClick={() => setReferralModalOpen(false)}>Cancel</button>
                            <button className="hbtn hbtn--primary" style={{ flex: 1 }} onClick={handleReferralSubmit}>{editingReferral ? "Save Changes" : "Create Referral"}</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tab 4: Invite */}

              {tab === "invite" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Invite Guests</h3>

                  {eventVisibility === "unlisted" && (
                    <div className="ticket-box" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Shareable view link</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>This event is unlisted, so it won't show on Discover. This link lets anyone open the event page to view it — it can be shared and opened any number of times, but it only unlocks viewing, not joining.</div>
                      </div>
                      {!inviteLinks.view && (
                        <button type="button" className="hbtn hbtn--primary" disabled={inviteLoading.view} onClick={() => generateInviteLink('view')} style={{ alignSelf: "flex-start" }}>
                          {inviteLoading.view ? "Generating..." : "+ Generate view link"}
                        </button>
                      )}
                      {inviteLinks.view && (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input className="cinput" readOnly value={inviteLinks.view} onFocus={ev => ev.target.select()} style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)", fontSize: 12 }} />
                          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => copyInviteLink(inviteLinks.view)}>Copy</button>
                        </div>
                      )}
                    </div>
                  )}

                  {eventJoinEligibility === "invite" && (
                    <div className="ticket-box" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>One-time join link</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>Join eligibility is set to invite-only. Generate a link for a guest — it unlocks the join flow and can be used once.</div>
                      </div>
                      <button type="button" className="hbtn hbtn--primary" disabled={inviteLoading.join} onClick={() => generateInviteLink('join')} style={{ alignSelf: "flex-start" }}>
                        {inviteLoading.join ? "Generating..." : "+ Generate join link"}
                      </button>
                      {inviteLinks.join.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {inviteLinks.join.map((url, i) => (
                            <div key={url + i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input className="cinput" readOnly value={url} onFocus={ev => ev.target.select()} style={{ flex: 1, background: "var(--field)", border: "1px solid var(--border)", fontSize: 12 }} />
                              <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={() => copyInviteLink(url)}>Copy</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {eventVisibility !== "unlisted" && eventJoinEligibility !== "invite" && (
                    <div className="ticket-box" style={{ padding: 20, fontSize: 13, color: "var(--ink-3)" }}>
                      This event is publicly visible with open join eligibility — no invite links are needed.
                    </div>
                  )}
                </div>
              )}


              {/* Tab: Settings */}
              {tab === "settings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Gallery Settings</h3>

                  {/* Gallery Settings Section */}
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20, background: "var(--surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Enable Gallery</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Allow media uploads and sharing.</div>
                      </div>
                      <Toggle on={galleryEnabled} onClick={() => {
                        const next = !galleryEnabled;
                        setGalleryEnabled(next);
                        let nextUploadRoles = galleryUploadRoles;
                        let nextViewRoles = galleryViewRoles;
                        if (next) {
                          nextUploadRoles = { roles: ['event_owner'] };
                          nextViewRoles = { roles: ['event_owner'] };
                          setGalleryUploadRoles(nextUploadRoles);
                          setGalleryViewRoles(nextViewRoles);
                        }
                        saveEventSettings({
                          gallery: {
                            enabled: next,
                            uploadRoles: nextUploadRoles,
                            viewRoles: nextViewRoles,
                            approvalRequired: galleryApprovalRequired,
                            videoOnly: galleryVideoOnly,
                            imageOnly: galleryImageOnly
                          }
                        });
                      }} />
                    </div>

                    {galleryEnabled && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 14, animation: "slideDown 0.3s ease-out" }}>

                        {/* Who can upload? */}
                        <div
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
                          onClick={() => setUploadRolesModalOpen(true)}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Who can upload?</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize upload permissions</div>
                          </div>
                          <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                            {getRolesSummary(galleryUploadRoles)}
                          </span>
                        </div>

                        {/* Who can view? */}
                        <div
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}
                          onClick={() => setViewRolesModalOpen(true)}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Who can view?</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize view permissions</div>
                          </div>
                          <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                            {getRolesSummary(galleryViewRoles)}
                          </span>
                        </div>

                        {/* Permission required toggle */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Permission is required</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Event managers and check-in staff must approve uploads before they appear in the gallery.</div>
                          </div>
                          <Toggle on={galleryApprovalRequired} onClick={() => {
                            const next = !galleryApprovalRequired;
                            setGalleryApprovalRequired(next);
                            saveEventSettings({
                              gallery: {
                                enabled: galleryEnabled,
                                uploadRoles: galleryUploadRoles,
                                viewRoles: galleryViewRoles,
                                approvalRequired: next,
                                videoOnly: galleryVideoOnly,
                                imageOnly: galleryImageOnly
                              }
                            });
                          }} />
                        </div>

                        {/* Media support switches: Video only and Image only */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Media Support</div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>Video only</div>
                              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Restrict uploads to video formats only.</div>
                            </div>
                            <Toggle
                              on={galleryVideoOnly}
                              onClick={() => {
                                const targetVal = !galleryVideoOnly;
                                setGalleryVideoOnly(targetVal);
                                const nextImageOnly = targetVal ? false : galleryImageOnly;
                                if (targetVal) {
                                  setGalleryImageOnly(false);
                                }
                                saveEventSettings({
                                  gallery: {
                                    enabled: galleryEnabled,
                                    uploadRoles: galleryUploadRoles,
                                    viewRoles: galleryViewRoles,
                                    approvalRequired: galleryApprovalRequired,
                                    videoOnly: targetVal,
                                    imageOnly: nextImageOnly
                                  }
                                });
                              }}
                            />
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>Image only</div>
                              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Restrict uploads to image formats only.</div>
                            </div>
                            <Toggle
                              on={galleryImageOnly}
                              onClick={() => {
                                const targetVal = !galleryImageOnly;
                                setGalleryImageOnly(targetVal);
                                const nextVideoOnly = targetVal ? false : galleryVideoOnly;
                                if (targetVal) {
                                  setGalleryVideoOnly(false);
                                }
                                saveEventSettings({
                                  gallery: {
                                    enabled: galleryEnabled,
                                    uploadRoles: galleryUploadRoles,
                                    viewRoles: galleryViewRoles,
                                    approvalRequired: galleryApprovalRequired,
                                    videoOnly: nextVideoOnly,
                                    imageOnly: targetVal
                                  }
                                });
                              }}
                            />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Discussion Settings Section */}
                  <h3 style={{ margin: "20px 0 0", fontSize: 16, fontWeight: 700 }}>Discussion Settings</h3>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20, background: "var(--surface)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Enable Discussion</div>
                        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Allow members to post and reply to threads.</div>
                      </div>
                      <Toggle on={discussionEnabled} onClick={() => {
                        const next = !discussionEnabled;
                        setDiscussionEnabled(next);
                        let nextThreadRoles = discussionThreadRoles;
                        let nextReplyRoles = discussionReplyRoles;
                        if (next) {
                          nextThreadRoles = { roles: ['event_owner'] };
                          nextReplyRoles = { roles: ['event_owner'] };
                          setDiscussionThreadRoles(nextThreadRoles);
                          setDiscussionReplyRoles(nextReplyRoles);
                        }
                        saveEventSettings({
                          discussion: {
                            enabled: next,
                            threadRoles: nextThreadRoles,
                            replyRoles: nextReplyRoles,
                            approvalRequired: discussionApprovalRequired
                          }
                        });
                      }} />
                    </div>

                    {discussionEnabled && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 14, animation: "slideDown 0.3s ease-out" }}>

                        {/* Who can create new thread? */}
                        <div
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
                          onClick={() => setThreadRolesModalOpen(true)}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Who can create new thread?</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize creation permissions</div>
                          </div>
                          <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                            {getRolesSummary(discussionThreadRoles)}
                          </span>
                        </div>

                        {/* Who can reply? */}
                        <div
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}
                          onClick={() => setReplyRolesModalOpen(true)}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Who can reply on thread?</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize reply permissions</div>
                          </div>
                          <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                            {getRolesSummary(discussionReplyRoles)}
                          </span>
                        </div>

                        {/* Is approval required toggle */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>Approval required to create a thread?</div>
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>New threads must be approved by an event manager or check-in staff before they become visible.</div>
                          </div>
                          <Toggle on={discussionApprovalRequired} onClick={() => {
                            const next = !discussionApprovalRequired;
                            setDiscussionApprovalRequired(next);
                            saveEventSettings({
                              discussion: {
                                enabled: discussionEnabled,
                                threadRoles: discussionThreadRoles,
                                replyRoles: discussionReplyRoles,
                                approvalRequired: next
                              }
                            });
                          }} />
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* Ticket sidebar — only for confirmed members / staff, not pending or non-joined visitors */}
            {tab === "about" && (
              <div className="ev-aside" style={{ width: 280, marginLeft: 20 }}>
                {claimToken && !isMember && (
                  <div className="ticket-box" style={{ cursor: "pointer", transition: "transform 0.2s" }} onClick={() => go("claim", claimToken)} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)", letterSpacing: "0.05em", marginBottom: 12 }}>
                        You have a Ticket!
                      </div>
                      <div style={{ padding: 10, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", filter: "blur(5px)", opacity: 0.9 }}>
                        {window.TicketQR ? <window.TicketQR token={claimToken} size={120} /> : <div style={{width: 120, height: 120, background: "#eee"}} />}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 16, textAlign: "center", fontWeight: 600 }}>
                        Click to claim & view ticket
                      </div>
                    </div>
                  </div>
                )}
                {isMember && (
                  <div className="ticket-box">
                    {currentEvent.bookingStatus === 'pending_payment' ? (
                      <div style={{ display: "flex", flexDirection: "column", padding: "20px 16px", background: "rgba(245,158,11,0.05)", borderRadius: "var(--r-md)", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                          <span style={{ display: "inline-flex", width: 24, height: 24, borderRadius: "50%", background: "#f59e0b", color: "#fff", alignItems: "center", justifyContent: "center" }}>
                            <I.clock style={{ width: 14, height: 14 }} />
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#92400e" }}>Payment Pending</span>
                        </div>
                        
                        <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
                          Your registration is on hold. Please complete the payment to secure your ticket.
                        </div>

                        {currentEvent.payment_instructions && (
                          <div style={{ background: "var(--surface)", padding: 12, borderRadius: 8, fontSize: 13, color: "var(--ink)", border: "1px solid var(--border)", marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                            <strong style={{ display: 'block', marginBottom: 4 }}>Payment Instructions:</strong>
                            {currentEvent.payment_instructions}
                          </div>
                        )}

                        {currentEvent.paymentProofUrl ? (
                          <div style={{ background: "rgba(16,185,129,0.1)", color: "#065f46", padding: "12px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                            <I.check style={{ width: 16, height: 16 }} />
                            <div>
                              <strong>Proof uploaded!</strong>
                              <div style={{ fontSize: 11, opacity: 0.8 }}>Waiting for organizer verification.</div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {currentEvent.holdExpiresAt && new Date(currentEvent.holdExpiresAt) > new Date() && (
                              <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600, marginBottom: 12 }}>
                                Hold expires at: {new Date(currentEvent.holdExpiresAt).toLocaleString()}
                              </div>
                            )}
                            {currentEvent.holdExpiresAt && new Date(currentEvent.holdExpiresAt) <= new Date() && (
                              <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>
                                Hold Expired. Registration may be cancelled.
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(() => {
                                const allowImg = currentEvent?.settings?.allow_image_proof === true;
                                return (
                                  <>
                                    {allowImg && <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>Submit Transaction ID or Upload Proof:</div>}
                                    <input 
                                      type="text" 
                                      className="cinput" 
                                      placeholder="Transaction ID / UTR (optional)" 
                                      value={transactionId && !transactionId.startsWith('data:') ? transactionId : ''} 
                                      onChange={e => setTransactionId(e.target.value)}
                                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--field)' }}
                                    />
                                    {allowImg && (
                                      <>
                                        <label style={{ 
                                          display: 'flex', 
                                          alignItems: 'center', 
                                          justifyContent: 'center', 
                                          gap: 8, 
                                          padding: '10px 12px', 
                                          background: transactionId.startsWith('data:') ? 'var(--green)' : 'var(--surface)', 
                                          border: transactionId.startsWith('data:') ? 'none' : '1px solid var(--border)', 
                                          borderRadius: 8, 
                                          fontSize: 13, 
                                          fontWeight: 600, 
                                          color: transactionId.startsWith('data:') ? '#fff' : 'var(--ink-2)', 
                                          cursor: 'pointer',
                                          transition: 'all 0.2s'
                                        }}>
                                          <I.image style={{ width: 16, height: 16 }} />
                                          {transactionId.startsWith('data:') ? 'Change Image' : 'Upload Image Proof'}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                          />
                                        </label>
                                        {transactionId.startsWith('data:') && (
                                          <div style={{ fontSize: 12, color: 'var(--accent-2)', fontWeight: 600, textAlign: 'center' }}>Image selected</div>
                                        )}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                              <button 
                                className="hbtn hbtn--primary" 
                                onClick={handleSubmitTransactionId} 
                                disabled={uploadingProof} 
                                style={{ width: '100%', justifyContent: 'center' }}
                              >
                                {uploadingProof ? 'Submitting...' : 'Submit Transaction Proof'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      e.online ? (
                        <OnlineMeetingCard url={e.online_link} banner={e.cover} status={currentEvent.status} isPast={e.ends_at ? new Date(e.ends_at) < new Date() : (e.starts_at ? new Date(e.starts_at) < new Date() : false)} />
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)", letterSpacing: "0.05em", marginBottom: 12 }}>
                            Your Event Ticket
                          </div>
                          <div style={{ padding: 10, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {window.TicketQR && <window.TicketQR token={e.qrToken || e.attendeeId || e.id || "test"} size={120} />}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
                            Scan QR at entry gate
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="ev-block" style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, marginTop: 0 }}>{confirmedCount} attending</h3>
                  <div className="att-grid">
                    {(hostStats?.confirmed || attendees || []).slice(0, 8).map((a, i) => {
                      const name = typeof a === 'object' ? (a.name || a.display_name) : a;
                      const userId = typeof a === 'object' ? (a.userId || a.id || a.bookingId) : undefined;
                      const picture = typeof a === 'object' ? a.picture : undefined;
                      return (
                        <div
                          key={userId || i}
                          className="att"
                          style={{ cursor: userId ? "pointer" : "default" }}
                          onClick={() => userId && go("profile", { id: userId })}
                        >
                          <Avatar name={name || "Guest"} userId={userId} img={picture} size={28} />
                          <span className="nm">{name || "Guest"}</span>
                        </div>
                      );
                    })}
                    {confirmedCount > 8 && (
                      <div className="att" style={{ paddingRight: 14 }}>
                        <div className="av" style={{ width: 28, height: 28, fontSize: 11, background: "var(--surface-2)", color: "var(--ink-2)" }}>
                          +{confirmedCount - 8}
                        </div>
                        <span className="nm">more</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="host-card" style={{ marginTop: 16 }}>
                  <div className="hh"><Avatar name={e.hostBy || e.host} userId={e.hostUserId} img={e.hostPhoto} size={46} /><div><div className="n">{e.host}</div><div className="r">{e.hostType === 'group' ? 'Group' : 'Organizer'}</div></div></div>
                  <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss an update.</div>
                </div>
              </div>
            )}

            {tab === "discussion" && discussionEnabled && (
              <DiscussionPanel
                entityType="event"
                entityId={e.id}
                token={token}
                currentUserId={currentUserId}
                isOwner={isOwner}
                isAdmin={isAdmin}
                isModerator={isModerator}
                isMember={effectiveIsMember}
                myRoleKey={myRoleKey}
                availableRoles={availableRoles}
                isTicketManager={isTicketManager}
                isScanner={isScanner}
                forumsEnabled={discussionEnabled}
                threadPerm={discussionThreadRoles}
                replyPerm={discussionReplyRoles}
                approvalRequired={discussionApprovalRequired}
                ME={ME}
              />
            )}

            {tab === "ticketing" && isTicketManager && isPaidEvent && (
              <EventTicketingTab
                e={e}
                apiBase={apiBase}
                token={token}
                isTicketManager={isTicketManager}
                isPaidEvent={isPaidEvent}
              />
            )}

            {tab === "invite" && (
              <EventInviteTab
                eventVisibility={eventVisibility}
                eventJoinEligibility={eventJoinEligibility}
                inviteLinks={inviteLinks}
                inviteLoading={inviteLoading}
                generateInviteLink={generateInviteLink}
                copyInviteLink={copyInviteLink}
              />
            )}

            {tab === "settings" && (
              <EventSettingsTab
                galleryEnabled={galleryEnabled}
                setGalleryEnabled={setGalleryEnabled}
                galleryUploadRoles={galleryUploadRoles}
                setGalleryUploadRoles={setGalleryUploadRoles}
                galleryViewRoles={galleryViewRoles}
                setGalleryViewRoles={setGalleryViewRoles}
                galleryApprovalRequired={galleryApprovalRequired}
                setGalleryApprovalRequired={setGalleryApprovalRequired}
                galleryVideoOnly={galleryVideoOnly}
                setGalleryVideoOnly={setGalleryVideoOnly}
                galleryImageOnly={galleryImageOnly}
                setGalleryImageOnly={setGalleryImageOnly}
                discussionEnabled={discussionEnabled}
                setDiscussionEnabled={setDiscussionEnabled}
                discussionThreadRoles={discussionThreadRoles}
                setDiscussionThreadRoles={setDiscussionThreadRoles}
                discussionReplyRoles={discussionReplyRoles}
                setDiscussionReplyRoles={setDiscussionReplyRoles}
                discussionApprovalRequired={discussionApprovalRequired}
                setDiscussionApprovalRequired={setDiscussionApprovalRequired}
                getRolesSummary={getRolesSummary}
                saveEventSettings={saveEventSettings}
                setUploadRolesModalOpen={setUploadRolesModalOpen}
                setViewRolesModalOpen={setViewRolesModalOpen}
                setThreadRolesModalOpen={setThreadRolesModalOpen}
                setReplyRolesModalOpen={setReplyRolesModalOpen}
              />
            )}
          </div>

          {tab === "about" && (
            <EventSidebar
              e={e}
              currentEvent={currentEvent}
              isMember={isMember}
              confirmedCount={confirmedCount}
              hostStats={hostStats}
              attendees={attendees}
              city={city}
              go={go}
              ME={ME}
              Avatar={Avatar}
            />
          )}
        </div>
      </div>

      <EventRolesModal
        isOpen={uploadRolesModalOpen}
        onClose={() => setUploadRolesModalOpen(false)}
        bucket={galleryUploadRoles}
        setBucket={(nextUpload) => {
          const nextVal = typeof nextUpload === 'function' ? nextUpload(galleryUploadRoles) : nextUpload;
          setGalleryUploadRoles(nextVal);
          const currentView = Array.isArray(galleryViewRoles?.roles)
            ? galleryViewRoles
            : { public: !!galleryViewRoles?.public, roles: legacyBucketToRoleKeys(galleryViewRoles) };
          const nextView = {
            public: !!(currentView.public || nextVal.public),
            roles: Array.from(new Set([...(currentView.roles || []), ...(nextVal.roles || [])]))
          };
          setGalleryViewRoles(nextView);
        }}
        titleText="Who can upload?"
        onSave={(next) => {
          const currentView = Array.isArray(galleryViewRoles?.roles)
            ? galleryViewRoles
            : { public: !!galleryViewRoles?.public, roles: legacyBucketToRoleKeys(galleryViewRoles) };
          const nextView = {
            public: !!(currentView.public || next.public),
            roles: Array.from(new Set([...(currentView.roles || []), ...(next.roles || [])]))
          };
          saveEventSettings({
            gallery: {
              enabled: galleryEnabled,
              uploadRoles: next,
              viewRoles: nextView,
              approvalRequired: galleryApprovalRequired,
              videoOnly: galleryVideoOnly,
              imageOnly: galleryImageOnly
            }
          });
        }}
        availableRoles={availableRoles || []}
      />

      <EventRolesModal
        isOpen={viewRolesModalOpen}
        onClose={() => setViewRolesModalOpen(false)}
        bucket={galleryViewRoles}
        setBucket={setGalleryViewRoles}
        titleText="Who can view?"
        onSave={(next) => {
          saveEventSettings({
            gallery: {
              enabled: galleryEnabled,
              uploadRoles: galleryUploadRoles,
              viewRoles: next,
              approvalRequired: galleryApprovalRequired,
              videoOnly: galleryVideoOnly,
              imageOnly: galleryImageOnly
            }
          });
        }}
        availableRoles={availableRoles || []}
      />

      <EventRolesModal
        isOpen={threadRolesModalOpen}
        onClose={() => setThreadRolesModalOpen(false)}
        bucket={discussionThreadRoles}
        setBucket={(nextThread) => {
          const nextVal = typeof nextThread === 'function' ? nextThread(discussionThreadRoles) : nextThread;
          setDiscussionThreadRoles(nextVal);
          const currentReply = Array.isArray(discussionReplyRoles?.roles)
            ? discussionReplyRoles
            : { public: !!discussionReplyRoles?.public, roles: legacyBucketToRoleKeys(discussionReplyRoles) };
          const nextReply = {
            public: !!(currentReply.public || nextVal.public),
            roles: Array.from(new Set([...(currentReply.roles || []), ...(nextVal.roles || [])]))
          };
          setDiscussionReplyRoles(nextReply);
        }}
        titleText="Who can create new thread?"
        onSave={(next) => {
          const currentReply = Array.isArray(discussionReplyRoles?.roles)
            ? discussionReplyRoles
            : { public: !!discussionReplyRoles?.public, roles: legacyBucketToRoleKeys(discussionReplyRoles) };
          const nextReply = {
            public: !!(currentReply.public || next.public),
            roles: Array.from(new Set([...(currentReply.roles || []), ...(next.roles || [])]))
          };
          saveEventSettings({
            discussion: {
              enabled: discussionEnabled,
              threadRoles: next,
              replyRoles: nextReply,
              approvalRequired: discussionApprovalRequired
            }
          });
        }}
        availableRoles={availableRoles || []}
      />

      <EventRolesModal
        isOpen={replyRolesModalOpen}
        onClose={() => setReplyRolesModalOpen(false)}
        bucket={discussionReplyRoles}
        setBucket={setDiscussionReplyRoles}
        titleText="Who can reply on thread?"
        onSave={(next) => {
          saveEventSettings({
            discussion: {
              enabled: discussionEnabled,
              threadRoles: discussionThreadRoles,
              replyRoles: next,
              approvalRequired: discussionApprovalRequired
            }
          });
        }}
        availableRoles={availableRoles || []}
      />

      <EventMemberResponseModal
        member={responseMember}
        onClose={() => setResponseMember(null)}
        getQuestionLabel={(fieldId) => getQuestionLabel(currentEvent.formFields || [], fieldId)}
        Avatar={Avatar}
      />
    </div>
  );
}

Object.assign(window, { EventPage });
