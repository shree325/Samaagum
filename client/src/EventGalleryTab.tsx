import React, { useState, useRef } from 'react';

interface EventGalleryTabProps {
  e: any;
  galleryItems: any[];
  galleryEnabled: boolean;
  galleryVideoOnly: boolean;
  galleryImageOnly: boolean;
  canUploadToGallery: boolean;
  isTicketManager: boolean;
  isScanner: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  ME: any;
  apiBase: string;
  token: string | null;
  fetchEventGallery: () => Promise<void>;
}

export function EventGalleryTab({
  e,
  galleryItems,
  galleryEnabled,
  galleryVideoOnly,
  galleryImageOnly,
  canUploadToGallery,
  isTicketManager,
  isScanner,
  isOwner,
  isAdmin,
  isModerator,
  ME,
  apiBase,
  token,
  fetchEventGallery
}: EventGalleryTabProps) {
  const [viewerItem, setViewerItem] = useState<any>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [handModeActive, setHandModeActive] = useState(true);

  const galleryInputRef = useRef<HTMLInputElement>(null);

  const approvedItems = galleryItems.filter(item => item.approved && item.type !== "video");
  const currentIndex = viewerItem ? approvedItems.findIndex(item => item.id === viewerItem.id) : -1;

  const handlePrev = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (currentIndex > 0) {
      setViewerItem(approvedItems[currentIndex - 1]);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handleNext = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    if (currentIndex < approvedItems.length - 1) {
      setViewerItem(approvedItems[currentIndex + 1]);
      setZoomScale(1);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Media Gallery</h3>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Images & videos</div>
        </div>
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
                reader.onload = async (uploadEvt) => {
                  try {
                    const res = await fetch(`${apiBase}/api/events/${e.id}/gallery`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({
                        url: uploadEvt.target?.result,
                        type: isVideo ? "video" : "image"
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      fetchEventGallery();
                      if (!data.data.approved) {
                        alert("Upload successful! Your media is pending approval from organizers.");
                      } else {
                        alert("Upload successful!");
                      }
                    } else {
                      alert(data.message || "Failed to upload media.");
                    }
                  } catch (err) {
                    console.error(err);
                    alert("An error occurred during upload.");
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
            <button
              onClick={() => galleryInputRef.current?.click()}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(124, 58, 237, 0.1)",
                color: "var(--primary, #7c3aed)",
                border: "none",
                padding: "8px 16px",
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                transition: "background 0.2s"
              }}
              onMouseEnter={(evt) => evt.currentTarget.style.background = "rgba(124, 58, 237, 0.15)"}
              onMouseLeave={(evt) => evt.currentTarget.style.background = "rgba(124, 58, 237, 0.1)"}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Media
            </button>
          </div>
        )}
      </div>

      {/* Pending Approval Section */}
      {(isTicketManager || isScanner || isOwner || isAdmin || isModerator) && galleryItems.some(item => !item.approved) && (
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
                    onClick={async () => {
                      try {
                        const res = await fetch(`${apiBase}/api/events/${e.id}/gallery/${item.id}/approve`, {
                          method: 'PATCH',
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        const data = await res.json();
                        if (data.success) {
                          fetchEventGallery();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="hbtn"
                    style={{ padding: "2px 6px", fontSize: 10, height: 20, background: "#e5484d", color: "#fff" }}
                    onClick={async () => {
                      try {
                        const res = await fetch(`${apiBase}/api/events/${e.id}/gallery/${item.id}`, {
                          method: 'DELETE',
                          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                        });
                        const data = await res.json();
                        if (data.success) {
                          fetchEventGallery();
                        }
                      } catch (err) {
                        console.error(err);
                      }
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
              <div
                onClick={() => {
                  setViewerItem(item);
                  setZoomScale(1);
                  setPanOffset({ x: 0, y: 0 });
                  setHandModeActive(true);
                }}
                style={{ cursor: "pointer", width: "100%", height: "100%", background: item.url && (item.url.startsWith("linear-gradient") || item.url.startsWith("radial-gradient") || item.url.startsWith("var(")) ? item.url : `url(${item.url}) center/cover no-repeat` }}
              />
            )}

            {/* Delete button for allowed users */}
            {(isTicketManager || isScanner || isOwner || isAdmin || isModerator || item.uploadedBy === ME.name) && (
              <button
                style={{
                  position: "absolute", top: 6, right: 6,
                  background: "rgba(0, 0, 0, 0.6)", color: "#fff",
                  border: "none", borderRadius: "50%",
                  width: 24, height: 24, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 12
                }}
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this media?")) {
                    try {
                      const res = await fetch(`${apiBase}/api/events/${e.id}/gallery/${item.id}`, {
                        method: 'DELETE',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                      });
                      const data = await res.json();
                      if (data.success) {
                        fetchEventGallery();
                      }
                    } catch (err) {
                      console.error(err);
                    }
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

      {/* Lightbox / ImageViewer Modal */}
      {viewerItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 20000,
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            userSelect: "none"
          }}
          onClick={() => {
            setViewerItem(null);
            setZoomScale(1);
            setPanOffset({ x: 0, y: 0 });
          }}
        >
          {/* Header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
              zIndex: 10
            }}
            onClick={evt => evt.stopPropagation()}
          >
            <div style={{ fontSize: 14, color: "#ccc" }}>
              {viewerItem.uploadedBy ? `Uploaded by ${viewerItem.uploadedBy}` : "Image Preview"}
            </div>
            <button
              onClick={() => {
                setViewerItem(null);
                setZoomScale(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: "bold",
                transition: "background 0.2s"
              }}
              onMouseEnter={evt => evt.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={evt => evt.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >
              ✕
            </button>
          </div>

          {/* Navigation Controls */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: 24,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: 48,
                height: 48,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                zIndex: 10,
                transition: "background 0.2s"
              }}
              onMouseEnter={evt => evt.currentTarget.style.background = "rgba(0,0,0,0.8)"}
              onMouseLeave={evt => evt.currentTarget.style.background = "rgba(0,0,0,0.5)"}
            >
              ⟨
            </button>
          )}
          {currentIndex < approvedItems.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                position: "absolute",
                right: 24,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "50%",
                width: 48,
                height: 48,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                zIndex: 10,
                transition: "background 0.2s"
              }}
              onMouseEnter={evt => evt.currentTarget.style.background = "rgba(0,0,0,0.8)"}
              onMouseLeave={evt => evt.currentTarget.style.background = "rgba(0,0,0,0.5)"}
            >
              ⟩
            </button>
          )}

          {/* Viewport for pan & zoom */}
          <div
            style={{
              width: "80vw",
              height: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
              cursor: handModeActive ? (isDragging ? "grabbing" : "grab") : "zoom-in"
            }}
            onClick={evt => {
              evt.stopPropagation();
              if (!handModeActive) {
                setZoomScale(prev => prev > 1 ? 1 : 2.5);
                setPanOffset({ x: 0, y: 0 });
              }
            }}
            onMouseDown={evt => {
              if (!handModeActive) return;
              evt.preventDefault();
              setIsDragging(true);
              setDragStart({ x: evt.clientX - panOffset.x, y: evt.clientY - panOffset.y });
            }}
            onMouseMove={evt => {
              if (!isDragging) return;
              setPanOffset({
                x: evt.clientX - dragStart.x,
                y: evt.clientY - dragStart.y
              });
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchStart={evt => {
              if (!handModeActive || evt.touches.length !== 1) return;
              const touch = evt.touches[0];
              setIsDragging(true);
              setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
            }}
            onTouchMove={evt => {
              if (!isDragging || evt.touches.length !== 1) return;
              const touch = evt.touches[0];
              setPanOffset({
                x: touch.clientX - dragStart.x,
                y: touch.clientY - dragStart.y
              });
            }}
            onTouchEnd={() => setIsDragging(false)}
          >
            <img
              src={viewerItem.url}
              alt="Preview"
              draggable="false"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transition: isDragging ? "none" : "transform 0.15s ease-out",
                pointerEvents: "none"
              }}
            />
          </div>

          {/* Controls Bar at bottom */}
          <div
            style={{
              position: "absolute",
              bottom: 24,
              display: "flex",
              gap: 12,
              background: "rgba(0,0,0,0.85)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 30,
              padding: "8px 20px",
              zIndex: 10,
              alignItems: "center"
            }}
            onClick={evt => evt.stopPropagation()}
          >
            {/* Hand tool toggle */}
            <button
              onClick={() => setHandModeActive(!handModeActive)}
              title={handModeActive ? "Switch to click-to-zoom mode" : "Switch to drag-to-pan mode (Hand Tool)"}
              style={{
                background: handModeActive ? "var(--primary, #7c3aed)" : "transparent",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                transition: "all 0.2s"
              }}
            >
              🖐️
            </button>

            <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />

            {/* Zoom Out */}
            <button
              onClick={() => setZoomScale(prev => Math.max(prev - 0.5, 0.5))}
              title="Zoom Out"
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: "bold",
                transition: "background 0.2s"
              }}
              onMouseEnter={evt => evt.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={evt => evt.currentTarget.style.background = "transparent"}
            >
              ➖
            </button>

            {/* Scale Value */}
            <span style={{ minWidth: 48, textAlign: "center", fontSize: 13, fontWeight: 600 }}>
              {Math.round(zoomScale * 100)}%
            </span>

            {/* Zoom In */}
            <button
              onClick={() => setZoomScale(prev => Math.min(prev + 0.5, 6))}
              title="Zoom In"
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: "bold",
                transition: "background 0.2s"
              }}
              onMouseEnter={evt => evt.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={evt => evt.currentTarget.style.background = "transparent"}
            >
              ➕
            </button>

            <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.2)" }} />

            {/* Reset */}
            <button
              onClick={() => {
                setZoomScale(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              title="Reset View"
              style={{
                background: "transparent",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                transition: "background 0.2s"
              }}
              onMouseEnter={evt => evt.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={evt => evt.currentTarget.style.background = "transparent"}
            >
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
