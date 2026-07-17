import React from 'react';

interface ToggleProps {
  on: boolean;
  onClick: () => void;
}

function Toggle({ on, onClick }: ToggleProps) {
  return <button type="button" className={`tg ${on ? "on" : ""}`} onClick={onClick} />;
}

interface EventSettingsTabProps {
  galleryEnabled: boolean;
  setGalleryEnabled: (enabled: boolean) => void;
  galleryUploadRoles: any;
  setGalleryUploadRoles: (roles: any) => void;
  galleryViewRoles: any;
  setGalleryViewRoles: (roles: any) => void;
  galleryApprovalRequired: boolean;
  setGalleryApprovalRequired: (req: boolean) => void;
  galleryVideoOnly: boolean;
  setGalleryVideoOnly: (val: boolean) => void;
  galleryImageOnly: boolean;
  setGalleryImageOnly: (val: boolean) => void;

  discussionEnabled: boolean;
  setDiscussionEnabled: (enabled: boolean) => void;
  discussionThreadRoles: any;
  setDiscussionThreadRoles: (roles: any) => void;
  discussionReplyRoles: any;
  setDiscussionReplyRoles: (roles: any) => void;
  discussionApprovalRequired: boolean;
  setDiscussionApprovalRequired: (req: boolean) => void;

  getRolesSummary: (bucket: any) => string;
  saveEventSettings: (updatedVenueMeta: any) => Promise<void>;

  setUploadRolesModalOpen: (open: boolean) => void;
  setViewRolesModalOpen: (open: boolean) => void;
  setThreadRolesModalOpen: (open: boolean) => void;
  setReplyRolesModalOpen: (open: boolean) => void;
}

