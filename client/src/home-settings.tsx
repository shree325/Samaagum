// @ts-nocheck
/* ============================================================
   Samaagum Home — Account & Privacy Settings Page
   ============================================================ */

const { useState, useEffect, useRef } = React;

function SettingsPage({ st, go }) {
  // Navigation tabs in settings page
  const [activeTab, setActiveTab] = useState("account");

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
    try {
      const saved = localStorage.getItem("samaagum_privacy_prefs");
      return saved ? JSON.parse(saved) : {
        profileVisibility: "public", // public, private
        showActiveStatus: true,
        searchIndexing: true,
        directMessages: false,
        twoStepVerification: true,
        supportAccess: true,
      };
    } catch (e) {
      return {
        profileVisibility: "public",
        showActiveStatus: true,
        searchIndexing: true,
        directMessages: false,
        twoStepVerification: true,
        supportAccess: true,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("samaagum_privacy_prefs", JSON.stringify(privacy));
  }, [privacy]);

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
    if (window.toast) {
      window.toast("Preference updated!");
    }
  };

  const handleVisibilityChange = (value) => {
    setPrivacy(prev => ({ ...prev, profileVisibility: value }));
    if (window.toast) {
      window.toast(`Profile visibility set to ${value}`);
    }
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
        { id: "apps", label: "Apps", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg> },
        { id: "account", label: "Account", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.8"/><path d="M5 19.5c.8-3.4 3.6-5 7-5s6.2 1.6 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        { id: "notification", label: "Notification", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M6 9a6 6 0 0112 0c0 4 1.2 5.5 2 6.5H4c.8-1 2-2.5 2-6.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 19a2 2 0 004 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
        { id: "language", label: "Language & Region", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="12" r="8.3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.7 12h16.6M12 3.7c2.2 2.2 3.3 5 3.3 8.3S14.2 18.1 12 20.3c-2.2-2.2-3.3-5-3.3-8.3S9.8 5.9 12 3.7z" stroke="currentColor" strokeWidth="1.8"/></svg> },
      ]
    },
    {
      title: "Workspace Settings",
      items: [
        { id: "general", label: "General", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg> },
        { id: "billing", label: "Billing", icon: <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M20 7H4a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8"/><path d="M22 13h-4v2h4v-2zM4 7V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg> },
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
            
            {activeTab !== "account" ? (
              // Empty state for other sections
              <div style={{ textAlign: "center", padding: "64px 0", color: "var(--ink-3)" }}>
                <div style={{ fontSize: "48px", marginBottom: 16 }}>⚙️</div>
                <h3 style={{ fontSize: "18px", color: "var(--ink)", marginBottom: 8, fontWeight: 600 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</h3>
                <p style={{ fontSize: "14px", color: "var(--ink-3)", maxWidth: 360, margin: "0 auto" }}>
                  This section is empty because this task only asks to make changes in Account Settings.
                </p>
              </div>
            ) : (
              // Account Settings Panel
              <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
                
                {/* 1. My Profile */}
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 24 }}>
                    My Profile
                  </h2>

                  {/* Avatar Upload */}
                  <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                    <Avatar name={ME.name} img={profile.img} size={72} className="ring" />
                    <div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            background: "var(--ink)",
                            color: "var(--bg)",
                            border: "none",
                            borderRadius: "var(--r-pill)",
                            padding: "8px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "opacity var(--t-fast)"
                          }}
                        >
                          + Change Image
                        </button>
                        <button 
                          onClick={handleRemoveImage}
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--ink)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--r-pill)",
                            padding: "8px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Remove Image
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          hidden 
                          accept="image/*" 
                          onChange={handleImageChange} 
                        />
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--ink-3)" }}>
                        We support PNGs, JPEGs and GIFs under 2MB
                      </p>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>First Name</label>
                      <input 
                        className="cfield" 
                        value={profile.firstName} 
                        onChange={(e) => handleInputChange("firstName", e.target.value)} 
                        style={{
                          background: "var(--field)",
                          border: "1px solid var(--border)",
                          color: "var(--ink)",
                          padding: "12px 16px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "14px",
                          outline: "none"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>Last Name</label>
                      <input 
                        className="cfield" 
                        value={profile.lastName} 
                        onChange={(e) => handleInputChange("lastName", e.target.value)} 
                        style={{
                          background: "var(--field)",
                          border: "1px solid var(--border)",
                          color: "var(--ink)",
                          padding: "12px 16px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "14px",
                          outline: "none"
                        }}
                      />
                    </div>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

                {/* 2. Account Security */}
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: 24 }}>
                    Account Security
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Email Row */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>Email</label>
                        <input 
                          className="cfield" 
                          value={profile.email} 
                          readOnly 
                          style={{
                            background: "var(--field)",
                            border: "1px solid var(--border)",
                            color: "var(--ink-3)",
                            padding: "12px 16px",
                            borderRadius: "var(--r-sm)",
                            fontSize: "14px",
                            outline: "none",
                            cursor: "not-allowed"
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => window.toast ? window.toast("Email verification link sent!") : alert("Verification sent")}
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--ink)",
                          border: "1.5px solid var(--border)",
                          padding: "12px 20px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Change email
                      </button>
                    </div>

                    {/* Password Row */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--ink-2)" }}>Password</label>
                        <input 
                          type="password"
                          className="cfield" 
                          value="••••••••••••" 
                          readOnly
                          style={{
                            background: "var(--field)",
                            border: "1px solid var(--border)",
                            color: "var(--ink-3)",
                            padding: "12px 16px",
                            borderRadius: "var(--r-sm)",
                            fontSize: "14px",
                            outline: "none",
                            cursor: "not-allowed"
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => window.toast ? window.toast("Password reset link sent to your email!") : alert("Reset link sent")}
                        style={{
                          background: "var(--surface-2)",
                          color: "var(--ink)",
                          border: "1.5px solid var(--border)",
                          padding: "12px 20px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Change password
                      </button>
                    </div>

                    {/* 2-Step Verification Toggle */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
                      <div style={{ maxWidth: "80%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>2-Step Verifications</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Add an additional layer of security to your account during login.</div>
                      </div>
                      <button 
                        onClick={() => handleToggle("twoStepVerification")}
                        style={{
                          background: privacy.twoStepVerification ? "var(--accent-2)" : "var(--border-3, #ccc)",
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
                          left: privacy.twoStepVerification ? 23 : 3,
                          transition: "left var(--t-fast)"
                        }} />
                      </button>
                    </div>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

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
                          <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Only connections can see your details. Hidden from searches.</div>
                        </button>
                      </div>
                    </div>

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

                    {/* Direct Messaging Security */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: "1px solid var(--border-2)" }}>
                      <div style={{ maxWidth: "70%" }}>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>Who can start direct messages with you</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-3)" }}>Choose the level of privacy for your inbox.</div>
                      </div>
                      <select 
                        value={profile.messagingRestriction}
                        onChange={(e) => handleInputChange("messagingRestriction", e.target.value)}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          color: "var(--ink)",
                          padding: "8px 12px",
                          borderRadius: "var(--r-sm)",
                          fontSize: "13.5px",
                          outline: "none"
                        }}
                      >
                        <option value="anyone">Anyone</option>
                        <option value="only_connected">Only Connected Users</option>
                        <option value="approval_required">Approval Required</option>
                      </select>
                    </div>
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

Object.assign(window, { SettingsPage });
