// @ts-nocheck
/**
 * public-profile.tsx
 * Industry-level public profile view with connection-first messaging.
 */

function PublicProfile({ profile, go, socket }) {
  const User      = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" /><path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  const Mail      = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Share2    = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const UserPlus  = (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const CheckCircle = (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const ChatIcon  = (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>;
  const ChevronLeft = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Phone     = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Globe     = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const ClockIcon = (p) => <svg viewBox="0 0 24 24" fill="none" width="18" height="18" {...p}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

  const [loadedProfile, setLoadedProfile] = React.useState(null);
  const [theme, setTheme] = React.useState("light");

  const initialProfile = profile || {
    displayName: "Aanya Sharma",
    headline: "Product Designer & Community Builder",
    bio: "I'm looking for a role that aligns better with my long term career goals.",
    mobile: "+1234567890",
    email: "aanya@example.com",
    website: "https://samaagum.com",
    whatsapp: "+1234567890",
    profilePhoto: "https://i.pravatar.cc/200?img=47",
    coverBanner: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200",
  };

  const p = loadedProfile || initialProfile;
  const targetId = p.user_id || p.id || p.userId;
  const apiBase  = window.location.port === "8080" ? "http://localhost:3000" : "";

  // ─── Connection + messaging state ───────────────────────────────────────────
  const [connState,  setConnState]  = React.useState('loading');
  const [connId,     setConnId]     = React.useState(null);
  const [msgPref,    setMsgPref]    = React.useState('anyone');
  const [connecting, setConnecting] = React.useState(false);
  const [messaging,  setMessaging]  = React.useState(false);
  const [revoking,   setRevoking]   = React.useState(false);

  // Network modal states
  const [showNetworkModal, setShowNetworkModal] = React.useState(false);
  const [networkData, setNetworkData] = React.useState({ mutual: [], new: [], totalCount: 0 });
  const [networkSearch, setNetworkSearch] = React.useState("");
  const [networkPage, setNetworkPage] = React.useState(1);
  const [networkHasMore, setNetworkHasMore] = React.useState(false);
  const [networkLoading, setNetworkLoading] = React.useState(false);
  const [networkConnectStates, setNetworkConnectStates] = React.useState({}); // { [userId]: 'none'|'loading'|'requested'|'accepted' }

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ─── Fetch connection status helper ─────────────────────────────────────────
  const fetchConnectionStatus = React.useCallback(() => {
    if (!targetId) { setConnState('none'); return; }
    fetch(`${apiBase}/api/connections/status/${targetId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (!res.success) { setConnState('none'); return; }
        const d = res.data;
        setMsgPref(d.messagingPreference || 'anyone');
        setConnId(d.connectionId);
        if (d.state === 'none') {
          setConnState('none');
        } else if (d.state === 'requested') {
          setConnState(d.isRequester ? 'requested_by_me' : 'requested_by_them');
        } else if (d.state === 'accepted') {
          setConnState('accepted');
        } else if (d.state === 'blocked') {
          setConnState('blocked');
        } else {
          setConnState('none');
        }
      })
      .catch(() => setConnState('none'));
  }, [targetId, apiBase]);

  // ─── Fetch profile details helper ─────────────────────────────────────────
  const fetchProfileDetails = React.useCallback(() => {
    if (!targetId) return;
    fetch(`${apiBase}/api/public/profile/${targetId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setLoadedProfile(res.data);
        }
      })
      .catch(err => console.error("Error loading profile details:", err));
  }, [targetId, apiBase]);

  // ─── Reset profile details when navigating to a new profile ───────────────────
  React.useEffect(() => {
    setLoadedProfile(null);
    setConnState('loading');
    setConnId(null);
  }, [profile?.user_id, profile?.id, profile?.userId]);

  // ─── Fetch all data on mount or target change ──────────────────────────────
  React.useEffect(() => {
    fetchProfileDetails();
    fetchConnectionStatus();
  }, [fetchProfileDetails, fetchConnectionStatus]);


  // ─── Real-time socket listeners ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!socket || !targetId) return;

    const onAccepted = (payload) => {
      if (payload.requesterId === targetId || payload.addresseeId === targetId) {
        fetchConnectionStatus();
        fetchProfileDetails();
      }
    };
    const onDeclined = (payload) => {
      if (payload.addresseeId === targetId || payload.requesterId === targetId) {
        fetchConnectionStatus();
        fetchProfileDetails();
      }
    };
    const onReceived = (payload) => {
      if (payload.requester?.id === targetId || payload.addresseeId === targetId) {
        fetchConnectionStatus();
        fetchProfileDetails();
      }
    };
    const onProfileUpdated = (payload) => {
      if (payload.userId === targetId) {
        fetchConnectionStatus();
        fetchProfileDetails();
      }
    };

    socket.on('connection.accepted', onAccepted);
    socket.on('connection.declined', onDeclined);
    socket.on('connection.request.received', onReceived);
    socket.on('profile.updated', onProfileUpdated);
    return () => {
      socket.off('connection.accepted', onAccepted);
      socket.off('connection.declined', onDeclined);
      socket.off('connection.request.received', onReceived);
      socket.off('profile.updated', onProfileUpdated);
    };
  }, [socket, targetId, fetchProfileDetails, fetchConnectionStatus]);

  // ─── Network fetching & management ──────────────────────────────
  const fetchNetwork = React.useCallback(async (search = "", page = 1, append = false) => {
    if (!targetId) return;
    setNetworkLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/connections/network/${targetId}?q=${encodeURIComponent(search)}&page=${page}&limit=20`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        if (append) {
          setNetworkData(prev => ({
            totalCount: data.totalCount,
            mutual: [...prev.mutual, ...data.mutual],
            new: [...prev.new, ...data.new]
          }));
        } else {
          setNetworkData({
            totalCount: data.totalCount,
            mutual: data.mutual || [],
            new: data.new || []
          });
        }
        setNetworkHasMore(data.pagination?.hasMore || false);
        
        // Populate networkConnectStates
        const states = {};
        [...(data.mutual || []), ...(data.new || [])].forEach(u => {
          states[u.userId] = u.connectionState;
        });
        setNetworkConnectStates(prev => ({ ...prev, ...states }));
      }
    } catch (err) {
      console.error("Error fetching network connections:", err);
    } finally {
      setNetworkLoading(false);
    }
  }, [targetId, apiBase]);

  // Debounced search on networkSearch
  React.useEffect(() => {
    if (!showNetworkModal || !targetId) return;
    const t = setTimeout(() => {
      setNetworkPage(1);
      fetchNetwork(networkSearch, 1, false);
    }, 350);
    return () => clearTimeout(t);
  }, [networkSearch, showNetworkModal, targetId, fetchNetwork]);

  const handleConnectFromModal = async (userId: string, e: any) => {
    e.stopPropagation(); // MUST NOT navigate to profile
    if (networkConnectStates[userId] === "loading") return;
    setNetworkConnectStates(prev => ({ ...prev, [userId]: "loading" }));
    try {
      const res = await fetch(`${apiBase}/api/connections/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ addresseeUserId: userId })
      });
      const data = await res.json();
      if (data.success) {
        setNetworkConnectStates(prev => ({ ...prev, [userId]: "requested" }));
        if (window.toast) window.toast("Connection request sent! 🤝");
      } else {
        setNetworkConnectStates(prev => ({ ...prev, [userId]: "none" }));
        if (window.toast) window.toast(data.message || "Failed to send connection request.");
      }
    } catch {
      setNetworkConnectStates(prev => ({ ...prev, [userId]: "none" }));
      if (window.toast) window.toast("Network error. Please try again.");
    }
  };

  // ─── Action: Send connection request ────────────────────────────────────────
  const handleConnect = async () => {
    if (!targetId || connecting) return;
    setConnecting(true);
    try {
      const res = await fetch(`${apiBase}/api/connections/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ addresseeUserId: targetId })
      });
      const data = await res.json();
      if (data.success) {
        setConnState('requested_by_me');
        setConnId(data.data?.id || null);
        if (window.toast) window.toast("Connection request sent! 🤝");
      } else {
        if (window.toast) window.toast(data.message || "Failed to send request.");
      }
    } catch {
      if (window.toast) window.toast("Network error. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  // ─── Action: Revoke connection request ──────────────────────────────────────
  const handleRevoke = async () => {
    if (!connId || revoking) return;
    setRevoking(true);
    try {
      const res = await fetch(`${apiBase}/api/connections/${connId}/revoke`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setConnState('none');
        setConnId(null);
        if (window.toast) window.toast("Connection request revoked.");
        fetchProfileDetails();
      } else {
        if (window.toast) window.toast(data.message || "Failed to revoke request.");
      }
    } catch {
      if (window.toast) window.toast("Network error. Please try again.");
    } finally {
      setRevoking(false);
    }
  };

  // ─── Action: Open / start messaging ─────────────────────────────────────────
  const handleStartMessaging = async () => {
    if (!targetId || messaging) return;
    setMessaging(true);
    try {
      const res = await fetch(`${apiBase}/api/messaging/conversations/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ targetId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.id) {
          localStorage.setItem('active_chat_conv_id', json.data.id);
        }
        go("messages");
      } else {
        const json = await res.json();
        const restriction = json.restriction;
        if (restriction === 'only_connected') {
          if (window.toast) window.toast("Connect with this user first to send messages.");
        } else if (restriction === 'no_one') {
          if (window.toast) window.toast("This user has disabled direct messages.");
        } else {
          if (window.toast) window.toast(json.error || "Unable to start messaging.");
        }
      }
    } catch {
      if (window.toast) window.toast("Network error. Please try again.");
    } finally {
      setMessaging(false);
    }
  };

  // ─── Derived: Should we show the message button? ─────────────────────────────
  const showMessageButton = (() => {
    if (msgPref === 'no_one') return false;
    if (msgPref === 'only_connected') return connState === 'accepted';
    return connState !== 'loading' && connState !== 'blocked';
  })();

  // ─── Derived: Connect button label & state ──────────────────────────────────
  const connectBtnConfig = (() => {
    switch (connState) {
      case 'loading':      return { label: '...', disabled: true, style: 'ghost' };
      case 'none':         return { label: 'Connect', disabled: false, style: 'primary' };
      case 'requested_by_me':   return { label: 'Pending…', disabled: true, style: 'ghost' };
      case 'requested_by_them': return { label: 'Respond', disabled: false, style: 'primary' };
      case 'accepted':     return { label: 'Connected ✓', disabled: true, style: 'connected' };
      case 'blocked':      return null;
    }
  })();

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getSocialLinkUrl = (kind) => {
    const list = p.socialLinks || [];
    if (Array.isArray(list)) {
      const found = list.find(l => l.kind?.toLowerCase() === kind?.toLowerCase());
      return found ? found.value : '#';
    }
    return p.socialLinks?.[kind] || '#';
  };

  const contactIcons = React.useMemo(() => {
    const list = [
      { icon: "phone",    label: "Phone",    href: (p.phone || p.mobile) ? `tel:${p.phone || p.mobile}` : '#' },
      { icon: "email",    label: "Email",    href: p.email ? `mailto:${p.email}` : '#' },
      { icon: "globe",    label: "Website",  href: getSocialLinkUrl("website") !== '#' ? getSocialLinkUrl("website") : (p.website || '#') },
      { icon: "whatsapp", label: "WhatsApp", href: (p.whatsapp || p.phone || p.mobile) ? `https://wa.me/${(p.whatsapp || p.phone || p.mobile).replace(/\D/g, "")}` : '#' },
    ];
    if (loadedProfile) {
      return list.filter(item => item.href && item.href !== '#');
    }
    return list;
  }, [p, loadedProfile]);

  const socialLinks = React.useMemo(() => {
    const hasDbLinks = loadedProfile && loadedProfile.socialLinks && loadedProfile.socialLinks.length > 0;
    if (hasDbLinks) {
      return loadedProfile.socialLinks.map((link, idx) => ({
        id: link.id || idx,
        title: link.kind.charAt(0).toUpperCase() + link.kind.slice(1),
        icon: link.kind,
        url: link.value
      })).filter(l => l.url && l.url !== '#');
    }
    
    if (!loadedProfile) {
      return [
        { id: 1, title: "LinkedIn",  icon: "linkedin",  url: "#" },
        { id: 2, title: "GitHub",    icon: "github",    url: "#" },
        { id: 3, title: "Instagram", icon: "instagram", url: "#" },
        { id: 4, title: "X",         icon: "twitter",   url: "#" },
      ];
    }

    return [];
  }, [loadedProfile, p]);

  // ─── Virtual card visibility + mapped data ──────────────────────────────────
  // Server sends `showVirtualCard` after privacy filtering; before the DB load
  // (demo state) we default to showing it.
  const canShowVirtualCard = loadedProfile ? !!p.showVirtualCard : true;

  const cardUser = React.useMemo(() => {
    // Convert socialLinks array ({kind, value}) → object the VirtualCard expects.
    const socialObj = {};
    const list = p.socialLinks || [];
    if (Array.isArray(list)) {
      list.forEach(l => { if (l.kind && l.value) socialObj[l.kind.toLowerCase()] = l.value; });
    } else if (list && typeof list === 'object') {
      Object.assign(socialObj, list);
    }
    return {
      id: targetId,
      name: p.displayName,
      full_name: p.displayName,
      img: p.profilePhoto,
      profilePhoto: p.profilePhoto,
      role: p.headline,
      headline: p.headline,
      email: p.email,
      phone: p.phone || p.mobile,
      socialLinks: socialObj,
    };
  }, [p, targetId]);

  function getIconBg(icon) {
    const map = {
      linkedin:  "bg-[#0A66C2]",
      github:    "bg-[#24292e]",
      instagram: "bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
      facebook:  "bg-[#1877F2]",
      twitter:   "bg-[#000000]",
      youtube:   "bg-[#FF0000]",
      whatsapp:  "bg-[#25D366]",
      phone:     "bg-[#34C759]",
      email:     "bg-[#007AFF]",
      globe:     "bg-[#5856D6]",
    };
    return map[icon?.toLowerCase()] ?? "bg-[#636363]";
  }

  function getIconEmoji(icon) {
    const map = { linkedin: "in", github: "gh", instagram: "ig", twitter: "x" };
    return map[icon?.toLowerCase()] ?? icon?.slice(0, 2).toUpperCase() ?? "ln";
  }

  // ─── Theme styling ──────────────────────────────────────────────────────────
  const isDark = theme === "dark";
  const colors = {
    bgApp: isDark ? "#121212" : "#f9fafb",
    bgContainer: isDark ? "#1a1a1b" : "#f3f4f6",
    textMain: isDark ? "#ffffff" : "#111827",
    textSub: isDark ? "#9ca3af" : "#4b5563",
    textMuted: isDark ? "#6b7280" : "#6b7280",
    cardBg: isDark ? "#222224" : "#ffffff",
    cardShadow: isDark ? "none" : "0 -8px 40px rgba(0,0,0,0.08)",
    border: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
    navBg: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.75)",
    pillBg: isDark ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.85)",
    pillBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    pillShadow: isDark ? "0 4px 12px rgba(0,0,0,0.2)" : "0 4px 12px rgba(0,0,0,0.08)",
    chipBg: isDark ? "transparent" : "#f9fafb",
    chipBorder: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb",
    chipText: isDark ? "#ffffff" : "#374151",
    sparkle: isDark ? "rgba(255,255,255,0.2)" : "#e5e7eb",
    gradientOverlay: isDark ? "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 100%)" : "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.9) 100%)",
  };

  // ─── Blocked state ───────────────────────────────────────────────────────────
  if (connState === 'blocked') {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center">
        <div className="text-center p-8">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Profile Unavailable</h2>
          <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>This profile is not available.</p>
          <button onClick={() => go("home")} style={{ marginTop: 20, padding: "10px 24px", background: "#6366f1", color: "#fff", borderRadius: 24, border: "none", fontWeight: 600, cursor: "pointer" }}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll" style={{ background: colors.bgApp, height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", overflowY: "auto", overflowX: "hidden" }}>
      <div className="view-enter" style={{ position: "relative", minHeight: "100vh", width: "100%", background: colors.bgContainer, color: colors.textMain, display: "flex", flexDirection: "column", transition: "background 0.3s ease, color 0.3s ease" }}>

        {/* Full Bleed Cover Background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "65vh", backgroundImage: `url(${p.coverBanner || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200'})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: colors.gradientOverlay, transition: "background 0.3s ease" }} />
        </div>

        {/* Foreground Content Layer */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* Top Navbar */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px" }}>
            <button onClick={() => go("home")} style={{ width: 44, height: 44, borderRadius: "50%", background: colors.navBg, backdropFilter: "blur(4px)", color: colors.textMain, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <ChevronLeft style={{ width: 20, height: 20 }} />
            </button>
            <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ width: 44, height: 44, borderRadius: "50%", background: colors.navBg, backdropFilter: "blur(4px)", color: colors.textMain, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              {isDark ? <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> : <svg viewBox="0 0 24 24" fill="none" width="20" height="20" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            </button>
          </div>

          {/* Spacer to push info to bottom of cover */}
          <div style={{ flex: 1, minHeight: "18vh" }} />

          {/* User Info (overlaid on cover) */}
          <div style={{ padding: "0 40px 32px 40px", maxWidth: 880, margin: "0 auto", width: "100%", display: "flex", alignItems: "flex-end", gap: 24 }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ width: 116, height: 116, borderRadius: "50%", border: `4px solid ${colors.bgContainer}`, overflow: "hidden", background: "var(--bg-1)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                {p.profilePhoto ? (
                  <img src={p.profilePhoto} alt={p.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--bg-3)", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <h1 style={{ fontSize: 38, fontWeight: 800, color: colors.textMain, letterSpacing: "-0.5px", margin: 0, textShadow: isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "none" }}>
                {p.displayName}
              </h1>
              {p.headline && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: isDark ? "rgba(255,255,255,0.85)" : colors.textSub, fontSize: 16, fontWeight: 500, textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "none" }}>
                  {p.headline}
                </div>
              )}
              {p.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, color: isDark ? "rgba(255,255,255,0.85)" : colors.textSub, fontSize: 16, fontWeight: 500, textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {p.location}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Card */}
          <div style={{ background: colors.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: "40px 24px 100px 24px", flex: 1, display: "flex", flexDirection: "column", boxShadow: colors.cardShadow, transition: "background 0.3s ease" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>

              {/* Messaging preference hint (non-intrusive) */}
              {msgPref === 'no_one' && connState !== 'loading' && (
                <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 12, background: "var(--bg-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0, color: colors.textMuted }}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                    <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 14, color: colors.textMuted }}>This user has disabled direct messages</span>
                </div>
              )}
              {msgPref === 'only_connected' && connState === 'none' && (
                <div style={{ marginBottom: 24, padding: "12px 16px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink: 0, color: '#6366f1' }}>
                    <path d="M17 20c0-2.76-2.24-5-5-5s-5 2.24-5 5M12 15a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 14, color: '#6366f1', fontWeight: 500 }}>Connect first to send messages</span>
                </div>
              )}

              {/* CTA buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                {connectBtnConfig && (() => {
                  const cfg = connectBtnConfig;
                  const baseStyle = {
                    flex: showMessageButton ? 1 : undefined,
                    minWidth: showMessageButton ? undefined : '200px',
                    padding: "14px 28px",
                    borderRadius: 28,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: cfg.disabled ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    border: 'none',
                    transition: 'all 0.2s',
                    opacity: connecting ? 0.7 : 1,
                  };
                  if (cfg.style === 'primary') {
                    return (
                      <button
                        onClick={handleConnect}
                        disabled={cfg.disabled || connecting}
                        style={{ ...baseStyle, background: '#6366f1', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }}
                      >
                        {connecting ? (
                          <span>Sending…</span>
                        ) : cfg.label === 'Connect' ? (
                          <><UserPlus />{cfg.label}</>
                        ) : (
                          <><ClockIcon />{cfg.label}</>
                        )}
                      </button>
                    );
                  }
                  if (cfg.style === 'ghost') {
                    if (connState === 'requested_by_me') {
                      return (
                        <div style={{ display: 'flex', gap: 12, flex: showMessageButton ? 1 : undefined, width: showMessageButton ? undefined : '100%' }}>
                          <button
                            disabled={true}
                            style={{ ...baseStyle, flex: 1, background: 'transparent', color: colors.textSub, border: `1.5px solid ${colors.border}` }}
                          >
                            <ClockIcon style={{ color: '#f59e0b' }} />{cfg.label}
                          </button>
                          <button
                            onClick={handleRevoke}
                            disabled={revoking}
                            style={{
                              ...baseStyle,
                              flex: 1,
                              background: '#ef4444',
                              color: '#fff',
                              boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
                              cursor: revoking ? 'default' : 'pointer'
                            }}
                          >
                            {revoking ? 'Revoking…' : 'Revoke'}
                          </button>
                        </div>
                      );
                    }
                    return (
                      <button
                        disabled={true}
                        style={{ ...baseStyle, background: 'transparent', color: colors.textSub, border: `1.5px solid ${colors.border}` }}
                      >
                        {cfg.label}
                      </button>
                    );
                  }
                  if (cfg.style === 'connected') {
                    return (
                      <button
                        disabled={true}
                        style={{ ...baseStyle, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1.5px solid rgba(16,185,129,0.2)' }}
                      >
                        <CheckCircle />{cfg.label}
                      </button>
                    );
                  }
                  return null;
                })()}

                {showMessageButton && (
                  <button
                    onClick={handleStartMessaging}
                    disabled={messaging}
                    style={{
                      flex: 1,
                      padding: "14px 28px",
                      borderRadius: 28,
                      background: 'transparent',
                      color: colors.textMain,
                      border: `1.5px solid ${colors.border}`,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: messaging ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      opacity: messaging ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    <ChatIcon style={{ color: '#6366f1' }} />
                    {messaging ? 'Opening…' : 'Message'}
                  </button>
                )}

                {targetId && (
                  <button
                    onClick={() => {
                      setShowNetworkModal(true);
                      setNetworkSearch("");
                      setNetworkPage(1);
                      fetchNetwork("", 1, false);
                    }}
                    style={{
                      padding: "14px 24px",
                      borderRadius: 28,
                      background: colors.pillBg,
                      color: colors.textMain,
                      border: `1.5px solid ${colors.pillBorder}`,
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: colors.pillShadow,
                      transition: 'all 0.2s'
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    Connections
                  </button>
                )}
              </div>

              {/* Connected Users Modal */}
              {showNetworkModal && (
                <div style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 9999,
                  background: "rgba(0, 0, 0, 0.6)",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16
                }} onClick={() => setShowNetworkModal(false)}>
                  <div style={{
                    width: "100%",
                    maxWidth: 520,
                    maxHeight: "85vh",
                    background: colors.cardBg,
                    borderRadius: 24,
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                    border: `1px solid ${colors.border}`,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                  }} onClick={(e) => e.stopPropagation()}>
                    
                    {/* Header */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "20px 24px 16px 24px",
                      borderBottom: `1px solid ${colors.border}`
                    }}>
                      <div>
                        <h3 style={{ fontSize: 18, fontWeight: 800, color: colors.textMain, margin: 0 }}>Connected Users</h3>
                        <span style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, display: "block" }}>
                          {networkData.totalCount} {networkData.totalCount === 1 ? 'connection' : 'connections'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowNetworkModal(false)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: colors.chipBg,
                          border: `1px solid ${colors.chipBorder}`,
                          color: colors.textMain,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Bar */}
                    <div style={{ padding: "16px 24px", borderBottom: `1px solid ${colors.border}` }}>
                      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                        <svg style={{ position: "absolute", left: 14, color: colors.textMuted }} viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input 
                          type="text" 
                          placeholder="Search connections..." 
                          value={networkSearch}
                          onChange={(e) => setNetworkSearch(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 16px 10px 40px",
                            borderRadius: 12,
                            background: colors.chipBg,
                            border: `1.5px solid ${colors.chipBorder}`,
                            color: colors.textMain,
                            fontSize: 14,
                            outline: "none",
                            transition: "border-color 0.2s"
                          }}
                        />
                      </div>
                    </div>

                    {/* Scrollable list */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }} className="scroll">
                      {networkLoading && networkData.mutual.length === 0 && networkData.new.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, fontSize: 14 }}>
                          Loading connections...
                        </div>
                      ) : (
                        <>
                          {networkData.totalCount === 0 && (
                            <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, fontSize: 14 }}>
                              No connections found.
                            </div>
                          )}

                          {networkData.totalCount > 0 && networkData.mutual.length === 0 && networkData.new.length === 0 && (
                            <div style={{ textAlign: "center", padding: "40px 0", color: colors.textMuted, fontSize: 14 }}>
                              No matching connections found.
                            </div>
                          )}

                          {/* Mutual Connections Section */}
                          {networkData.mutual.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: colors.textMuted, letterSpacing: "0.5px", marginBottom: 12 }}>
                                Mutual Connections ({networkData.mutual.length})
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {networkData.mutual.map(user => (
                                  <div 
                                    key={user.userId} 
                                    onClick={() => {
                                      setShowNetworkModal(false);
                                      go("public-profile", user);
                                    }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "8px 12px",
                                      borderRadius: 12,
                                      cursor: "pointer",
                                      transition: "background 0.2s"
                                    }}
                                    className="hover:bg-gray-100/10"
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: colors.chipBg, flexShrink: 0 }}>
                                        {user.profilePhoto ? (
                                          <img src={user.profilePhoto} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", background: "var(--bg-3)" }}>
                                            <User style={{ width: 18, height: 18, color: colors.textMuted }} />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: colors.textMain }}>{user.displayName}</div>
                                        <div style={{ fontSize: 12, color: colors.textMuted }}>@{user.username}</div>
                                      </div>
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 8px", borderRadius: 12 }}>
                                      Mutual
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* New Connections Section */}
                          {networkData.new.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: colors.textMuted, letterSpacing: "0.5px", marginBottom: 12 }}>
                                New Connections ({networkData.new.length})
                              </h4>
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {networkData.new.map(user => {
                                  const cState = networkConnectStates[user.userId] || user.connectionState;
                                  return (
                                    <div 
                                      key={user.userId} 
                                      onClick={() => {
                                        setShowNetworkModal(false);
                                        go("public-profile", user);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 12px",
                                        borderRadius: 12,
                                        cursor: "pointer",
                                        transition: "background 0.2s"
                                      }}
                                      className="hover:bg-gray-100/10"
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: colors.chipBg, flexShrink: 0 }}>
                                          {user.profilePhoto ? (
                                            <img src={user.profilePhoto} alt={user.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                          ) : (
                                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", background: "var(--bg-3)" }}>
                                              <User style={{ width: 18, height: 18, color: colors.textMuted }} />
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 14, fontWeight: 700, color: colors.textMain }}>{user.displayName}</div>
                                          <div style={{ fontSize: 12, color: colors.textMuted }}>@{user.username}</div>
                                        </div>
                                      </div>

                                      {/* Connection Button */}
                                      {cState === 'none' && (
                                        <button 
                                          onClick={(e) => handleConnectFromModal(user.userId, e)}
                                          style={{
                                            padding: "6px 14px",
                                            borderRadius: 16,
                                            background: "#6366f1",
                                            color: "#fff",
                                            border: "none",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            transition: "background 0.2s"
                                          }}
                                        >
                                          Connect
                                        </button>
                                      )}
                                      {cState === 'loading' && (
                                        <button 
                                          disabled
                                          style={{
                                            padding: "6px 14px",
                                            borderRadius: 16,
                                            background: colors.chipBg,
                                            border: `1.5px solid ${colors.chipBorder}`,
                                            color: colors.textMuted,
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: "default"
                                          }}
                                        >
                                          ...
                                        </button>
                                      )}
                                      {cState === 'requested' && (
                                        <button 
                                          disabled
                                          style={{
                                            padding: "6px 14px",
                                            borderRadius: 16,
                                            background: "rgba(245, 158, 11, 0.1)",
                                            border: "1.5px solid rgba(245, 158, 11, 0.2)",
                                            color: "#f59e0b",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: "default"
                                          }}
                                        >
                                          Requested
                                        </button>
                                      )}
                                      {cState === 'requested_by_them' && (
                                        <button 
                                          onClick={(e) => handleConnectFromModal(user.userId, e)}
                                          style={{
                                            padding: "6px 14px",
                                            borderRadius: 16,
                                            background: "#6366f1",
                                            color: "#fff",
                                            border: "none",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            transition: "background 0.2s"
                                          }}
                                        >
                                          Respond
                                        </button>
                                      )}
                                      {cState === 'accepted' && (
                                        <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", padding: "4px 8px", borderRadius: 12 }}>
                                          Connected ✓
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Pagination Load More button */}
                          {networkHasMore && (
                            <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                              <button 
                                onClick={async () => {
                                  const nextPage = networkPage + 1;
                                  setNetworkPage(nextPage);
                                  await fetchNetwork(networkSearch, nextPage, true);
                                }}
                                disabled={networkLoading}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: 16,
                                  background: colors.chipBg,
                                  border: `1.5px solid ${colors.chipBorder}`,
                                  color: colors.textMain,
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: networkLoading ? "default" : "pointer"
                                }}
                              >
                                {networkLoading ? "Loading..." : "Load More"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* Bio Section */}
              {p.bio && (
                <div style={{ marginTop: 24, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: colors.textMain }}>Bio</h2>
                  <p style={{ color: colors.textSub, fontSize: 16, marginTop: 12, lineHeight: 1.6, fontWeight: 400 }}>
                    {p.bio}
                  </p>
                </div>
              )}

              {/* Contact Info Grid */}
              {(p.email || p.phone || p.mobile) && (
                <div style={{ marginTop: 32, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: colors.textMain, marginBottom: 16 }}>Contact Info</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24 }}>
                    {p.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <Mail />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>Email</div>
                          <a href={`mailto:${p.email}`} style={{ fontSize: 14, color: colors.textMain, textDecoration: "none", fontWeight: 500 }}>{p.email}</a>
                        </div>
                      </div>
                    )}
                    {(p.phone || p.mobile) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                          <Phone />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: colors.textMuted }}>Phone</div>
                          <a href={`tel:${p.phone || p.mobile}`} style={{ fontSize: 14, color: colors.textMain, textDecoration: "none", fontWeight: 500 }}>{p.phone || p.mobile}</a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interests Section */}
              {p.skills && p.skills.length > 0 && (
                <div style={{ marginTop: 32, paddingBottom: 24, borderBottom: `1px solid ${colors.border}` }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: colors.textMain }}>Interests</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
                    {p.skills.map((skill, i) => (
                      <div key={i} style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, borderRadius: 24, padding: "8px 16px", color: colors.chipText, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }}></span> {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links rendering */}
              {socialLinks.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: colors.textMain, marginBottom: 16 }}>Social Links</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    {socialLinks.map((link) => (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                        <span className={`w-6 h-6 rounded-lg ${getIconBg(link.icon)} flex items-center justify-center text-white text-[9px] font-bold uppercase`}>{getIconEmoji(link.icon)}</span>
                        {link.title}
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Virtual Card (gated by privacy settings) */}
              {canShowVirtualCard && window.VirtualCard && (
                <window.VirtualCard user={cardUser} />
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublicProfile });
