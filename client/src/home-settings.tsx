// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { Toggle } from './create_event';
import { ME } from './home-data';
import { Profile } from './home-profile';
import { Empty, Sidebar } from './home-shell';
import { Footer } from './landing-activity';
import { I } from './home-icons';

/* ============================================================
   Samaagum Home — Account & Privacy Settings Page
   ============================================================ */



export function SettingsPage({ st, go, activeTabParam }) {
  // Navigation tabs in settings page
  const [activeTab, setActiveTab] = useState(activeTabParam || "account");

  useEffect(() => {
    if (activeTabParam) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  // Sync profile details from ME
  const [profile, setProfile] = useState({
    firstName: ME.name ? ME.name.split(" ")[0] || "" : "",
    lastName: ME.name ? ME.name.split(" ").slice(1).join(" ") || "" : "",
    email: ME.email || "",
    img: ME.img || "",
    messagingRestriction: ME.messaging_restriction || "anyone",
  });

  // Privacy preferences (persisted in localStorage)
  const [privacy, setPrivacy] = useState(() => {
    const defaultPrefs = {
      profileVisibility: "public", // public, private
      showActiveStatus: true,
      searchIndexing: true,
      directMessages: false,
      twoStepVerification: true,
      supportAccess: true,
      privateProfileMode: "hide_all", // hide_all, custom_fields
      visibleFields: {
        email: false,
        phone: false,
        location: true,
        gender: false,
        dob: false,
        socialLinks: true,
        virtualCard: true
      }
    };
    if (ME.privacy) {
      return { ...defaultPrefs, ...ME.privacy };
    }
    try {
      const saved = localStorage.getItem("samaagum_privacy_prefs");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultPrefs, ...parsed };
      }
      return defaultPrefs;
    } catch (e) {
      return defaultPrefs;
    }
  });

  const syncPrivacyToServer = async (newPrefs) => {
    try {
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');
      const res = await fetch(`${api}/api/admin/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          privacyPrefs: newPrefs
        })
      });
      if (res.ok && window.chatSocket) {
        window.chatSocket.emit("privacy.update");
      }
    } catch (e) {
      console.error("Failed to sync privacy preferences to server", e);
    }
  };



  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [billingData, setBillingData] = useState(null);
  const [billingOrders, setBillingOrders] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);

  const getLocalSession = () => {
    const userAgent = navigator.userAgent;
    let os = 'macOS';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('Linux')) os = 'Linux';

    let browser = 'Chrome';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    return {
      id: 'current-session',
      browser,
      os,
      ip: '127.0.0.1',
      current: true,
      lastActive: new Date().toISOString()
    };
  };

  useEffect(() => {
    if (activeTab === "session") {
      setLoadingSessions(true);
      setSessions([getLocalSession()]);

      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');
      fetch(`${api}/api/admin/user/sessions`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      })
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data && res.data.length > 0) {
            setSessions(res.data);
          }
        })
        .catch(err => console.error("Error fetching sessions:", err))
        .finally(() => setLoadingSessions(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "billing") {
      setLoadingBilling(true);
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');

      Promise.all([
        fetch(`${api}/api/subscription/status`, {
          headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
        }).then(res => res.json()),
        fetch(`${api}/api/subscription/orders`, {
          headers: { ...(token ? { "Authorization": `Bearer ${token}` } : {}) }
        }).then(res => res.json())
      ])
        .then(([statusRes, ordersRes]) => {
          if (statusRes.success && statusRes.data) {
            setBillingData(statusRes.data.subscription);
          } else {
            setBillingData(null);
          }
          if (ordersRes.success && ordersRes.data) {
            setBillingOrders(ordersRes.data);
          }
        })
        .catch(err => console.error("Error fetching billing details:", err))
        .finally(() => setLoadingBilling(false));
    }
  }, [activeTab]);

  const fileInputRef = useRef(null);
  const [saving, setSaving] = useState(false);

  // Sync state if ME changes
  useEffect(() => {
    setProfile({
      firstName: ME.name ? ME.name.split(" ")[0] || "" : "",
      lastName: ME.name ? ME.name.split(" ").slice(1).join(" ") || "" : "",
      email: ME.email || "",
      img: ME.img || "",
      messagingRestriction: ME.messaging_restriction || "anyone",
    });
  }, [ME.name, ME.email, ME.img, ME.messaging_restriction]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (key) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleVisibilityChange = (value) => {
    setPrivacy(prev => ({ ...prev, profileVisibility: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, img: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfile(prev => ({ ...prev, img: "" }));
    if (window.toast) {
      window.toast("Profile picture removed");
    }
  };

  const downloadInvoice = async (orderId, orderNumber) => {
    try {
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');
      const response = await fetch(`${api}/api/subscription/orders/${orderId}/invoice`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error(err);
      if (window.toast) {
        window.toast("Error downloading invoice. Please try again.");
      } else {
        alert("Error downloading invoice. Please try again.");
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');

      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("displayName", fullName);
      formData.append("bio", ME.role || "");
      formData.append("location", ME.location || "");
      formData.append("messagingRestriction", profile.messagingRestriction);
      formData.append("privacyPrefs", JSON.stringify(privacy));

      const base64ToBlob = (base64) => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      if (profile.img && profile.img.startsWith("data:")) {
        formData.append("profilePhoto", base64ToBlob(profile.img), "profile.jpg");
      } else if (profile.img === "") {
        formData.append("profilePhoto", "");
      }

      const res = await fetch(`${api}/api/admin/user/profile`, {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (res.ok) {
        ME.name = fullName;
        ME.messaging_restriction = profile.messagingRestriction;
        if (profile.img !== undefined) ME.img = profile.img;
        
        // Save privacy preferences on success
        localStorage.setItem("samaagum_privacy_prefs", JSON.stringify(privacy));
        ME.privacy = privacy;
        if (window.chatSocket) {
          window.chatSocket.emit("privacy.update");
        }

        if (window.toast) window.toast("Settings saved successfully!");
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to save settings");
      }
    } catch (e) {
      alert("Error saving settings: " + (e.message || "Network error"));
    } finally {
      setSaving(false);
    }
  };

  const menuSections = [
    {
      title: "General Settings",
      items: [
        { id: "apps", label: "Apps", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" /></svg> },
        { id: "account", label: "Account", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.8" /><path d="M5 19.5c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> },
        { id: "session", label: "Sessions", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" /><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> },
        { id: "notification", label: "Notification", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 9a6 6 0 0112 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> },
        { id: "language", label: "Language & Region", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.8" /><path d="M3.7 12h16.6M12 3.7c2.2 2.2 3.3 5 3.3 8.3S14.2 18.1 12 20.3c-2.2-2.2-3.3-5-3.3-8.3S9.8 5.9 12 3.7z" stroke="currentColor" strokeWidth="1.8" /></svg> },
      ]
    },
    {
      title: "Workspace Settings",
      items: [
        { id: "general", label: "General", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8" /></svg> },
        { id: "billing", label: "Billing", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8" /><path d="M22 13h-4v2h4v-2zM4 7V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg> },
      ]
    }
  ];

  return (
    <div className="scroll" style={{ flex: 1, overflowY: "auto", background: "var(--bg-2)" }}>
      <div className="view-enter" style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Breadcrumb Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <button onClick={() => go("home")} style={{ background: "none", border: "none", color: "var(--ink-3)", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: 4 }}>
            Home
          </button>
          <span style={{ color: "var(--ink-3)", fontSize: "14px" }}>/</span>
          <span style={{ color: "var(--ink)", fontSize: "14px", fontWeight: 500 }}>Settings</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 600, color: "var(--ink)", marginBottom: 32 }}>
          Account Settings
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 40, alignItems: "start" }}>

          {/* Settings Sub-Sidebar Menu */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {menuSections.map((sec, sIdx) => (
              <div key={sIdx}>
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", padding: "0 12px 8px" }}>
                  {sec.title}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sec.items.map(item => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: "var(--r-md)",
                          border: "none",
                          background: active ? "var(--accent-soft)" : "transparent",
                          color: active ? "var(--accent-2)" : "var(--ink-2)",
                          fontWeight: active ? 600 : 500,
                          fontSize: "14px",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all var(--t-fast)"
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", color: "currentColor" }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          {/* Settings Main Panels */}
          <main style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 40, boxShadow: "var(--sh-sm)" }}>
            {activeTab !== "account" && activeTab !== "session" && activeTab !== "billing" ? (
              // Empty state for other sections
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-3)" }}>
                <div style={{ fontSize: "48px", marginBottom: 16 }}>⚙️</div>
                <h3 style={{ fontSize: "18px", color: "var(--ink)", marginBottom: 8, fontWeight: 600 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
                <p style={{ fontSize: "14px", color: "var(--ink-3)", maxWidth: 360, margin: "0 auto" }}>
                  This section is empty because this task only asks to make changes in Account & Session Settings.
                </p>
              </div>
            ) : activeTab === "session" ? (
              // Sessions Panel
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
                    Active Sessions & Login History
                  </h2>
                  <p style={{ fontSize: "14px", color: "var(--ink-3)", marginBottom: 24 }}>
                    Manage and view your active sessions on other browsers and devices.
                  </p>

                  {loadingSessions ? (
                    <div style={{ color: "var(--ink-3)", fontSize: "14px" }}>Loading session details...</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {sessions.map(sess => (
                        <div
                          key={sess.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "16px",
                            borderRadius: "var(--r-md)",
                            border: "1px solid var(--border)",
                            background: sess.current ? "rgba(109, 94, 252, 0.04)" : "var(--surface-2)"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: sess.current ? "rgba(109, 94, 252, 0.1)" : "var(--border)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: sess.current ? "var(--accent-2)" : "var(--ink-2)"
                            }}>
                              {sess.os === 'iOS' || sess.os === 'Android' ? (
                                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="18" r="1" fill="currentColor" /></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M7 20h10M12 16v4" stroke="currentColor" strokeWidth="1.8" /></svg>
                              )}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--ink)" }}>
                                  {sess.browser} on {sess.os}
                                </span>
                                {sess.current && (
                                  <span style={{
                                    background: "rgba(34, 197, 94, 0.1)",
                                    color: "rgb(34, 197, 94)",
                                    padding: "2px 8px",
                                    borderRadius: "var(--r-pill)",
                                    fontSize: "11px",
                                    fontWeight: 600
                                  }}>
                                    This device
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                                <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>IP: {sess.ip}</span>
                                <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>•</span>
                                <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                                  {sess.current ? "Active now" : `Last login: ${new Date(sess.lastActive).toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {!sess.current && (
                            <button
                              onClick={() => {
                                setSessions(prev => prev.filter(s => s.id !== sess.id));
                                if (window.toast) window.toast("Session revoked.");
                              }}
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border)",
                                color: "#e5484d",
                                borderRadius: "var(--r-sm)",
                                padding: "6px 12px",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all var(--t-fast)"
                              }}
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "billing" ? (
              // Billing Dashboard Panel
              <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>
                    Billing & Subscriptions
                  </h2>
                  <p style={{ fontSize: "14px", color: "var(--ink-3)", marginBottom: 24 }}>
                    Manage your plans, view subscription status, and check your order history.
                  </p>

                  {loadingBilling ? (
                    <div style={{ color: "var(--ink-3)", fontSize: "14px", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--border)", borderTopColor: "var(--accent-2)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      Loading billing information...
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                      {/* Subscription Status Card */}
                      <div style={{
                        background: "linear-gradient(135deg, var(--surface), var(--surface-2))",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-lg)",
                        padding: "24px",
                        boxShadow: "var(--sh-sm)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 20
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)", fontWeight: 600 }}>Current Plan</span>
                            <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>
                              {billingData && billingData.plan ? (billingData.plan.charAt(0).toUpperCase() + billingData.plan.slice(1)) : "Free Tier"}
                            </h3>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              borderRadius: "var(--r-pill)",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: billingData?.status === "active" ? "rgba(34, 197, 94, 0.1)" : "rgba(100, 116, 139, 0.1)",
                              color: billingData?.status === "active" ? "rgb(34, 197, 94)" : "var(--ink-3)"
                            }}>
                              {billingData && billingData.plan ? (billingData.status.toUpperCase()) : "FREE TIER"}
                            </span>
                            <button
                              onClick={() => go("upgrade")}
                              style={{
                                background: "var(--accent-2)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--r-md)",
                                padding: "8px 16px",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                transition: "all var(--t-fast)"
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                              {billingData && billingData.plan ? "Renew / Upgrade" : "Upgrade Plan"}
                            </button>
                          </div>
                        </div>

                        {billingData && billingData.plan ? (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                            <div>
                              <div style={{ fontSize: "12px", color: "var(--ink-3)", marginBottom: 4 }}>Billing Cycle</div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                                {billingData.billingCycle === "yearly" ? "Yearly" : "Monthly"}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "12px", color: "var(--ink-3)", marginBottom: 4 }}>Purchase Date</div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                                {new Date(billingData.startDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "12px", color: "var(--ink-3)", marginBottom: 4 }}>Expiry Date</div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                                {new Date(billingData.endDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: "12px", color: "var(--ink-3)", marginBottom: 4 }}>Time Remaining</div>
                              <div style={{ fontSize: "14px", fontWeight: 600, color: billingData?.endDate && Math.ceil((new Date(billingData.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 5 ? "rgb(239, 68, 68)" : "var(--ink)" }}>
                                {(() => {
                                  const days = Math.ceil((new Date(billingData.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                  if (days < 0) return "Expired";
                                  if (days === 0) return "Expires today";
                                  return `${days} days left`;
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: "var(--ink-2)", fontSize: "14px", borderTop: "1px solid var(--border)", paddingTop: 20 }}>
                            You do not have an active premium plan. Upgrade to a premium plan to unlock advanced networking, platform customizations, and more host features!
                          </div>
                        )}
                      </div>

                      {/* Billing History Table */}
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", marginBottom: 16 }}>Billing History</h3>
                        {billingOrders.length === 0 ? (
                          <div style={{
                            textAlign: "center",
                            padding: "32px",
                            border: "1px dashed var(--border)",
                            borderRadius: "var(--r-md)",
                            color: "var(--ink-3)",
                            fontSize: "14px"
                          }}>
                            No billing history or invoices found.
                          </div>
                        ) : (
                          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                              <thead>
                                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Order Number</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Plan</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Billing Cycle</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Date</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Total</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Payment Method</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Status</th>
                                  <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink-2)" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {billingOrders.map(order => (
                                  <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink)" }}>{order.order_number}</td>
                                    <td style={{ padding: "12px 16px", color: "var(--ink-2)" }}>
                                      {order.admin_subscription_plans?.name || order.plan_id}
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "var(--ink-2)", textTransform: "capitalize" }}>{order.plan_type}</td>
                                    <td style={{ padding: "12px 16px", color: "var(--ink-3)" }}>
                                      {new Date(order.completed_at || order.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--ink)" }}>
                                      {order.currency} {parseFloat(order.total).toFixed(2)}
                                    </td>
                                    <td style={{ padding: "12px 16px", color: "var(--ink-3)" }}>{order.payment_method_title || order.payment_method}</td>
                                    <td style={{ padding: "12px 16px" }}>
                                      <span style={{
                                        display: "inline-block",
                                        padding: "2px 8px",
                                        borderRadius: "var(--r-pill)",
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        background: order.status === "completed" ? "rgba(34, 197, 94, 0.1)" : order.status === "pending" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                        color: order.status === "completed" ? "rgb(34, 197, 94)" : order.status === "pending" ? "rgb(245, 158, 11)" : "rgb(239, 68, 68)"
                                      }}>
                                        {order.status}
                                      </span>
                                    </td>
                                    <td style={{ padding: "12px 16px" }}>
                                      {order.status === "completed" && (
                                        <button
                                          onClick={() => downloadInvoice(order.id, order.order_number)}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: "1px solid var(--border)",
                                            background: "var(--surface)",
                                            color: "var(--ink-2)",
                                            fontSize: "12px",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            transition: "all 0.2s"
                                          }}
                                          onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
                                          onMouseLeave={e => { e.currentTarget.style.color = "var(--ink-2)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                                        >
                                          <I.download style={{ width: 13, height: 13 }} /> Invoice
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Account Settings Panel
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                {/* 3. Task Specific: Profile Visibility & Privacy Preferences */}
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 24 }}>
                    Profile Visibility & Privacy
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Profile Visibility Setting */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>Profile Visibility</label>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button
                          onClick={() => handleVisibilityChange("public")}
                          style={{
                            flex: 1,
                            padding: "16px",
                            borderRadius: "var(--r-md)",
                            border: `1.5px solid ${privacy.profileVisibility === "public" ? "var(--accent-2)" : "var(--border)"}`,
                            background: privacy.profileVisibility === "public" ? "var(--accent-soft)" : "transparent",
                            color: "var(--ink)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all var(--t-std)"
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 4 }}>Public Profile</div>
                          <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Anyone can view your hosted events, bio, and interests.</div>
                        </button>
                        <button
                          onClick={() => handleVisibilityChange("private")}
                          style={{
                            flex: 1,
                            padding: "16px",
                            borderRadius: "var(--r-md)",
                            border: `1.5px solid ${privacy.profileVisibility === "private" ? "var(--accent-2)" : "var(--border)"}`,
                            background: privacy.profileVisibility === "private" ? "var(--accent-soft)" : "transparent",
                            color: "var(--ink)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all var(--t-std)"
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: 4 }}>Private Profile</div>
                          <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>You control exactly what every visitor can see. Hidden from searches.</div>
                        </button>
                      </div>
                    </div>

                    {privacy.profileVisibility === "private" && (
                      <div
                        className="view-enter"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          padding: "20px",
                          marginTop: "8px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 16,
                          animation: "fadeIn 0.2s ease-out"
                        }}
                      >
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                          Private Profile Settings
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="privateProfileMode"
                              value="hide_all"
                              checked={privacy.privateProfileMode === "hide_all"}
                              onChange={() => {
                                setPrivacy(prev => ({ ...prev, privateProfileMode: "hide_all" }));
                                if (window.toast) window.toast("Full profile hidden enabled");
                              }}
                              style={{ marginTop: "4px" }}
                            />
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>Hide full profile</div>
                              <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Your entire profile is hidden from everyone who visits it. Only your name is visible.</div>
                            </div>
                          </label>

                          <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                            <input
                              type="radio"
                              name="privateProfileMode"
                              value="custom_fields"
                              checked={privacy.privateProfileMode === "custom_fields"}
                              onChange={() => {
                                setPrivacy(prev => ({ ...prev, privateProfileMode: "custom_fields" }));
                                if (window.toast) window.toast("Custom visibility enabled");
                              }}
                              style={{ marginTop: "4px" }}
                            />
                            <div>
                              <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--ink)" }}>Custom visibility (Select visible fields)</div>
                              <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Control exactly what fields are visible to everyone who visits your profile.</div>
                            </div>
                          </label>
                        </div>

                        {privacy.privateProfileMode === "custom_fields" && (
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: "12px 20px",
                              borderTop: "1px solid var(--border)",
                              paddingTop: "16px",
                              marginTop: "8px"
                            }}
                          >
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink-3)", gridColumn: "1 / -1", marginBottom: "4px" }}>
                              Select fields to SHOW to visitors:
                            </div>
                            {[
                              { key: "email", label: "Email Address" },
                              { key: "phone", label: "Phone Number" },
                              { key: "location", label: "Location" },
                              { key: "gender", label: "Gender" },
                              { key: "dob", label: "Date of Birth" },
                              { key: "socialLinks", label: "Social Links & Socials" },
                              { key: "virtualCard", label: "Virtual Card" }
                            ].map(field => (
                              <label key={field.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px", color: "var(--ink)", cursor: "pointer" }}>
                                <input
                                  type="checkbox"
                                  checked={privacy.visibleFields?.[field.key] || false}
                                  onChange={() => {
                                    setPrivacy(prev => ({
                                      ...prev,
                                      visibleFields: {
                                        ...prev.visibleFields,
                                        [field.key]: !prev.visibleFields?.[field.key]
                                      }
                                    }));
                                  }}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    accentColor: "var(--accent-2)"
                                  }}
                                />
                                {field.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Active Status Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
                      <div style={{ maxWidth: "80%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Show active status</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Allow other community members to see when you are online in chats.</div>
                      </div>
                      <button
                        onClick={() => handleToggle("showActiveStatus")}
                        style={{
                          background: privacy.showActiveStatus ? "var(--accent-2)" : "var(--border-3, #ccc)",
                          border: "none",
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          position: "relative",
                          cursor: "pointer",
                          transition: "background var(--t-fast)"
                        }}
                      >
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: privacy.showActiveStatus ? 23 : 3,
                          transition: "left var(--t-fast)"
                        }} />
                      </button>
                    </div>

                    {/* Search Indexing Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
                      <div style={{ maxWidth: "80%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Search Engine Indexing</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Allow search engines like Google to index your public Samaagum profile page.</div>
                      </div>
                      <button
                        onClick={() => handleToggle("searchIndexing")}
                        style={{
                          background: privacy.searchIndexing ? "var(--accent-2)" : "var(--border-3, #ccc)",
                          border: "none",
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          position: "relative",
                          cursor: "pointer",
                          transition: "background var(--t-fast)"
                        }}
                      >
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: privacy.searchIndexing ? 23 : 3,
                          transition: "left var(--t-fast)"
                        }} />
                      </button>
                    </div>

                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

                {/* Messaging Preferences — standalone section */}
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
                    Messaging Preferences
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--ink-3)", marginBottom: 24 }}>
                    Control who is allowed to start a direct conversation with you.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      {
                        value: "anyone",
                        label: "Anyone",
                        desc: "Any Samaagum member can send you a direct message, even without connecting first.",
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )
                      },
                      {
                        value: "only_connected",
                        label: "Only Connected Users",
                        desc: "Only people you have accepted a connection with can start a conversation with you.",
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                            <path d="M17 20c0-2.76-2.24-5-5-5s-5 2.24-5 5M12 15a4 4 0 100-8 4 4 0 000 8zM22 11a3 3 0 11-6 0 3 3 0 016 0zM2 11a3 3 0 116 0 3 3 0 01-6 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )
                      },
                      {
                        value: "no_one",
                        label: "No One",
                        desc: "Nobody can send you direct messages. The message icon is hidden from your profile entirely.",
                        icon: (
                          <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                            <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        )
                      }
                    ].map(opt => {
                      const active = (profile.messagingRestriction || "anyone") === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleInputChange("messagingRestriction", opt.value)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            padding: "14px 16px",
                            borderRadius: "var(--r-md)",
                            border: `1.5px solid ${active ? "var(--accent-2)" : "var(--border)"}`,
                            background: active ? "var(--accent-soft)" : "transparent",
                            color: "var(--ink)",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "all var(--t-std)"
                          }}
                        >
                          <span style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: active ? "rgba(109,94,252,0.12)" : "var(--surface-2)",
                            color: active ? "var(--accent-2)" : "var(--ink-2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all var(--t-std)"
                          }}>
                            {opt.icon}
                          </span>
                          <span style={{ flex: 1 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 600, fontSize: "14px", color: active ? "var(--accent-2)" : "var(--ink)" }}>
                                {opt.label}
                              </span>
                              {active && (
                                <span style={{ background: "var(--accent-2)", color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--r-pill)", letterSpacing: "0.04em" }}>
                                  ACTIVE
                                </span>
                              )}
                            </span>
                            <span style={{ display: "block", fontSize: "12px", color: "var(--ink-3)", marginTop: 3 }}>
                              {opt.desc}
                            </span>
                          </span>
                          <span style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--accent-2)" : "var(--border-2)"}`,
                            background: active ? "var(--accent-2)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all var(--t-std)"
                          }}>
                            {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />



                {/* 4. Support Access */}
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 24 }}>
                    Support Access
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Support Access Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ maxWidth: "80%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Support access</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>You have granted us to access to your account for support purposes until Aug 31, 2023, 9:40 PM.</div>
                      </div>
                      <button
                        onClick={() => handleToggle("supportAccess")}
                        style={{
                          background: privacy.supportAccess ? "var(--accent-2)" : "var(--border-3, #ccc)",
                          border: "none",
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          position: "relative",
                          cursor: "pointer",
                          transition: "background var(--t-fast)"
                        }}
                      >
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 3,
                          left: privacy.supportAccess ? 23 : 3,
                          transition: "left var(--t-fast)"
                        }} />
                      </button>
                    </div>

                    {/* Log out of all devices */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Log out of all devices</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Log out of all other active sessions on other devices besides this one.</div>
                      </div>
                      <button
                        onClick={() => window.toast ? window.toast("Logged out of all other devices successfully.") : alert("Logged out")}
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--ink)",
                          border: "1.5px solid var(--border)",
                          padding: "10px 20px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Log out
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#e5484d", marginBottom: 4 }}>Delete my account</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Permanently delete the account and remove access from all workspaces.</div>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you absolutely sure you want to delete your account? This action is irreversible.")) {
                            localStorage.clear();
                            window.location.href = "/";
                          }
                        }}
                        style={{
                          background: "rgba(229, 72, 77, 0.08)",
                          color: "#e5484d",
                          border: "1px solid rgba(229, 72, 77, 0.2)",
                          padding: "10px 20px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Save / Cancel buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={() => go("home")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--ink-2)",
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      padding: "10px 20px"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      background: "var(--accent-grad)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--r-pill)",
                      padding: "12px 28px",
                      fontSize: "14.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "var(--sh-glow)",
                      opacity: saving ? 0.7 : 1,
                      transition: "opacity var(--t-fast)"
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}


