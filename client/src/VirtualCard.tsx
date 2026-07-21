// @ts-nocheck
import React, { useEffect, useState } from 'react';
// Removed unused import to avoid circular dependencies
import { QRCode, useProfileSync } from './home-icons';
import { Profile } from './home-profile';
import { apiBase } from './home-subscription';
import { I } from './home-icons';



import QRCodeLib from 'qrcode';

export function VirtualCard({ user }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  const photo = user?.img || user?.profilePhoto || user?.profile_photo || user?.profiles?.[0]?.img;
  const displayName = user?.name || user?.full_name || user?.profile?.[0]?.display_name || user?.profile?.display_name || user?.profiles?.[0]?.display_name || user?.profiles?.display_name || 'User';
  const role = user?.role || user?.headline || user?.profiles?.[0]?.headline || '';
  const email = user?.email || user?.primary_email || '';
  const phone = user?.phone || user?.phoneNumber || '';
  const socialLinks = user?.socialLinks || {};

  // Try to find a handle or extract from email
  const handle = user?.handle || `@${user?.email?.split('@')[0] || user?.primary_email?.split('@')[0] || displayName.replace(/\s+/g, '').toLowerCase() || 'user'}`;
  
  // Handle dynamic real-time profile updates using the global hook
  // Assuming `user.id` or `user.user_id` is passed. If not, it just uses fallback.
  const userId = user?.id || user?.user_id;
  const p = I.useProfileSync ? I.useProfileSync(userId, { 
    name: displayName, 
    img: photo, 
    body: role, 
    location: null 
  }) : { name: displayName, img: photo, bio: role, location: null };

  const syncedDisplayName = p.name;
  const syncedPhoto = p.img;
  const syncedRole = p.bio || p.headline || role;

  const username = handle.replace('@', '');
  
  const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:8080" : window.location.origin;
  // Fallback to query parameter routing to support Live Server testing
  const profileUrl = `${apiBase}/pages/VirtualCardPage.html?u=${encodeURIComponent(username)}`;

  const downloadVCF = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName || ''}\nTITLE:${role || ''}\nEMAIL:${email || ''}\nTEL:${phone || ''}\nURL:${user?.socialLinks?.website || ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(displayName || 'contact').replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const vcardText = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName || ''}\nTITLE:${role || ''}\nEMAIL:${email || ''}\nTEL:${phone || ''}\nURL:${user?.socialLinks?.website || ''}\nEND:VCARD`;
    QRCodeLib.toDataURL(vcardText, {
      width: 200,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR Code', err);
        // Fallback to quickchart if library fails
        setQrCodeUrl(`https://quickchart.io/qr?text=${encodeURIComponent(vcardText)}&size=200&dark=111827&light=ffffff&margin=2`);
      });
  }, [displayName, role, email, phone, user?.socialLinks?.website]);


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
    setShowShareModal(true);
  };

  const downloadCardImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw premium gradient background
    const grad = ctx.createLinearGradient(0, 0, 800, 450);
    grad.addColorStop(0, '#0f172a'); // slate-900
    grad.addColorStop(1, '#1e1b4b'); // indigo-950
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);

    // Add grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 450);
      ctx.stroke();
    }
    for (let j = 0; j < 450; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
      ctx.stroke();
    }

    // Glow effect
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath();
    ctx.arc(800, 0, 250, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Logo / Branding
    ctx.fillStyle = '#6366f1'; // Indigo-500
    ctx.font = '800 24px sans-serif';
    ctx.fillText('SAMAAGUM', 50, 60);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '500 12px sans-serif';
    ctx.fillText('VIRTUAL CONTACT CARD', 50, 80);

    // 3. Draw Profile Picture
    const drawContent = () => {
      // Draw Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(displayName, 50, 240);

      // Draw Role
      ctx.fillStyle = '#94a3b8'; // slate-400
      ctx.font = '500 18px sans-serif';
      ctx.fillText(role || 'Member', 50, 275);

      // Draw Email / Phone
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 14px monospace';
      let textY = 320;
      if (email) {
        ctx.fillText(`✉  ${email}`, 50, textY);
        textY += 28;
      }
      if (phone) {
        ctx.fillText(`☎  ${phone}`, 50, textY);
        textY += 28;
      }

      // Draw QR Code on the right side
      if (qrCodeUrl) {
        const qrImg = new Image();
        qrImg.onload = () => {
          // Draw white background wrapper for QR code
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(520, 100, 220, 220, 16);
          } else {
            ctx.rect(520, 100, 220, 220);
          }
          ctx.fill();

          // Draw the QR code
          ctx.drawImage(qrImg, 530, 110, 200, 200);

          // Subtext under QR code
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '600 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SCAN TO CONNECT', 630, 350);

          // Save/Download link
          const imgUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = imgUrl;
          a.download = `samaagum-card-${username}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };
        qrImg.src = qrCodeUrl;
      }
    };

    // Load and draw profile image
    if (syncedPhoto && syncedPhoto.length > 10 && syncedPhoto !== "null") {
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      avatarImg.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(110, 150, 60, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, 50, 90, 120, 120);
        ctx.restore();
        drawContent();
      };
      avatarImg.onerror = () => {
        // Fallback if avatar fails to load
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(110, 150, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((displayName || 'U')[0].toUpperCase(), 110, 162);
        ctx.textAlign = 'left';
        drawContent();
      };
      avatarImg.src = syncedPhoto;
    } else {
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(110, 150, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((displayName || 'U')[0].toUpperCase(), 110, 162);
      ctx.textAlign = 'left';
      drawContent();
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
            {syncedPhoto && syncedPhoto.length > 10 && syncedPhoto !== "null" ? (
              <img src={syncedPhoto} alt={syncedDisplayName} style={{ width: 90, height: 90, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--bg-1)", boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div style={{ display: (syncedPhoto && syncedPhoto.length > 10 && syncedPhoto !== "null") ? 'none' : 'flex', width: 90, height: 90, borderRadius: "50%", background: "var(--accent-grad, linear-gradient(135deg, #3b82f6, #8b5cf6))", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: "bold", border: "3px solid var(--bg-1)", boxShadow: "0 8px 16px rgba(0,0,0,0.1)", textTransform: "uppercase" }}>
              {(syncedDisplayName || 'U')[0]}
            </div>
            
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <h3 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px 0", color: "var(--ink)", letterSpacing: "-0.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syncedDisplayName}</h3>
              {syncedRole && <div style={{ fontSize: 16, color: "var(--accent-1)", fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{syncedRole}</div>}
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
                  onClick={downloadVCF}
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
              onClick={downloadVCF}
              style={{ color: "var(--accent-1)", fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', cursor: "pointer", margin: 0 }}
            >
              Download VCF
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
          <button onClick={downloadCardImage} style={{ background: "var(--accent-1)", color: "white", padding: "10px 24px", borderRadius: 24, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, border: "none", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Card Image
          </button>
          <button onClick={shareProfile} style={{ background: "transparent", border: "1px solid var(--ink)", color: "var(--ink)", padding: "10px 24px", borderRadius: 24, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => {e.currentTarget.style.background = "var(--ink)"; e.currentTarget.style.color = "var(--bg-app)"}} onMouseOut={e => {e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink)"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            Share Card
          </button>
        </div>

      </div>

      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(5, 4, 10, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'var(--surface, #14121f)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 24,
            padding: 32,
            width: 480,
            maxWidth: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            color: 'var(--ink, #fff)',
            fontFamily: 'system-ui, sans-serif'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowShareModal(false)}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                color: 'var(--ink-2, #94a3b8)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: 20, fontWeight: 700 }}>Share Virtual Card</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--ink-3, #64748b)' }}>
              Choose a platform or copy the link to share your contact details.
            </p>

            {/* Direct Platform Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {/* WhatsApp */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my Samaagum Virtual Card: ${profileUrl}`)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: '#25d366',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'transform 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: 20 }}>💬</span> WhatsApp
              </a>

              {/* X / Twitter */}
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my Samaagum Virtual Card`)}&url=${encodeURIComponent(profileUrl)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: '#000000',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'transform 0.15s',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: 18 }}>✖</span> X / Twitter
              </a>

              {/* Facebook */}
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: '#1877f2',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'transform 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: 20 }}>📘</span> Facebook
              </a>

              {/* LinkedIn */}
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`}
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: '#0a66c2',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  transition: 'transform 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: 20 }}>💼</span> LinkedIn
              </a>
            </div>

            {/* Link Copy Block */}
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 16, padding: 8, marginBottom: 20 }}>
              <input 
                type="text" 
                readOnly 
                value={profileUrl}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ink-2, #cbd5e1)',
                  fontSize: 13,
                  outline: 'none',
                  padding: '0 8px',
                  fontFamily: 'monospace'
                }}
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(profileUrl);
                  alert("Link copied!");
                }}
                style={{
                  background: 'var(--accent-1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = 0.9}
                onMouseOut={e => e.currentTarget.style.opacity = 1}
              >
                Copy
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {/* Native share sheet fallback if supported */}
              {navigator.share && (
                <button
                  onClick={() => {
                    navigator.share({
                      title: `${displayName} - Virtual Card`,
                      text: `Check out my Samaagum Virtual Card`,
                      url: profileUrl
                    }).catch(console.error);
                  }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    borderRadius: 16,
                    padding: '12px',
                    color: 'var(--ink)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  🔗 More Options
                </button>
              )}

              {/* Download Canvas Image option */}
              <button
                onClick={() => {
                  downloadCardImage();
                  setShowShareModal(false);
                }}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  border: 'none',
                  borderRadius: 16,
                  padding: '12px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = 0.95}
                onMouseOut={e => e.currentTarget.style.opacity = 1}
              >
                🖼 Save Card Image
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.VirtualCard = VirtualCard;
}


