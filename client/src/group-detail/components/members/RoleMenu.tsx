import React from 'react';
import { I } from '../../../home-icons';

interface RoleMenuProps {
  memberId: string;
  targetRole: string;
  currentUserRole: string;
  availableRoles: any[];
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  onRoleChange: (memberId: string, roleKey: string) => void;
  onRemove: (memberId: string) => void;
}

export function RoleMenu({
  memberId,
  targetRole,
  currentUserRole,
  availableRoles,
  openMenuId,
  setOpenMenuId,
  onRoleChange,
  onRemove
}: RoleMenuProps) {
  const getRoleHierarchy = (role: string) => {
    const meta = (availableRoles || []).find(r => r.key === role);
    if (meta) return meta.hierarchy_level;
    if (role === 'group_owner') return 100;
    if (role === 'group_admin') return 110;
    if (role === 'group_moderator') return 120;
    return 1000;
  };

  const myLevel = getRoleHierarchy(currentUserRole);
  const theirLevel = getRoleHierarchy(targetRole);

  const isMe = memberId === null; // Handled by caller but double check
  let showMakeOwner = false;
  let showMakeAdmin = false;
  let showMakeMod = false;
  let showMakeMember = false;
  let showRemove = false;

  if (myLevel < 1000) {
    if (myLevel < theirLevel) {
      showMakeOwner = currentUserRole === 'group_owner';
      showMakeAdmin = myLevel <= 110 && targetRole !== 'group_admin';
      showMakeMod = myLevel <= 120 && targetRole !== 'group_moderator';
      showMakeMember = myLevel <= 1000 && targetRole !== 'group_member';
      showRemove = true;
    }
  }

  const hasMenuOptions = showMakeOwner || showMakeAdmin || showMakeMod || showMakeMember || showRemove;
  if (!hasMenuOptions) return null;

  return (
    <div style={{ position: "relative" }}>
      <button className="tool" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === memberId ? null : memberId); }}>
        <I.more style={{ width: 16, height: 16 }} />
      </button>
      {openMenuId === memberId && (
        <div style={{ display: "flex", flexDirection: "column", position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--sh-md)", zIndex: 9999, minWidth: 160, padding: 4 }}>
          {showMakeOwner && <button className="menu-btn" onClick={() => onRoleChange(memberId, 'group_owner')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Owner</button>}
          {showMakeAdmin && <button className="menu-btn" onClick={() => onRoleChange(memberId, 'group_admin')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Admin</button>}
          {showMakeMod && <button className="menu-btn" onClick={() => onRoleChange(memberId, 'group_moderator')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Moderator</button>}
          {showMakeMember && <button className="menu-btn" onClick={() => onRoleChange(memberId, 'group_member')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Member</button>}
          {showRemove && <button className="menu-btn" onClick={() => onRemove(memberId)} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "#ef4444", borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 6 }}>Remove Member</button>}
        </div>
      )}
    </div>
  );
}
