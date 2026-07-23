// @ts-nocheck
export const getRolesSummaryText = (bucket) => {
  if (!bucket) return "No one";
  if (bucket.public) return "Public";
  if (Array.isArray(bucket.roles)) {
    if (bucket.roles.length === 0) return "No one";
    if (bucket.roles.length === 4) return "Everyone";
    const names = bucket.roles.map(k => {
      if (k === 'group_owner') return 'Owner';
      if (k === 'group_admin') return 'Admin';
      if (k === 'group_moderator') return 'Moderator';
      if (k === 'registered_user') return 'Member';
      return k;
    });
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(" & ");
    const last = names.pop();
    return names.join(", ") + " & " + last;
  }
  return "Custom";
};
