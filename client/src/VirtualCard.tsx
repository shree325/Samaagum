// @ts-nocheck
var { useState, useEffect } = React;

function VirtualCard({ user }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const photo = user?.img || user?.profilePhoto || user?.profile_photo || user?.profiles?.[0]?.img;
  const displayName = user?.name || user?.full_name || user?.profile?.[0]?.display_name || user?.profile?.display_name || user?.profiles?.[0]?.display_name || user?.profiles?.display_name || 'User';
  const role = user?.role || user?.headline || user?.profiles?.[0]?.headline || '';
  const email = user?.email || user?.primary_email || '';
  const phone = user?.phone || user?.phoneNumber || '';
  const socialLinks = user?.socialLinks || {};

  // Try to find a handle or extract from email
  const handle = user?.handle || `@${user?.email?.split('@')[0] || user?.primary_email?.split('@')[0] || displayName.replace(/\s+/g, '').toLowerCase() || 'user'}`;
  const username = handle.replace('@', '');
  
  const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:8080" : window.location.origin;
  // Fallback to query parameter routing to support Live Server testing
  const profileUrl = `${apiBase}/pages/VirtualCardPage.html?u=${encodeURIComponent(username)}`;

  useEffect(() => {
    if (window.QRCodeLib) {
      window.QRCodeLib.toDataURL(profileUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#111827',
          light: '#ffffff'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('Error generating QR Code', err);
      });
    } else {
      // Fallback if library didn't load
      setQrCodeUrl(`https://quickchart.io/qr?text=${encodeURIComponent(profileUrl)}&size=200&dark=111827&light=ffffff&margin=2`);
    }
  }, [profileUrl]);


  const downloadQR = async () => {
    if (!qrCodeUrl) return;
    
    if (qrCodeUrl.startsWith('data:')) {
      const a = document.createElement("a");
      a.href = qrCodeUrl;
      a.download = `qr-${username}.png`;
      a.click();
    } else {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `qr-${username}.png`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        // Fallback if fetch fails due to CORS
        window.open(qrCodeUrl, '_blank');
      }
    }
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${displayName}`,
        text: `Check out my Samaagum Profile`,
        url: profileUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(profileUrl);
      alert("Profile Link Copied");
    }
  };

  return (
    <div style={{ marginTop: 40, borderTop: "1px solid var(--border)", paddingTop: 40 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
        Virtual Card <span style={{ color: "var(--accent-1)", fontSize: 22 }}>✦</span>
      </h2>
      
      <div style={{ 
        background: "linear-gradient(145deg, var(--bg-1) 0%, var(--surface-2) 100%)", 
        marginTop: 24, borderRadius: 24, padding: 32, 
        display: "flex", flexDirection: "column", gap: 24, 
        border: "1px solid var(--border)", 
        boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative background element */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'var(--accent-grad)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ display: "flex", flexWrap: "nowrap", justifyContent: "space-between", alignItems: "center", gap: 24, position: "relative", zIndex: 1 }}>
          
          {/* User Profile Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, flex: "1 1 auto", minWidth: 0 }}>
            {photo && photo.length > 10 && photo !== "null" ? (
              <img src={photo} alt={displayName} style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--bg-1)", boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div style={{ display: (photo && photo.length > 10 && photo !== "null") ? 'none' : 'flex', width: 90, height: 90, borderRadius: "50%", background: "var(--accent-grad, linear-gradient(135deg, #3b82f6, #8b5cf6))", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: "bold", border: "3px solid var(--bg-1)", boxShadow: "0 8px 16px rgba(0,0,0,0.1)", textTransform: "uppercase" }}>
              {(displayName || 'U')[0]}
            </div>
            
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <h3 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px 0", color: "var(--ink)", letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</h3>
              {role && <div style={{ fontSize: 16, color: "var(--accent-1)", fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{role}</div>}
              {email && <div style={{ fontSize: 14, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <a href={`mailto:${email}`} style={{ overflow: "hidden", textOverflow: "ellipsis", color: "inherit", textDecoration: "none" }}>{email}</a>
              </div>}
              {phone && <div style={{ fontSize: 14, color: "var(--ink-2)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <a href={`tel:${phone}`} style={{ overflow: "hidden", textOverflow: "ellipsis", color: "inherit", textDecoration: "none" }}>{phone}</a>
              </div>}
            </div>
          </div>

          {/* QR Code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ padding: 8, background: "#fff", borderRadius: 16, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Virtual Card QR" 
                  onClick={() => window.location.href = profileUrl}
                  style={{ width: 120, height: 120, borderRadius: 8, cursor: "pointer", transition: "transform 0.2s" }} 
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                />
              ) : (
                <div style={{ width: 120, height: 120, background: '#f4f4f5', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12 }}>
                  Loading QR...
                </div>
              )}
            </div>
            <p 
              onClick={() => window.location.href = profileUrl}
              style={{ color: "var(--accent-1)", fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: "pointer", margin: 0 }}
            >
              Scan to View
            </p>
          </div>
        </div>

        {/* Social Links */}
        {Object.values(socialLinks).some(link => link && link.trim()) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 4, position: "relative", zIndex: 1 }}>
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", textDecoration: "none", fontSize: 14, padding: "8px 16px", background: "var(--bg-1)", borderRadius: 20, border: "1px solid var(--border)", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface)"} onMouseOut={e => e.currentTarget.style.background = "var(--bg-1)"}>
                <span>📷</span> Insta
              </a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", textDecoration: "none", fontSize: 14, padding: "8px 16px", background: "var(--bg-1)", borderRadius: 20, border: "1px solid var(--border)", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface)"} onMouseOut={e => e.currentTarget.style.background = "var(--bg-1)"}>
                <span>💼</span> LinkedIn
              </a>
            )}
            {socialLinks.github && (
              <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", textDecoration: "none", fontSize: 14, padding: "8px 16px", background: "var(--bg-1)", borderRadius: 20, border: "1px solid var(--border)", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface)"} onMouseOut={e => e.currentTarget.style.background = "var(--bg-1)"}>
                <span>🐱</span> GitHub
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", textDecoration: "none", fontSize: 14, padding: "8px 16px", background: "var(--bg-1)", borderRadius: 20, border: "1px solid var(--border)", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface)"} onMouseOut={e => e.currentTarget.style.background = "var(--bg-1)"}>
                <span>✖</span> X
              </a>
            )}
            {socialLinks.website && (
              <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)", textDecoration: "none", fontSize: 14, padding: "8px 16px", background: "var(--bg-1)", borderRadius: 20, border: "1px solid var(--border)", fontWeight: 600, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface)"} onMouseOut={e => e.currentTarget.style.background = "var(--bg-1)"}>
                <span>🌐</span> Website
              </a>
            )}
          </div>
        )}


        {/* Action Buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 12, borderTop: "1px dashed var(--border)", paddingTop: 20, position: "relative", zIndex: 1 }}>
          <button onClick={downloadQR} style={{ background: "var(--accent-1)", color: "white", padding: "10px 24px", borderRadius: 24, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, border: "none", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download QR
          </button>
          <button onClick={shareProfile} style={{ background: "transparent", border: "1px solid var(--ink)", color: "var(--ink)", padding: "10px 24px", borderRadius: 24, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "var(--ink)"; e.currentTarget.style.color = "var(--bg-app)"}} onMouseOut={e => {e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink)"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Share Card
          </button>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { VirtualCard });
