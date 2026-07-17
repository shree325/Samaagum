// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';
import { Toggle } from '../common/Toggle';
import { RolesSubModal } from './RolesSubModal';
import { getRolesSummaryText } from '../../utils/roles';

export function GallerySettingsModal({
  open,
  onClose,
  gallery,
  setGallery,
  galleryAllow,
  setGalleryAllow,
  galleryImageOnly,
  setGalleryImageOnly,
  galleryVideoOnly,
  setGalleryVideoOnly,
  galleryApprove,
  setGalleryApprove,
  galleryUploadRoles,
  setGalleryUploadRoles,
  galleryViewRoles,
  setGalleryViewRoles
}) {
  const [uploadRolesModalOpen, setUploadRolesModalOpen] = useState(false);
  const [viewRolesModalOpen, setViewRolesModalOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="setting-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Gallery Settings</h3>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer" }}><I.x style={{ width: 16 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
              <div className="ti">
                <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Enable Gallery</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Allow media uploads and sharing.</div>
              </div>
              <Toggle on={gallery} onClick={() => setGallery(!gallery)} />
            </div>

            {gallery && (
              <>
                <div className="toggle-row" onClick={() => setUploadRolesModalOpen(true)} style={{ padding: 0, background: "transparent", border: "none", margin: 0, cursor: "pointer" }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Who can upload?</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize upload permissions</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{getRolesSummaryText(galleryUploadRoles)}</span>
                    <I.arrowR style={{ width: 14, color: "var(--ink-3)" }} />
                  </div>
                </div>

                <div className="toggle-row" onClick={() => setViewRolesModalOpen(true)} style={{ padding: 0, background: "transparent", border: "none", margin: 0, cursor: "pointer" }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Who can view?</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize view permissions</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{getRolesSummaryText(galleryViewRoles)}</span>
                    <I.arrowR style={{ width: 14, color: "var(--ink-3)" }} />
                  </div>
                </div>

                <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Permission is required</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Group owners, admins, and moderators must approve uploads before they appear in the gallery.</div>
                  </div>
                  <Toggle on={galleryApprove} onClick={() => setGalleryApprove(!galleryApprove)} />
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-3)", marginTop: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Media Support</div>

                <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Video only</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Restrict uploads to video formats only.</div>
                  </div>
                  <Toggle on={galleryVideoOnly} onClick={() => {
                    const val = !galleryVideoOnly;
                    setGalleryVideoOnly(val);
                    if (val) setGalleryImageOnly(false);
                  }} />
                </div>

                <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Image only</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Restrict uploads to image formats only.</div>
                  </div>
                  <Toggle on={galleryImageOnly} onClick={() => {
                    const val = !galleryImageOnly;
                    setGalleryImageOnly(val);
                    if (val) setGalleryVideoOnly(false);
                  }} />
                </div>
              </>
            )}
          </div>
          <button className="hbtn hbtn--primary" style={{ width: "100%", marginTop: 24, justifyContent: "center" }} onClick={onClose}>Confirm</button>
        </div>

        <RolesSubModal open={uploadRolesModalOpen} onClose={() => setUploadRolesModalOpen(false)} bucket={galleryUploadRoles} setBucket={(nextUpload) => {
          const nextVal = typeof nextUpload === 'function' ? nextUpload(galleryUploadRoles) : nextUpload;
          setGalleryUploadRoles(nextVal);
          const nextView = {
            public: !!(galleryViewRoles.public || nextVal.public),
            roles: Array.from(new Set([...(galleryViewRoles.roles || []), ...(nextVal.roles || [])]))
          };
          setGalleryViewRoles(nextView);
        }} titleText="Who can upload?" />

        <RolesSubModal open={viewRolesModalOpen} onClose={() => setViewRolesModalOpen(false)} bucket={galleryViewRoles} setBucket={setGalleryViewRoles} titleText="Who can view?" />
      </div>
    </div>
  );
}
export default GallerySettingsModal;
