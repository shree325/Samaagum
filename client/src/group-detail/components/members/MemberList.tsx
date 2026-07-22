import React from 'react';
import { Avatar } from '../../../home-icons';
import { RoleMenu } from './RoleMenu';

interface MemberListProps {
  members: any[];
  currentUserId: string | null;
  currentUserRole: string;
  availableRoles: any[];
  roleColors: Record<string, string>;
  roleLabels: Record<string, string>;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  roleHasCap: (roleKey: string, cap: string) => boolean;
  go: (dest: string, arg?: any) => void;
  onRoleChange: (memberId: string, roleKey: string) => void;
  onRemove: (memberId: string) => void;
  onViewResponses: (member: any) => void;
}

export function MemberList({
  members,
  currentUserId,
  currentUserRole,
  availableRoles,
  roleColors,
  roleLabels,
  openMenuId,
  setOpenMenuId,
  roleHasCap,
  go,
  onRoleChange,
  onRemove,
  onViewResponses
}: MemberListProps) {
  const canViewResponses = currentUserRole === 'group_owner' ||
    roleHasCap(currentUserRole, 'group.moderate') ||
    roleHasCap(currentUserRole, 'group.manage');

  const getHighestRole = (roles: string[] = []) => {
    if (roles.includes('group_owner')) return 'group_owner';
    if (roles.includes('group_admin')) return 'group_admin';
    if (roles.includes('group_moderator')) return 'group_moderator';
    return 'group_member';
  };

  return (
    <div>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Members ({members.length})</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {members.map((m) => {
          const targetRole = getHighestRole(m.roles);
          const isMe = m.user_id === currentUserId;

          return (
            <div key={m.user_id} style={{ position: "relative", zIndex: openMenuId === m.user_id ? 50 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                onClick={() => m.users && go("public-profile", m.users)}
              >
                <Avatar name={m.users?.display_name || "Unknown"} userId={m.users?.id} img={m.users?.profilePhoto} size={40} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{m.users?.display_name || "Unknown"}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>@{m.users?.username || "unknown"}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {canViewResponses && m.hasResponses && (
                  <button
                    className="hbtn hbtn--ghost hbtn--sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewResponses(m);
                    }}
                    title="View Join Responses"
                    style={{ padding: "4px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, height: 28 }}
                  >
                    Responses
                  </button>
                )}
                <span style={{ fontSize: 13, fontWeight: 600, color: roleColors[targetRole] }}>
                  {roleLabels[targetRole]}
                </span>
                {!isMe && (
                  <RoleMenu
                    memberId={m.user_id}
                    targetRole={targetRole}
                    currentUserRole={currentUserRole}
                    availableRoles={availableRoles}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    onRoleChange={onRoleChange}
                    onRemove={onRemove}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
