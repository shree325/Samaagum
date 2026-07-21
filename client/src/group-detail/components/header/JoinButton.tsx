import React from 'react';
import { I } from '../../../home-icons';

interface JoinButtonProps {
  isOwner: boolean;
  capacityFull: boolean;
  hasWaitlist: boolean;
  isJoined: boolean;
  isPending: boolean;
  handleJoinClick: () => void;
  handleLeaveClick: () => void;
  handleCancelJoinRequestClick: () => void;
  g: any;
  go: (dest: string, arg?: any) => void;
}

export function JoinButton({
  isOwner,
  capacityFull,
  hasWaitlist,
  isJoined,
  isPending,
  handleJoinClick,
  handleLeaveClick,
  handleCancelJoinRequestClick,
  g,
  go
}: JoinButtonProps) {
  if (isOwner) {
    return (
      <>
        <button className="hbtn hbtn--soft hbtn--sm" onClick={() => go("edit-group", g)}>
          <I.edit style={{ width: 14 }} /> Edit Group
        </button>
        {!g.settings?.isArchived ? (
          <button className="hbtn hbtn--sm" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }} onClick={async () => {
            if (!confirm("Archive this group? It will be hidden from Discover but remain in your My Groups > Archive.")) return;
            const _ab = window.location.port === "8080" ? "http://localhost:3000" : "";
            const _tk = localStorage.getItem('token');
            const _r = await fetch(`${_ab}/api/groups/${g.id}/archive`, { method: 'POST', headers: _tk ? { 'Authorization': `Bearer ${_tk}` } : {} });
            const _d = await _r.json();
            if (_d.success) { go("groups", { tab: "created", createdSub: "archive" }); } else { alert(_d.message || "Failed to archive"); }
          }}>Archive</button>
        ) : (
          <button className="hbtn hbtn--sm hbtn--soft" onClick={async () => {
            const _ab = window.location.port === "8080" ? "http://localhost:3000" : "";
            const _tk = localStorage.getItem('token');
            const _r = await fetch(`${_ab}/api/groups/${g.id}/unarchive`, { method: 'POST', headers: _tk ? { 'Authorization': `Bearer ${_tk}` } : {} });
            const _d = await _r.json();
            if (_d.success) { go("groups", { tab: "created", createdSub: "active" }); } else { alert(_d.message || "Failed to unarchive"); }
          }}>Unarchive</button>
        )}
      </>
    );
  }

  if (capacityFull && !hasWaitlist) {
    return (
      <button className="hbtn hbtn--sm hbtn--ghost" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
        <I.users style={{ width: 14, height: 14 }} /> Group is Full
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className={`hbtn hbtn--sm ${isJoined || isPending ? "hbtn--ghost" : "hbtn--primary"}`} onClick={isPending ? undefined : handleJoinClick} style={isPending ? { cursor: 'default' } : undefined}>
        {isPending ? <><I.clock />Requested</> : isJoined ? <><I.check />Joined</> : capacityFull ? <><I.users style={{ width: 14, height: 14 }} />Join Waitlist</> : <><I.plus />Join group</>}
      </button>
      {isJoined && (
        <button className="hbtn hbtn--sm hbtn--soft" style={{ color: "var(--red)" }} onClick={handleLeaveClick}>
          Leave Group
        </button>
      )}
      {isPending && (
        <button className="hbtn hbtn--sm hbtn--soft" style={{ color: "var(--red)" }} onClick={handleCancelJoinRequestClick}>
          Cancel Request
        </button>
      )}
    </div>
  );
}
