import React from 'react';
import { Avatar } from '../../../home-icons';

interface PendingRequestsProps {
  requests: any[];
  groupSettings: any;
  currentUserRole: string;
  roleHasCap: (roleKey: string, cap: string) => boolean;
  onApprove: (r: any) => void;
  onDecline: (r: any) => void;
}

export function PendingRequests({
  requests,
  groupSettings,
  currentUserRole,
  roleHasCap,
  onApprove,
  onDecline
}: PendingRequestsProps) {
  const canModerate = currentUserRole === 'group_owner' ||
    roleHasCap(currentUserRole, 'group.moderate') ||
    roleHasCap(currentUserRole, 'group.manage');

  if (!canModerate || requests.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)" }} />
        Pending Approvals ({requests.length})
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.map(r => (
          <div key={r.user_id} style={{ display: "flex", flexDirection: "column", padding: 10, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={r.users?.display_name || "Unknown"} userId={r.users?.id} img={r.users?.profilePhoto} size={32} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.users?.display_name || "Unknown"}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="hbtn hbtn--soft hbtn--sm" onClick={() => onDecline(r)} style={{ color: "#ef4444" }}>Decline</button>
                <button className="hbtn hbtn--primary hbtn--sm" onClick={() => onApprove(r)}>Approve</button>
              </div>
            </div>
            {r.answers && Object.keys(r.answers).length > 0 && (
              <div style={{ marginTop: 12, padding: 12, background: "var(--bg)", borderRadius: 6, fontSize: 13, border: "1px solid var(--border)" }}>
                <h5 style={{ margin: "0 0 8px 0", fontSize: 12, textTransform: "uppercase", color: "var(--ink-3)", letterSpacing: "0.05em" }}>Questionnaire Answers</h5>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(r.answers).filter(([k]) => !['ticketName', 'isQuestionnaireSubmit', 'tickets', 'buyer', 'attendees', 'transactionId', 'registration_location'].includes(k)).map(([key, ans]) => {
                    const idx = parseInt(key);
                    const qs = groupSettings?.questionnaires || [];
                    const q = (!isNaN(idx) && idx < 1000) ? qs[idx] : qs.find((x: any) => x.id === key);
                    return (
                      <div key={key}>
                        <div style={{ fontWeight: 500, color: "var(--ink-2)" }}>Q: {q?.q || `Question ${isNaN(idx) ? key : idx + 1}`}</div>
                        <div style={{ color: "var(--ink)", marginTop: 2 }}>A: {String(ans)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
