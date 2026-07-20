// @ts-nocheck
// ─── Access Tree Utilities ────────────────────────────────────────────────────
// Pure functions for operating on the hierarchical access control tree.
// The tree shape: Community → SubCommunity → Group
// `selected` shape: { communities: string[], subCommunities: string[], groups: string[] }

import { ACCESS_TREE } from '../constants';

export const isChecked = (node: any, selected: any): boolean => {
  if (node.type === 'group') {
    return selected.groups.includes(node.id);
  }
  if (!node.children || node.children.length === 0) {
    if (node.type === 'subcommunity') return selected.subCommunities.includes(node.id);
    return selected.communities.includes(node.id);
  }
  return node.children.every((child: any) => isChecked(child, selected));
};

export const isIndeterminate = (node: any, selected: any): boolean => {
  if (node.type === 'group') return false;
  if (!node.children || node.children.length === 0) return false;
  const checkedCount = node.children.filter((c: any) => isChecked(c, selected)).length;
  const indetCount   = node.children.filter((c: any) => isIndeterminate(c, selected)).length;
  const allChecked   = checkedCount === node.children.length;
  const noneChecked  = checkedCount === 0 && indetCount === 0;
  return !allChecked && !noneChecked;
};

export const getDescendantIds = (
  node: any,
): { communities: string[]; subCommunities: string[]; groups: string[] } => {
  const res = { communities: [] as string[], subCommunities: [] as string[], groups: [] as string[] };
  if (node.type === 'community')    res.communities.push(node.id);
  else if (node.type === 'subcommunity') res.subCommunities.push(node.id);
  else if (node.type === 'group')   res.groups.push(node.id);
  if (node.children) {
    node.children.forEach((child: any) => {
      const c = getDescendantIds(child);
      res.communities.push(...c.communities);
      res.subCommunities.push(...c.subCommunities);
      res.groups.push(...c.groups);
    });
  }
  return res;
};

export const findParentPath = (id: string, tree: any[]): any[] => {
  for (const comm of tree) {
    if (comm.id === id) return [];
    if (comm.children) {
      for (const sub of comm.children) {
        if (sub.id === id) return [comm];
        if (sub.children) {
          for (const grp of sub.children) {
            if (grp.id === id) return [comm, sub];
          }
        }
      }
    }
  }
  return [];
};

export const toggleNodeCheck = (node: any, selected: any) => {
  const checked = isChecked(node, selected);
  const desc    = getDescendantIds(node);

  let nextCommunities    = [...selected.communities];
  let nextSubCommunities = [...selected.subCommunities];
  let nextGroups         = [...selected.groups];

  if (checked) {
    nextCommunities    = nextCommunities.filter(id => !desc.communities.includes(id));
    nextSubCommunities = nextSubCommunities.filter(id => !desc.subCommunities.includes(id));
    nextGroups         = nextGroups.filter(id => !desc.groups.includes(id));

    const parentPath = findParentPath(node.id, ACCESS_TREE);
    parentPath.forEach((p: any) => {
      if (p.type === 'community')    nextCommunities    = nextCommunities.filter(id => id !== p.id);
      else if (p.type === 'subcommunity') nextSubCommunities = nextSubCommunities.filter(id => id !== p.id);
    });
  } else {
    desc.communities.forEach(id    => { if (!nextCommunities.includes(id))    nextCommunities.push(id); });
    desc.subCommunities.forEach(id => { if (!nextSubCommunities.includes(id)) nextSubCommunities.push(id); });
    desc.groups.forEach(id         => { if (!nextGroups.includes(id))         nextGroups.push(id); });

    // Upward propagation — auto-check parents when all children are checked
    let changed = true;
    while (changed) {
      changed = false;
      for (const comm of ACCESS_TREE) {
        if (comm.children && comm.children.length > 0) {
          const allChildrenChecked = comm.children.every((sub: any) => {
            if (sub.children && sub.children.length > 0) {
              return sub.children.every((grp: any) => nextGroups.includes(grp.id));
            }
            return nextSubCommunities.includes(sub.id);
          });
          if (allChildrenChecked && !nextCommunities.includes(comm.id)) {
            nextCommunities.push(comm.id);
            changed = true;
          }
          comm.children.forEach((sub: any) => {
            if (sub.children && sub.children.length > 0) {
              const allSubChecked = sub.children.every((grp: any) => nextGroups.includes(grp.id));
              if (allSubChecked && !nextSubCommunities.includes(sub.id)) {
                nextSubCommunities.push(sub.id);
                changed = true;
              }
            }
          });
        }
      }
    }
  }

  return { communities: nextCommunities, subCommunities: nextSubCommunities, groups: nextGroups };
};

export const nodeMatchesSearch = (node: any, query: string): boolean => {
  if (node.name.toLowerCase().includes(query.toLowerCase())) return true;
  if (node.children) return node.children.some((c: any) => nodeMatchesSearch(c, query));
  return false;
};

export const getSearchAutoExpandedIds = (query: string): Set<string> => {
  const ids = new Set<string>();
  if (!query) return ids;
  ACCESS_TREE.forEach(comm => {
    let commMatches = false;
    if (comm.children) {
      comm.children.forEach((sub: any) => {
        let subMatches = false;
        if (sub.children) {
          sub.children.forEach((grp: any) => {
            if (grp.name.toLowerCase().includes(query.toLowerCase())) subMatches = true;
          });
        }
        if (sub.name.toLowerCase().includes(query.toLowerCase()) || subMatches) {
          commMatches = true;
          ids.add(sub.id);
        }
      });
    }
    if (comm.name.toLowerCase().includes(query.toLowerCase()) || commMatches) ids.add(comm.id);
  });
  return ids;
};

export const getTopLevelCheckedNodes = (tree: any[], selected: any): any[] => {
  const list: any[] = [];
  const traverse = (node: any) => {
    if (isChecked(node, selected)) { list.push(node); return; }
    if (node.children) node.children.forEach(traverse);
  };
  tree.forEach(traverse);
  return list;
};

export const getSelectedNodesWithDetails = (
  tree: any[],
  selected: any,
): { id: string; name: string; type: string }[] => {
  const result: { id: string; name: string; type: string }[] = [];
  const traverse = (node: any) => {
    if (node.type === 'community'    && selected.communities.includes(node.id))    result.push({ id: node.id, name: node.name, type: 'community' });
    else if (node.type === 'subcommunity' && selected.subCommunities.includes(node.id)) result.push({ id: node.id, name: node.name, type: 'subcommunity' });
    else if (node.type === 'group'   && selected.groups.includes(node.id))         result.push({ id: node.id, name: node.name, type: 'group' });
    if (node.children) node.children.forEach(traverse);
  };
  tree.forEach(traverse);
  return result;
};

export const findNodeInTree = (id: string, tree: any[]): any => {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeInTree(id, node.children);
      if (found) return found;
    }
  }
  return null;
};
