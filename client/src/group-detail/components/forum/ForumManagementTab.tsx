import React from 'react';

interface ForumManagementTabProps {
  forum: any;
}

export function ForumManagementTab({ forum }: ForumManagementTabProps) {
  const {
    forumMembers,
    forumMemberSearch,
    forumMemberSearchResults,
    forumMgmtSearching,
    handleForumMemberSearch,
    handleGrantForumPerm,
    handleRevokeForumPerm
  } = forum;

  const PERMS = [
    { key: 'create_thread', label: 'Create Thread' },
    { key: 'reply_thread', label: 'Reply to Thread' }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Forum Management</h3>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-2)" }}>Grant special post/reply permissions to specific members when forum restrictions are active.</p>

      {/* Member search bar to grant permission */}
      <div className="form-card" style={{ padding: 20 }}>
        <h4 style={{ margin: "0 0 10px 0", fontSize: 14 }}>Search Member to Grant Permissions</h4>
        <div style={{ position: "relative" }}>
          <input
            className="cinput"
            placeholder="Type member name..."
            value={forumMemberSearch}
            onChange={e => handleForumMemberSearch(e.target.value)}
          />
          {forumMgmtSearching && (
            <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--ink-3)" }}>Searching…</div>
          )}
        </div>

        {forumMemberSearchResults.length > 0 && (
          <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {forumMemberSearchResults.map((m: any) => {
              const uName = m.users?.display_name || m.name || "Unknown";
              return (
                <div key={m.user_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{uName} <span style={{ fontWeight: 400, color: "var(--ink-3)", marginLeft: 6 }}>@{m.users?.username}</span></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {PERMS.map(p => {
                      // Check if already has it
                      const alreadyHas = (forumMembers || []).some((fm: any) => fm.user_id === m.user_id && fm.perm_type === p.key);
                      if (alreadyHas) return <span key={p.key} style={{ fontSize: 11, color: "var(--accent-2)", background: "var(--surface-2)", padding: "3px 8px", borderRadius: 4 }}>{p.label} ✓</span>;
                      return (
                        <button key={p.key} className="hbtn hbtn--primary hbtn--sm" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => handleGrantForumPerm(m.user_id, p.key)}>
                          + {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Permissions Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
        <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>Granted Permissions</h4>
        {forumMembers.length === 0 ? (
          <div style={{ color: "var(--ink-3)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No special forum permissions granted yet.</div>
        ) : (
          <table className="grp-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Member</th>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Permission</th>
                <th style={{ padding: "8px 4px", color: "var(--ink-3)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forumMembers.map((fm: any) => (
                <tr key={`${fm.user_id}-${fm.perm_type}`} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 4px" }}>
                    <div style={{ fontWeight: 600 }}>{fm.users?.display_name || "Unknown"}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>@{fm.users?.username}</div>
                  </td>
                  <td style={{ padding: "10px 4px" }}>
                    <span style={{ fontSize: 12, background: "var(--surface-2)", color: "var(--ink)", padding: "3px 8px", borderRadius: 4 }}>
                      {fm.perm_type === 'create_thread' ? 'Create Thread' : fm.perm_type === 'reply_thread' ? 'Reply to Thread' : fm.perm_type}
                    </span>
                  </td>
                  <td style={{ padding: "10px 4px" }}>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#e74c3c" }} onClick={() => handleRevokeForumPerm(fm.user_id, fm.perm_type)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
