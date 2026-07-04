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

  const isOwner = e.hostBy === ME.name || e.host === ME.name || e.created_by === ME.id;
  const isAdmin = ME.role && ME.role.toLowerCase().includes("admin");
  const isModerator = ME.role && ME.role.toLowerCase().includes("moderator");
  // Booking status — passed from home-app router or fetched from server
  const bookingStatusProp = e.bookingStatus || null;
  const isJoined = bookingStatusProp === 'confirmed';
  const isPending = bookingStatusProp === 'pending_approval';
  const isMember = isOwner || isAdmin || isModerator || isJoined;

  const [currentEvent, setCurrentEvent] = useState(e);
  const [hostStats, setHostStats] = useState(null);
  
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

  const handleHostRequestAction = async (bookingId, action) => {
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

  useEffect(() => {
    fetchEventDetails();
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
    try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (err) {}
  }

  // Gallery/Discussion tabs visible to owners, admins, moderators, AND confirmed joiners
  const canViewGallery = galleryEnabled && (
    galleryViewRoles.public ||
    (isMember && (galleryViewRoles.owner || galleryViewRoles.admin || galleryViewRoles.moderator)) ||
    (isOwner && galleryViewRoles.owner) ||
    (isAdmin && galleryViewRoles.admin) ||
    (isModerator && galleryViewRoles.moderator)
  );

  const canUploadToGallery = galleryEnabled && (
    galleryUploadRoles.public ||
    (isOwner && galleryUploadRoles.owner) ||
    (isAdmin && galleryUploadRoles.admin) ||
    (isModerator && galleryUploadRoles.moderator)
  );

  // Tab State
  const [tab, setTab] = useState("about"); // about | members | gallery | discussion | invite | settings

  const pendingCount = (hostStats?.requests || []).length;
  const confirmedCount = (hostStats?.confirmed || attendees || []).length;

  const tabs = [
    ["about", "About"],
    ["members", isMember ? `Members${pendingCount > 0 && (isOwner || isAdmin || isModerator) ? ` · 🔴${pendingCount}` : ""}` : "Members"],
    ...(canViewGallery ? [["gallery", "Gallery"]] : []),
    ...(discussionEnabled && isMember ? [["discussion", "Discussion"]] : []),
    ...((isOwner || isAdmin || isModerator) ? [["invite", "Invite"]] : []),
    ...((isOwner || isAdmin || isModerator) ? [["settings", "Advance setting"]] : [])
  ];

  // Gallery items state
  const [galleryItems, setGalleryItems] = useState([
    { id: 1, url: e.cover || "linear-gradient(135deg,#ff6b4a 0%,#ff4d8d 100%)", type: "image", approved: true }
  ]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");

  const galleryInputRef = useRef(null);
  const attendees = currentEvent.attendees || [];

  const handleInviteSubmit = (event) => {
    event.preventDefault();
    if (!newInviteEmail) return;
    alert(`Invitation sent to ${newInviteEmail}`);
    setNewInviteEmail("");
  };

  const getRolesSummary = (roles) => {
    if (roles.public) return "Public";
    const selected = [];
    if (roles.owner) selected.push("Owner");
    if (roles.admin) selected.push("Admin");
    if (roles.moderator) selected.push("Moderator");

    if (selected.length === 0) return "No one";
    if (selected.length === 1 && selected[0] === "Admin") return "Admin only";
    if (selected.length === 2 && selected.includes("Admin") && selected.includes("Owner")) return "Admin and Owner only";
    if (selected.length === 3 && selected.includes("Admin") && selected.includes("Owner") && selected.includes("Moderator")) return "Admin, Owner and Moderator only";

    return selected.join(" & ") + " only";
  };

  const renderRolesModal = (isOpen, onClose, roles, setRoles, titleText, onSave) => {
    if (!isOpen) return null;
    const options = [
      { key: "owner", label: "Owner" },
      { key: "admin", label: "Admin" },
      { key: "moderator", label: "Moderator" },
      { key: "public", label: "Public" }
    ];

    const toggleRole = (key) => {
      const next = { ...roles, [key]: !roles[key] };
      setRoles(next);
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
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {options.map(opt => (
              <div key={opt.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{opt.label}</span>
                <Toggle on={roles[opt.key]} onClick={() => toggleRole(opt.key)} />
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
                <span className="fchip on" style={{ pointerEvents:"none", padding: "4px 11px", fontSize: 12 }}>
                  {e.cat || "Event"}
                </span>
              </div>
            </div>

            <div className="gh-act">
              <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => toggleSave(e.id)}>
                {isSaved ? <I.bookmarkF /> : <I.bookmark />} Save
              </button>
              {(isOwner || isAdmin || isModerator) && (
                <>
                  <button className="hbtn hbtn--soft hbtn--sm" onClick={() => go("edit-event", e)}>
                    <I.edit style={{ width: 14 }} /> Edit Event
                  </button>
                  <button className="hbtn hbtn--sm" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }} onClick={() => {
                    if (confirm("Are you sure you want to cancel/archive this event?")) {
                      alert("Event archived.");
                      go("home");
                    }
                  }}>
                    Archive
                  </button>
                </>
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
                    {(isOwner || isAdmin || isModerator) && pendingRequests.length > 0 && (
                      <div style={{ border: "1px solid rgba(245,158,11,0.3)", borderRadius: "var(--r-md)", background: "rgba(245,158,11,0.06)", overflow: "hidden" }}>
                        <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#92400e" }}>Pending Requests ({pendingRequests.length})</span>
                          <span style={{ marginLeft: "auto", fontSize: 11, color: "#b45309" }}>Approve or decline below</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {pendingRequests.map((r, idx) => (
                            <div key={r.id || r.bookingId} style={{
                              padding: "14px 18px",
                              borderBottom: idx < pendingRequests.length - 1 ? "1px solid rgba(245,158,11,0.15)" : "none",
                              display: "flex", flexDirection: "column", gap: 8
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                                  onClick={() => r.userId && go("profile", { id: r.userId })}>
                                  <Avatar name={r.name || "User"} size={36} />
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name || "Unknown"}</div>
                                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.email || ""}</div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button className="hbtn hbtn--soft hbtn--sm"
                                    style={{ color: "#ef4444", padding: "4px 12px", fontSize: 12 }}
                                    onClick={() => handleHostRequestAction(r.bookingId, 'decline')}>
                                    Decline
                                  </button>
                                  <button className="hbtn hbtn--primary hbtn--sm"
                                    style={{ padding: "4px 12px", fontSize: 12 }}
                                    onClick={() => handleHostRequestAction(r.bookingId, 'accept')}>
                                    Approve
                                  </button>
                                </div>
                              </div>
                              {/* Questionnaire answers */}
                              {r.answers && Object.keys(r.answers).length > 0 && (
                                <div style={{ marginLeft: 46, padding: "8px 12px", background: "rgba(0,0,0,0.04)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {Object.entries(r.answers).map(([key, val]) => (
                                    <div key={key} style={{ fontSize: 12 }}>
                                      <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>{key}: </span>
                                      <span style={{ color: "var(--ink)" }}>{String(val)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No pending + not host: show nothing special */}
                    {(isOwner || isAdmin || isModerator) && pendingRequests.length === 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(31,157,87,0.07)", border: "1px solid rgba(31,157,87,0.2)", borderRadius: "var(--r-md)" }}>
                        <span style={{ fontSize: 16 }}>✅</span>
                        <span style={{ fontSize: 13, color: "#166534", fontWeight: 500 }}>No pending join requests</span>
                      </div>
                    )}

                    {/* Confirmed members */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                          Members
                          {confirmedAttendees.length > 0 && (
                            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", background: "var(--border)", padding: "2px 8px", borderRadius: 999 }}>
                              {confirmedAttendees.length}
                            </span>
                          )}
                        </h3>
                        {confirmedAttendees.length > 4 && (
                          <input
                            className="cinput"
                            placeholder="Search members…"
                            value={memberSearch}
                            onChange={ev => setMemberSearch(ev.target.value)}
                            style={{ width: 170, fontSize: 12, background: "var(--field)", border: "1px solid var(--border)" }}
                          />
                        )}
                      </div>
                      {confirmedAttendees.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
                          No confirmed members yet.
                        </div>
                      ) : (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                          {(typeof confirmedAttendees[0] === 'string'
                            ? confirmedAttendees.filter(n => !memberSearch || n.toLowerCase().includes(memberSearch.toLowerCase()))
                              .map((name, i, arr) => ({ name, id: null, email: null, _arr: arr, _i: i }))
                            : confirmedAttendees.filter(a => !memberSearch || (a.name || "").toLowerCase().includes(memberSearch.toLowerCase()))
                          ).map((a, i, arr) => {
                            const name = typeof a === 'string' ? a : (a.name || "Member");
                            const userId = a.userId || a.id || null;
                            const email = a.email || "";
                            const isLast = i === arr.length - 1;
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
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "#1f9d57", background: "rgba(31,157,87,0.1)", padding: "3px 8px", borderRadius: 999 }}>
                                    Attending
                                  </span>
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
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Event Gallery</h3>
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
                            reader.onload = (uploadEvt) => {
                              const newMedia = {
                                id: Date.now(),
                                url: uploadEvt.target.result,
                                type: isVideo ? "video" : "image",
                                approved: !(galleryApprovalRequired && !isOwner && !isAdmin && !isModerator),
                                uploadedBy: ME.name
                              };
                              setGalleryItems(prev => [...prev, newMedia]);
                              if (!newMedia.approved) {
                                alert("Upload successful! Your media is pending approval from organizers.");
                              } else {
                                alert("Upload successful!");
                              }
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                        <button className="hbtn hbtn--primary hbtn--sm" onClick={() => galleryInputRef.current?.click()}>
                          Add Media
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Pending Approval Section */}
                  {(isOwner || isAdmin || isModerator) && galleryItems.some(item => !item.approved) && (
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
                                onClick={() => {
                                  setGalleryItems(prev => prev.map(p => p.id === item.id ? { ...p, approved: true } : p));
                                }}
                              >
                                Approve
                              </button>
                              <button 
                                className="hbtn" 
                                style={{ padding: "2px 6px", fontSize: 10, height: 20, background: "#e5484d", color: "#fff" }}
                                onClick={() => {
                                  setGalleryItems(prev => prev.filter(p => p.id !== item.id));
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
                        {(isOwner || isAdmin || isModerator || item.uploadedBy === ME.name) && (
                          <button 
                            style={{ 
                              position: "absolute", top: 6, right: 6, 
                              background: "rgba(0, 0, 0, 0.6)", color: "#fff", 
                              border: "none", borderRadius: "50%", 
                              width: 24, height: 24, display: "flex", 
                              alignItems: "center", justifyContent: "center", 
                              cursor: "pointer", fontSize: 12
                            }}
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this media?")) {
                                setGalleryItems(prev => prev.filter(p => p.id !== item.id));
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
                  forumsEnabled={discussionEnabled}
                  threadPerm={discussionThreadRoles}
                  replyPerm={discussionReplyRoles}
                  approvalRequired={discussionApprovalRequired}
                  ME={ME}
                />
              )}

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
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Admin, owner, and moderator must accept uploads.</div>
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
                            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>New threads must be approved by Admin, Owner, or Moderator.</div>
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

            {/* Ticket sidebar */}
            {tab === "about" && (
              <div className="ev-aside" style={{ width: 280, marginLeft: 20 }}>
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
