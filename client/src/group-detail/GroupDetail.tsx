import React, { useState, useEffect } from 'react';
import { Group } from './types';
import { useGroup } from './hooks/useGroup';
import { useMembership } from './hooks/useMembership';
import { usePermissions } from './hooks/usePermissions';
import { useDiscussion } from './hooks/useDiscussion';
import { useGallery } from './hooks/useGallery';
import { useEvents } from './hooks/useEvents';
import { useInvites } from './hooks/useInvites';
import { useMembers } from './hooks/useMembers';
import { useForum } from './hooks/useForum';
import { useShare } from './hooks/useShare';

import { GroupHero } from './components/header/GroupHero';
import { GroupHeader } from './components/header/GroupHeader';
import { TabNavigation } from './components/tabs/TabNavigation';
import { MemberOnlyScreen } from './components/common/MemberOnlyScreen';

import { AboutTab } from './components/about/AboutTab';
import { DiscussionTab } from './components/discussion/DiscussionTab';
import { EventsTab } from './components/events/EventsTab';
import { InvitesTab } from './components/invites/InvitesTab';
import { ForumManagementTab } from './components/forum/ForumManagementTab';
import { GalleryTab } from './components/gallery/GalleryTab';
import { MemberManagementPanel } from './components/members/MemberManagementPanel';
import { GroupDashboard } from '../group-dashboard';

import { ME } from '../home-data';
import { Avatar, I } from '../home-icons';
import { getHighestRole } from './utils/permissions';
import { canEdit } from './utils/permissions';

interface GroupDetailProps {
  group: Group;
  st: any;
  go: (dest: string, arg?: any) => void;
}

