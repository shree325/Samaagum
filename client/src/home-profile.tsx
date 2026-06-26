// @ts-nocheck
/* ============================================================
   Samaagum Home — Public profile (TAPOnn-grade)
   ============================================================ */

const UploadIcon = (p) => <svg viewBox="0 0 24 24" fill="none" width="16" height="16" {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const UserIcon = (p) => <svg viewBox="0 0 24 24" fill="none" width="24" height="24" {...p}><circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" /><path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;

const handleImageUpload = (e, callback) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => callback(reader.result);
  reader.readAsDataURL(file);
};

function EditProfileForm({ profile, onCancel }) {
  const [form, setForm] = React.useState({
    name: profile.name || "",
    role: profile.role || "",
    handle: profile.handle || "",
    bio: profile.bio || "",
    location: profile.location || "",
    locationName: profile.locationName || "",
    locationLat: profile.locationLat || undefined,
    locationLng: profile.locationLng || undefined,
    address: profile.address || "",
    gender: profile.gender || "",
    dob: profile.dob || "",
    phone: profile.phone || "",
    profilePhoto: profile.img || "",
    coverBanner: profile.coverBanner || ""
  });



  const coverRef = React.useRef(null);
  const avatarRef = React.useRef(null);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');

      const nameParts = (form.name || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("displayName", form.name || "");
      formData.append("userName", form.handle || "");
      formData.append("headline", form.role || "");
      formData.append("bio", form.bio || "");
      formData.append("location", form.location || "");
      formData.append("locationName", form.locationName || "");
      if (form.locationLat !== undefined) formData.append("locationLat", form.locationLat);
      if (form.locationLng !== undefined) formData.append("locationLng", form.locationLng);
      formData.append("address", form.address || "");
      formData.append("gender", form.gender || "");
      formData.append("dob", form.dob || "");
      formData.append("phone", form.phone || "");

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

      if (form.profilePhoto && form.profilePhoto !== profile.img && form.profilePhoto.startsWith("data:")) {
        formData.append("profilePhoto", base64ToBlob(form.profilePhoto), "profile.jpg");
      }
      
      if (form.coverBanner && form.coverBanner !== profile.coverBanner && form.coverBanner.startsWith("data:")) {
        formData.append("coverBanner", base64ToBlob(form.coverBanner), "cover.jpg");
      } else if (form.coverBanner === "") {
        formData.append("coverBanner", "");
      }

      const res = await fetch(`${api}/api/admin/user/profile`, {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (res.ok) {
        Object.assign(profile, form);
        if (form.profilePhoto) profile.img = form.profilePhoto;
        if (form.locationName) profile.locationName = form.locationName;
        if (form.locationLat !== undefined) profile.locationLat = form.locationLat;
        if (form.locationLng !== undefined) profile.locationLng = form.locationLng;
        if (form.address) profile.address = form.address;
        
        if (window.ME) {
          window.ME.location = form.location || form.locationName || window.ME.location;
        }

        if (window.toast) window.toast("Profile saved to database!");
        onCancel();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to save profile");
      }
    } catch (e) {
      alert("Error saving profile: " + (e.message || "Network error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="scroll">
      <div className="view-enter" style={{ maxWidth: 680, margin: "0 auto", padding: "40px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--ink-1)", letterSpacing: "-0.5px" }}>Edit Profile</h1>
            <p style={{ marginTop: 6, fontSize: 15, color: "var(--ink-3)" }}>Manage your digital identity and contact info.</p>
          </div>
          <button onClick={onCancel} className="hbtn hbtn--ghost"><I.external style={{ transform: "rotate(180deg)", marginRight: 6 }} /> Back</button>
        </div>

        {/* Premium Card Container */}
        <div style={{ background: "var(--bg-2)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}>

          {/* Cover Banner Area */}
          <div
            onClick={() => coverRef.current?.click()}
            className="group"
            style={{ height: 180, background: "var(--bg-3)", position: "relative", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
          >
            {form.coverBanner ? (
              <img src={form.coverBanner} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}>
                <UploadIcon style={{ marginBottom: 12, width: 28, height: 28, opacity: 0.8 }} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Add Cover Banner</span>
              </div>
            )}
            {/* Hover Overlay */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", opacity: 0, transition: "opacity 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center" }} className="group-hover:opacity-100">
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}><UploadIcon /> Change Cover</span>
            </div>
            <input type="file" ref={coverRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, set("coverBanner"))} />
          </div>

          {/* Form Content Area */}
          {/* Form Content Area */}
          <div style={{ padding: "96px 40px 40px 40px", position: "relative" }}>

            {/* Avatar Upload */}
            <div style={{ position: "absolute", top: -56, left: 40 }}>
              <div
                onClick={() => avatarRef.current?.click()}
                className="group"
                style={{ width: 112, height: 112, borderRadius: "50%", background: "var(--bg-1)", border: "4px solid var(--bg-2)", overflow: "hidden", cursor: "pointer", position: "relative", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              >
                {form.profilePhoto ? (
                  <img src={form.profilePhoto} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : profile.name ? (
                  <div style={{ width: "100%", height: "100%", background: "var(--accent-grad)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: "bold" }}>{profile.name[0]}</div>
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--bg-3)", color: "var(--ink-3)", display: "flex", alignItems: "center", justifyContent: "center" }}><UserIcon style={{ width: 40, height: 40 }} /></div>
                )}
                {/* Hover Overlay */}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", opacity: 0, transition: "opacity 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center" }} className="group-hover:opacity-100">
                  <UploadIcon style={{ color: "#fff", width: 24, height: 24 }} />
                </div>
                <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => handleImageUpload(e, set("profilePhoto"))} />
              </div>
            </div>

            {/* Inputs Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Full Name</label>
                <input className="cfield" value={form.name} onChange={(e) => set("name")(e.target.value)} style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Handle / Username</label>
                <input className="cfield" value={form.handle} onChange={(e) => set("handle")(e.target.value)} style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Role / Headline</label>
                <input className="cfield" value={form.role} onChange={(e) => set("role")(e.target.value)} placeholder="e.g. Software Engineer" style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s ease" }} />
              </div>
              {window.featureSettings?.location_active !== false && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Location</label>
                  {window.LocationSelector && (
                    <window.LocationSelector
                      value={{
                        location_name: form.locationName || form.location,
                        address: form.address || form.location,
                        latitude: form.locationLat,
                        longitude: form.locationLng
                      }}
                      onChange={(loc) => {
                        if (loc) {
                          set("locationName")(loc.location_name);
                          set("location")(loc.location_name);
                          set("address")(loc.address);
                          set("locationLat")(loc.latitude);
                          set("locationLng")(loc.longitude);
                        } else {
                          set("locationName")("");
                          set("location")("");
                          set("address")("");
                          set("locationLat")(undefined);
                          set("locationLng")(undefined);
                        }
                      }}
                      placeholder="e.g. Bengaluru"
                    />
                  )}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Gender</label>
                <div style={{ position: "relative" }}>
                  <select className="cfield" value={form.gender} onChange={(e) => set("gender")(e.target.value)} style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", transition: "border-color 0.2s ease", appearance: "none" }}>
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                  <svg style={{ position: "absolute", right: 16, top: 14, pointerEvents: "none", color: "var(--ink-3)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Date of Birth</label>
                <input type="date" className="cfield" value={form.dob} onChange={(e) => set("dob")(e.target.value)} style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", transition: "border-color 0.2s ease" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Phone Number</label>
                <input type="tel" className="cfield" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="e.g. +1 234 567 8900" style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", transition: "border-color 0.2s ease" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>Bio</label>
                <textarea className="cfield" rows={4} value={form.bio} onChange={(e) => set("bio")(e.target.value)} style={{ background: "var(--bg-1)", border: "1px solid var(--border)", color: "var(--ink-1)", padding: "14px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", resize: "vertical", transition: "border-color 0.2s ease" }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 16 }}>
              <button onClick={onCancel} disabled={saving} className="hbtn hbtn--ghost" style={{ padding: "0 24px" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="hbtn hbtn--primary" style={{ background: "var(--accent-grad)", color: "white", padding: "0 28px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile({ st, go }) {
  const [tab, setTab] = useState("about");
  const tabs = [["about", "About"], ["events", "Events"], ["groups", "Groups"]];
  const myEvents = [EVENTS[0], EVENTS[5], EVENTS[1]];
  const myGroups = [GROUPS[0], GROUPS[1], GROUPS[3]];
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState("light");

  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [linkForm, setLinkForm] = useState({
    instagram: ME.socialLinks?.instagram || "",
    linkedin: ME.socialLinks?.linkedin || "",
    github: ME.socialLinks?.github || "",
    twitter: ME.socialLinks?.twitter || "",
    youtube: ME.socialLinks?.youtube || "",
    website: ME.socialLinks?.website || ""
  });
  const [savingLinks, setSavingLinks] = useState(false);

  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [interestsForm, setInterestsForm] = useState(ME.skills || []);
  const [newInterest, setNewInterest] = useState("");
  const [savingInterests, setSavingInterests] = useState(false);

  const handleAddInterest = (e) => {
    if (e && e.type === "keydown" && e.key !== "Enter") return;
    if (e) e.preventDefault();
    if (newInterest.trim() && !interestsForm.includes(newInterest.trim())) {
      setInterestsForm([...interestsForm, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterestsForm(interestsForm.filter(i => i !== interestToRemove));
  };

  const handleSaveInterests = async () => {
    setSavingInterests(true);
    try {
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');
      const payload = {
        displayName: ME.name,
        bio: ME.role,
        preferredLocation: ME.location,
        skills: interestsForm
      };
      const res = await fetch(`${api}/api/admin/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        ME.skills = interestsForm;
        if (window.toast) window.toast("Interests saved!");
        setIsEditingInterests(false);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to save interests");
      }
    } catch (e) {
      alert("Error saving interests: " + (e.message || "Network error"));
    } finally {
      setSavingInterests(false);
    }
  };

  const handleSaveLinks = async () => {
    setSavingLinks(true);
    try {
      const api = window.location.port === "8080" ? "http://localhost:3000" : window.location.origin;
      const token = localStorage.getItem('token');
      const payload = {
        displayName: ME.name,
        bio: ME.role,
        preferredLocation: ME.location,
        socialLinks: linkForm
      };
      const res = await fetch(`${api}/api/admin/user/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        ME.socialLinks = linkForm;
        if (window.toast) window.toast("Links saved!");
        setIsEditingLinks(false);
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to save links");
      }
    } catch (e) {
      alert("Error saving links: " + (e.message || "Network error"));
    } finally {
      setSavingLinks(false);
    }
  };

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
    premiumBg: isDark ? "linear-gradient(145deg, #2c2d4a 0%, #1e1e30 100%)" : "var(--accent-grad)",
    premiumText: "#fff",
    premiumBtn: isDark ? "#e8e8e8" : "#ffffff",
    premiumBtnText: isDark ? "#111" : "var(--accent-1)",
  };

  if (isEditing) {
    return <EditProfileForm onCancel={() => setIsEditing(false)} profile={ME} />;
  }

  return (
    <div className="scroll" style={{ background: colors.bgApp, height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif", overflowY: "auto", overflowX: "hidden" }}>
      <div className="view-enter" style={{ position: "relative", minHeight: "100vh", width: "100%", background: colors.bgContainer, color: colors.textMain, display: "flex", flexDirection: "column", transition: "background 0.3s ease, color 0.3s ease" }}>

        {/* Full Bleed Cover Background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "65vh", backgroundImage: `url(${ME.coverBanner || COVERS.dusk})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }}>
          {/* Subtle gradient overlay to make text readable */}
          <div style={{ position: "absolute", inset: 0, background: colors.gradientOverlay, transition: "background 0.3s ease" }} />
        </div>

        {/* Foreground Content Layer */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

          {/* Top Navbar */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 20px" }}>
            <button onClick={() => setTheme(isDark ? "light" : "dark")} style={{ width: 44, height: 44, borderRadius: "50%", background: colors.navBg, backdropFilter: "blur(4px)", color: colors.textMain, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              {isDark ? <I.sun style={{ width: 20, height: 20 }} /> : <I.moon style={{ width: 20, height: 20 }} />}
            </button>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setIsEditing(true)} style={{ width: 44, height: 44, borderRadius: "50%", background: colors.navBg, backdropFilter: "blur(4px)", color: colors.textMain, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <I.edit style={{ width: 18, height: 18 }} />
              </button>
              <button style={{ width: 44, height: 44, borderRadius: "50%", background: colors.navBg, backdropFilter: "blur(4px)", color: colors.textMain, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(0,0,0,0.05)", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
            </div>
          </div>

          {/* Spacer to push info to bottom of cover */}
          <div style={{ flex: 1, minHeight: "18vh" }} />

          {/* User Info (overlaid on cover) */}
          <div style={{ padding: "0 40px 32px 40px", maxWidth: 880, margin: "0 auto", width: "100%", display: "flex", alignItems: "flex-end", gap: 24 }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <I.Avatar userId={window.ME?.id} name={ME.name} img={ME.img} size={116} style={{ border: `4px solid ${colors.bgContainer}`, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }} />
              <button onClick={() => setIsEditing(true)} style={{ position: "absolute", bottom: 0, right: 0, background: colors.pillBg, backdropFilter: "blur(8px)", border: `1px solid ${colors.pillBorder}`, color: colors.textMain, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: colors.pillShadow }}>
                <I.edit style={{ width: 16, height: 16 }} />
              </button>
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <h1 style={{ fontSize: 38, fontWeight: 800, color: colors.textMain, letterSpacing: "-0.5px", margin: 0, textShadow: isDark ? "0 2px 12px rgba(0,0,0,0.4)" : "none" }}>
                {ME.name || (ME.handle ? ME.handle.replace('@', '') : 'User')}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: isDark ? "rgba(255,255,255,0.85)" : colors.textSub, fontSize: 16, fontWeight: 500, textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "none" }}>
                {ME.email || (ME.handle ? `${ME.handle.replace('@', '')}@gmail.com` : 'user@gmail.com')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, color: isDark ? "rgba(255,255,255,0.85)" : colors.textSub, fontSize: 16, fontWeight: 500, textShadow: isDark ? "0 1px 4px rgba(0,0,0,0.3)" : "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {ME.location}
              </div>
            </div>
          </div>

          {/* Bottom Card */}
          <div style={{ background: colors.cardBg, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: "40px 24px 100px 24px", flex: 1, display: "flex", flexDirection: "column", boxShadow: colors.cardShadow, transition: "background 0.3s ease" }}>
            <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>

              {/* Stats Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 32, borderBottom: `1px solid ${colors.border}` }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.textMain }}>{ME.stats.groups}</div>
                  <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 6, fontWeight: 500 }}>Group</div>
                </div>
                <div style={{ color: colors.sparkle, fontSize: 18 }}>✦</div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.textMain }}>1</div>
                  <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 6, fontWeight: 500 }}>Interest</div>
                </div>
                <div style={{ color: colors.sparkle, fontSize: 18 }}>✦</div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: colors.textMain }}>{ME.stats.events}</div>
                  <div style={{ fontSize: 14, color: colors.textMuted, marginTop: 6, fontWeight: 500 }}>RSVPs</div>
                </div>
              </div>

              {/* Premium Upgrade Card */}
              <div style={{ background: colors.premiumBg, borderRadius: 24, padding: 32, marginTop: 32, color: colors.premiumText, boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: colors.premiumText }}>Samaagum+</h3>
                <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, lineHeight: 1.5, marginTop: 8, marginBottom: 24 }}>
                  The best of Samaagum for people seeking connection. Free for 7 days.
                </p>
                <button onClick={() => go("upgrade")} style={{ background: colors.premiumBtn, color: colors.premiumBtnText, border: "none", borderRadius: 28, padding: "14px 24px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  Try Samaagum+ for free
                </button>
              </div>

              {/* Interests Section */}
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8, color: colors.textMain }}>
                  Interests <span style={{ color: "var(--accent-1)", fontSize: 22 }}>✦</span>
                  <button onClick={() => { setIsEditingInterests(!isEditingInterests); setInterestsForm(ME.skills || []); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-1)", display: "flex", alignItems: "center", padding: 4, borderRadius: "50%", transition: "background 0.2s" }} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <I.plus style={{ width: 20, height: 20 }} />
                  </button>
                </h2>
                
                {isEditingInterests ? (
                  <div style={{ marginTop: 24, background: colors.cardBg, border: `1px solid ${colors.border}`, padding: 24, borderRadius: 20 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                      {interestsForm.map((skill, i) => (
                        <div key={i} style={{ background: "var(--bg-1)", border: `1px solid ${colors.border}`, borderRadius: 24, padding: "8px 16px", color: colors.textMain, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                          {skill}
                          <button onClick={() => handleRemoveInterest(skill)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", display: "flex", alignItems: "center", padding: 2, borderRadius: "50%" }} className="hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ display: "flex", gap: 12 }}>
                      <input 
                        className="cfield" 
                        placeholder="Add a new interest..." 
                        value={newInterest} 
                        onChange={(e) => setNewInterest(e.target.value)} 
                        onKeyDown={handleAddInterest}
                        style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", flex: 1, boxSizing: "border-box" }} 
                      />
                      <button onClick={handleAddInterest} style={{ background: "var(--accent-1)", color: "white", border: "none", padding: "0 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                        <I.plus style={{ width: 18, height: 18 }} /> Add
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
                      <button onClick={() => setIsEditingInterests(false)} disabled={savingInterests} style={{ background: "transparent", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", color: colors.textSub, fontWeight: 600 }}>Cancel</button>
                      <button onClick={handleSaveInterests} disabled={savingInterests} style={{ background: "var(--accent-1)", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>{savingInterests ? "Saving..." : "Save Interests"}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ color: colors.textMuted, fontSize: 16, marginTop: 8, marginBottom: 24, fontWeight: 500 }}>Topics and skills you care about</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {ME.skills && ME.skills.length > 0 ? ME.skills.map((skill, i) => (
                        <button key={i} style={{ background: colors.chipBg, border: `1px solid ${colors.chipBorder}`, borderRadius: 24, padding: "12px 20px", color: colors.chipText, fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "default", transition: "all 0.2s" }}>
                          <span className="dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-1)", display: "inline-block" }}></span> {skill}
                        </button>
                      )) : (
                        <div style={{ color: colors.textMuted, fontSize: 15 }}>No interests selected yet.</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Social Links rendering */}
              <div style={{ marginTop: 40 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8, color: colors.textMain }}>
                  Links
                  <button onClick={() => setIsEditingLinks(!isEditingLinks)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-1)", display: "flex", alignItems: "center", padding: 4, borderRadius: "50%", transition: "background 0.2s" }} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                    <I.plus style={{ width: 20, height: 20 }} />
                  </button>
                </h2>

                {isEditingLinks ? (
                  <div style={{ marginTop: 24, background: colors.cardBg, border: `1px solid ${colors.border}`, padding: 24, borderRadius: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: colors.textMain, display: "flex", alignItems: "center", gap: 6 }}>📷 Instagram</label>
                        <input className="cfield" placeholder="https://instagram.com/username" value={linkForm.instagram} onChange={(e) => setLinkForm(p => ({ ...p, instagram: e.target.value }))} style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: colors.textMain, display: "flex", alignItems: "center", gap: 6 }}>💼 LinkedIn</label>
                        <input className="cfield" placeholder="https://linkedin.com/in/username" value={linkForm.linkedin} onChange={(e) => setLinkForm(p => ({ ...p, linkedin: e.target.value }))} style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: colors.textMain, display: "flex", alignItems: "center", gap: 6 }}>🐱 GitHub</label>
                        <input className="cfield" placeholder="https://github.com/username" value={linkForm.github} onChange={(e) => setLinkForm(p => ({ ...p, github: e.target.value }))} style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: colors.textMain, display: "flex", alignItems: "center", gap: 6 }}>✖ X</label>
                        <input className="cfield" placeholder="https://x.com/username" value={linkForm.twitter} onChange={(e) => setLinkForm(p => ({ ...p, twitter: e.target.value }))} style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: colors.textMain, display: "flex", alignItems: "center", gap: 6 }}>▶ YouTube</label>
                        <input className="cfield" placeholder="https://youtube.com/@username" value={linkForm.youtube} onChange={(e) => setLinkForm(p => ({ ...p, youtube: e.target.value }))} style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: colors.textMain, display: "flex", alignItems: "center", gap: 6 }}>🌐 Website</label>
                        <input className="cfield" placeholder="https://myportfolio.com" value={linkForm.website} onChange={(e) => setLinkForm(p => ({ ...p, website: e.target.value }))} style={{ background: colors.bgContainer, border: `1px solid ${colors.border}`, color: colors.textMain, padding: "12px 16px", borderRadius: 10, fontSize: 15, outline: "none", width: "100%", boxSizing: "border-box" }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
                      <button onClick={() => setIsEditingLinks(false)} disabled={savingLinks} style={{ background: "transparent", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", color: colors.textSub, fontWeight: 600 }}>Cancel</button>
                      <button onClick={handleSaveLinks} disabled={savingLinks} style={{ background: "var(--accent-1)", color: "white", border: "none", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>{savingLinks ? "Saving..." : "Save Links"}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {ME.socialLinks && Object.values(ME.socialLinks).some(link => link && typeof link === 'string' && link.trim() !== '') ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
                        {ME.socialLinks.instagram && (
                          <a href={ME.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                            <span>📷</span> Instagram <I.external style={{ width: 14, height: 14, opacity: 0.5, marginLeft: 4 }} />
                          </a>
                        )}
                        {ME.socialLinks.linkedin && (
                          <a href={ME.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                            <span>💼</span> LinkedIn <I.external style={{ width: 14, height: 14, opacity: 0.5, marginLeft: 4 }} />
                          </a>
                        )}
                        {ME.socialLinks.github && (
                          <a href={ME.socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                            <span>🐱</span> GitHub <I.external style={{ width: 14, height: 14, opacity: 0.5, marginLeft: 4 }} />
                          </a>
                        )}
                        {ME.socialLinks.twitter && (
                          <a href={ME.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                            <span>✖</span> X <I.external style={{ width: 14, height: 14, opacity: 0.5, marginLeft: 4 }} />
                          </a>
                        )}
                        {ME.socialLinks.youtube && (
                          <a href={ME.socialLinks.youtube} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                            <span>▶</span> YouTube <I.external style={{ width: 14, height: 14, opacity: 0.5, marginLeft: 4 }} />
                          </a>
                        )}
                        {ME.socialLinks.website && (
                          <a href={ME.socialLinks.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.chipText, textDecoration: "none", fontSize: 15, padding: "12px 20px", background: colors.chipBg, borderRadius: 24, border: `1px solid ${colors.chipBorder}`, fontWeight: 600, transition: "all 0.2s", cursor: "pointer" }}>
                            <span>🌐</span> Website <I.external style={{ width: 14, height: 14, opacity: 0.5, marginLeft: 4 }} />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={{ marginTop: 12, color: colors.textMuted, fontSize: 15 }}>No links added yet.</div>
                    )}
                  </>
                )}
              </div>

              {/* Virtual Card rendering */}
              {(() => {
                const VCard = typeof window !== 'undefined' ? window.VirtualCard : null;
                return VCard ? <VCard user={ME} /> : null;
              })()}

              {tab==="groups" && (
                <div className="prof-section">
                  <div className="ev-grid">
                    {myGroups.map(g => <GroupCard key={g.id} g={g} onOpen={(g)=>go("group", g)} joined={true} onJoin={()=>st.toggleJoin(g)} />)}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Profile });

