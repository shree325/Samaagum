// @ts-nocheck
import React, { useState } from 'react';
import { I } from '../../../../home-icons';
import { RuleCommunitySummaryChip } from '../../chips/RuleCommunitySummaryChip';
import { RuleGroupSummaryChip } from '../../chips/RuleGroupSummaryChip';
import { GroupSelector } from './GroupSelector';
import { CommunitySelector } from './CommunitySelector';

export function RuleEditor({ selectedAccess, setSelectedAccess, dynamicCommunities, dynamicGroups, onClose }) {
  const rules = Array.isArray(selectedAccess.selectedMembers) ? selectedAccess.selectedMembers : [];

  const [editingGroupsRuleId, setEditingGroupsRuleId] = useState(null);
  const [tempSelectedGroups, setTempSelectedGroups] = useState([]);

  const [editingCommunitiesRuleId, setEditingCommunitiesRuleId] = useState(null);
  const [tempSelectedCommunities, setTempSelectedCommunities] = useState([]);

  const updateRules = (newRules) => {
    setSelectedAccess(prev => ({
      ...prev,
      selectedMembers: newRules
    }));
  };

  const addRule = () => {
    const newRule = {
      id: "r-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      community: dynamicCommunities[0] || "",
      communities: dynamicCommunities[0] ? [dynamicCommunities[0]] : [],
      groups: []
    };
    updateRules([...rules, newRule]);
  };

  const updateRule = (id, fields) => {
    const nextRules = rules.map(r => r.id === id ? { ...r, ...fields } : r);
    updateRules(nextRules);
  };

  const deleteRule = (id) => {
    const nextRules = rules.filter(r => r.id !== id);
    updateRules(nextRules);
  };

  const currentGroupsRule = rules.find(r => r.id === editingGroupsRuleId);
  const currentCommsRule = rules.find(r => r.id === editingCommunitiesRuleId);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: 520, borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "85vh", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: "var(--ink)", fontWeight: 600 }}>
            Access Rules: Selected Members
          </h3>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--ink-2)" }}>
            Map communities to specific allowed groups.
          </p>
        </div>
        <button onClick={onClose} style={{ background: "var(--field)", border: "none", width: 30, height: 30, borderRadius: 15, cursor: "pointer", color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><I.x style={{ width: 14 }} /></button>
      </div>

      <div style={{ padding: "20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
        {rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", background: "var(--field)", borderRadius: "var(--r-md)", border: "1.5px dashed var(--border)" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "4px" }}>No access rules defined</div>
            <div style={{ fontSize: "12px", color: "var(--ink-2)", marginBottom: "16px" }}>Add a rule to map communities to specific groups.</div>
            <button type="button" className="hbtn hbtn--soft hbtn--sm" onClick={addRule}>
              <I.plus style={{ width: 14 }} /> Add Access Rule
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {rules.map((rule, index) => (
              <div
                key={rule.id}
                style={{
                  padding: "16px",
                  background: "var(--field)",
                  borderRadius: "var(--r-md)",
                  border: "1px solid var(--border)",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Rule #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteRule(rule.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-1)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div className="cfield" style={{ margin: 0 }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "4px", display: "block" }}>Communities</label>
                  <div>
                    <RuleCommunitySummaryChip
                      rule={rule}
                      onEditClick={() => {
                        setEditingCommunitiesRuleId(rule.id);
                        setTempSelectedCommunities(Array.isArray(rule.communities) ? rule.communities : (rule.community ? [rule.community] : []));
                      }}
                    />
                  </div>
                </div>

                <div className="cfield" style={{ margin: 0 }}>
                  <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--ink-2)", marginBottom: "6px", display: "block" }}>
                    Allowed Groups
                  </label>
                  <div>
                    <RuleGroupSummaryChip
                      rule={rule}
                      onEditClick={() => {
                        setEditingGroupsRuleId(rule.id);
                        setTempSelectedGroups(rule.groups || []);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="hbtn hbtn--ghost"
              onClick={addRule}
              style={{ width: "100%", borderStyle: "dashed", borderContent: "2px", height: "42px" }}
            >
              <I.plus style={{ width: 14 }} /> Add Another Rule
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", background: "var(--field)" }}>
        <button type="button" className="hbtn hbtn--primary" onClick={onClose} style={{ padding: "8px 18px", fontSize: 13 }}>Save Rules</button>
      </div>

      {editingGroupsRuleId && currentGroupsRule && (
        <GroupSelector
          rule={currentGroupsRule}
          dynamicGroups={dynamicGroups}
          tempSelectedGroups={tempSelectedGroups}
          setTempSelectedGroups={setTempSelectedGroups}
          onSave={() => {
            updateRule(currentGroupsRule.id, { groups: tempSelectedGroups });
            setEditingGroupsRuleId(null);
          }}
          onClose={() => setEditingGroupsRuleId(null)}
        />
      )}

      {editingCommunitiesRuleId && currentCommsRule && (
        <CommunitySelector
          dynamicCommunities={dynamicCommunities}
          tempSelectedCommunities={tempSelectedCommunities}
          setTempSelectedCommunities={setTempSelectedCommunities}
          onSave={() => {
            updateRule(currentCommsRule.id, { communities: tempSelectedCommunities, community: tempSelectedCommunities[0] || "" });
            setEditingCommunitiesRuleId(null);
          }}
          onClose={() => setEditingCommunitiesRuleId(null)}
        />
      )}
    </div>
    </div>
  );
}
