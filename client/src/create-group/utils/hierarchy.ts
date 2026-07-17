// @ts-nocheck
export function getDynamicHierarchy(apiData = null) {
  // If real data from API is available, build from it
  if (apiData && apiData.communities && apiData.communities.length > 0) {
    const tree = [];
    for (const comm of apiData.communities) {
      tree.push({ id: `c-${comm.id}`, name: comm.name, type: "community", parentId: null });
      for (const grp of comm.groups || []) {
        tree.push({ id: `g-c-${comm.id}-${grp.id}`, name: grp.name, type: "group", parentId: `c-${comm.id}` });
      }
    }
    return tree;
  }
  return [];
}

export const getHierarchyContext = (id, tree) => {
  const item = tree.find(x => x.id === id);
  if (!item) return "";
  if (!item.parentId) return item.name;
  return `${getHierarchyContext(item.parentId, tree)} > ${item.name}`;
};

export const getAllDescendants = (id, tree) => {
  let descendants = [];
  const children = tree.filter(x => x.parentId === id);
  for (const child of children) {
    descendants.push(child.id);
    descendants = descendants.concat(getAllDescendants(child.id, tree));
  }
  return descendants;
};
