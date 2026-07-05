// @ts-nocheck
/* ============================================================
   Samaagum — Event Page (Luma-grade with tabs matching screenshot)
   ============================================================ */

function Toggle({ on, onClick }) { return <button className={`tg ${on ? "on" : ""}`} onClick={onClick} />; }

function EventPage({ ev, st, go }) {
  let e = ev || FEATURED;
  var { useState, useRef } = React;

  // Normalize if it's a database event
  if (e && (e.starts_at || typeof e.venue === 'object' || typeof e.venue === 'string')) {
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

    let venueObj = {};
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

    let meta = {};
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

    const priceVal = e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : ((e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : '—');

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
      host: e.host || ME.name || "Organizer",
      hostBy: e.hostBy || ME.name || "Organizer",
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
  } else if (e) {
    if (typeof e.venue === 'object' && e.venue !== null) {
      e = {
        ...e,
        venue: e.venue.name || e.venue.address || 'Venue TBD',
        gallery: e.venue.meta?.gallery || {
          enabled: false,
          uploadRoles: { owner: true, admin: true, moderator: true, public: false },
          viewRoles: { owner: true, admin: true, moderator: true, public: true },
          approvalRequired: false,
          videoOnly: false,
          imageOnly: false
        }
      };
    }
  }

  const { saved, toggleSave, city } = st;
  const isSaved = saved.has(e.id);

  const [currentEvent, setCurrentEvent] = useState(e);
  const [hostStats, setHostStats] = useState(null);
  const [eventMembers, setEventMembers] = useState(null);
  const [availableRoles, setAvailableRoles] = useState(null);

  // isOwner checks both prop (e.created_by) and the richer server-fetched currentEvent.created_by
  const isOwner = (
    (e.created_by && e.created_by === ME.id) ||
    (currentEvent.created_by && currentEvent.created_by === ME.id) ||
    e.id === "new"
  );
  const isAdmin = ME.role && ME.role.toLowerCase().includes("admin");
  const isModerator = ME.role && ME.role.toLowerCase().includes("moderator");
  // Booking status — passed from home-app router or fetched from server
  const bookingStatusProp = currentEvent.bookingStatus || e.bookingStatus || null;
  const isJoined = bookingStatusProp === 'confirmed';
  const isPending = bookingStatusProp === 'pending_approval';
  const isMember = isOwner || isAdmin || isModerator || isJoined;

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

  const saveEventSettings = async (updatedVenueMeta) => {
    try {
      const token = localStorage.getItem('token');
      // Use the preserved raw venue object — NOT the display string
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
        // Update currentEvent.venue_raw locally so the sync useEffect
        // reads the new values without a full refetch (which would reset toggles)
        setCurrentEvent(prev => ({
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
    if (e.id === "new") {
      // Mock/Preview mode: populate state directly from the preview object
      const venueObj = e.venue || {};
      const meta = venueObj.meta || {};
      const dateObj = e.starts_at ? new Date(e.starts_at) : new Date();
      const month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
      const day = dateObj.getDate();
      const dateStr = dateObj.toLocaleDateString();
      const time = dateObj.toLocaleTimeString();

      const priceVal = e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : ((e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : '—');

      const normalized = {
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
        host: e.host || ME.name || "Organizer",
        hostBy: e.hostBy || ME.name || "Organizer",
        attendees: e.attendees || [],
        instructions: e.instruction || e.instructions || meta.instructions || "",
        formFields: e.formFields || meta.formFields || [],
        bookingStatus: e.bookingStatus,
        gallery: meta.gallery || e.gallery || {
          enabled: false,
          uploadRoles: { owner: true, admin: true, moderator: true, public: false },
          viewRoles: { owner: true, admin: true, moderator: true, public: true },
          approvalRequired: false,
          videoOnly: false,
          imageOnly: false
        },
        venue_raw: venueObj
      };
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
        let ev = data.data.event;
        const venueObj = ev.venue || {};
        const meta = venueObj.meta || {};
        const dateObj = ev.starts_at ? new Date(ev.starts_at) : new Date();
        const month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
        const day = dateObj.getDate();
        const dateStr = dateObj.toLocaleDateString();
        const time = dateObj.toLocaleTimeString();

        const priceVal = data.data.tickets?.[0] ? `₹${(data.data.tickets[0].price_minor / 100).toFixed(0)}` : ((ev.registration_mode === 'free' || ev.registration_mode === 'free_rsvp') ? 'Free' : '—');

        const normalized = {
          ...ev,
          desc: ev.description || ev.desc,
          cover: ev.cover || meta.cover || "",
          cat: meta.category || ev.cat || "General",
          type: (ev.registration_mode === 'free' || ev.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
          online: ev.location_type === 'online',
          month,
          day,
          date: dateStr,
          time,
          venue: ev.location_type === 'online' ? 'Online' : (venueObj.name || venueObj.address || 'Venue TBD'),
          city: ev.city || (ev.location_type === 'online' ? 'Online' : (venueObj.address ? (typeof venueObj.address === 'string' ? venueObj.address.split(',').pop().trim() : '') : '')),
          going: ev.going || 0,
          cap: ev.capacity_total || ev.cap || 9999,
          price: priceVal,
          host: ev.host || ME.name || "Organizer",
          hostBy: ev.hostBy || ME.name || "Organizer",
          attendees: data.data.attendees || [],
          instructions: ev.instruction || ev.instructions || meta.instructions || "",
          formFields: ev.formFields || meta.formFields || [],
          bookingStatus: data.data.bookingStatus,
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

  const fetchHostStats = async () => {
    if (e.id === "new") return;
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
    if (e.id === "new") return;
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

  const handleHostRequestAction = async (bookingId, action) => {
    if (e.id === "new") return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/requests/${bookingId}/action`, {
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
        if (window.toast) {
          const msg = action === 'accept' ? "Request approved! 🎉" : "Request declined.";
          window.toast(msg, action === 'accept' ? "success" : "warning");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventGallery = async () => {
    if (e.id === "new") return;
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

  useEffect(() => {
    fetchEventDetails();
    fetchEventMembers();
    fetchEventGallery();
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/api/events/available-roles`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
    if (!e?.id || !window.io) return;
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = window.io(socketUrl, { transports: ['websocket'] });
    socket.emit('join_event', e.id);
    socket.on('dashboard_updated', () => {
      fetchEventDetails();
      if (isOwner || isAdmin || isModerator) {
        fetchHostStats();
      }
      // Also refresh the parent's joinedEvents list so My Events page updates
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
    uploadRoles: { owner: true, admin: true, moderator: true, public: false },
    viewRoles: { owner: true, admin: true, moderator: true, public: true },
    approvalRequired: false,
    videoOnly: false,
    imageOnly: false
  };

  // Gallery Settings states in the Advance Settings panel
  const [galleryEnabled, setGalleryEnabled] = useState(initialGallery.enabled);
  const [galleryUploadRoles, setGalleryUploadRoles] = useState(initialGallery.uploadRoles);
  const [galleryViewRoles, setGalleryViewRoles] = useState(initialGallery.viewRoles);
  const [galleryApprovalRequired, setGalleryApprovalRequired] = useState(initialGallery.approvalRequired);
  const [galleryVideoOnly, setGalleryVideoOnly] = useState(initialGallery.videoOnly);
  const [galleryImageOnly, setGalleryImageOnly] = useState(initialGallery.imageOnly);

  const [uploadRolesModalOpen, setUploadRolesModalOpen] = useState(false);
  const [viewRolesModalOpen, setViewRolesModalOpen] = useState(false);

  // Discussion states
  const [discussionEnabled, setDiscussionEnabled] = useState(false);
  const [discussionThreadRoles, setDiscussionThreadRoles] = useState({ owner: true, admin: true, moderator: true, public: true });
  const [discussionReplyRoles, setDiscussionReplyRoles] = useState({ owner: true, admin: true, moderator: true, public: true });
  const [discussionApprovalRequired, setDiscussionApprovalRequired] = useState(false);
  const [threadRolesModalOpen, setThreadRolesModalOpen] = useState(false);
  const [replyRolesModalOpen, setReplyRolesModalOpen] = useState(false);

  useEffect(() => {
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
  let currentUserId = null;
  if (token) {
    try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (err) { }
  }

  const roleHasCap = (roleKey, cap) => (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes(cap);

  const myMemberEntry = eventMembers ? eventMembers.find(m => m.id === currentUserId || (window.ME && m.id === window.ME.id)) : null;
  const isHostOrCoHost = isOwner || !!(myMemberEntry && roleHasCap(myMemberEntry.role, 'event.manage'));
  const isTicketManager = isHostOrCoHost || !!(myMemberEntry && roleHasCap(myMemberEntry.role, 'event.configure_tickets'));
  const isScanner = !isTicketManager && !!(myMemberEntry && roleHasCap(myMemberEntry.role, 'checkin.gate_staff'));
  const effectiveIsMember = isMember || !!myMemberEntry;

  // Effective RBAC role key for this user on this event — mirrors EventService.getEventUserRole:
  // owner -> top seeded role key, staff -> their assigned role key, confirmed booking -> 'member'.
  const myRoleKey = isOwner ? (availableRoles || [])[0]?.key : (myMemberEntry?.role || (effectiveIsMember ? 'member' : null));

  // Evaluates a gallery/discussion permission bucket. New shape ({public, roles}) is checked
  // dynamically against availableRoles; legacy shape ({owner,admin,moderator,member,public})
  // keeps its original behavior unchanged until an admin re-saves via the new roles modal.
  const checkRoleBucket = (bucket, bypass) => {
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

  // Gallery/Discussion tabs visible to owners, admins, moderators, AND confirmed joiners
  const canViewGallery = galleryEnabled && checkRoleBucket(galleryViewRoles, isTicketManager);
  const canUploadToGallery = galleryEnabled && checkRoleBucket(galleryUploadRoles, isTicketManager);
  const canAccessDiscussion = effectiveIsMember ||
    checkRoleBucket(discussionThreadRoles, isTicketManager) ||
    checkRoleBucket(discussionReplyRoles, isTicketManager);

  // Tab State
  const [tab, setTab] = useState("about"); // about | members | gallery | discussion | ticketing | invite | settings

  const pendingCount = (hostStats?.requests || []).length;
  const confirmedCount = (hostStats?.confirmed || attendees || []).length;
  const isPaidEvent = currentEvent.registration_mode === 'paid' || e.registration_mode === 'paid';

  const tabs = e.id === "new" ? [["about", "About"]] : [
    ["about", "About"],
    ...(effectiveIsMember ? [["members", `Members${pendingCount > 0 && (isTicketManager || isAdmin || isModerator) ? ` · 🔴${pendingCount}` : ""}`]] : []),
    ...(canViewGallery ? [["gallery", "Gallery"]] : []),
    ...(discussionEnabled && canAccessDiscussion ? [["discussion", "Discussion"]] : []),
    ...(isTicketManager && isPaidEvent ? [["ticketing", "🎟 Ticketing"]] : []),
    ...(isTicketManager ? [["invite", "Invite"]] : []),
    ...(isTicketManager ? [["settings", "Advance setting"]] : [])
  ];

  // Gallery items state
  const [galleryItems, setGalleryItems] = useState([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");

  const galleryInputRef = useRef(null);
  const attendees = currentEvent.attendees || [];

  // ── Ticketing & Coupons State ──
  const [tcTab, setTcTab] = useState("tickets"); // tickets | coupons | referrals
  const [tcLoading, setTcLoading] = useState(false);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [tcCoupons, setTcCoupons] = useState([]);
  const [tcReferrals, setTcReferrals] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [ticketSearch, setTicketSearch] = useState("");
  const [couponSearch, setCouponSearch] = useState("");
  const [referralSearch, setReferralSearch] = useState("");

  // Ticket modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [ticketForm, setTicketForm] = useState({ name: "", description: "", price: "", currency: "INR", capacity: "", max_per_booking: "", sale_start: "", sale_end: "", early_bird_price: "", early_bird_currency: "INR", early_bird_ends_at: "", visibility: "public" });

  // Coupon modal state
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percent", discount_value: "", currency: "INR", valid_from: "", valid_to: "", max_total: "", max_per_user: "", status: "active" });

  // Referral modal state
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [referralForm, setReferralForm] = useState({ code: "", affiliate_id: "", commission_rule: "" });

  const fetchTicketTypes = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/ticket-types`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setTicketTypes(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTcCoupons = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/coupons`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setTcCoupons(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchTcReferrals = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/${e.id}/referrals`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setTcReferrals(data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAffiliates = async () => {
    try {
      const res = await fetch(`${apiBase}/api/events/affiliates`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      const data = await res.json();
      if (data.success) setAffiliates(data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (tab === "ticketing" && isTicketManager && isPaidEvent) {
      setTcLoading(true);
      Promise.all([fetchTicketTypes(), fetchTcCoupons(), fetchTcReferrals(), fetchAffiliates()])
        .finally(() => setTcLoading(false));
    }
  }, [tab, e.id]);

  const handleInviteSubmit = (event) => {
    event.preventDefault();
    if (!newInviteEmail) return;
    alert(`Invitation sent to ${newInviteEmail}`);
    setNewInviteEmail("");
  };

  const handleLeaveEvent = async () => {
    if (!confirm("Are you sure you want to leave this event?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert("You have left the event successfully.");
        go("home");
      } else {
        alert(data.message || "Failed to leave event");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to leave event due to a network error.");
    }
  };

  const handleArchiveEvent = async () => {
    if (!confirm("Archive this event? It will be marked as cancelled and moved to Archived in My Events. This cannot be undone.")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/events/${e.id}/archive`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Update local state so the page shows archived status immediately
        setCurrentEvent(prev => ({ ...(prev || e), status: 'cancelled' }));
        // Refresh the created events list in the parent state so My Events tab updates
        if (st?.setCreatedEvents) {
          st.setCreatedEvents(prev =>
            prev.map(ev => ev.id === e.id ? { ...ev, status: 'cancelled' } : ev)
          );
        }
      } else {
        alert(data.message || "Failed to archive event.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to archive event due to a network error.");
    }
  };

  // Translates a legacy {owner,admin,moderator,member,public} bucket into the new dynamic
  // {public, roles: string[]} shape the first time it's edited via the roles modal below.
  const legacyBucketToRoleKeys = (bucket) => {
    const keys = [];
    if (bucket?.owner) keys.push('event_owner', 'event_manager');
    if (bucket?.admin) keys.push('co_host');
    if (bucket?.moderator) keys.push('checkin_lead', 'gate_staff', 'session_gate_staff', 'ticket_scanner');
    if (bucket?.member) keys.push('member');
    const validKeys = new Set((availableRoles || []).map(r => r.key));
    return keys.filter(k => validKeys.has(k));
  };

  const getRolesSummary = (bucket) => {
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
    // Legacy shape — unchanged summary logic until re-saved via the new roles modal
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

  const renderRolesModal = (isOpen, onClose, bucket, setBucket, titleText, onSave) => {
    if (!isOpen) return null;
    const isNewShape = Array.isArray(bucket?.roles);
    const current = isNewShape ? bucket : { public: !!bucket?.public, roles: legacyBucketToRoleKeys(bucket) };

    const togglePublic = () => {
      const next = { ...current, public: !current.public };
      setBucket(next);
      if (onSave) onSave(next);
    };

    const toggleRole = (key) => {
      const roles = current.roles.includes(key) ? current.roles.filter(k => k !== key) : [...current.roles, key];
      const next = { public: current.public, roles };
      setBucket(next);
      if (onSave) onSave(next);
    };

    return (
      <div className="modal-overlay" style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.5)", display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 10000
      }}>
        <div className="modal-content" style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)", width: "90%", maxWidth: "380px",
          padding: "24px", boxShadow: "var(--sh-xl)", color: "var(--ink)"
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>{titleText}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, maxHeight: "50vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--border-3)" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Public (Everyone)</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Opens this to everyone, including non-members — overrides role selection below.</div>
              </div>
              <Toggle on={current.public} onClick={togglePublic} />
            </div>
            {(availableRoles || []).map(r => (
              <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: current.public ? 0.5 : 1 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.display_name}</span>
                <Toggle on={current.roles.includes(r.key)} onClick={() => toggleRole(r.key)} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="hbtn hbtn--primary hbtn--sm" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scroll">
      <div className="view-enter">
        {/* Banner section */}
        <div className="detail-cover" style={{
          height: 200,
          backgroundSize: "cover",
          backgroundPosition: "center",
          background: e.cover && (e.cover.startsWith("linear-gradient") || e.cover.startsWith("radial-gradient") || e.cover.startsWith("var(")) ? e.cover : `url(${e.cover}) center/cover no-repeat`
        }}>
          {!e.cover && <Grain />}
          <div className="scrim" />
          <button className="detail-back" style={{ top: 20, left: 20 }} onClick={() => (e.id === "new" && e.__draft) ? go("edit-event", { __draft: e.__draft }) : go("home")}><I.arrowL />Back</button>
        </div>

        {/* Group details header container */}
        <div className="grp-detail">
          <div className="grp-head">
            {/* Custom visual event icon box */}
            <div className="gicon-lg" style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              boxShadow: "0 8px 24px rgba(59, 130, 246, 0.25)"
            }}>
              📅
            </div>

            <div className="gh-meta">
              <div className="nm">{e.title}</div>
              <div className="sub">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <I.users /> {attendees.length} members
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1f9d57", fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bb673" }} />
                  {e.online ? "Online" : "In-person"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  🎫 {e.price}
                </span>
                <span className="fchip on" style={{ pointerEvents: "none", padding: "4px 11px", fontSize: 12 }}>
                  {e.cat || "Event"}
                </span>
              </div>
            </div>

            <div className="gh-act">
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => toggleSave(e.id)}>
                {isSaved ? <I.bookmarkF /> : <I.bookmark />} Save
              </button>
              {isHostOrCoHost && (
                <>
                  <button className="hbtn hbtn--soft hbtn--sm" onClick={() => go("edit-event", currentEvent || e)}>
                    <I.edit style={{ width: 14 }} /> Edit Event
                  </button>
                  <button className="hbtn hbtn--sm" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }} onClick={handleArchiveEvent}>
                    Archive
                  </button>
                </>
              )}
              {effectiveIsMember && (
                <button className="hbtn hbtn--sm" style={{ background: "#e5484d", color: "#fff" }} onClick={handleLeaveEvent}>
                  Leave Event
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="grp-tabs">
            {tabs.map(([k, l]) => (
              <button key={k} className={`grp-tab ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>

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

                  {!e.online && e.venue && (
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
                  )}

                  {e.instructions && (
                    <div className="ev-block" style={{ background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px" }}>
                      <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 700 }}>📢 Special Instructions</h3>
                      <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)" }}>{e.instructions}</p>
                    </div>
                  )}
                </div>
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
                                  <Avatar name={r.name || "User"} size={38} />
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>{r.name || "Unknown"}</div>
                                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{r.email || ""}</div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button className="hbtn hbtn--ghost hbtn--sm"
                                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "20px", padding: "6px 16px", fontSize: 13, fontWeight: 600 }}
                                    onClick={() => handleHostRequestAction(r.bookingId, 'decline')}>
                                    Decline
                                  </button>
                                  <button className="hbtn hbtn--primary hbtn--sm"
                                    style={{ background: "linear-gradient(135deg,#ff6b4a,#ff4d8d)", border: "none", borderRadius: "20px", padding: "6px 18px", fontSize: 13, fontWeight: 600, color: "#fff" }}
                                    onClick={() => handleHostRequestAction(r.bookingId, 'accept')}>
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
                                  {Object.entries(r.answers).map(([key, val]) => (
                                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                      <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>Q: {key}</div>
                                      <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>A: {String(val)}</div>
                                    </div>
                                  ))}
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
                                    <Avatar name={name} size={32} />
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
                          <div style={{ width: "100%", height: "100%", background: item.url && (item.url.startsWith("linear-gradient") || item.url.startsWith("radial-gradient") || item.url.startsWith("var(")) ? item.url : `url(${item.url}) center/cover no-repeat` }} />
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
                            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{editingTicket ? "Edit Ticket Type" : "New Ticket Type"}</h2>
                            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setTicketModalOpen(false)} style={{ border: "none" }}>✕</button>
                          </div>
                          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={fieldStyle}><label style={labelStyle}>Ticket Name *</label><input className="cinput" value={ticketForm.name} onChange={ev => setTicketForm(f => ({...f, name: ev.target.value}))} placeholder="e.g. General Admission" /></div>
                            <div style={fieldStyle}><label style={labelStyle}>Description</label><textarea className="cinput" value={ticketForm.description} onChange={ev => setTicketForm(f => ({...f, description: ev.target.value}))} placeholder="What's included..." rows={2} style={{ resize: "vertical" }} /></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>Price</label><input className="cinput" type="number" min="0" step="0.01" value={ticketForm.price} onChange={ev => setTicketForm(f => ({...f, price: ev.target.value}))} placeholder="0.00" /></div>
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
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>Early Bird (Optional)</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                              <div style={fieldStyle}><label style={labelStyle}>EB Price</label><input className="cinput" type="number" min="0" step="0.01" value={ticketForm.early_bird_price} onChange={ev => setTicketForm(f => ({...f, early_bird_price: ev.target.value}))} placeholder="0.00" /></div>
                              <div style={fieldStyle}><label style={labelStyle}>EB Currency</label><input className="cinput" value={ticketForm.early_bird_currency} onChange={ev => setTicketForm(f => ({...f, early_bird_currency: ev.target.value}))} placeholder="INR" /></div>
                              <div style={fieldStyle}><label style={labelStyle}>EB Ends At</label><input className="cinput" type="datetime-local" value={ticketForm.early_bird_ends_at} onChange={ev => setTicketForm(f => ({...f, early_bird_ends_at: ev.target.value}))} /></div>
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
                  <div className="ticket-box" style={{ padding: 20 }}>
                    <form onSubmit={handleInviteSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div className="cfield">
                        <label>Invite by Email Address</label>
                        <input className="cinput" type="email" placeholder="friend@example.com" value={newInviteEmail} onChange={e => setNewInviteEmail(e.target.value)} style={{ background: "var(--field)", border: "1px solid var(--border)" }} />
                      </div>
                      <button type="submit" className="hbtn hbtn--primary">Send Invitation</button>
                    </form>
                  </div>
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
                        saveEventSettings({
                          gallery: {
                            enabled: next,
                            uploadRoles: galleryUploadRoles,
                            viewRoles: galleryViewRoles,
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
                        saveEventSettings({
                          discussion: {
                            enabled: next,
                            threadRoles: discussionThreadRoles,
                            replyRoles: discussionReplyRoles,
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
                {isMember && (
                  <div className="ticket-box">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "var(--accent-2)", letterSpacing: "0.05em", marginBottom: 12 }}>
                        Your Event Ticket
                      </div>
                      <div style={{ padding: 10, background: "#fff", borderRadius: "var(--r-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.06)", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <QRCode seed={e.id || "test"} size={120} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 10, textAlign: "center" }}>
                        Scan QR at entry gate
                      </div>
                    </div>
                  </div>
                )}

                <div className="ev-block" style={{ marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, marginTop: 0 }}>{confirmedCount} attending</h3>
                  <div className="att-grid">
                    {(hostStats?.confirmed || attendees || []).slice(0, 8).map((a, i) => (
                      <div
                        key={a.id || a.userId || a.bookingId || i}
                        className="att"
                        style={{ cursor: a.userId ? "pointer" : "default" }}
                        onClick={() => a.userId && go("profile", { id: a.userId })}
                      >
                        <Avatar name={a.name || "Guest"} size={28} />
                        <span className="nm">{a.name || "Guest"}</span>
                      </div>
                    ))}
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
                  <div className="hh"><Avatar name={e.hostBy || e.host} size={46} /><div><div className="n">{e.host}</div><div className="r">Organizer</div></div></div>
                  <div className="hb">Curating the best gatherings in {e.city || city}. Follow to never miss an update.</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Roles Selection Modals */}
      {renderRolesModal(uploadRolesModalOpen, () => setUploadRolesModalOpen(false), galleryUploadRoles, setGalleryUploadRoles, "Who can upload?", (next) => {
        saveEventSettings({
          gallery: {
            enabled: galleryEnabled,
            uploadRoles: next,
            viewRoles: galleryViewRoles,
            approvalRequired: galleryApprovalRequired,
            videoOnly: galleryVideoOnly,
            imageOnly: galleryImageOnly
          }
        });
      })}
      {renderRolesModal(viewRolesModalOpen, () => setViewRolesModalOpen(false), galleryViewRoles, setGalleryViewRoles, "Who can view?", (next) => {
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
      })}
      {renderRolesModal(threadRolesModalOpen, () => setThreadRolesModalOpen(false), discussionThreadRoles, setDiscussionThreadRoles, "Who can create new thread?", (next) => {
        saveEventSettings({
          discussion: {
            enabled: discussionEnabled,
            threadRoles: next,
            replyRoles: discussionReplyRoles,
            approvalRequired: discussionApprovalRequired
          }
        });
      })}
      {renderRolesModal(replyRolesModalOpen, () => setReplyRolesModalOpen(false), discussionReplyRoles, setDiscussionReplyRoles, "Who can reply on thread?", (next) => {
        saveEventSettings({
          discussion: {
            enabled: discussionEnabled,
            threadRoles: discussionThreadRoles,
            replyRoles: next,
            approvalRequired: discussionApprovalRequired
          }
        });
      })}
    </div>
  );
}

Object.assign(window, { EventPage });
