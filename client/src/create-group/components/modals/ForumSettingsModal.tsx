// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';
import { Toggle } from '../common/Toggle';
import { RolesSubModal } from './RolesSubModal';
import { getRolesSummaryText } from '../../utils/roles';

export function ForumSettingsModal({ 
  open, 
  onClose, 
  forums, 
  setForums, 
  forumsThreadRoles, 
  setForumsThreadRoles, 
  forumsReplyRoles, 
  setForumsReplyRoles, 
  forumsApprove, 
  setForumsApprove 
}) {
  const [threadRolesModalOpen, setThreadRolesModalOpen] = useState(false);
  const [replyRolesModalOpen, setReplyRolesModalOpen] = useState(false);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="setting-modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: 20, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0 }}>Discussion Settings</h3>
          <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 32, height: 32, borderRadius: 16, cursor: "pointer" }}><I.x style={{ width: 16 }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
              <div className="ti">
                <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Enable Discussion</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Allow members to post and reply to threads.</div>
              </div>
              <Toggle on={forums} onClick={() => setForums(!forums)} />
            </div>

            {forums && (
              <>
                <div className="toggle-row" onClick={() => setThreadRolesModalOpen(true)} style={{ padding: 0, background: "transparent", border: "none", margin: 0, cursor: "pointer" }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Who can create new thread?</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize creation permissions</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{getRolesSummaryText(forumsThreadRoles)}</span>
                    <I.arrowR style={{ width: 14, color: "var(--ink-3)" }} />
                  </div>
                </div>

                <div className="toggle-row" onClick={() => setReplyRolesModalOpen(true)} style={{ padding: 0, background: "transparent", border: "none", margin: 0, cursor: "pointer" }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Who can reply on thread?</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>Click to customize reply permissions</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{getRolesSummaryText(forumsReplyRoles)}</span>
                    <I.arrowR style={{ width: 14, color: "var(--ink-3)" }} />
                  </div>
                </div>

                <div className="toggle-row" style={{ padding: 0, background: "transparent", border: "none", margin: 0 }}>
                  <div className="ti">
                    <div className="t" style={{ fontSize: 14, fontWeight: 600 }}>Approval required to create a thread?</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>New threads must be approved by a group owner, admin, or moderator before they become visible.</div>
                  </div>
                  <Toggle on={forumsApprove} onClick={() => setForumsApprove(!forumsApprove)} />
                </div>
              </>
            )}
          </div>
          <button className="hbtn hbtn--primary" style={{ width: "100%", marginTop: 24, justifyContent: "center" }} onClick={onClose}>Confirm</button>
        </div>

        <RolesSubModal open={threadRolesModalOpen} onClose={() => setThreadRolesModalOpen(false)} bucket={forumsThreadRoles} setBucket={setForumsThreadRoles} titleText="Who can create new thread?" />
        <RolesSubModal open={replyRolesModalOpen} onClose={() => setReplyRolesModalOpen(false)} bucket={forumsReplyRoles} setBucket={setForumsReplyRoles} titleText="Who can reply on thread?" />
      </div>
    </div>
  );
}
