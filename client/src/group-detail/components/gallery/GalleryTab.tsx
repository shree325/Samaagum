import React from 'react';
import { I } from '../../../home-icons';

interface GalleryTabProps {
  gallery: any;
  permissions: any;
  g: any;
}

export function GalleryTab({ gallery, permissions, g }: GalleryTabProps) {
  const {
    galleryItems,
    setGalleryItems,
    callerIsAdmin,
    galleryUploading,
    previewMedia,
    imageZoom,
    imageOrigin,
    handleGalleryUpload,
    openMediaPreview,
    closeMediaPreview,
    zoomIn,
    zoomOut,
    toggleImageZoom
  } = gallery;

  const { canUpload, gallerySettings } = permissions;
  const galleryMediaType = gallerySettings.imageOnly ? "Images only" : gallerySettings.videoOnly ? "Videos only" : "Images & videos";
  const galleryNeedsApproval = gallerySettings.approve === true;
  const galleryAcceptTypes = gallerySettings.videoOnly ? "video/*" : gallerySettings.imageOnly ? "image/*" : "image/*,video/*";

  const handleApproveMedia = async (mediaId: string) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/groups/${g.id}/gallery/${mediaId}/approve`, {
        method: 'POST',
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setGalleryItems((prev: any[]) => prev.map(item => item.id === mediaId ? { ...item, status: 'approved' } : item));
      } else alert(data.message || "Failed to approve media");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/groups/${g.id}/gallery/${mediaId}`, {
        method: 'DELETE',
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setGalleryItems((prev: any[]) => prev.filter(item => item.id !== mediaId));
      } else alert(data.message || "Failed to delete media");
    } catch (err) {
      console.error(err);
    }
  };

  // Setup separate lists
  const approvedItems = galleryItems.filter((x: any) => x.status === 'approved' || !galleryNeedsApproval);
  const pendingItems = galleryItems.filter((x: any) => x.status === 'pending');
  const showPendingSection = (g.role === 'owner' || g.role === 'admin' || g.role === 'moderator' || callerIsAdmin) && pendingItems.length > 0;

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const _resolveUrl = (u: string) => u && !u.startsWith('blob:') ? (u.startsWith('/api/') ? apiBase + u : u) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Gallery</h3>
          <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Accepting: {galleryMediaType} {galleryNeedsApproval && "(Requires host approval)"}</span>
        </div>
        {canUpload && (
          <div style={{ position: "relative" }}>
            <input
              type="file"
              accept={galleryAcceptTypes}
              onChange={handleGalleryUpload}
              style={{ display: "none" }}
              id="gallery-file-input"
              disabled={galleryUploading}
            />
            <label htmlFor="gallery-file-input" className="hbtn hbtn--primary hbtn--sm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {galleryUploading ? "Uploading…" : <><I.plus style={{ width: 14 }} /> Upload media</>}
            </label>
          </div>
        )}
      </div>

      {showPendingSection && (
        <div style={{ background: "color-mix(in srgb, var(--accent-2) 6%, var(--surface))", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)" }} />
            Pending Approval ({pendingItems.length})
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
            {pendingItems.map((item: any) => {
              const src = _resolveUrl(item.url);
              return (
                <div key={item.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                  {item.type === 'video' ? (
                    <video src={src || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => openMediaPreview({ src, type: 'video' })} />
                  ) : (
                    <img src={src || undefined} alt="gallery pending" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openMediaPreview({ src, type: 'image' })} />
                  )}
                  <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', gap: 4, zIndex: 2 }}>
                    <button className="hbtn hbtn--primary hbtn--sm" style={{ flex: 1, padding: '2px 0', fontSize: 11, height: 24 }} onClick={() => handleApproveMedia(item.id)}>Approve</button>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ flex: 1, padding: '2px 0', fontSize: 11, color: '#ff4d4f', background: 'rgba(255,255,255,0.85)', height: 24 }} onClick={() => handleDeleteMedia(item.id)}>Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {approvedItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
          <I.groups style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
          <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No media uploaded yet</h4>
          <p style={{ margin: 0 }}>{canUpload ? "Upload the first picture or video to the group gallery." : "No pictures or videos here yet."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {approvedItems.map((item: any) => {
            const src = _resolveUrl(item.url);
            const isManager = g.role === 'owner' || g.role === 'admin' || g.role === 'moderator' || callerIsAdmin;
            return (
              <div key={item.id} className="gallery-item-wrapper" style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                {item.type === 'video' ? (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <video src={src || undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={() => openMediaPreview({ src, type: 'video' })} />
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 10, pointerEvents: 'none' }}>▶ VIDEO</div>
                  </div>
                ) : (
                  <img src={src || undefined} alt="gallery" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => openMediaPreview({ src, type: 'image' })} />
                )}
                {isManager && (
                  <button
                    onClick={() => handleDeleteMedia(item.id)}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete Media"
                  >
                    🗑️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {previewMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeMediaPreview}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 960, maxHeight: '90vh', background: 'var(--bg)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.35)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeMediaPreview} className="tool" style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, background: 'rgba(0,0,0,0.45)', borderRadius: 999, color: '#fff', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.x style={{ width: 18, height: 18 }} />
            </button>
            {previewMedia.type === 'video' ? (
              <video src={previewMedia.src} controls autoPlay style={{ display: 'block', width: '100%', maxHeight: '90vh', background: '#000' }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', background: '#000', maxHeight: '90vh' }}>
                <img
                  src={previewMedia.src}
                  alt="Preview"
                  onDoubleClick={toggleImageZoom}
                  style={{
                    transform: `scale(${imageZoom})`,
                    transformOrigin: `${imageOrigin.x} ${imageOrigin.y}`,
                    transition: 'transform 0.15s ease',
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    cursor: 'zoom-in'
                  }}
                />
              </div>
            )}
            {previewMedia.type !== 'video' && (
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, background: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: '8px 10px' }}>
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: '#fff' }} onClick={zoomOut} disabled={imageZoom <= 1}>-</button>
                <span style={{ color: '#fff', fontSize: 13, minWidth: 48, textAlign: 'center' }}>{Math.round(imageZoom * 100)}%</span>
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: '#fff' }} onClick={zoomIn} disabled={imageZoom >= 3}>+</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