export function EventSettingsTab({
  galleryEnabled,
  setGalleryEnabled,
  galleryUploadRoles,
  setGalleryUploadRoles,
  galleryViewRoles,
  setGalleryViewRoles,
  galleryApprovalRequired,
  setGalleryApprovalRequired,
  galleryVideoOnly,
  setGalleryVideoOnly,
  galleryImageOnly,
  setGalleryImageOnly,

  discussionEnabled,
  setDiscussionEnabled,
  discussionThreadRoles,
  setDiscussionThreadRoles,
  discussionReplyRoles,
  setDiscussionReplyRoles,
  discussionApprovalRequired,
  setDiscussionApprovalRequired,

  getRolesSummary,
  saveEventSettings,

  setUploadRolesModalOpen,
  setViewRolesModalOpen,
  setThreadRolesModalOpen,
  setReplyRolesModalOpen
}: EventSettingsTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Gallery Settings</h3>

      {/* Gallery Settings Section */}
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20, background: "var(--surface)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Enable Gallery</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Allow media uploads and sharing.</div>
          </div>
          <Toggle on={galleryEnabled} onClick={() => {
            const next = !galleryEnabled;
            setGalleryEnabled(next);
            let nextUploadRoles = galleryUploadRoles;
            let nextViewRoles = galleryViewRoles;
            if (next) {
              nextUploadRoles = { roles: ['event_owner'] };
              nextViewRoles = { roles: ['event_owner'] };
              setGalleryUploadRoles(nextUploadRoles);
              setGalleryViewRoles(nextViewRoles);
            }
            saveEventSettings({
              gallery: {
                enabled: next,
                uploadRoles: nextUploadRoles,
                viewRoles: nextViewRoles,
                approvalRequired: galleryApprovalRequired,
                videoOnly: galleryVideoOnly,
                imageOnly: galleryImageOnly
              }
            });
          }} />
        </div>

        {galleryEnabled && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 14, animation: "slideDown 0.3s ease-out" }}>

            {/* Who can upload? */}
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
              onClick={() => setUploadRolesModalOpen(true)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Who can upload?</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize upload permissions</div>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                {getRolesSummary(galleryUploadRoles)}
              </span>
            </div>

            {/* Who can view? */}
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}
              onClick={() => setViewRolesModalOpen(true)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Who can view?</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize view permissions</div>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                {getRolesSummary(galleryViewRoles)}
              </span>
            </div>

            {/* Permission required toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Permission is required</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Event managers and check-in staff must approve uploads before they appear in the gallery.</div>
              </div>
              <Toggle on={galleryApprovalRequired} onClick={() => {
                const next = !galleryApprovalRequired;
                setGalleryApprovalRequired(next);
                saveEventSettings({
                  gallery: {
                    enabled: galleryEnabled,
                    uploadRoles: galleryUploadRoles,
                    viewRoles: galleryViewRoles,
                    approvalRequired: next,
                    videoOnly: galleryVideoOnly,
                    imageOnly: galleryImageOnly
                  }
                });
              }} />
            </div>

            {/* Media support switches: Video only and Image only */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.03em" }}>Media Support</div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Video only</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Restrict uploads to video formats only.</div>
                </div>
                <Toggle
                  on={galleryVideoOnly}
                  onClick={() => {
                    const targetVal = !galleryVideoOnly;
                    setGalleryVideoOnly(targetVal);
                    const nextImageOnly = targetVal ? false : galleryImageOnly;
                    if (targetVal) {
                      setGalleryImageOnly(false);
                    }
                    saveEventSettings({
                      gallery: {
                        enabled: galleryEnabled,
                        uploadRoles: galleryUploadRoles,
                        viewRoles: galleryViewRoles,
                        approvalRequired: galleryApprovalRequired,
                        videoOnly: targetVal,
                        imageOnly: nextImageOnly
                      }
                    });
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Image only</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Restrict uploads to image formats only.</div>
                </div>
                <Toggle
                  on={galleryImageOnly}
                  onClick={() => {
                    const targetVal = !galleryImageOnly;
                    setGalleryImageOnly(targetVal);
                    const nextVideoOnly = targetVal ? false : galleryVideoOnly;
                    if (targetVal) {
                      setGalleryVideoOnly(false);
                    }
                    saveEventSettings({
                      gallery: {
                        enabled: galleryEnabled,
                        uploadRoles: galleryUploadRoles,
                        viewRoles: galleryViewRoles,
                        approvalRequired: galleryApprovalRequired,
                        videoOnly: nextVideoOnly,
                        imageOnly: targetVal
                      }
                    });
                  }}
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Discussion Settings Section */}
      <h3 style={{ margin: "20px 0 0", fontSize: 16, fontWeight: 700 }}>Discussion Settings</h3>
      <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: 20, background: "var(--surface)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Enable Discussion</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Allow members to post and reply to threads.</div>
          </div>
          <Toggle on={discussionEnabled} onClick={() => {
            const next = !discussionEnabled;
            setDiscussionEnabled(next);
            let nextThreadRoles = discussionThreadRoles;
            let nextReplyRoles = discussionReplyRoles;
            if (next) {
              nextThreadRoles = { roles: ['event_owner'] };
              nextReplyRoles = { roles: ['event_owner'] };
              setDiscussionThreadRoles(nextThreadRoles);
              setDiscussionReplyRoles(nextReplyRoles);
            }
            saveEventSettings({
              discussion: {
                enabled: next,
                threadRoles: nextThreadRoles,
                replyRoles: nextReplyRoles,
                approvalRequired: discussionApprovalRequired
              }
            });
          }} />
        </div>

        {discussionEnabled && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-2)", display: "flex", flexDirection: "column", gap: 14, animation: "slideDown 0.3s ease-out" }}>

            {/* Who can create new thread? */}
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0" }}
              onClick={() => setThreadRolesModalOpen(true)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Who can create new thread?</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize creation permissions</div>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                {getRolesSummary(discussionThreadRoles)}
              </span>
            </div>

            {/* Who can reply? */}
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px 0", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}
              onClick={() => setReplyRolesModalOpen(true)}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Who can reply on thread?</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize reply permissions</div>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--accent-2)", fontWeight: 600 }}>
                {getRolesSummary(discussionReplyRoles)}
              </span>
            </div>

            {/* Is approval required toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-3)", paddingTop: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Approval required to create a thread?</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>New threads must be approved by an event manager or check-in staff before they become visible.</div>
              </div>
              <Toggle on={discussionApprovalRequired} onClick={() => {
                const next = !discussionApprovalRequired;
                setDiscussionApprovalRequired(next);
                saveEventSettings({
                  discussion: {
                    enabled: discussionEnabled,
                    threadRoles: discussionThreadRoles,
                    replyRoles: discussionReplyRoles,
                    approvalRequired: next
                  }
                });
              }} />
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
