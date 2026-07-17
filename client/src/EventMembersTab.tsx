import React, { useState } from 'react';
import { I } from './home-icons';

interface EventMembersTabProps {
  e: any;
  hostStats: any;
  eventMembers: any[] | null;
  availableRoles: any[] | null;
  isTicketManager: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isHostOrCoHost: boolean;
  isOwner: boolean;
  ME: any;
  apiBase: string;
  token: string | null;
  go: (view: string, params?: any) => void;
  getQuestionLabel: (fieldId: string) => string;
  fetchEventMembers: () => Promise<void>;
  fetchHostStats: () => Promise<void>;
  handleHostRequestAction: (bookingId: string, action: 'accept' | 'decline') => Promise<void>;
  handleRemoveEventMember: (userId: string) => Promise<void>;
  setResponseMember: (member: any) => void;
  Avatar: React.ComponentType<any>;
}

export function EventMembersTab({
  e,
  hostStats,
  eventMembers,
  availableRoles,
  isTicketManager,
  isAdmin,
  isModerator,
  isHostOrCoHost,
  isOwner,
  ME,
  apiBase,
  token,
  go,
  getQuestionLabel,
  fetchEventMembers,
  fetchHostStats,
  handleHostRequestAction,
  handleRemoveEventMember,
  setResponseMember,
  Avatar
}: EventMembersTabProps) {
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const performAction = async (id: string, action: 'accept' | 'decline') => {
    setActionLoading(id);
    await handleHostRequestAction(id, action);
    setActionLoading(null);
  };

  const pendingRequests = hostStats?.requests || [];
  const confirmedAttendees = hostStats?.confirmed || [];
  const statsLoaded = !!hostStats;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Pending join requests — host only */}
      {(isTicketManager || isAdmin || isModerator) && pendingRequests.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6d5efc", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>Pending Approvals ({pendingRequests.length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pendingRequests.map((r: any) => (
              <div key={r.id || r.bookingId} style={{
                padding: "16px 20px",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-md)",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                    onClick={() => r.userId && go("profile", { id: r.userId })}>
                    <Avatar name={r.name || "User"} userId={r.userId} img={r.picture} size={38} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: "var(--ink)" }}>{r.name || "Unknown"}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{r.email || ""}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="hbtn hbtn--ghost hbtn--sm"
                      disabled={actionLoading === (r.id || r.bookingId)}
                      style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "20px", padding: "6px 16px", fontSize: 13, fontWeight: 600, opacity: actionLoading === (r.id || r.bookingId) ? 0.5 : 1 }}
                      onClick={() => performAction(r.id || r.bookingId, 'decline')}>
                      {actionLoading === (r.id || r.bookingId) ? '...' : 'Decline'}
                    </button>
                    <button className="hbtn hbtn--primary hbtn--sm"
                      disabled={actionLoading === (r.id || r.bookingId)}
                      style={{ background: "linear-gradient(135deg,#ff6b4a,#ff4d8d)", border: "none", borderRadius: "20px", padding: "6px 18px", fontSize: 13, fontWeight: 600, color: "#fff", opacity: actionLoading === (r.id || r.bookingId) ? 0.5 : 1 }}
                      onClick={() => performAction(r.id || r.bookingId, 'accept')}>
                      {actionLoading === (r.id || r.bookingId) ? '...' : 'Approve'}
                    </button>
                  </div>
                </div>
                {/* Questionnaire answers box */}
                {((r.answers && Object.keys(r.answers).length > 0) || r.transactionId) && (
                  <div style={{
                    padding: "16px",
                    background: "var(--bg-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-md)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Questionnaire Answers
                    </div>
                    {Object.entries(r.answers).filter(([k]) => !['ticketTypeId', 'qty', 'ticketName', 'isQuestionnaireSubmit', 'registration_location', 'transactionId', 'buyer', 'attendees'].includes(k)).map(([key, val]) => {
                      const label = getQuestionLabel(key);
                      return (
                        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>Q: {label}</div>
                          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                            {typeof val === 'string' && (val.startsWith('data:image/') || val.match(/\.(jpeg|jpg|gif|png)$/) || val.startsWith('http')) && (val.startsWith('data:image/') || val.includes('res.cloudinary') || val.includes('firebasestorage')) ? (
                              <img src={val} alt={label} style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, marginTop: 4, objectFit: 'contain', background: '#000' }} />
                            ) : (
                              <>A: {String(val)}</>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {r.transactionId && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
                        <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>Payment Proof / Transaction ID</div>
                        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 600 }}>
                          {typeof r.transactionId === 'string' && (r.transactionId.startsWith('data:image/') || r.transactionId.match(/\.(jpeg|jpg|gif|png)$/) || r.transactionId.startsWith('http')) ? (
                            <img src={r.transactionId} alt="Payment Proof" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 8, marginTop: 4, objectFit: 'contain', background: '#000' }} />
                          ) : (
                            <>{r.transactionId}</>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed members */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
            Members
            {eventMembers && eventMembers.filter(m => m.state === 'active').length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: "var(--ink-3)", background: "var(--border)", padding: "2px 8px", borderRadius: 999 }}>
                {eventMembers.filter(m => m.state === 'active').length}
              </span>
            )}
          </h3>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              className="cinput"
              value={memberRoleFilter}
              onChange={ev => setMemberRoleFilter(ev.target.value)}
              style={{ fontSize: 12, background: "var(--field)", border: "1px solid var(--border)", padding: "6px 28px 6px 12px", height: "auto", minHeight: "32px" }}
            >
              <option value="all">All Roles</option>
              {(availableRoles || []).map(r => (
                <option key={r.key} value={r.key}>{r.display_name}</option>
              ))}
            </select>
            <input
              className="cinput"
              placeholder="Search members…"
              value={memberSearch}
              onChange={ev => setMemberSearch(ev.target.value)}
              style={{ width: 170, fontSize: 12, background: "var(--field)", border: "1px solid var(--border)", minHeight: "32px" }}
            />
          </div>
        </div>
        {!eventMembers ? (
          <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--ink-3)" }}>Loading members...</div>
        ) : eventMembers.filter(m => m.state === 'active').length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--ink-3)", border: "1px dashed var(--border)", borderRadius: "var(--r-md)" }}>
            No confirmed members yet.
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
            {eventMembers
              .filter(m => m.state === 'active')
              .filter(m => memberRoleFilter === 'all' || m.role === memberRoleFilter)
              .filter(m => !memberSearch || (m.name || m.display_name || "").toLowerCase().includes(memberSearch.toLowerCase()))
              .map((a, i, arr) => {
                const name = a.name || a.display_name || "Member";
                const userId = a.id;
                const email = a.email || "";
                const isLast = i === arr.length - 1;

                const roleMeta = (key: string) => (availableRoles || []).find(r => r.key === key);
                const ROLE_BADGE_COLORS = ['#9333ea', '#2563eb', '#ea580c', '#0891b2', '#4338ca', '#be185d'];

                const handleRoleChange = async (newRole: string) => {
                  try {
                    const res = await fetch(`${apiBase}/api/events/${e.id}/memberships/${userId}/role`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({ role: newRole })
                    });
                    const data = await res.json();
                    if (data.success) {
                      if (window.toast) window.toast("Role updated successfully!", "success");
                      fetchEventMembers();
                    } else {
                      if (window.toast) window.toast(data.message || "Failed to update role", "error");
                    }
                  } catch (err) {
                    if (window.toast) window.toast("Error updating role", "error");
                  }
                };

                const userRoleKey = isOwner ? (availableRoles || [])[0]?.key : (eventMembers.find(m => m.id === ME?.id)?.role || 'member');
                const myLevel = roleMeta(userRoleKey)?.hierarchy_level ?? Infinity;
                const theirLevel = roleMeta(a.role)?.hierarchy_level ?? Infinity;
                const canChangeRole = isHostOrCoHost && myLevel < theirLevel;
                const canRemoveMember = userId !== ME?.id && (isOwner || (isHostOrCoHost && myLevel < theirLevel));

                const memberBooking = confirmedAttendees.find((c: any) => c.userId === userId);
                const memberAnswers = memberBooking?.answers || null;
                const hasAnswers = memberAnswers && Object.keys(memberAnswers).length > 0;

                return (
                  <div key={userId || name + i}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 16px",
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                      cursor: userId ? "pointer" : "default",
                      transition: "background 0.15s"
                    }}
                    onClick={() => userId && go("profile", { id: userId })}
                    onMouseEnter={ev => { if (userId) ev.currentTarget.style.background = "var(--field)"; }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = ""; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={name} userId={userId} img={a.picture} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
                        {email && <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{email}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={ev => ev.stopPropagation()}>
                      {canChangeRole ? (
                        <select
                          className="cselect"
                          value={a.role}
                          onChange={(evt) => handleRoleChange(evt.target.value)}
                          style={{ fontSize: 12, padding: "4px 24px 4px 8px", background: "var(--field)", border: "1px solid var(--border)" }}
                        >
                          {(availableRoles || []).filter(r => r.hierarchy_level > myLevel).map(r => (
                            <option key={r.key} value={r.key}>{r.display_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: a.role === 'member' ? "#1f9d57" : (ROLE_BADGE_COLORS[(availableRoles || []).findIndex(r => r.key === a.role) % ROLE_BADGE_COLORS.length] || "#1f9d57"), background: "rgba(0,0,0,0.05)", padding: "3px 8px", borderRadius: 999 }}>
                          {roleMeta(a.role)?.display_name || 'Member'}
                        </span>
                      )}
                      {canRemoveMember && (
                        <button
                          className="hbtn hbtn--soft hbtn--sm"
                          style={{ fontSize: 11.5, padding: "4px 10px", color: "#ef4444" }}
                          onClick={(ev) => { ev.stopPropagation(); handleRemoveEventMember(userId); }}
                        >
                          Remove
                        </button>
                      )}
                      {(isHostOrCoHost || isAdmin || isModerator) && (
                        <button
                          className="hbtn hbtn--soft hbtn--sm"
                          style={{ fontSize: 11.5, padding: "4px 10px" }}
                          onClick={() => setResponseMember({ ...a, name, email, answers: memberAnswers })}
                        >
                          Response{!statsLoaded ? "…" : (hasAnswers ? "" : " (none)")}
                        </button>
                      )}
                      {userId && <I.arrowR style={{ width: 14, color: "var(--ink-3)" }} />}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
