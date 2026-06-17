// Deprecated: This file has been split into create_event.tsx and CreateGroup.tsx
// Please do not use or import this file.
const { useState, useRef, useEffect, useCallback, useMemo } = React;

// Reuse existing components and utilities from the project
// Assuming CoverPicker, I, Grain, etc. are globally available via the app bundle
const COVER_SWATCHES = Object.entries(COVERS).map(([k,v])=>({k,v}));

function CoverPicker({ value, onPick }) {
  return (
    <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
      {COVER_SWATCHES.map(s => (
        <button key={s.k} onClick={()=>onPick(s.v)} title={s.k}
          style={{ width:34, height:34, borderRadius:10, cursor:"pointer", background:s.v,
            border: value===s.v?"2.5px solid var(--ink)":"2px solid transparent",
            boxShadow: value===s.v?"0 0 0 2px var(--surface) inset":"var(--sh-sm)", transition:"transform .15s" }} />
      ))}
    </div>
  );
}


function CreateGroup({ go, mobile }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [cover, setCover] = useState(COVERS.sunset);
  const [privacy, setPrivacy] = useState("public"); // public | private | invite-only
  const [desc, setDesc] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState(["Me"]);

  const [showBannerMenu, setShowBannerMenu] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const fileInputRef = useRef(null);

  // Auto‑slug from name
  useEffect(() => {
    if (name && (!slug || slug === name.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""))) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  }, [name]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) validateAndProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingBanner(true);
  };

  const handleDragLeave = () => setIsDraggingBanner(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingBanner(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndProcessFile = async (file) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setBannerError("Client Validation Error: Invalid format. Please use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setBannerError("Client Validation Error: File size exceeds 5MB limit.");
      return;
    }
    setBannerError("");
    setIsUploadingBanner(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const reader = new FileReader();
      reader.onload = () => {
        setCover(reader.result);
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setBannerError(err.message);
      setIsUploadingBanner(false);
    }
  };

  const addMember = (e) => {
    if (e.key === "Enter" && memberInput.trim()) {
      setMembers([...members, memberInput.trim()]);
      setMemberInput("");
    }
  };

  const removeMember = (i) => {
    setMembers(members.filter((_, idx) => idx !== i));
  };

  const previewGroup = {
    cover,
    name: name || "Untitled Group",
    slug: slug || "your-group-slug",
    privacy,
    members,
  };

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-lg)",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "var(--sh-sm)"
  };

  return (
    <div className={`create ${mobile?"single":""}`}>
      <div className="create-form" style={{ backgroundColor: "var(--bg-2)", padding: mobile ? "24px 20px 100px" : "32px 40px 100px", position: "relative" }}>
        <div className="cf-inner" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="create-head" style={{ marginBottom: 32 }}>
            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => go("home")} style={{ padding:"7px 11px", background: "var(--surface)" }}>
              <I.arrowL/>
            </button>
            <div>
              <div className="ck">New group</div>
              <h1>Create a group</h1>
            </div>
          </div>

          {/* Banner Upload */}
          <div style={{ ...cardStyle, display: "grid", gridTemplateColumns: mobile ? "1fr" : "1.2fr 1fr", gap: 32 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 8 }}>Banner</label>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/jpeg,image/png,image/webp" style={{ display: "none" }} />
              <div
                className={`cover-up ${cover?"filled":""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => setShowBannerMenu(prev => !prev)}
                style={{
                  ...(cover && !cover.startsWith("linear-gradient") ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : cover ? { background: cover } : {}),
                  borderRadius: "var(--r-md)",
                  marginBottom: 8,
                  height: 180,
                  position: "relative",
                  border: isDraggingBanner ? "2.5px dashed var(--accent-2)" : "1.5px dashed var(--border)",
                  transition: "all 0.2s ease",
                  cursor: "pointer"
                }}
              >
                {cover && cover.startsWith("linear-gradient") && <Grain/>}
                {isUploadingBanner && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--r-md)" }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Uploading &amp; Verifying...</span>
                  </div>
                )}
                <div className="up-hint" style={{ color: cover ? "#fff" : "var(--ink-3)", textShadow: cover && !cover.startsWith("linear-gradient") ? "0 1px 4px rgba(0,0,0,0.6)" : "none" }}>
                  <div className="uic" style={{ background: cover ? "rgba(255,255,255,0.25)" : "var(--accent-soft)", color: cover ? "#fff" : "var(--accent-2)" }}>
                    <I.image/>
                  </div>
                  {cover ? "Click or Drag to Manage Banner" : "Click or Drag to Upload Cover"}
                </div>
                {showBannerMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      zIndex: 10,
                      width: "180px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      boxShadow: "var(--sh-lg)",
                      padding: "4px",
                      marginTop: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px"
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", padding: "8px 12px", border: "none" }}
                      onClick={() => { fileInputRef.current?.click(); setShowBannerMenu(false); }}>
                      📤 Upload Image
                    </button>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", padding: "8px 12px", border: "none" }}
                      onClick={() => { const cpEl = document.getElementById("cover-picker-label"); cpEl?.scrollIntoView({ behavior: "smooth" }); setShowBannerMenu(false); }}>
                      🎨 Choose Preset Cover
                    </button>
                    {cover && (
                      <button className="hbtn hbtn--ghost hbtn--sm" style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", padding: "8px 12px", color: "#e5484d", border: "none" }}
                        onClick={() => { setCover(""); setShowBannerMenu(false); }}>
                        🗑️ Remove Banner
                      </button>
                    )}
                  </div>
                )}
              </div>
              {bannerError && (
                <div style={{ color: "#e5484d", fontSize: 12, marginTop: 4, marginBottom: 8, fontWeight: 500 }}>
                  ⚠️ {bannerError}
                </div>
              )}
              <div id="cover-picker-label" style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 12 }}>
                Recommended ratio 16:9 (accepts JPG, PNG, WEBP)
              </div>
              <CoverPicker value={cover} onPick={setCover} />
            </div>

            {/* Right side – form fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="cfield" style={{ marginBottom: 0 }}>
                <label>Group Name</label>
                <input className="title-input" placeholder="Your group name" value={name} onChange={e => setName(e.target.value)} style={{ background: "var(--field)", border: "1px solid var(--border)", fontSize: 18, marginBottom: 8 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-3)" }}>
                  <span>samaagum.co/</span>
                  <input value={slug} onChange={e => setSlug(e.target.value)} style={{ background: "transparent", border: "none", color: "var(--ink-2)", fontSize: 12, outline: "none", width: "100%" }} placeholder="your-group-slug" />
                </div>
              </div>

              <div className="cfield" style={{ marginBottom: 0 }}>
                <label>Privacy</label>
                <select className="cselect" value={privacy} onChange={e => setPrivacy(e.target.value)}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="invite-only">Invite‑Only</option>
                </select>
              </div>

              <div className="cfield" style={{ marginBottom: 0 }}>
                <label>Group Description</label>
                <div
                  style={{ minHeight: 120, background: "var(--field)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px", color: desc ? "var(--ink)" : "var(--ink-3)", cursor: "pointer", fontSize: 14 }}
                  onClick={() => setDesc("")} // placeholder for opening a rich editor
                >
                  {desc ? desc : "Click to add a description. Tell people what this community is about."}
                </div>
              </div>

              <div className="cfield" style={{ marginBottom: 0 }}>
                <label>Invite members</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {members.map((m, i) => (
                    <span key={i} style={{
                      padding: "6px 12px",
                      background: "var(--field)",
                      border: "1px solid var(--border)",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m}</span>
                      <I.x style={{ width: 12, height: 12, cursor: "pointer" }} onClick={() => removeMember(i)} />
                    </span>
                  ))}
                </div>
                <input className="cinput" placeholder="Enter member name and press Enter" value={memberInput} onChange={e => setMemberInput(e.target.value)} onKeyDown={addMember} style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live preview panel */}
      <div className={mobile?"mobile-preview-stacked":"create-preview"} style={mobile ? {
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        borderTop: "1px solid var(--border-2)",
        marginTop: "32px"
      } : {
        position: "sticky",
        top: 0,
        height: "100vh",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        overflowY: "auto",
        borderLeft: "1px solid var(--border-2)",
        background: "var(--bg-2)"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: "var(--ink-3)" }}>Live preview</div>
        <div style={cardStyle}>
          <div style={{ height: 100, background: previewGroup.cover || "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {previewGroup.cover && !previewGroup.cover.startsWith("linear-gradient") && <img src={previewGroup.cover} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Banner" />}
            {previewGroup.cover && previewGroup.cover.startsWith("linear-gradient") && <div style={{ position: "absolute", inset: 0, background: previewGroup.cover }}><Grain/></div>}
          </div>
          <div style={{ padding: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--ink)" }}>{previewGroup.name}</h3>
            <p style={{ fontSize: 11, color: "var(--ink-3)", margin: "4px 0 0" }}>slug: samaagum.co/{previewGroup.slug}</p>
            <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>Privacy: {previewGroup.privacy}</p>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)" }}>Members:</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {previewGroup.members.map((m, i) => (
                  <span key={i} style={{ padding: "4px 8px", background: "var(--field)", borderRadius: 999, fontSize: 11 }}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CreateGroup });
