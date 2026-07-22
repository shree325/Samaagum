// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../../home-icons';
import { CATEGORY_ICONS } from '../../../constants/category-icons';
import { getHierarchyContext, getAllDescendants } from '../../../utils/hierarchy';

export function CommunityTree({ selectedAccess, setSelectedAccess, dynamicTree, onClose }) {
  const [treeSearch, setTreeSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  const currentRestricted = selectedAccess.restricted || { communities: [], subCommunities: [], groups: [] };

  const selectedIds = [
    ...(currentRestricted.communities || []).flatMap(nameOrId => {
      const node = dynamicTree.find(n => n.type === "community" && (n.name === nameOrId || n.id === nameOrId));
      return node ? [node.id] : [];
    }),
    ...(currentRestricted.subCommunities || []).flatMap(nameOrId => {
      const node = dynamicTree.find(n => n.type === "subCommunity" && (n.name === nameOrId || n.id === nameOrId));
      return node ? [node.id] : [];
    }),
    ...(currentRestricted.groups || []).flatMap(nameOrId => {
      const node = dynamicTree.find(n => n.type === "group" && (n.name === nameOrId || n.id === nameOrId));
      return node ? [node.id] : [];
    }),
  ];

  const setSelectedIds = (newSelectedIds) => {
    const newComms = [];
    const newSubs = [];
    const newGroups = [];

    newSelectedIds.forEach(id => {
      const item = dynamicTree.find(x => x.id === id);
      if (item) {
        if (item.type === "community") newComms.push(item.name);
        else if (item.type === "subCommunity") newSubs.push(item.name);
        else if (item.type === "group") newGroups.push(item.name);
      }
    });

    setSelectedAccess(prev => ({
      ...prev,
      restricted: {
        communities: newComms,
        subCommunities: newSubs,
        groups: newGroups
      }
    }));
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSelectNode = (id, checked) => {
    const descendants = getAllDescendants(id, dynamicTree);
    const idsToToggle = [id, ...descendants];

    let nextSelected = new Set(selectedIds);
    if (checked) {
      idsToToggle.forEach(x => nextSelected.add(x));
    } else {
      idsToToggle.forEach(x => nextSelected.delete(x));
    }

    const evaluateParents = (currentSet) => {
      let changed = false;
      const byParent = {};
      dynamicTree.forEach(n => {
        if (n.parentId) {
          if (!byParent[n.parentId]) byParent[n.parentId] = [];
          byParent[n.parentId].push(n.id);
        }
      });

      let iterations = 0;
      do {
        changed = false;
        Object.keys(byParent).forEach(pid => {
          const childrenIds = byParent[pid];
          const allChecked = childrenIds.length > 0 && childrenIds.every(cid => currentSet.has(cid));
          if (allChecked && !currentSet.has(pid)) {
            currentSet.add(pid);
            changed = true;
          } else if (!allChecked && currentSet.has(pid)) {
            currentSet.delete(pid);
            changed = true;
          }
        });
        iterations++;
      } while (changed && iterations < 5);

      return currentSet;
    };

    setSelectedIds(Array.from(evaluateParents(nextSelected)));
  };

  const isNodeChecked = (id) => selectedIds.includes(id);
  const isNodeIndeterminate = (id) => {
    if (isNodeChecked(id)) return false;
    const descendants = getAllDescendants(id, dynamicTree);
    if (descendants.length === 0) return false;
    const selectedCount = descendants.filter(d => selectedIds.includes(d)).length;
    return selectedCount > 0 && selectedCount < descendants.length;
  };

  const lowerSearch = treeSearch.toLowerCase();
  const visibleNodes = new Set();

  if (lowerSearch) {
    dynamicTree.forEach(n => {
      if (n.name.toLowerCase().includes(lowerSearch)) {
        visibleNodes.add(n.id);
        let curr = n.parentId;
        while (curr) {
          visibleNodes.add(curr);
          const parent = dynamicTree.find(x => x.id === curr);
          curr = parent ? parent.parentId : null;
        }
        getAllDescendants(n.id, dynamicTree).forEach(d => visibleNodes.add(d));
      }
    });
  } else {
    dynamicTree.forEach(n => visibleNodes.add(n.id));
  }

  const allVisibleSelected = visibleNodes.size > 0 && Array.from(visibleNodes).every(id => selectedIds.includes(id));

  const handleSelectAll = () => {
    const nextSelected = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleNodes.forEach(id => nextSelected.delete(id));
    } else {
      visibleNodes.forEach(id => nextSelected.add(id));
    }

    const byParent = {};
    dynamicTree.forEach(n => {
      if (n.parentId) {
        if (!byParent[n.parentId]) byParent[n.parentId] = [];
        byParent[n.parentId].push(n.id);
      }
    });
    let changed = false;
    let iterations = 0;
    do {
      changed = false;
      Object.keys(byParent).forEach(pid => {
        const childrenIds = byParent[pid];
        const allChecked = childrenIds.length > 0 && childrenIds.every(cid => nextSelected.has(cid));
        if (allChecked && !nextSelected.has(pid)) {
          nextSelected.add(pid);
          changed = true;
        } else if (!allChecked && nextSelected.has(pid)) {
          nextSelected.delete(pid);
          changed = true;
        }
      });
      iterations++;
    } while (changed && iterations < 5);

    setSelectedIds(Array.from(nextSelected));
  };

  const renderNode = (node, depth = 0) => {
    if (!visibleNodes.has(node.id)) return null;

    const children = dynamicTree.filter(n => n.parentId === node.id);
    const isExpandable = children.length > 0;
    const isExpanded = lowerSearch ? true : !!expanded[node.id];
    const checked = isNodeChecked(node.id);
    const indeterminate = isNodeIndeterminate(node.id);

    let icon = "👥";
    if (node.type === "community") icon = CATEGORY_ICONS[node.name] || "📌";
    else if (node.type === "subCommunity") icon = "📁";

    return (
      <div key={node.id} style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            paddingLeft: `${12 + (depth * 20)}px`,
            borderRadius: "var(--r-sm)",
            cursor: "pointer",
            transition: "background 0.15s",
            background: checked ? "var(--field)" : "transparent"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--field)"}
          onMouseLeave={e => e.currentTarget.style.background = checked ? "var(--field)" : "transparent"}
          onClick={() => handleSelectNode(node.id, !checked)}
        >
          {isExpandable ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, width: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)" }}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          ) : (
            <div style={{ width: 16 }} />
          )}

          <input
            type="checkbox"
            checked={checked}
            ref={el => { if (el) el.indeterminate = indeterminate; }}
            onChange={(e) => { e.stopPropagation(); handleSelectNode(node.id, e.target.checked); }}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent-2)", margin: 0 }}
          />

          <span style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", width: 20 }}>{icon}</span>
          <span style={{ fontSize: 13.5, fontWeight: checked ? 500 : 400, color: checked ? "var(--ink)" : "var(--ink-2)", flex: 1 }}>
            {node.name}
          </span>
        </div>

        {isExpanded && children.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 520, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>
          Allowed Access Control
        </h3>
        <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ position: "relative" }}>
          <I.search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, color: "var(--ink-3)" }} />
          <input className="cinput" type="text" placeholder="Search communities, sub-communities, or groups..." value={treeSearch} onChange={e => setTreeSearch(e.target.value)} style={{ padding: "8px 12px 8px 34px", fontSize: 13 }} />
        </div>

        {selectedIds.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)" }}>Selected Items</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "100px", overflowY: "auto", padding: "4px 0" }}>
              {selectedIds.map(id => {
                const node = dynamicTree.find(x => x.id === id);
                if (!node) return null;
                if (node.parentId && selectedIds.includes(node.parentId)) return null;

                const context = getHierarchyContext(node.id, dynamicTree);
                let icon = "👥";
                if (node.type === "community") icon = "🏛️";
                else if (node.type === "subCommunity") icon = "📁";

                return (
                  <span
                    key={id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      background: "var(--accent-soft)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-sm)",
                      fontSize: "12px",
                      color: "var(--accent-2)",
                      fontWeight: 500
                    }}
                    title={context}
                  >
                    <span style={{ fontSize: "12px" }}>{icon}</span> {context}
                    <button
                      type="button"
                      onClick={() => handleSelectNode(id, false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0 2px",
                        color: "var(--accent-2)",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
          <span style={{ color: "var(--ink-2)", fontWeight: 500 }}>
            Selected: {selectedIds.length} of {dynamicTree.length}
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--accent-2)",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0
            }}
          >
            {allVisibleSelected ? (treeSearch ? "Deselect All Visible" : "Deselect All") : (treeSearch ? "Select All Visible" : "Select All")}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {dynamicTree.filter(n => !n.parentId).map(root => renderNode(root, 0))}
          {visibleNodes.size === 0 && (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>No results found</div>
          )}
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--field)" }}>
        <button type="button" className="hbtn hbtn--primary" onClick={onClose} style={{ padding: "8px 18px", fontSize: 13 }}>Save Settings</button>
      </div>
    </div>
    </div>
  );
}