export function GroupDetail({ group, st, go }: GroupDetailProps) {
  const groupState = useGroup(group, st);
  const {
    g,
    fullGroup,
    setFullGroup,
    membershipState,
    setMembershipState,
    globalChatSettings,
    isOwner,
    setIsOwner,
    members,
    setMembers,
    accessDenied,
    accessDeniedMsg,
    onlineCount,
    setOnlineCount,
    fetchGroupDetails
  } = groupState;

  const handleMessageMember = async (m: any) => {
    const targetId = m.users?.id || m.id || m.user_id;
    if (!targetId) return;

    const token = localStorage.getItem('token');
    let currentUserId: string | null = null;
    if (token) {
      try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (e) { }
    }
    if (currentUserId === targetId) {
      alert("You cannot message yourself.");
      return;
    }

    const restriction = m.messagingRestriction || 'anyone';
    const isConnected = m.connectionState === 'accepted';

    if (restriction === 'no_one') return;

    if (restriction === 'only_connected' && !isConnected) {
      alert("Only connected users can message this member.");
      return;
    }

    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/messaging/conversations/direct`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {})
        },
        body: JSON.stringify({ targetId })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.id) {
          localStorage.setItem('active_chat_conv_id', json.data.id);
        }
        go("messages");
      } else {
        const json = await res.json();
        alert(json.message || json.error || "Unable to start messaging.");
      }
    } catch (e) {
      alert("Failed to connect. Please try again.");
    }
  };

  const membership = useMembership(g, membershipState, setMembershipState, fetchGroupDetails, st);
  const {
    isJoined,
    isPending,
    showQModal,
    setShowQModal,
    answers,
    setAnswers,
    handleJoinClick,
    handleLeaveClick,
    handleCancelJoinRequestClick,
    submitJoinRequest
  } = membership;

  const token = localStorage.getItem('token');
  let currentUserId: string | null = null;
  if (token) {
    try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (e) { }
  }

  const myMemberEntry = (members || []).find(m => m.id === currentUserId);
  const myRoleKey = isOwner ? 'group_owner' :
                    (myMemberEntry?.role === 'owner' ? 'group_owner' :
                     myMemberEntry?.role === 'admin' ? 'group_admin' :
                     myMemberEntry?.role === 'moderator' ? 'group_moderator' : 'group_member');

  const myRoleRef = React.useRef(myRoleKey);
  React.useEffect(() => {
    myRoleRef.current = myRoleKey;
  }, [myRoleKey]);

  const [tab, setTab] = useState(() => {
    return sessionStorage.getItem(`group_tab_${g.id || g.entity_id}`) || "about";
  });

  const membersHook = useMembers(g, isOwner || myRoleKey === 'group_admin' || myRoleKey === 'group_owner', currentUserId);
  const {
    joinRequests,
    setJoinRequests,
    newJoinRequestNotif,
    setNewJoinRequestNotif,
    availableRoles,
    fetchJoinRequests
  } = membersHook;

  const permissions = usePermissions(g, isOwner, isJoined, isPending, myRoleKey, availableRoles);
  const {
    isMember,
    canShare,
    canManageGroup,
    forumsEnabled,
    galleryEnabled,
    gallerySettings,
    canPost,
    canReply,
    forumsPublic,
    galleryPublic,
    canViewGallery,
    isAccessRestricted,
    isPublicGroup,
    canUpload
  } = permissions;

  const showMemberOnlyScreen = permissions.showMemberOnlyScreen(tab);

  const discussion = useDiscussion(g, permissions);
  const { sort, activeThread, setActiveThread, fetchPosts } = discussion;

  const activeThreadRef = React.useRef(activeThread);
  React.useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const gallery = useGallery(g, gallerySettings.approve === true);
  const { galleryItems, setGalleryItems, setCallerIsAdmin } = gallery;

  const events = useEvents(g);
  const { gEvents } = events;

  const invitesHook = useInvites(g, canManageGroup);
  const { inviteEmail, setInviteEmail, inviteLink, setInviteLink, fetchInvites, invites } = invitesHook;

  const forum = useForum(g);
  const { fetchForumMembers } = forum;

  const share = useShare();
  const { showShareSheet, setShowShareSheet } = share;

  const [dashboardStats, setDashboardStats] = useState({
    totalPosts: 0,
    pinnedPosts: 0,
    lockedPosts: 0,
    reportedPosts: 0,
    activeMembers: 0,
    pendingMembers: 0
  });

  // Socket logic kept in orchestrator to coordinate between multiple hooks
  React.useEffect(() => {
    if (!g.id || g.id === "newg") return;

    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

    const fetchStats = async () => {
      if (!canManageGroup) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/api/groups/${g.id}/dashboard-stats`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success) {
          setDashboardStats(data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();

    if (!(window as any).io) return;
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = (window as any).io(socketUrl, { transports: ['websocket'] });

    if (isMember) {
      socket.emit('join_group', { groupId: g.id, userId: currentUserId });
    }

    socket.on('dashboard_updated', () => {
      fetchGroupDetails();
      fetchStats();
    });

    socket.on('new_join_request', () => {
      fetchStats();
      setNewJoinRequestNotif(true);
    });

    socket.on('new_thread', () => {
      if (tab === 'discussion') fetchPosts(sort);
    });

    socket.on('thread_deleted', (data: any) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(null);
        alert("This thread has been deleted.");
      }
    });

    socket.on('thread_edited', (data: any) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.refreshThreadComments(data.postId);
      }
    });

    socket.on('thread_solved', (data: any) => {
      if (tab === 'discussion') {
        discussion.setPosts((prev: any[]) => prev.map(t => t.id === data.postId ? { ...t, solved: data.solved } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.setActiveThread((prev: any) => prev ? { ...prev, solved: data.solved } : null);
      }
    });

    socket.on('thread_pinned', (data: any) => {
      if (tab === 'discussion') {
        discussion.setPosts((prev: any[]) => prev.map(t => t.id === data.postId ? { ...t, pinned: data.pinned } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.setActiveThread((prev: any) => prev ? { ...prev, pinned: data.pinned } : null);
      }
    });

    socket.on('thread_locked', (data: any) => {
      if (tab === 'discussion') {
        discussion.setPosts((prev: any[]) => prev.map(t => t.id === data.postId ? { ...t, locked: data.locked } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.setActiveThread((prev: any) => prev ? { ...prev, locked: data.locked } : null);
      }
    });

    socket.on('thread_archived', (data: any) => {
      if (tab === 'discussion') {
        discussion.setPosts((prev: any[]) => prev.map(t => t.id === data.postId ? { ...t, archived: data.archived } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.setActiveThread((prev: any) => prev ? { ...prev, archived: data.archived } : null);
      }
    });

    socket.on('thread_voted', (data: any) => {
      if (tab === 'discussion') {
        discussion.setPosts((prev: any[]) => prev.map(t => t.id === data.postId ? { ...t, vote_score: data.score } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.setThreadVotes((prev: any) => ({ ...prev, [data.postId]: { ...prev[data.postId], score: data.score } }));
      }
    });

    socket.on('thread_reacted', (data: any) => {
      if (tab === 'discussion') {
        discussion.setPosts((prev: any[]) => prev.map(t => t.id === data.postId ? { ...t, reactions: data.reactions } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.setThreadReactions((prev: any) => ({ ...prev, [data.postId]: data.reactions }));
      }
    });

    socket.on('new_comment', (data: any) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.refreshThreadComments(data.postId);
      }
    });

    socket.on('comment_deleted', (data: any) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.refreshThreadComments(data.postId);
      }
    });

    socket.on('comment_voted', (data: any) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.refreshThreadComments(data.postId);
      }
    });

    socket.on('comment_edited', (data: any) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        discussion.refreshThreadComments(data.postId);
      }
    });

    socket.on('online_count', (data: any) => {
      if (data.groupId === g.id) setOnlineCount(data.count);
    });

    socket.on('gallery_updated', (payload: any) => {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      }).then(r => r.json()).then(d => {
        if (d.success) {
          const isManager = myRoleRef.current === 'group_owner' || myRoleRef.current === 'group_admin' || myRoleRef.current === 'group_moderator';
          if (isManager && payload && payload.action === 'upload') {
            if ((window as any).toast) (window as any).toast("New media approval request received!", "info");
          }
          setGalleryItems(d.data);
          setCallerIsAdmin(d.callerIsAdmin || false);
        }
      }).catch(console.error);
    });

    return () => {
      if (isMember) socket.emit('leave_group', g.id);
      socket.disconnect();
    };
  }, [g.id, isOwner, isMember, tab, sort, fetchPosts]);

  const tabs = [
    ["about", <span style={{ fontSize: 13, fontWeight: 600 }}>About</span>],
    ["events", <span style={{ fontSize: 13, fontWeight: 600 }}>Events</span>],
    ["members", <span style={{ fontSize: 13, fontWeight: 600 }}>Members</span>],
    ["gallery", <span style={{ fontSize: 13, fontWeight: 600 }}>Gallery</span>],
    ["discussion", <span style={{ fontSize: 13, fontWeight: 600 }}>Discussions</span>]
  ];

  if (canManageGroup) {
    if ((g.joinMode === 'invite_only' || g.joinMode === 'approval') && !tabs.find(t => t[0] === 'invites')) {
      tabs.push(["invites", <span style={{ fontSize: 13, fontWeight: 600 }}>Invites</span>]);
    }
    const threadPerm = g.settings?.forums?.threadPerm || 'everyone';
    const replyPerm = g.settings?.forums?.replyPerm || 'everyone';
    if (forumsEnabled && (threadPerm === 'selected' || replyPerm === 'selected') && !tabs.find(t => t[0] === 'forum-mgmt')) {
      tabs.push(["forum-mgmt", <span style={{ fontSize: 13, fontWeight: 600 }}>Forum Management</span>]);
    }
    if (!tabs.find(t => t[0] === 'dashboard')) {
      tabs.push(["dashboard", <span style={{ fontSize: 13, fontWeight: 600 }}>Dashboard</span>]);
    }
  }

  const visibleTabs = tabs.filter(([k]) => {
    if (k === 'gallery' && !galleryEnabled) return false;
    if (k === 'discussion' && !forumsEnabled) return false;
    
    if (isAccessRestricted) {
      if (k === 'members') return false;
      if (k === 'discussion') return forumsPublic;
      if (k === 'gallery') return galleryPublic;
      if (k === 'events') return isPublicGroup;
    } else {
      if (k === 'gallery') return canViewGallery;
    }
    return true;
  });

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t[0] === tab)) {
      setTab(visibleTabs[0][0] as string);
    }
  }, [tab, visibleTabs]);

  useEffect(() => {
    if (tab === "invites") fetchInvites();
    if (tab === "requests") fetchJoinRequests();
    if (tab === "forum-mgmt") fetchForumMembers();
    if (tab === "discussion") fetchPosts(sort);
  }, [tab, fetchInvites, fetchJoinRequests, fetchForumMembers, fetchPosts, sort]);

  useEffect(() => {
    if (group && (group as any).postId) {
      discussion.openThread({ id: (group as any).postId });
    }
  }, [group?.id, (group as any)?.postId]);

  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const _resolveUrl = (u: any) => u && !u.startsWith('blob:') ? (u.startsWith('/api/') ? apiBase + u : u) : null;
  const bannerSrc = _resolveUrl(g.banner);
  const iconSrc = _resolveUrl(g.icon);
  const isCustomIcon = !!(iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/")));
  const nonOwnerMembers = members.filter(m => m.role !== 'owner');
  const capacityFull = g.isFull !== undefined ? g.isFull : !!(g.settings && g.settings.capacity && g.settings.capacity.limit === true && g.settings.capacity.max > 0 && nonOwnerMembers.length >= g.settings.capacity.max);
  const hasWaitlist = g.hasWaitlist !== undefined ? g.hasWaitlist : !!(capacityFull && g.settings && g.settings.capacity && g.settings.capacity.waitlist === true);

  let displayLocation: string | null = null;
  const loc = g.settings?.location;
  if (loc) {
    if (loc.city && loc.state && loc.country) displayLocation = `${loc.city}, ${loc.state}, ${loc.country}`;
    else if (loc.city && loc.state) displayLocation = `${loc.city}, ${loc.state}`;
    else if (loc.city && loc.country) displayLocation = `${loc.city}, ${loc.country}`;
    else if (loc.city) displayLocation = loc.city;
    else if (typeof loc === 'string') displayLocation = loc;
  } else if (g.settings?.city) {
    displayLocation = g.settings.city;
  }

  if (accessDenied) {
    return (
      <div className="scroll">
        <div className="view-enter" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 22 }}>Access Restricted</h2>
            <p style={{ color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 24px 0" }}>{accessDeniedMsg}</p>
            <button className="hbtn hbtn--soft" onClick={() => go("discover")}>Back to Discover</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div className="view-enter">
        <GroupHero bannerSrc={bannerSrc} cover={g.cover || ""} go={go} />
        <div className="grp-detail">
          <GroupHeader
            g={g}
            membersCount={members.length}
            onlineCount={onlineCount}
            isCustomIcon={isCustomIcon}
            iconSrc={iconSrc}
            displayLocation={displayLocation}
            canShare={canShare}
            showShareSheet={showShareSheet}
            setShowShareSheet={setShowShareSheet}
            isOwner={isOwner}
            capacityFull={capacityFull}
            hasWaitlist={hasWaitlist}
            isJoined={isJoined}
            isPending={isPending}
            handleJoinClick={handleJoinClick}
            handleLeaveClick={handleLeaveClick}
            handleCancelJoinRequestClick={handleCancelJoinRequestClick}
            go={go}
          />

          <TabNavigation
            visibleTabs={visibleTabs as any}
            tab={tab}
            setTab={setTab}
            gId={g.id}
            entityId={g.entity_id}
            canManageGroup={canManageGroup}
            dashboardStats={dashboardStats}
            newJoinRequestNotif={newJoinRequestNotif}
            galleryItems={galleryItems}
            myRoleKey={myRoleKey}
            setNewJoinRequestNotif={setNewJoinRequestNotif}
          />

          <div className="grp-cols" style={tab === "dashboard" ? { gridTemplateColumns: "1fr" } : undefined}>
            <div style={{ minWidth: 0 }}>
              {showMemberOnlyScreen ? (
                <MemberOnlyScreen onJoin={handleJoinClick} isPending={isPending} />
              ) : (
                <>
                  {tab === "about" && <AboutTab g={g} />}
                  {tab === "discussion" && (
                    globalChatSettings && (
                      globalChatSettings.allowGroupChat === false || 
                      globalChatSettings.communicationPolicies?.groupChatsEnabled === false
                    ) ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", padding: "48px 24px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", margin: "20px 0", color: "var(--ink)", width: "100%" }}>
                        <div style={{ fontSize: "56px", marginBottom: "20px", userSelect: "none" }}>🔒</div>
                        <h2 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>This feature is currently disabled from admin side</h2>
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--ink-3)", lineHeight: "1.6", maxWidth: "360px" }}>For further information, please contact the administrator.</p>
                      </div>
                    ) : (
                      <DiscussionTab
                        discussion={discussion}
                        permissions={permissions}
                        gId={g.id}
                        isOwner={isOwner}
                        currentUserId={currentUserId}
                        token={token}
                        ME={ME}
                        handleJoinClick={handleJoinClick}
                        isPending={isPending}
                        canEdit={canEdit}
                      />
                    )
                  )}
                  {tab === "events" && <EventsTab gEvents={gEvents} isOwner={isOwner} g={g} go={go} st={st} />}
                  {tab === "gallery" && <GalleryTab gallery={gallery} permissions={permissions} g={g} />}
                  {tab === "members" && <MemberManagementPanel group={g} st={st} go={go} />}
                  {tab === "dashboard" && <GroupDashboard group={g} st={st} go={go} embedded={true} setTab={setTab} members={members} />}
                  {tab === "invites" && <InvitesTab invites={invites} inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteLink={inviteLink} setInviteLink={setInviteLink} fetchInvites={fetchInvites} g={g} />}
                  {tab === "forum-mgmt" && <ForumManagementTab forum={forum} />}
                </>
              )}
            </div>

            {tab !== "dashboard" && (
              <div className="grp-side">
                <div className="side-card">
                  <h4>About</h4>
                  <div style={{ marginTop: 12 }}>
                    <div className="side-stat"><span className="k">Members</span><span className="v">{members.length.toLocaleString()}</span></div>
                    <div className="side-stat"><span className="k">Posts</span><span className="v">{g.posts || 0}</span></div>
                    <div className="side-stat"><span className="k">Join policy</span><span className="v">{g.joinMode === 'open' ? 'Anyone can join' : g.joinMode === 'invite_only' ? 'Invite only' : 'Approval required'}</span></div>
                  </div>
                </div>
                <div className="side-card">
                  <h4>Top members</h4>
                  {members.slice(0, 5).map((m: any, i: number) => {
                    const mName = typeof m === 'object' ? (m.users?.display_name || m.name || m) : m;
                    const mUsername = typeof m === 'object' ? `@${m.users?.username || m.username || 'unknown'}` : '';
                    const targetRole = typeof m === 'object' ? (m.role || (m.roles ? getHighestRole(m.roles) : (i === 0 ? "group_owner" : i < 3 ? "group_moderator" : "group_member"))) : "group_member";
                    const mRole = targetRole.replace('group_', '');
                    const targetUserId = m.users?.id || m.id || m.user_id;
                    const isSelf = currentUserId === targetUserId;
                    const restriction = m.messagingRestriction || 'anyone';
                    const showMessageIcon = restriction !== 'no_one' && !isSelf;
                    return (
                      <div
                        key={m.id || mName}
                        className="member-row"
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                      >
                        <div
                          onClick={() => {
                            const targetUser = typeof m === 'object' && m.users ? m.users : (typeof m === 'object' ? m : { id: m.id, name: mName, username: mUsername.replace('@', '') });
                            if (targetUser && targetUser.id) {
                              go("public-profile", targetUser);
                            }
                          }}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}
                        >
                          <Avatar name={mName} userId={m.id || m.user_id} img={m.profilePhoto || m.users?.profilePhoto} size={32} />
                          <div className="mi" style={{ flex: 1, minWidth: 0 }}>
                            <div className="n" style={{ display: "flex", alignItems: "center", gap: 5 }}>{mName} {mRole === 'owner' && <I.crown className="crown" />}</div>
                            <div className="r" style={{ display: "flex", gap: 4, alignItems: "center" }}>
                              <span style={{ color: "var(--ink-2)" }}>{mUsername}</span>
                              <span>·</span>
                              <span style={{ textTransform: "capitalize" }}>{mRole}</span>
                            </div>
                          </div>
                        </div>
                        {showMessageIcon && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageMember(m);
                            }}
                            className="hbtn hbtn--ghost hbtn--sm"
                            style={{ padding: 6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", minWidth: 28, height: 28, color: "var(--ink-2)" }}
                            title="Message Member"
                          >
                            <I.chat style={{ width: 15, height: 15 }} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showQModal && g.settings && g.settings.questionnaires && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowQModal(false); }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', padding: 28, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.28)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Join Questionnaire</h2>
              <button className="tool" onClick={() => setShowQModal(false)}><I.x style={{ width: 20, height: 20 }} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Please answer the following questions to join.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {g.settings.questionnaires.map((q: any, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>{q.q} {q.req && <span style={{ color: 'red' }}>*</span>}</label>
                  {q.type === 'long' ? (
                    <textarea
                      placeholder="Your answer..."
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'yesno' ? (
                    <select
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : q.type === 'multiplechoice' && q.options && q.options.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {q.options.map((opt: string, optIdx: number) => (
                        <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`q_${i}`}
                            value={opt}
                            checked={answers[i] === opt}
                            onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                            style={{ margin: 0, cursor: 'pointer' }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : q.type === 'multiselect' && q.options && q.options.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {q.options.map((opt: string, optIdx: number) => (
                        <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            value={opt}
                            checked={(answers[i] || []).includes(opt)}
                            onChange={(e) => {
                              const cur = answers[i] || [];
                              const next = e.target.checked ? [...cur, opt] : cur.filter((x: any) => x !== opt);
                              setAnswers({ ...answers, [i]: next });
                            }}
                            style={{ margin: 0, cursor: 'pointer' }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : q.type === 'email' ? (
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'phone' ? (
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'date' ? (
                    <input
                      type="date"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'time' ? (
                    <input
                      type="time"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              className="hbtn hbtn--primary"
              style={{ marginTop: 16 }}
              onClick={() => {
                const isAnswered = (val: any) => Array.isArray(val) ? val.length > 0 : !!(val && String(val).trim());
                const requiredMissing = g.settings!.questionnaires!.some((q: any, i: number) => q.req && !isAnswered(answers[i]));
                if (requiredMissing) {
                  return alert("Please answer all required questions.");
                }
                submitJoinRequest(answers);
              }}
            >
              Submit & Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export { useMembership };
export { usePermissions };
export { useDiscussion };
export { useGallery };
export { useEvents };
export { useInvites };
export { useMembers };
export { useForum };
export { useShare };
