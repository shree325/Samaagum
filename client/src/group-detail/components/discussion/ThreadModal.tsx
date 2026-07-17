import React from 'react';
import { I, Avatar } from '../../../home-icons';
import { getRelativeTime } from '../../utils/date';
import { VoteWidget } from './VoteWidget';
import { TagPill } from './TagPill';
import { EmojiBar } from './EmojiBar';
import { CommentItem } from './CommentItem';

interface ThreadModalProps {
  activeThread: any;
  loadingThread: boolean;
  replyDraft: string;
  setReplyDraft: (val: string) => void;
  submittingReply: boolean;
  canReply: boolean;
  isOwner: boolean;
  currentUserId: string | null;
  replyingToId: string | null;
  inlineReplyDraft: string;
  submittingInlineReply: boolean;
  commentVotes: Record<string, any>;
  editingPostId: string | null;
  editPostDraft: string;
  setEditingPostId: (val: string | null) => void;
  setEditPostDraft: (val: string) => void;
  editingCommentId: string | null;
  editCommentDraft: string;
  setEditingCommentId: (val: string | null) => void;
  setEditCommentDraft: (val: string) => void;
  myLikes: Set<string>;
  threadVotes: Record<string, any>;
  threadReactions: Record<string, any>;
  gId: string;
  token: string | null;
  ME: any;
  onBack: () => void;
  onVoteThread: (postId: string, vote: number) => void;
  onVoteComment: (commentId: string, vote: number) => void;
  onReactThread: (postId: string, emoji: string) => void;
  onLikeThread: (postId: string) => void;
  onSolveThread: (postId: string, solved: boolean) => void;
  onDeletePost: (postId: string) => void;
  onEditPost: () => void;
  onEditComment: (commentId: string) => void;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitInlineReply: (commentId: string) => void;
  onInlineReplyChange: (val: string) => void;
  onDeleteComment: (commentId: string) => void;
  onSubmitReply: () => void;
  canEdit: (createdAt: any) => boolean;
  setPosts: any;
  setActiveThread: any;
}

