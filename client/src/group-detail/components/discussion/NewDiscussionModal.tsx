import React from 'react';
import { ALL_FORUM_TAGS } from '../../utils/constants';

interface NewDiscussionModalProps {
  showNewThreadModal: boolean;
  setShowNewThreadModal: (val: boolean) => void;
  newThreadTitle: string;
  setNewThreadTitle: (val: string) => void;
  newThreadBody: string;
  setNewThreadBody: (val: string) => void;
  newThreadTag: string;
  setNewThreadTag: (val: string) => void;
  postingThread: boolean;
  handleNewThread: () => void;
}

export function NewDiscussionModal({
  showNewThreadModal,
  setShowNewThreadModal,
  newThreadTitle,
  setNewThreadTitle,
  newThreadBody,
  setNewThreadBody,
  newThreadTag,
  setNewThreadTag,
  postingThread,
  handleNewThread
}: NewDiscussionModalProps) {
  if (!showNewThreadModal) return null;

  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
      <div className="modal-content" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", width: "90%", maxWidth: "500px", padding: 24, boxShadow: "var(--sh-xl)", color: "var(--ink)" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>New Thread</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <input className="cinput" placeholder="Title (optional)" value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} />
          <textarea className="ctextarea" placeholder="What's on your mind? (Markdown supported)" value={newThreadBody} onChange={e => setNewThreadBody(e.target.value)} rows={6} style={{ fontFamily: "inherit" }} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 6 }}>Tag (optional)</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {ALL_FORUM_TAGS.map(t => (
                <button key={t} onClick={() => setNewThreadTag(newThreadTag === t ? "" : t)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 12, border: `1px solid ${newThreadTag === t ? 'var(--accent-2)' : 'var(--border)'}`, background: newThreadTag === t ? 'var(--surface-2)' : 'transparent', color: newThreadTag === t ? 'var(--accent-2)' : 'var(--ink-2)', cursor: "pointer", fontWeight: newThreadTag === t ? 600 : 400 }}>{t}</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setShowNewThreadModal(false)}>Cancel</button>
          <button className="hbtn hbtn--primary hbtn--sm" disabled={postingThread || (!newThreadTitle.trim() && !newThreadBody.trim())} onClick={handleNewThread}>{postingThread ? "Posting…" : "Create Thread"}</button>
        </div>
      </div>
    </div>
  );
}
