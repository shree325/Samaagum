// @ts-nocheck
import React, { useMemo } from 'react';
import { getDynamicHierarchy } from '../../../utils/hierarchy';
import { RuleEditor } from './RuleEditor';
import { CommunityTree } from './CommunityTree';

export function AccessControlModal({ open, onClose, mode, selectedAccess, setSelectedAccess, hierarchyData, myManagedGroups }) {
  const isRuleMode = mode === "selected_members";

  const dynamicTree = useMemo(() => {
    const fullTree = getDynamicHierarchy(hierarchyData);
    if (myManagedGroups && myManagedGroups.length > 0) {
      const managedIds = new Set(myManagedGroups.map(g => g.id));
      const filtered = fullTree.filter(n => n.type !== 'group' || managedIds.has(n.id.slice(-36)));
      const keptParents = new Set(filtered.map(n => n.parentId).filter(Boolean));
      return filtered.filter(n => n.type === 'group' || keptParents.has(n.id));
    }
    return fullTree;
  }, [hierarchyData, myManagedGroups]);

  const dynamicCommunities = useMemo(() =>
    hierarchyData && hierarchyData.communities && hierarchyData.communities.length > 0
      ? hierarchyData.communities.map(c => c.name)
      : [],
    [hierarchyData]
  );

  const dynamicGroups = useMemo(() =>
    hierarchyData && hierarchyData.communities && hierarchyData.communities.length > 0
      ? hierarchyData.communities.flatMap(c => (c.groups || []).map(g => g.name))
      : [],
    [hierarchyData]
  );

  if (!open) return null;

  if (isRuleMode) {
    return (
      <RuleEditor
        selectedAccess={selectedAccess}
        setSelectedAccess={setSelectedAccess}
        dynamicCommunities={dynamicCommunities}
        dynamicGroups={dynamicGroups}
        onClose={onClose}
      />
    );
  }

  return (
    <CommunityTree
      selectedAccess={selectedAccess}
      setSelectedAccess={setSelectedAccess}
      dynamicTree={dynamicTree}
      onClose={onClose}
    />
  );
}
export default AccessControlModal;
