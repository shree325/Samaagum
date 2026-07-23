export const canEdit = (createdAt: string | Date | number): boolean => {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = now - created;
  return diffMs < 5 * 60 * 1000; // 5 minutes
};

export const getHighestRole = (roles: string[] = []): string => {
  if (roles.includes('group_owner')) return 'group_owner';
  if (roles.includes('group_admin')) return 'group_admin';
  if (roles.includes('group_moderator')) return 'group_moderator';
  return 'registered_user';
};
