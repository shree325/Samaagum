import { Group } from '../types';

export function usePermissions(
  g: Group,
  isOwner: boolean,
  isJoined: boolean,
  isPending: boolean,
  myRoleKey: string,
  availableRoles: any[]
) {
  const isMember = isOwner || isJoined;
  const canShare = isOwner || (isMember && g.visibility === 'public');

  const roleHasCap = (roleKey: string, cap: string) => 
    (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes(cap);

  const canManageGroup = isOwner || roleHasCap(myRoleKey, 'group.manage');

  const forumsEnabled = !g.settings?.forums || g.settings.forums.enabled !== false;
  const gallerySettings = g.settings?.gallery || {};
  const galleryEnabled = gallerySettings.enabled !== false;

  const threadPerm = g.settings?.forums?.threadPerm || "everyone";
  const replyPerm = g.settings?.forums?.replyPerm || "everyone";
  const forumPermissions = g.forumPermissions || [];
  const isArchived = Boolean(g.settings?.isArchived);

  const canPost = (() => {
    if (isArchived || !forumsEnabled) return false;
    const threadRoles = g.settings?.forums?.threadRoles;
    if (threadRoles) {
      if (threadRoles.public) return true;
      if (isOwner) return true;
      if (!isJoined) return false;
      return (threadRoles.roles || []).includes(myRoleKey);
    }
    // Fallback
    if (!isMember) return false;
    return isOwner || threadPerm === "everyone" || threadPerm === "members" || 
      (threadPerm === "selected" && forumPermissions.includes("create_thread"));
  })();

  const canReply = (() => {
    if (isArchived || !forumsEnabled) return false;
    const replyRoles = g.settings?.forums?.replyRoles;
    if (replyRoles) {
      if (replyRoles.public) return true;
      if (isOwner) return true;
      if (!isJoined) return false;
      return (replyRoles.roles || []).includes(myRoleKey);
    }
    // Fallback
    if (!isMember) return false;
    return isOwner || replyPerm === "everyone" || replyPerm === "members" || 
      (replyPerm === "selected" && forumPermissions.includes("reply_thread"));
  })();

  const forumsPublic = g.settings?.forums?.threadRoles
    ? (g.settings.forums.threadRoles.public === true || g.settings.forums.replyRoles?.public === true)
    : (threadPerm === 'everyone' || replyPerm === 'everyone');

  const galleryPublic = g.settings?.gallery?.viewRoles
    ? g.settings.gallery.viewRoles.public === true
    : (g.settings?.gallery?.allow !== false);

  const canViewGallery = (() => {
    const viewRoles = g.settings?.gallery?.viewRoles;
    if (!viewRoles) return true;
    if (viewRoles.public) return true;
    if (isOwner) return true;
    return viewRoles.roles.includes(myRoleKey);
  })();

  const isAccessRestricted = !isJoined && !isOwner;
  const isPublicGroup = g.visibility === 'public' && g.joinMode === 'open';

  const showMemberOnlyScreen = (tab: string) => {
    if (!isAccessRestricted) return false;
    if (tab === 'members') return true;
    if (tab === 'discussion') return !forumsPublic;
    if (tab === 'gallery') return !galleryPublic;
    if (tab === 'events') return !isPublicGroup;
    return false;
  };

  const canUpload = !isArchived && galleryEnabled && (isOwner || isJoined);
  const canModerateForums = isOwner || ['group_admin', 'group_moderator'].includes(myRoleKey);

  return {
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
    showMemberOnlyScreen,
    canUpload,
    canModerateForums
  };
}