export function ThreadModal({
  activeThread,
  loadingThread,
  replyDraft,
  setReplyDraft,
  submittingReply,
  canReply,
  isOwner,
  currentUserId,
  replyingToId,
  inlineReplyDraft,
  submittingInlineReply,
  commentVotes,
  editingPostId,
  editPostDraft,
  setEditingPostId,
  setEditPostDraft,
  editingCommentId,
  editCommentDraft,
  setEditingCommentId,
  setEditCommentDraft,
  myLikes,
  threadVotes,
  threadReactions,
  gId,
  token,
  ME,
  onBack,
  onVoteThread,
  onVoteComment,
  onReactThread,
  onLikeThread,
  onSolveThread,
  onDeletePost,
  onEditPost,
  onEditComment,
  onStartReply,
  onCancelReply,
  onSubmitInlineReply,
  onInlineReplyChange,
  onDeleteComment,
  onSubmitReply,
  canEdit,
  setPosts,
  setActiveThread
}: ThreadModalProps) {
  if (!activeThread) return null;

  const atVotes = threadVotes[activeThread.id] || {};
  const atVoteScore = atVotes.score !== undefined ? atVotes.score : (activeThread.vote_score || 0);
  const atUserVote = atVotes.userVote !== undefined ? atVotes.userVote : (activeThread.user_vote || 0);
  const atReactions = threadReactions[activeThread.id] || activeThread.reactions || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button className="hbtn hbtn--ghost hbtn--sm" style={{ alignSelf: "flex-start" }} onClick={onBack}>
        <I.arrowL style={{ width: 14, height: 14 }} /> Back to Discussions
      </button>

      <div className={`post ${activeThread.pinned ? "pinned" : ""}`}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <VoteWidget
            score={atVoteScore}
            userVote={atUserVote}
            onUpvote={() => onVoteThread(activeThread.id, atUserVote === 1 ? 0 : 1)}
            onDownvote={() => onVoteThread(activeThread.id, atUserVote === -1 ? 0 : -1)}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {activeThread.pinned && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 3 }}><I.bookmarkF style={{ width: 10, height: 10 }} />Pinned</span>}
              {activeThread.locked && <span style={{ fontSize: 11, fontWeight: 600, color: "#e74c3c", display: "flex", alignItems: "center", gap: 3 }}><I.lock style={{ width: 10, height: 10 }} />Locked</span>}
              {activeThread.solved && <span style={{ fontSize: 11, fontWeight: 700, color: "#1a7f37", background: "#e6ffed", borderRadius: 8, padding: "1px 7px" }}>✓ Solved</span>}
              {(activeThread.tags || []).map((t: any) => <TagPill key={t.id || t.name} tag={t.name} />)}
            </div>
            {activeThread.title && <h2 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{activeThread.title}</h2>}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)", marginBottom: 12 }}>
              <Avatar name={activeThread.author_name || "Unknown"} userId={activeThread.author_user_id} img={activeThread.author_photo} size={22} />
              <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>{activeThread.author_name || "Unknown"}</span>
              <span>·</span>
              <span>{activeThread.created_at ? getRelativeTime(activeThread.created_at) : 'Just now'}</span>
              {activeThread.view_count > 0 && <span>· {activeThread.view_count} views</span>}
            </div>
            {editingPostId === activeThread.id ? (
              <div style={{ marginBottom: 12 }}>
                <textarea
                  autoFocus
                  value={editPostDraft}
                  onChange={e => setEditPostDraft(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit", resize: "vertical", outline: "none", background: "var(--surface)", color: "var(--ink)", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 8 }}>
                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { setEditingPostId(null); setEditPostDraft(""); }}>Cancel</button>
                  <button className="hbtn hbtn--primary hbtn--sm" onClick={onEditPost}>Save</button>
                </div>
              </div>
            ) : (
              activeThread.body && <div className="pbody" style={{ marginBottom: 12 }}>{activeThread.body}</div>
            )}
            <EmojiBar counts={atReactions} onReact={emoji => onReactThread(activeThread.id, emoji)} />
            {isOwner && (
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={async () => {
                  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                  const r = await fetch(`${apiBase}/api/groups/${gId}/posts/${activeThread.id}/pin`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ pinned: !activeThread.pinned }) });
                  const d = await r.json();
                  if (d.success) { setActiveThread((prev: any) => prev ? ({ ...prev, pinned: !prev.pinned }) : null); setPosts((prev: any) => prev.map((p: any) => p.id === activeThread.id ? { ...p, pinned: !p.pinned } : p)); }
                }}>{activeThread.pinned ? "Unpin" : "Pin"}</button>
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={async () => {
                  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                  const r = await fetch(`${apiBase}/api/groups/${gId}/posts/${activeThread.id}/lock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ locked: !activeThread.locked }) });
                  const d = await r.json();
                  if (d.success) { setActiveThread((prev: any) => prev ? ({ ...prev, locked: !prev.locked }) : null); setPosts((prev: any) => prev.map((p: any) => p.id === activeThread.id ? { ...p, locked: !p.locked } : p)); }
                }}>{activeThread.locked ? "Unlock" : "Lock"}</button>
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: activeThread.solved ? "var(--ink-2)" : "#1a7f37" }} onClick={() => onSolveThread(activeThread.id, !activeThread.solved)}>
                  {activeThread.solved ? "Unmark Solved" : "✓ Mark Solved"}
                </button>
              </div>
            )}
            {(isOwner || activeThread.author_user_id === currentUserId) && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                {canEdit(activeThread.created_at) && activeThread.author_user_id === currentUserId && (
                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { setEditingPostId(activeThread.id); setEditPostDraft(activeThread.body || ""); }}>
                    <I.edit style={{ width: 13, height: 13 }} /> Edit thread
                  </button>
                )}
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#e74c3c" }} title="Delete thread" onClick={() => { if (!confirm("Delete this thread and all replies?")) return; onDeletePost(activeThread.id); onBack(); }}>
                  <I.trash style={{ width: 13, height: 13 }} /> Delete thread
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ fontWeight: 600, fontSize: 15, borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
        {loadingThread ? "Loading replies…" : `${(activeThread.comments || []).length} ${(activeThread.comments || []).length === 1 ? 'Reply' : 'Replies'}`}
      </div>

      {loadingThread && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-3)" }}>
          <div className="spinner" style={{ margin: "0 auto" }} />
        </div>
      )}

      {!loadingThread && (activeThread.comments || []).length === 0 && (
        <div style={{ textAlign: "center", padding: "32px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
          <p style={{ margin: 0, fontSize: 14 }}>{canReply && !activeThread.locked ? "Be the first to reply!" : "No replies yet."}</p>
        </div>
      )}

      {!loadingThread && (activeThread.comments || []).map((c: any) => (
        <div key={c.id} style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
          <CommentItem
            c={c}
            depth={0}
            canReply={canReply && !activeThread.locked}
            isOwner={isOwner}
            currentUserId={currentUserId}
            replyingToId={replyingToId}
            inlineReplyDraft={inlineReplyDraft}
            submittingInlineReply={submittingInlineReply}
            commentVotes={commentVotes}
            onVote={onVoteComment}
            onDelete={onDeleteComment}
            onStartReply={onStartReply}
            onCancelReply={onCancelReply}
            onInlineReplyChange={onInlineReplyChange}
            onSubmitInlineReply={onSubmitInlineReply}
            canEdit={canEdit}
            editingCommentId={editingCommentId}
            editCommentDraft={editCommentDraft}
            onEditStart={(c) => { setEditingCommentId(c.id); setEditCommentDraft(c.body); }}
            onEditCancel={() => { setEditingCommentId(null); setEditCommentDraft(""); }}
            onEditChange={v => setEditCommentDraft(v)}
            onEditSubmit={onEditComment}
          />
        </div>
      ))}

      {canReply && !activeThread.locked && (
        <div className="composer">
          <Avatar name={ME.name} img={ME.img} size={36} />
          <div className="ci">
            <textarea placeholder="Write a reply…" value={replyDraft} onChange={e => setReplyDraft(e.target.value)} rows={replyDraft ? 3 : 1} />
            <div className="cbar">
              <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft: "auto" }} disabled={!replyDraft.trim() || submittingReply} onClick={onSubmitReply}>
                {submittingReply ? 'Posting…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
      {activeThread.locked && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)" }}>
          <I.lock style={{ width: 16, height: 16, opacity: 0.6 }} />
          <span style={{ fontSize: 13 }}>This thread is locked. No new replies.</span>
        </div>
      )}
    </div>
  );
}
