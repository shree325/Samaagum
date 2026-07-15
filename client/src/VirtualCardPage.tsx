// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { VirtualCard } from './VirtualCard';
import { ME } from './home-data';
import { Profile } from './home-profile';
import { apiBase } from './home-subscription';
import { I } from './landing-core';
import QRCodeLib from 'qrcode';



export function VirtualCardPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // VCard is imported from './VirtualCard'

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('u');
        
        const apiBase = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : window.location.origin;

        if (!username) {
          const token = localStorage.getItem('token');
          if (!token) {
            window.location.replace('/');
            return;
          }
          
          // Fetch logged in user's profile
          const res = await fetch(`${apiBase}/api/admin/user/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!res.ok) {
            setError('Please login or provide a username.');
            setLoading(false);
            return;
          }
          
          const data = await res.json();
          if (data.success && data.data) {
            const p = data.data.profile || {};
            setUserData({
              full_name: p.display_name || data.data.email?.split('@')[0] || 'User',
              role: p.headline || p.template_key || '',
              location: p.preferred_location || p.location || '',
              email: data.data.email,
              phone: data.data.phone,
              bio: p.bio || '',
              profile_photo: data.data.profilePhoto || p.img || '',
              socialLinks: data.data.socialLinks || {}
            });
          } else {
            setError('Failed to load your profile.');
          }
          setLoading(false);
          return;
        }

        const res = await fetch(`${apiBase}/api/public/card/${encodeURIComponent(username)}`);
        
        if (!res.ok) {
          throw new Error('User not found');
        }

        const data = await res.json();
        if (data.success) {
          setUserData(data.data);
        } else {
          throw new Error(data.message || 'User not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  const downloadCardImage = async () => {
    try {
      const qrUrl = await QRCodeLib.toDataURL(window.location.href, { margin: 1 });
      
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw premium gradient background
      const grad = ctx.createLinearGradient(0, 0, 800, 450);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
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
      ctx.fillStyle = '#6366f1';
      ctx.font = '800 24px sans-serif';
      ctx.fillText('SAMAAGUM', 50, 60);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 12px sans-serif';
      ctx.fillText('VIRTUAL CONTACT CARD', 50, 80);

      const drawContent = () => {
        // Draw Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(userData.full_name || 'User', 50, 240);

        // Draw Role
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 18px sans-serif';
        ctx.fillText(userData.role || 'Member', 50, 275);

        // Draw Email / Phone
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '500 14px monospace';
        let textY = 320;
        if (userData.email) {
          ctx.fillText(`✉  ${userData.email}`, 50, textY);
          textY += 28;
        }
        if (userData.phone) {
          ctx.fillText(`☎  ${userData.phone}`, 50, textY);
          textY += 28;
        }

        // Draw QR Code on the right side
        if (qrUrl) {
          const qrImg = new Image();
          qrImg.onload = () => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(520, 100, 220, 220, 16);
            } else {
              ctx.rect(520, 100, 220, 220);
            }
            ctx.fill();

            ctx.drawImage(qrImg, 530, 110, 200, 200);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '600 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('SCAN TO CONNECT', 630, 350);

            const imgUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = imgUrl;
            const username = new URLSearchParams(window.location.search).get('u') || 'user';
            a.download = `samaagum-card-${username}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };
          qrImg.src = qrUrl;
        }
      };

      // Load and draw profile image
      if (userData.profile_photo && userData.profile_photo.length > 10 && userData.profile_photo !== "null") {
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
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.arc(110, 150, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText((userData.full_name || 'U')[0].toUpperCase(), 110, 162);
          ctx.textAlign = 'left';
          drawContent();
        };
        avatarImg.src = userData.profile_photo;
      } else {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(110, 150, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText((userData.full_name || 'U')[0].toUpperCase(), 110, 162);
        ctx.textAlign = 'left';
        drawContent();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--ink)' }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Loading Virtual Card...</div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'var(--ink)' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-1)' }}>Oops!</div>
        <div style={{ fontSize: 16, marginTop: 8 }}>{error || 'User not found'}</div>
      </div>
    );
  }

  // Extract user info for passing into VirtualCard
  // VirtualCard expects a 'user' prop that has `name`, `role`, `location`, `handle`, `email` etc.
  // And `socialLinks` which it extracts from `ME.socialLinks` or `user.socialLinks`.
  // Wait, VirtualCard expects user.socialLinks? Actually `VirtualCard` doesn't render the social links itself in the code I wrote. The social links were in `home-profile.tsx`.
  // Wait! The user prompt says the VirtualCardPage should display the full user profile including links.
  // Let's render them here.

  const socialLinks = userData.socialLinks || {};

  return (
    <div className="scroll" style={{ background: "var(--bg-app)", height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", overflowY: "auto", overflowX: "hidden" }}>
      <div className="view-enter" style={{ position: "relative", minHeight: "100vh", width: "100%", maxWidth: 680, margin: "0 auto", background: "var(--bg-container)", color: "var(--ink)", display: "flex", flexDirection: "column" }}>
        
        {/* Full Bleed Cover Background */}
        <div style={{ height: "35vh", backgroundImage: `url(${userData.profile_photo || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop'})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)" }} />
        </div>

        {/* Foreground Content */}
        <div style={{ position: "relative", zIndex: 1, padding: "0 20px", marginTop: -60, flex: 1, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 60 }}>
          
          {/* Profile Card */}
          <div style={{ 
            background: "var(--card-bg, #ffffff)", 
            borderRadius: "24px", 
            padding: "0 32px 32px 32px", 
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)", 
            border: "1px solid var(--border)",
            position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: -60 }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
                {userData.profile_photo && userData.profile_photo.length > 10 && userData.profile_photo !== "null" ? (
                  <img src={userData.profile_photo} style={{ width: 120, height: 120, borderRadius: "50%", border: "6px solid var(--card-bg, #ffffff)", objectFit: "cover", background: "var(--bg-1)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div style={{ display: (userData.profile_photo && userData.profile_photo.length > 10 && userData.profile_photo !== "null") ? 'none' : 'flex', width: 120, height: 120, borderRadius: "50%", border: "6px solid var(--card-bg, #ffffff)", background: "var(--accent-grad, linear-gradient(135deg, #3b82f6, #8b5cf6))", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: "bold", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", textTransform: "uppercase" }}>
                  {(userData.full_name || userData.email || 'U')[0]}
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 12, marginTop: 84 }}>
                <button onClick={() => setShowShareModal(true)} style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                  Share
                </button>
                <button onClick={() => {
                  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${userData.full_name || ''}\nTITLE:${userData.role || ''}\nEMAIL:${userData.email || ''}\nTEL:${userData.phone || ''}\nNOTE:${userData.bio ? userData.bio.replace(/\\n/g, '\\\\n') : ''}\nURL:${userData.socialLinks?.website || ''}\nEND:VCARD`;
                  const blob = new Blob([vcard], { type: 'text/vcard' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${(userData.full_name || 'contact').replace(/\\s+/g, '_')}.vcf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }} style={{ background: "var(--accent-1)", color: "white", border: "none", padding: "8px 16px", borderRadius: 20, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.opacity = 0.9} onMouseOut={e => e.currentTarget.style.opacity = 1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 20 }}>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>{userData.full_name || 'User'}</h1>
              {userData.role && <div style={{ fontSize: 18, color: "var(--accent-1)", fontWeight: 600, marginTop: 4 }}>{userData.role}</div>}
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, color: "var(--ink-2)", fontSize: 15, fontWeight: 500 }}>
                {userData.location && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    {userData.location}
                  </div>
                )}
                {userData.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    <a href={`mailto:${userData.email}`} style={{ color: "inherit", textDecoration: "none" }}>{userData.email}</a>
                  </div>
                )}
                {userData.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <a href={`tel:${userData.phone}`} style={{ color: "inherit", textDecoration: "none" }}>{userData.phone}</a>
                  </div>
                )}
              </div>

              {userData.bio && (
                <p style={{ marginTop: 24, fontSize: 16, lineHeight: 1.6, color: "var(--ink-1)" }}>
                  {userData.bio}
                </p>
              )}

            {Object.values(socialLinks).some(link => link && link.trim()) && (
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0" }}>Connect</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", textDecoration: "none", fontSize: 15, padding: "10px 16px", background: "var(--surface)", borderRadius: 24, border: "1px solid var(--border)", fontWeight: 600 }}>
                      📷 Instagram
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", textDecoration: "none", fontSize: 15, padding: "10px 16px", background: "var(--surface)", borderRadius: 24, border: "1px solid var(--border)", fontWeight: 600 }}>
                      💼 LinkedIn
                    </a>
                  )}
                  {socialLinks.github && (
                    <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", textDecoration: "none", fontSize: 15, padding: "10px 16px", background: "var(--surface)", borderRadius: 24, border: "1px solid var(--border)", fontWeight: 600 }}>
                      🐱 GitHub
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", textDecoration: "none", fontSize: 15, padding: "10px 16px", background: "var(--surface)", borderRadius: 24, border: "1px solid var(--border)", fontWeight: 600 }}>
                      ✖ X
                    </a>
                  )}
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink)", textDecoration: "none", fontSize: 15, padding: "10px 16px", background: "var(--surface)", borderRadius: 24, border: "1px solid var(--border)", fontWeight: 600 }}>
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            )}

              {/* Interests inside Virtual Card Page Profile */}
              {userData.skills && userData.skills.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0" }}>Interests</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {userData.skills.map((skill, i) => (
                      <div key={i} style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 20, padding: "8px 14px", color: "var(--ink)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-1)" }}></span> {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <VirtualCard user={{ ...userData, name: userData.full_name }} />
          </div>
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
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my Samaagum Virtual Card: ${window.location.href}`)}`}
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
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my Samaagum Virtual Card`)}&url=${encodeURIComponent(window.location.href)}`}
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
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
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
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
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
                value={window.location.href}
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
                  navigator.clipboard.writeText(window.location.href);
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
                      title: `${userData.full_name || 'User'} - Virtual Card`,
                      text: `Check out my Samaagum Virtual Card`,
                      url: window.location.href
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

import ReactDOM from 'react-dom/client';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<VirtualCardPage />);
}


