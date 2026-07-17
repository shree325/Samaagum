import React from 'react';

interface MemberResponseModalProps {
  member: any;
  onClose: () => void;
  getQuestionLabel: (fieldId: string) => string;
  Avatar: React.ComponentType<any>;
}

export function EventMemberResponseModal({
  member,
  onClose,
  getQuestionLabel,
  Avatar
}: MemberResponseModalProps) {
  if (!member) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--surface)", width: "min(480px,95vw)", maxHeight: "80vh", overflowY: "auto", borderRadius: "var(--r-xl)", boxShadow: "var(--sh-xl)", display: "flex", flexDirection: "column" }} onClick={ev => ev.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={member.name} userId={member.id} img={member.picture} size={34} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{member.name}</div>
              {member.email && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{member.email}</div>}
            </div>
          </div>
          <button className="hbtn hbtn--ghost hbtn--sm" onClick={onClose} style={{ border: "none" }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {member.answers && Object.keys(member.answers).length > 0 ? (
            Object.entries(member.answers).filter(([k]) => !['ticketTypeId', 'qty', 'ticketName', 'isQuestionnaireSubmit', 'registration_location'].includes(k)).map(([key, val]) => {
              const label = getQuestionLabel(key);
              return (
                <div key={key}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, color: "var(--ink)", background: "var(--field)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px" }}>{String(val)}</div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)", fontSize: 13.5 }}>
              This member didn't submit any questionnaire responses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
