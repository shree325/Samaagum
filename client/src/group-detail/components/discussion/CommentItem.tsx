import React from 'react';
import { Avatar, I } from '../../../home-icons';
import { getRelativeTime } from '../../utils/date';
import { Comment } from '../../types';

interface CommentItemProps {
  c: Comment;
  depth: number;
  canReply: boolean;
  isOwner: boolean;
  currentUserId: string | null;
  replyingToId: string | null;
  inlineReplyDraft: string;
  submittingInlineReply: boolean;
  commentVotes: Record<string, { score: number; userVote: number }>;
  onVote: (commentId: string, vote: number) => void;
  onDelete: (commentId: string) => void;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onInlineReplyChange: (val: string) => void;
  onSubmitInlineReply: (parentCommentId: string) => void;
  canEdit: (createdAt: string | Date | number | undefined) => boolean;
  editingCommentId: string | null;
  editCommentDraft: string;
  onEditStart: (c: Comment) => void;
  onEditCancel: (commentId: string) => void;
  onEditChange: (val: string) => void;
  onEditSubmit: (commentId: string) => void;
}

export function CommentItem({
  c,
  depth,
  canReply,
  isOwner,
  currentUserId,
  replyingToId,
  inlineReplyDraft,
  submittingInlineReply,
  commentVotes,
  onVote,
  onDelete,
  onStartReply,
  onCancelReply,
  onInlineReplyChange,
  onSubmitInlineReply,
  canEdit,
  editingCommentId,
  editCommentDraft,
  onEditStart,
  onEditCancel,
  onEditChange,
  onEditSubmit
}: CommentItemProps) {
  const timeStr = c.created_at ? getRelativeTime(c.created_at) : 'Just now';
  const votes = commentVotes[c.id];
  const score = votes?.score !== undefined ? votes.score : (c.vote_score || 0);
  const userVote = votes?.userVote !== undefined ? votes.userVote : (c.user_vote || 0);
  const isReplying = replyingToId === c.id;
  const replies = c.replies || [];
  return (
    <div style={{ marginTop: depth > 0 ? 12 : 16 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
          <Avatar name={c.author_name || "Unknown"} userId={c.author_user_id} img={c.author_photo} size={28} />
          {(replies.length > 0 || isReplying) && (
            <div style={{ 
              width: 2, 
              flex: 1, 
              backgroundColor: 'var(--border)', 
              marginTop: 8, 
              marginBottom: 4, 
              borderRadius: 2 
            }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{c.author_name || "Unknown"}</span>
              <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>@{c.author_username || "unknown"}</span>
              <span style={{ color: "var(--ink-3)", marginLeft: 8 }}>· {timeStr}</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {c.author_user_id === currentUserId && canEdit && canEdit(c.created_at) && (
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => onEditStart(c)} title="Edit" style={{ color: "var(--ink-3)", padding: "2px 6px" }}>
                  <I.edit style={{ width: 11, height: 11 }} />
                </button>
              )}
              {(isOwner || c.author_user_id === currentUserId) && (
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => onDelete(c.id)} title="Delete" style={{ color: "var(--ink-3)", padding: "2px 6px" }}>
                  <I.trash style={{ width: 11, height: 11 }} />
                </button>
              )}
            </div>
          </div>
          {editingCommentId === c.id ? (
            <div style={{ marginBottom: 8 }}>
              <textarea
                autoFocus
                value={editCommentDraft}
                onChange={e => onEditChange(e.target.value)}
                rows={2}
                style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, fontFamily: "inherit", resize: "none", outline: "none", background: "var(--surface)", color: "var(--ink)", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => onEditCancel(c.id)}>Cancel</button>
                <button className="hbtn hbtn--primary hbtn--sm" onClick={() => onEditSubmit(c.id)}>Save</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink)", whiteSpace: "pre-wrap", wordBreak: "break-word", marginBottom: 8 }}>{c.body}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
              <button onClick={() => onVote(c.id, userVote === 1 ? 0 : 1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800, color: userVote === 1 ? "var(--accent-2)" : "var(--ink-3)", padding: "1px 4px", fontSize: 12 }}>▲</button>
              <span style={{ fontWeight: 600, color: "var(--ink-2)", minWidth: 16, textAlign: "center" }}>{score}</span>
              <button onClick={() => onVote(c.id, userVote === -1 ? 0 : -1)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800, color: userVote === -1 ? "#e74c3c" : "var(--ink-3)", padding: "1px 4px", fontSize: 12 }}>▼</button>
            </div>
            {canReply && depth < 4 && (
              <button onClick={() => isReplying ? onCancelReply() : onStartReply(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", fontSize: 12, display: "flex", alignItems: "center", gap: 3, padding: "2px 4px", borderRadius: 4 }}>
                <I.reply style={{ width: 11, height: 11 }} /> {isReplying ? "Cancel" : "Reply"}
              </button>
            )}
          </div>
          {isReplying && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <Avatar name="Me" size={24} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <textarea
                  autoFocus
                  placeholder="Write a reply…"
                  value={inlineReplyDraft}
                  onChange={e => onInlineReplyChange(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none", background: "var(--surface)", color: "var(--ink)", boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={onCancelReply}>Cancel</button>
                  <button className="hbtn hbtn--primary hbtn--sm" disabled={!inlineReplyDraft.trim() || submittingInlineReply} onClick={() => onSubmitInlineReply(c.id)}>{submittingInlineReply ? "Posting…" : "Reply"}</button>
                </div>
              </div>
            </div>
          )}
          {replies.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {replies.map(r => (
                <CommentItem key={r.id} c={r} depth={depth + 1} canReply={canReply} isOwner={isOwner} currentUserId={currentUserId} replyingToId={replyingToId} inlineReplyDraft={inlineReplyDraft} submittingInlineReply={submittingInlineReply} commentVotes={commentVotes} onVote={onVote} onDelete={onDelete} onStartReply={onStartReply} onCancelReply={onCancelReply} onInlineReplyChange={onInlineReplyChange} onSubmitInlineReply={onSubmitInlineReply} canEdit={canEdit} editingCommentId={editingCommentId} editCommentDraft={editCommentDraft} onEditStart={onEditStart} onEditCancel={onEditCancel} onEditChange={onEditChange} onEditSubmit={onEditSubmit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
