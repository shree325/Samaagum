// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../home-icons';
import { ACCESS_TREE } from '../../constants';
import {
  isChecked, isIndeterminate, toggleNodeCheck,
  nodeMatchesSearch, getSearchAutoExpandedIds,
  getSelectedNodesWithDetails, findNodeInTree,
} from '../../utils/access-tree';
import { TreeNodeCheckbox } from './TreeNodeCheckbox';

export function AccessControlModal({
  open,
  onClose,
  mode,
  selectedAccess,
  setSelectedAccess,
}: {
  open: boolean;
  onClose: () => void;
  mode?: string;
  selectedAccess: any;
  setSelectedAccess: (v: any) => void;
}) {
  const [search,          setSearch]          = useState('');
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set<string>());

  if (!open) return null;

  const searchAutoExpandedIds = getSearchAutoExpandedIds(search);
  const isNodeExpanded = (id: string) => expandedNodeIds.has(id) || searchAutoExpandedIds.has(id);
  const toggleNodeExpansion = (id: string) => {
    const next = new Set(expandedNodeIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedNodeIds(next);
  };

  const selectAllNodes = () => {
    const communities: string[] = []; const subCommunities: string[] = []; const groups: string[] = [];
    ACCESS_TREE.forEach(comm => {
      communities.push(comm.id);
      (comm.children ?? []).forEach((sub: any) => {
        subCommunities.push(sub.id);
        (sub.children ?? []).forEach((grp: any) => groups.push(grp.id));
      });
    });
    setSelectedAccess({ ...selectedAccess, restricted: { communities, subCommunities, groups } });
  };

  const clearAllNodes = () =>
    setSelectedAccess({ ...selectedAccess, restricted: { communities: [], subCommunities: [], groups: [] } });

  const renderTreeNode = (node: any, level = 0) => {
    if (search && !nodeMatchesSearch(node, search)) return null;
    const nodeChecked       = isChecked(node, selectedAccess.restricted);
    const nodeIndeterminate = isIndeterminate(node, selectedAccess.restricted);
    const hasChildren = node.children && node.children.length > 0;
    const expanded    = isNodeExpanded(node.id);
    const icon = node.type === 'community' ? '🏛️' : node.type === 'subcommunity' ? '📁' : '👥';

    const doToggle = () => {
      const nextRestricted = toggleNodeCheck(node, selectedAccess.restricted);
      setSelectedAccess({ ...selectedAccess, restricted: nextRestricted });
    };

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          className="tree-node-row"
          onClick={doToggle}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer', marginLeft: level * 20, userSelect: 'none', transition: 'background 0.15s ease' }}
        >
          {hasChildren
            ? <span onClick={e => { e.stopPropagation(); toggleNodeExpansion(node.id); }} style={{ cursor: 'pointer', fontSize: 10, width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}>▶</span>
            : <span style={{ width: 16 }} />
          }
          <span onClick={e => e.stopPropagation()}>
            <TreeNodeCheckbox checked={nodeChecked} indeterminate={nodeIndeterminate} onChange={doToggle} />
          </span>
          <span style={{ fontSize: 13, fontWeight: node.type === 'community' ? 600 : 500, color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <span>{icon}</span><span>{node.name}</span>
          </span>
        </div>
        {hasChildren && expanded && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const allSelectedDetails = getSelectedNodesWithDetails(ACCESS_TREE, selectedAccess.restricted);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <style dangerouslySetInnerHTML={{ __html: '.tree-node-row:hover { background: var(--bg-2) !important; }' }} />
      <div style={{ background: 'var(--surface)', width: 500, maxHeight: '85vh', borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', boxShadow: 'var(--sh-xl)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>Restricted Access Settings</h2>
          <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={onClose} style={{ border: 'none' }}><I.x /></button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* Selection summary */}
          <div style={{ marginBottom: 12, padding: '0 4px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>Selection Summary</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
              <span>👥 {selectedAccess.restricted.groups.length} Groups</span>
            </div>
            {allSelectedDetails.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', background: 'var(--field)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', maxHeight: 120, overflowY: 'auto' }}>
                {allSelectedDetails.map(node => {
                  const icon = node.type === 'community' ? '🏛️' : node.type === 'subcommunity' ? '📁' : '👥';
                  return (
                    <span key={node.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-soft)', color: 'var(--accent-2)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999 }}>
                      <span>{icon} {node.name}</span>
                      <span style={{ cursor: 'pointer', marginLeft: 4, opacity: 0.8 }} onClick={() => {
                        const fullNode = findNodeInTree(node.id, ACCESS_TREE);
                        if (fullNode) setSelectedAccess({ ...selectedAccess, restricted: toggleNodeCheck(fullNode, selectedAccess.restricted) });
                      }}>✕</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {/* Search + action buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input className="cinput" placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, background: 'var(--field)', border: '1px solid var(--border)', marginBottom: 0 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={selectAllNodes} style={{ padding: '8px 12px', fontSize: 12, height: 38 }}>Select All</button>
              <button type="button" className="hbtn hbtn--ghost hbtn--sm" onClick={clearAllNodes}   style={{ padding: '8px 12px', fontSize: 12, color: '#e5484d', height: 38 }}>Clear All</button>
            </div>
          </div>
          {/* Tree */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 12, background: 'var(--bg)' }}>
            {ACCESS_TREE.map(node => renderTreeNode(node, 0))}
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-2)' }}>
          <button type="button" className="hbtn hbtn--primary" onClick={onClose}>Save &amp; Close</button>
        </div>
      </div>
    </div>
  );
}
