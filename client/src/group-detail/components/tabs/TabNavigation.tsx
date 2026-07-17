import React from 'react';

interface TabNavigationProps {
  visibleTabs: Array<[string, React.ReactNode]>;
  tab: string;
  setTab: (tab: string) => void;
  gId: string;
  entityId?: string;
  canManageGroup: boolean;
  dashboardStats: any;
  newJoinRequestNotif: boolean;
  galleryItems: any[];
  myRoleKey: string;
  setNewJoinRequestNotif: (val: boolean) => void;
}

export function TabNavigation({
  visibleTabs,
  tab,
  setTab,
  gId,
  entityId,
  canManageGroup,
  dashboardStats,
  newJoinRequestNotif,
  galleryItems,
  myRoleKey,
  setNewJoinRequestNotif
}: TabNavigationProps) {
  return (
    <div className="grp-tabs">
      {visibleTabs.map(([k, l]) => (
        <button key={k} className={`grp-tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); sessionStorage.setItem(`group_tab_${gId || entityId}`, k); if (k === "dashboard" || k === "members") setNewJoinRequestNotif(false); }}>
          {l}
          {k === "members" && canManageGroup && (dashboardStats.pendingMembers > 0 || newJoinRequestNotif) && (
            <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
          )}
          {k === "dashboard" && newJoinRequestNotif && (
            <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
          )}
          {k === "gallery" && (myRoleKey === 'group_owner' || myRoleKey === 'group_admin' || myRoleKey === 'group_moderator') && galleryItems.some(item => item.status === 'pending') && (
            <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
          )}
        </button>
      ))}
    </div>
  );
}
