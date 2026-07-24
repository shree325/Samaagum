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

import { OnlineMeetingCard } from './OnlineMeetingCard';

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return <button type="button" className={`tg ${on ? "on" : ""}`} onClick={onClick} />;
}

export function EventPage({ ev, st, go }: { ev: any; st: any; go: (view: string, params?: any) => void }) {
  let initialNormalized = ev || FEATURED;
  if (initialNormalized && (initialNormalized.starts_at || typeof initialNormalized.venue === 'object' || typeof initialNormalized.venue === 'string')) {
    initialNormalized = normalizeEventData(initialNormalized, ME, st.city);
  } else if (initialNormalized && typeof initialNormalized.venue === 'object' && initialNormalized.venue !== null) {
    initialNormalized = {
      ...initialNormalized,
      venue: initialNormalized.venue.name || initialNormalized.venue.address || 'Venue TBD',
      gallery: initialNormalized.venue.meta?.gallery || {
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
  const claimToken = typeof window !== 'undefined' ? (window.location.hash.split('claim=')[1]?.split('&')[0] || new URLSearchParams(window.location.search).get("claim") || initialNormalized.inviteToken) : null;
  const isSaved = wishlisted ? wishlisted.has(initialNormalized.id) : false;

  const [currentEvent, setCurrentEvent] = useState(initialNormalized);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);

  const e = { ...initialNormalized, ...currentEvent };
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
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success && data.data) {
        const normalizedEvent = normalizeEventData(data.data.event, ME, st.city);
        normalizedEvent.attendees = data.data.attendees || [];
        normalizedEvent.bookingStatus = data.data.bookingStatus;
        normalizedEvent.bookingId = data.data.bookingId;
        normalizedEvent.paymentProofUrl = data.data.paymentProofUrl;
        normalizedEvent.holdExpiresAt = data.data.holdExpiresAt;
        normalizedEvent.payment_instructions = data.data.event.payment_instructions;
        normalizedEvent.attendeeId = data.data.attendeeId;
        normalizedEvent.ticketId = data.data.ticketId;
        normalizedEvent.qrToken = data.data.qrToken;
        normalizedEvent.checkinStatus = data.data.checkinStatus;

        setCurrentEvent(normalizedEvent);
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
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
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
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setEventMembers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHostRequestAction = async (attendeeId: string, action: 'accept' | 'decline') => {
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
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
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

  const myRoleKey = isOwner ? (availableRoles || [])[0]?.key : (myMemberEntry?.role || (effectiveIsMember ? 'registered_user' : null));

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
    if (bucket?.member) keys.push('registered_user');
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
              <EventDashboard ev={currentEvent || e} st={st} go={go} embedded={true} onTabChange={setTab} />
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
              claimToken={claimToken}
              apiBase={apiBase}
              onPaymentProofUploaded={(url: string) => {
                setCurrentEvent((prev: any) => ({ ...prev, paymentProofUrl: url }));
              }}
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
