import React from 'react';
import { I } from '../../../home-icons';

interface MemberOnlyScreenProps {
  onJoin: () => void;
  isPending: boolean;
}

export function MemberOnlyScreen({ onJoin, isPending }: MemberOnlyScreenProps) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
      <I.lock style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
      <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 18 }}>Members Only</h4>
      <p style={{ margin: "0 0 24px 0", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
        This content is available only to group members. Join this group to access Discussions, Members, Gallery, and Events.
      </p>
      <button className="hbtn hbtn--primary" onClick={onJoin} disabled={isPending}>
        {isPending ? "Request Pending" : "Join Group"}
      </button>
    </div>
  );
}
