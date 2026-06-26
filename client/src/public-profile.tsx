// @ts-nocheck
/**
 * public-profile.tsx
 * Standalone Public Profile View matching the exact style from the samaagum-profile artifact,
 * mapped to a clean white theme.
 */

function PublicProfile({ profile, go, socket }) {
  const User = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" /><path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  const Mail = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M2 8l10 7 10-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Share2 = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" /><path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const UserPlus = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const X = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const ChevronLeft = (p) => <svg viewBox="0 0 24 24" fill="none" width="20" height="20" {...p}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Phone = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  const Globe = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

  const p = profile || {
    displayName: "Aanya Sharma",
    headline: "Product Designer & Community Builder",
    bio: "I'm looking for a role that aligns better with my long term career goals. I believe my current role has prepared me well and I'm ready to take on more responsibility.\n\nI'm confident that this new opportunity will allow me to apply my expertise in a more meaningful way.",
    mobile: "+1234567890",
    email: "aanya@example.com",
    website: "https://samaagum.com",
    whatsapp: "+1234567890",
    profilePhoto: "https://i.pravatar.cc/200?img=47",
    coverBanner: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200",
  };

  const targetId = p.user_id || p.id || p.userId;
  const [requestStatus, setRequestStatus] = React.useState(null); // null, 'PENDING', 'ACCEPTED', 'DECLINED'
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    if (!socket || !targetId) return;

    const handleRequestAccepted = (payload) => {
      if (payload.receiverId === targetId || payload.senderId === targetId) {
        setRequestStatus('ACCEPTED');
      }
    };

    const handleRequestDeclined = (payload) => {
      if (payload.receiverId === targetId || payload.senderId === targetId) {
        setRequestStatus('DECLINED');
      }
    };

    socket.on("request.accepted", handleRequestAccepted);
    socket.on("request.declined", handleRequestDeclined);

    return () => {
      socket.off("request.accepted", handleRequestAccepted);
      socket.off("request.declined", handleRequestDeclined);
    };
  }, [socket, targetId]);

  React.useEffect(() => {
    if (!targetId) {
      setChecking(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

    fetch(`${apiBase}/api/messaging/requests/status/${targetId}`, { headers })
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setRequestStatus(res.data.status);
        }
        setChecking(false);
      })
      .catch(err => {
        console.error("Error checking request status:", err);
        setChecking(false);
      });
  }, [targetId]);

  const handleStartMessaging = () => {
    if (!targetId) return;
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

    fetch(`${apiBase}/api/messaging/conversations/direct`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetId })
    })
      .then(res => {
        if (res.ok) {
          return res.json().then(json => {
            go("messages");
          });
        } else if (res.status === 403) {
          return res.json().then(json => {
            if (json.restriction === 'approval_required') {
              fetch(`${apiBase}/api/messaging/requests`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ targetId })
              })
                .then(r => r.json())
                .then(rJson => {
                  if (rJson.success) {
                    setRequestStatus('PENDING');
                    if (window.toast) window.toast("Messaging request sent!");
                    else alert("Messaging request sent!");
                  }
                });
            } else if (json.restriction === 'only_connected') {
              if (window.toast) window.toast("This user only allows DMs from connections.");
              else alert("This user only allows DMs from connections.");
            } else {
              alert(json.error || "Unable to start messaging.");
            }
          });
        } else {
          alert("Failed to start messaging.");
        }
      })
      .catch(err => console.error("Error starting messaging:", err));
  };

  const contactIcons = [
    { icon: "phone", label: "Phone", href: p.mobile ? `tel:${p.mobile}` : '#' },
    { icon: "email", label: "Email", href: p.email ? `mailto:${p.email}` : '#' },
    { icon: "globe", label: "Website", href: p.website || '#' },
    { icon: "whatsapp", label: "WhatsApp", href: p.whatsapp ? `https://wa.me/${p.whatsapp.replace(/\D/g, "")}` : '#' },
  ];

  const socialLinks = [
    { id: 1, title: "LinkedIn", icon: "linkedin", url: "#" },
    { id: 2, title: "GitHub", icon: "github", url: "#" },
    { id: 3, title: "Instagram", icon: "instagram", url: "#" },
    { id: 4, title: "X", icon: "twitter", url: "#" },
  ];

  function getIconBg(icon) {
    const map = {
      linkedin: "bg-[#0A66C2]",
      github: "bg-[#24292e]",
      instagram: "bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]",
      facebook: "bg-[#1877F2]",
      twitter: "bg-[#000000]",
      youtube: "bg-[#FF0000]",
      whatsapp: "bg-[#25D366]",
      phone: "bg-[#34C759]",
      email: "bg-[#007AFF]",
      globe: "bg-[#5856D6]",
    };
    return map[icon?.toLowerCase()] ?? "bg-[#636363]";
  }

  function getIconEmoji(icon) {
    const map = {
      linkedin: "in",
      github: "gh",
      instagram: "ig",
      twitter: "x",
    };
    return map[icon?.toLowerCase()] ?? icon?.slice(0, 2).toUpperCase() ?? "ln";
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center py-0">
      <div className="w-full max-w-sm min-h-screen bg-white text-gray-900 relative overflow-hidden flex flex-col shadow-2xl">
        {/* Cover banner */}
        <div className="relative h-52 w-full flex-shrink-0">
          {p.coverBanner ? (
            <img src={p.coverBanner} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f0f1a]" />
          )}
          {/* Top bar buttons */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
            <button onClick={() => go("profile")} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <ChevronLeft className="w-5 h-5 -ml-1" />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avatar overlapping cover */}
        <div className="flex justify-center -mt-14 relative z-10 mb-3">
          <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-xl">
            {p.profilePhoto ? (
              <img src={p.profilePhoto} alt={p.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <User className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Name & headline */}
        <div className="text-center px-6 mb-2">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{p.displayName}</h1>
          {p.headline && (
            <p className="text-[#6366f1] text-sm font-medium mt-0.5">{p.headline}</p>
          )}
        </div>

        {/* Bio (Hidden in public profile as per request) */}

        {/* CTA buttons */}
        <div className="flex items-center justify-center gap-3 px-6 mb-6">
          <button 
            onClick={handleStartMessaging}
            disabled={requestStatus === 'PENDING'}
            className="flex-1 py-3 rounded-full bg-[#6366f1] text-white text-sm font-semibold hover:bg-[#4f46e5] transition-colors shadow-sm disabled:bg-gray-300 disabled:text-gray-500"
          >
            {requestStatus === 'PENDING' ? 'Request Pending' : 'Start Messaging'}
          </button>
          <button className="flex-1 py-3 rounded-full border border-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
            Exchange Contact
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 px-6 pb-10 space-y-6 overflow-y-auto">
          {/* Contact icons grid */}
          <div className="grid grid-cols-4 gap-3">
            {contactIcons.map((c) => (
              <a key={c.icon} href={c.href} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 group">
                <div className={`w-14 h-14 rounded-2xl ${getIconBg(c.icon)} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                  {c.icon === "phone" && <Phone className="w-6 h-6 text-white" />}
                  {c.icon === "email" && <Mail className="w-6 h-6 text-white" />}
                  {c.icon === "globe" && <Globe className="w-6 h-6 text-white" />}
                  {c.icon === "whatsapp" && <span className="text-white text-lg font-bold">W</span>}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">{c.label}</span>
              </a>
            ))}
          </div>

          {/* Social Links Grid */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-3">Social Links</p>
            <div className="grid grid-cols-4 gap-3">
              {socialLinks.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 group">
                  <div className={`w-14 h-14 rounded-2xl ${getIconBg(link.icon)} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                    <span className="text-white text-[10px] font-bold uppercase">{getIconEmoji(link.icon)}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{link.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#6366f1] flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">S</span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium">Powered by Samaagum</p>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PublicProfile });

