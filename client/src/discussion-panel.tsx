// @ts-nocheck
import React from 'react';
import { I, Avatar } from './home-icons';

/* ============================================================
   Samaagum Shared Discussion Panel Component
   ============================================================ */

function getRelativeTime(d) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

const TAG_COLORS = {
  Question: { bg: "#e8f4ff", color: "#0969da" },
  Announcement: { bg: "#fff3e0", color: "#e05000" },
  Help: { bg: "#f3e8ff", color: "#8250df" },
  Bug: { bg: "#ffebe9", color: "#cf222e" },
  Feature: { bg: "#e6ffed", color: "#1a7f37" },
  News: { bg: "#e0f7fa", color: "#00838f" },
  Discussion: { bg: "#f6f8fa", color: "#57606a" },
  General: { bg: "#f6f8fa", color: "#57606a" }
};

const ALL_FORUM_TAGS = ["Question", "Announcement", "Help", "Bug", "Feature", "News", "Discussion", "General"];
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥"];

function TagPill({ tag }) {
  const c = TAG_COLORS[tag] || TAG_COLORS.General;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, display: "inline-block", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{tag}</span>
  );
}

function VoteWidget({ score, userVote, onUpvote, onDownvote }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 32 }}>
      <button onClick={e => { e.stopPropagation(); onUpvote(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 15, fontWeight: 800, color: userVote === 1 ? "var(--accent-2)" : "var(--ink-3)", lineHeight: 1 }} title="Upvote">▲</button>
      <span style={{ fontSize: 13, fontWeight: 700, color: score > 0 ? "var(--accent-2)" : score < 0 ? "#e74c3c" : "var(--ink-3)", minWidth: 20, textAlign: "center" }}>{score}</span>
      <button onClick={e => { e.stopPropagation(); onDownvote(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 15, fontWeight: 800, color: userVote === -1 ? "#e74c3c" : "var(--ink-3)", lineHeight: 1 }} title="Downvote">▼</button>
    </div>
  );
}

function EmojiBar({ counts, onReact }) {
  const [showPicker, setShowPicker] = React.useState(false);
  const hasAny = EMOJIS.some(e => (counts || {})[e] > 0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {EMOJIS.filter(e => (counts || {})[e] > 0).map(e => (
        <button key={e} onClick={ev => { ev.stopPropagation(); onReact(e); }} style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          {e} <span style={{ color: "var(--ink-2)" }}>{(counts || {})[e]}</span>
        </button>
      ))}
      <div style={{ position: "relative", display: "inline-block" }}>
        <button onClick={ev => { ev.stopPropagation(); setShowPicker(v => !v); }} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, padding: "2px 8px", fontSize: 12, cursor: "pointer", color: "var(--ink-3)" }} title="React">+</button>
        {showPicker && (
          <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 8, display: "flex", gap: 4, zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={ev => { ev.stopPropagation(); onReact(e); React.useState && setShowPicker(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}>{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SortBar({ sort, onSort }) {
  const opts = [["new", "New"], ["hot", "🔥 Hot"], ["top", "Top"], ["pinned", "📌 Pinned"]];
  return (
    <div style={{ display: "flex", gap: 2, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => onSort(k)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: sort === k ? 600 : 400, background: sort === k ? "var(--ink)" : "transparent", color: sort === k ? "#fff" : "var(--ink-2)", transition: "all .15s" }}>{l}</button>
      ))}
    </div>
  );
}

function ThreadCard({ p, onOpen, voteData, onVote, reactions, onReact, isLiked, onLike, currentUserId, isPrivileged, onApprove, onReject }) {
  const timeStr = p.created_at ? getRelativeTime(p.created_at) : 'Just now';
  const authorName = p.author_name || p.author_username || 'Unknown';
  const displayTitle = p.title || (p.body ? p.body.slice(0, 90) + (p.body.length > 90 ? '…' : '') : 'Untitled thread');
  const replyCount = p.comments_count || 0;
  const score = voteData ? voteData.score : (p.vote_score || 0);
  const userVote = voteData ? voteData.userVote : (p.user_vote || 0);
  const rxCounts = reactions || p.reactions || {};
  const likeCount = rxCounts['❤️'] || 0;
  const tags = p.tags || [];
  const hasBadges = p.pinned || p.locked || p.solved || tags.length > 0;
  const isPending = p.status === 'hidden';
  const isMyPendingPost = isPending && p.author_user_id === currentUserId;
  return (
    <div className={`post ${p.pinned ? "pinned" : ""}`} style={{ display: "flex", gap: 12, cursor: isPending && !isPrivileged ? "default" : "pointer", opacity: isPending && !isPrivileged && !isMyPendingPost ? 0.5 : 1, background: isMyPendingPost ? "var(--surface-2)" : undefined, borderLeft: isMyPendingPost ? "3px solid #f59e0b" : undefined }} onClick={() => !isPending && onOpen(p)}>
      <div onClick={e => e.stopPropagation()}>
        <VoteWidget score={score} userVote={userVote} onUpvote={() => onVote(p.id, userVote === 1 ? 0 : 1)} onDownvote={() => onVote(p.id, userVote === -1 ? 0 : -1)} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Pending approval badge */}
        {isPending && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>⏳ Pending Approval</span>
            {isPrivileged && (
              <>
                <button
                  className="hbtn hbtn--primary hbtn--sm"
                  style={{ fontSize: 11, padding: "2px 10px" }}
                  onClick={e => { e.stopPropagation(); onApprove && onApprove(p.id); }}
                >Approve</button>
                <button
                  className="hbtn hbtn--ghost hbtn--sm"
                  style={{ fontSize: 11, padding: "2px 10px", color: "#e74c3c" }}
                  onClick={e => { e.stopPropagation(); onReject && onReject(p.id); }}
                >Reject</button>
              </>
            )}
          </div>
        )}
        {hasBadges && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
            {p.pinned && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 3 }}><I.bookmarkF style={{ width: 10, height: 10 }} />Pinned</span>}
            {p.locked && <span style={{ fontSize: 11, fontWeight: 600, color: "#e74c3c", display: "flex", alignItems: "center", gap: 3 }}><I.lock style={{ width: 10, height: 10 }} />Locked</span>}
            {p.solved && <span style={{ fontSize: 11, fontWeight: 700, color: "#1a7f37", background: "#e6ffed", borderRadius: 8, padding: "1px 7px" }}>✓ Solved</span>}
            {tags.map(t => <TagPill key={t.id || t.name} tag={t.name} />)}
          </div>
        )}
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", marginBottom: 6, lineHeight: 1.4 }}>{displayTitle}</div>
        {p.title && p.body && (
          <div style={{ fontSize: 13.5, color: "var(--ink-2)", marginBottom: 8, lineHeight: 1.5 }}>{p.body.slice(0, 120)}{p.body.length > 120 ? '…' : ''}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)", flexWrap: "wrap" }}>
          <Avatar name={authorName} userId={p.author_user_id} img={p.author_photo} size={18} />
          <span style={{ fontWeight: 500, color: "var(--ink-2)" }}>{authorName}</span>
          <span>·</span>
          <span>{timeStr}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><I.comment style={{ width: 12, height: 12 }} />{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
          {p.view_count > 0 && <span>{p.view_count} views</span>}
          {/* Like button */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onLike && onLike(p.id); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 20, color: isLiked ? "#e0245e" : "var(--ink-3)", fontWeight: isLiked ? 700 : 400, fontSize: 13, transition: "all 0.15s" }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{isLiked ? "❤️" : "🤍"}</span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ c, depth, canReply, isOwner, currentUserId, replyingToId, inlineReplyDraft, submittingInlineReply, commentVotes, onVote, onDelete, onStartReply, onCancelReply, onInlineReplyChange, onSubmitInlineReply, canEdit, editingCommentId, editCommentDraft, onEditStart, onEditCancel, onEditChange, onEditSubmit }) {
  const timeStr = c.created_at ? getRelativeTime(c.created_at) : 'Just now';
  const votes = commentVotes[c.id] || {};
  const score = votes.score !== undefined ? votes.score : (c.vote_score || 0);
  const userVote = votes.userVote !== undefined ? votes.userVote : (c.user_vote || 0);
  const isReplying = replyingToId === c.id;
  const replies = c.replies || [];
  return (
    <div style={{ display: "flex", gap: 10, paddingLeft: depth > 0 ? 18 : 0, borderLeft: depth > 0 ? "2px solid var(--border)" : "none", marginTop: depth > 0 ? 10 : 0 }}>
      <Avatar name={c.author_name || "Unknown"} userId={c.author_user_id} img={c.author_photo} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
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
        {replies.map(r => (
          <CommentItem key={r.id} c={r} depth={depth + 1} canReply={canReply} isOwner={isOwner} currentUserId={currentUserId} replyingToId={replyingToId} inlineReplyDraft={inlineReplyDraft} submittingInlineReply={submittingInlineReply} commentVotes={commentVotes} onVote={onVote} onDelete={onDelete} onStartReply={onStartReply} onCancelReply={onCancelReply} onInlineReplyChange={onInlineReplyChange} onSubmitInlineReply={onSubmitInlineReply} canEdit={canEdit} editingCommentId={editingCommentId} editCommentDraft={editCommentDraft} onEditStart={onEditStart} onEditCancel={onEditCancel} onEditChange={onEditChange} onEditSubmit={onEditSubmit} />
        ))}
      </div>
    </div>
  );
}

function DiscussionPanel({ entityType, entityId, token, currentUserId, isOwner, isAdmin, isModerator, isMember: isMemberProp, myRoleKey, availableRoles, isTicketManager, isScanner, forumsEnabled, threadPerm, replyPerm, approvalRequired, ME }) {
  const { useState, useEffect, useRef, useCallback } = React;
  
  const [posts, setPosts] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const activeThreadRef = useRef(null);
  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);
  
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [newThreadTag, setNewThreadTag] = useState("");
  const [postingThread, setPostingThread] = useState(false);

  const [sort, setSort] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [threadVotes, setThreadVotes] = useState({});
  const [threadReactions, setThreadReactions] = useState({});
  const [commentVotes, setCommentVotes] = useState({});
  const [replyingToId, setReplyingToId] = useState(null);
  const [inlineReplyDraft, setInlineReplyDraft] = useState("");
  const [submittingInlineReply, setSubmittingInlineReply] = useState(false);
  const [myLikes, setMyLikes] = useState(new Set());

  // Edit state
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostDraft, setEditPostDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");

  const canEdit = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    return diffMs < 5 * 60 * 1000; // 5 minutes
  };

  const apiPathBase = entityType === 'event' ? `/api/events/${entityId}` : `/api/groups/${entityId}`;

  const fetchPosts = useCallback(async (sortArg) => {
    if (!entityId || entityId === "new" || entityId === "newg") return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const params = new URLSearchParams({ page: "1", limit: "50", sort: sortArg || "new" });
      const res = await fetch(`${apiBase}${apiPathBase}/posts?${params}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
        const votes = {};
        const reactions = {};
        data.data.forEach(p => {
          votes[p.id] = { score: p.vote_score || 0, userVote: p.user_vote || 0 };
          reactions[p.id] = p.reactions || {};
        });
        setThreadVotes(votes);
        setThreadReactions(reactions);
      }
    } catch (e) { console.error(e); }
  }, [entityId, token, apiPathBase]);

  useEffect(() => {
    fetchPosts(sort);
  }, [sort, fetchPosts]);

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this discussion?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
      } else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const openThread = async (post) => {
    setActiveThread({ ...post, comments: [] });
    setLoadingThread(true);
    setReplyDraft("");
    setReplyingToId(null);
    setCommentVotes({});
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${post.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setActiveThread(data.data);
        const initCVotes = {};
        const walkComments = (comments) => {
          (comments || []).forEach(c => {
            initCVotes[c.id] = { score: c.vote_score || 0, userVote: c.user_vote || 0 };
            if (c.replies) walkComments(c.replies);
          });
        };
        walkComments(data.data.comments || []);
        setCommentVotes(initCVotes);
        setThreadVotes(prev => ({ ...prev, [data.data.id]: { score: data.data.vote_score || 0, userVote: data.data.user_vote || 0 } }));
        setThreadReactions(prev => ({ ...prev, [data.data.id]: data.data.reactions || {} }));
      }
    } catch (e) { console.error(e); }
    setLoadingThread(false);
  };

  const refreshThreadComments = useCallback(async (threadId) => {
    if (!threadId) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${threadId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setActiveThread(data.data);
        const initCVotes = {};
        const walkComments = (comments) => {
          (comments || []).forEach(c => {
            initCVotes[c.id] = { score: c.vote_score || 0, userVote: c.user_vote || 0 };
            if (c.replies) walkComments(c.replies);
          });
        };
        walkComments(data.data.comments || []);
        setCommentVotes(initCVotes);
        setThreadVotes(prev => ({ ...prev, [data.data.id]: { score: data.data.vote_score || 0, userVote: data.data.user_vote || 0 } }));
        setThreadReactions(prev => ({ ...prev, [data.data.id]: data.data.reactions || {} }));
      }
    } catch (e) { console.error(e); }
  }, [entityId, token, apiPathBase]);

  const refreshThreadCommentsRef = useRef(refreshThreadComments);
  useEffect(() => {
    refreshThreadCommentsRef.current = refreshThreadComments;
  }, [refreshThreadComments]);

  const handleNewThread = async () => {
    if (!newThreadTitle.trim() && !newThreadBody.trim()) return;
    setPostingThread(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ title: newThreadTitle, body: newThreadBody, tags: newThreadTag ? [newThreadTag] : [] })
      });
      const data = await res.json();
      if (data.success) {
        setNewThreadTitle("");
        setNewThreadBody("");
        setNewThreadTag("");
        setShowNewThreadModal(false);
        // If it's pending approval, add it locally so the author can see it with the badge
        if (data.data?.pendingApproval) {
          setPosts(prev => [data.data, ...prev]);
          if (window.toast) window.toast("Thread submitted! Awaiting organizer approval. ⏳", "info");
        } else {
          fetchPosts(sort);
        }
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
    setPostingThread(false);
  };

  const handleApproveThread = async (postId) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}/approve`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        // Move the post from pending (hidden) to active locally and re-fetch
        fetchPosts(sort);
        if (window.toast) window.toast("Thread approved! ✓", "success");
      } else {
        if (window.toast) window.toast(data.message || "Failed to approve", "warning");
      }
    } catch (e) { console.error(e); }
  };

  const handleRejectThread = async (postId) => {
    if (!confirm("Reject (delete) this pending thread?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (window.toast) window.toast("Thread rejected and removed.", "info");
      }
    } catch (e) { console.error(e); }
  };


  const handleSubmitReply = async () => {
    if (!replyDraft.trim() || !activeThread) return;
    setSubmittingReply(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: replyDraft })
      });
      const data = await res.json();
      if (data.success) {
        setReplyDraft("");
        setActiveThread(prev => ({ ...prev, comments: [...(prev.comments || []), data.data] }));
        setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
    setSubmittingReply(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!activeThread || !confirm("Delete this reply?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const removeComment = (comments) => comments.filter(c => c.id !== commentId).map(c => ({ ...c, replies: removeComment(c.replies || []) }));
        setActiveThread(prev => ({ ...prev, comments: removeComment(prev.comments || []) }));
        setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p));
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleVoteThread = async (postId, vote) => {
    const prev = threadVotes[postId] || { score: 0, userVote: 0 };
    setThreadVotes(v => ({ ...v, [postId]: { score: prev.score + (vote - prev.userVote), userVote: vote } }));
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ vote })
      });
      const data = await res.json();
      if (data.success) setThreadVotes(v => ({ ...v, [postId]: { score: data.data.vote_score, userVote: data.data.user_vote } }));
    } catch (e) { console.error(e); }
  };

  const handleVoteComment = async (commentId, vote) => {
    const prev = commentVotes[commentId] || { score: 0, userVote: 0 };
    setCommentVotes(v => ({ ...v, [commentId]: { score: prev.score + (vote - prev.userVote), userVote: vote } }));
    if (!activeThread) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ vote })
      });
      const data = await res.json();
      if (data.success) setCommentVotes(v => ({ ...v, [commentId]: { score: data.data.vote_score, userVote: data.data.user_vote } }));
    } catch (e) { console.error(e); }
  };

  const handleReactThread = async (postId, emoji) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emoji })
      });
      const data = await res.json();
      if (data.success) {
        setThreadReactions(r => ({ ...r, [postId]: data.data.reactions }));
        if (activeThread && activeThread.id === postId) setActiveThread(prev => ({ ...prev, reactions: data.data.reactions }));
      }
    } catch (e) { console.error(e); }
  };

  const handleLikeThread = async (postId) => {
    const isLiked = myLikes.has(postId);
    setMyLikes(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setThreadReactions(r => {
      const prev = r[postId] || {};
      const prevCount = prev['❤️'] || 0;
      return { ...r, [postId]: { ...prev, '❤️': Math.max(0, isLiked ? prevCount - 1 : prevCount + 1) } };
    });
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emoji: '❤️' })
      });
      const data = await res.json();
      if (data.success) {
        setThreadReactions(r => ({ ...r, [postId]: data.data.reactions }));
      }
    } catch (e) {
      setMyLikes(prev => {
        const next = new Set(prev);
        isLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
    }
  };

  const handleSolveThread = async (postId, solved) => {
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${postId}/solve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ solved })
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, solved } : p));
        if (activeThread && activeThread.id === postId) setActiveThread(prev => ({ ...prev, solved }));
      }
    } catch (e) { console.error(e); }
  };

  const handleStartReply = (commentId) => { setReplyingToId(commentId); setInlineReplyDraft(""); };
  const handleCancelReply = () => { setReplyingToId(null); setInlineReplyDraft(""); };

  const handleSubmitInlineReply = async (parentCommentId) => {
    if (!inlineReplyDraft.trim() || !activeThread) return;
    setSubmittingInlineReply(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: inlineReplyDraft, parent_id: parentCommentId })
      });
      const data = await res.json();
      if (data.success) {
        setInlineReplyDraft("");
        setReplyingToId(null);
        const insertReply = (comments, pid, nc) => comments.map(c => c.id === pid ? { ...c, replies: [...(c.replies || []), nc] } : { ...c, replies: insertReply(c.replies || [], pid, nc) });
        setActiveThread(prev => ({ ...prev, comments: insertReply(prev.comments || [], parentCommentId, data.data) }));
        setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      } else { alert(data.message); }
    } catch (e) { console.error(e); }
    setSubmittingInlineReply(false);
  };

  const handleEditPost = async () => {
    if (!editPostDraft.trim() || !editingPostId) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${editingPostId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: editPostDraft, title: activeThread?.title || null })
      });
      const data = await res.json();
      if (data.success) {
        setActiveThread(prev => ({ ...prev, body: editPostDraft }));
        setPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, body: editPostDraft } : p));
        setEditingPostId(null);
        setEditPostDraft("");
      } else { alert(data.message); }
    } catch (e) { console.error(e); }
  };

  const handleEditComment = async (commentId) => {
    if (!editCommentDraft.trim()) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: editCommentDraft })
      });
      const data = await res.json();
      if (data.success) {
        const updateComment = (comments) => comments.map(c => c.id === commentId ? { ...c, body: editCommentDraft } : { ...c, replies: updateComment(c.replies || []) });
        setActiveThread(prev => ({ ...prev, comments: updateComment(prev.comments || []) }));
        setEditingCommentId(null);
        setEditCommentDraft("");
      } else { alert(data.message); }
    } catch (e) { console.error(e); }
  };

  // Socket setup
  useEffect(() => {
    if (!window.io) return;
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = window.io(socketUrl, { transports: ['websocket'] });

    const roomType = entityType === 'event' ? 'join_event' : 'join_group';
    socket.emit(roomType, entityId);

    socket.on('new_thread', () => {
      fetchPosts(sort);
    });

    socket.on('thread_pending_approval', () => {
      // Privileged users refresh feed to see new pending thread
      if (isOwner || isAdmin || isModerator) {
        fetchPosts(sort);
      }
    });

    socket.on('post_approved', () => {
      fetchPosts(sort);
    });

    socket.on('thread_deleted', (data) => {
      fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(null);
        alert("This thread has been deleted.");
      }
    });

    socket.on('thread_edited', (data) => {
      fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('thread_solved', (data) => {
      setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, solved: data.solved } : t));
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, solved: data.solved } : null);
      }
    });

    socket.on('thread_pinned', (data) => {
      setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, pinned: data.pinned } : t));
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, pinned: data.pinned } : null);
      }
    });

    socket.on('thread_locked', (data) => {
      setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, locked: data.locked } : t));
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, locked: data.locked } : null);
      }
    });

    socket.on('thread_voted', (data) => {
      setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, vote_score: data.score } : t));
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setThreadVotes(prev => ({ ...prev, [data.postId]: { ...prev[data.postId], score: data.score } }));
      }
    });

    socket.on('thread_reacted', (data) => {
      setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, reactions: data.reactions } : t));
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setThreadReactions(prev => ({ ...prev, [data.postId]: data.reactions }));
      }
    });

    socket.on('new_comment', (data) => {
      fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('comment_deleted', (data) => {
      fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('comment_voted', (data) => {
      fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('comment_edited', (data) => {
      fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    return () => {
      const leaveType = entityType === 'event' ? 'leave_event' : 'leave_group';
      socket.emit(leaveType, entityId);
      socket.disconnect();
    };
  }, [entityId, sort, fetchPosts]);

  // Permissions check.
  // Groups (home-group.tsx) pass string perms ('everyone' | 'members' | 'selected') derived
  // from g.settings?.forums — that path is untouched below. Events pass an object bucket:
  // either the new dynamic {public, roles: string[]} shape (checked against myRoleKey/
  // availableRoles) or the legacy {owner,admin,moderator,member,public} shape (checked against
  // isOwner/isAdmin/isModerator, unchanged) for events whose settings haven't been re-saved yet.
  // isMemberProp is intentionally NOT AND-gated into canPost/canReply below: hasBucketPerm already
  // fully decides non-owner access (including a bucket explicitly marked public), and requiring
  // membership on top of that would wrongly lock out a genuine non-member when public:true is set —
  // "public means to all" per the Discussion Settings UI, not "all current members".

  const hasBucketPerm = (perm) => {
    if (typeof perm === "string") {
      // Group path — 'selected' without per-member data defaults to owner/admin only, matching
      // the "everyone in forumPermissions" checks done elsewhere in home-group.tsx.
      return perm === "everyone" || perm === "members" || isOwner || isAdmin;
    }
    if (!perm) return false;
    if (Array.isArray(perm.roles)) {
      return !!isTicketManager || perm.public === true || (!!myRoleKey && perm.roles.includes(myRoleKey));
    }
    return !!(
      perm.public ||
      (isOwner && perm.owner) ||
      (isAdmin && perm.admin) ||
      (isModerator && perm.moderator) ||
      ((isTicketManager || isScanner) && perm.moderator)
    );
  };

  const hasThreadPerm = hasBucketPerm(threadPerm);
  const hasReplyPerm = hasBucketPerm(replyPerm);

  const canPost = forumsEnabled && (isOwner || hasThreadPerm);
  const canReply = forumsEnabled && (isOwner || hasReplyPerm);

  const isPrivilegedUser = isOwner || isAdmin || isModerator;
  const filteredPosts = (activeTag
    ? posts.filter(p => (p.tags || []).some(t => t.name === activeTag))
    : posts
  ).filter(p => {
    // Exclude pending (hidden) posts from the main feed — they appear in the Pending Approvals section instead
    // Exception: the author themselves should see their own pending post in the main list with the badge
    if (p.status === 'hidden' && isPrivilegedUser) return false; // Privileged users see them in the pending section only
    if (p.status === 'hidden' && p.author_user_id !== currentUserId) return false; // Others can't see pending from other people
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q);
  });

  const atVotes = activeThread ? (threadVotes[activeThread.id] || {}) : {};
  const atVoteScore = atVotes.score !== undefined ? atVotes.score : (activeThread ? (activeThread.vote_score || 0) : 0);
  const atUserVote = atVotes.userVote !== undefined ? atVotes.userVote : (activeThread ? (activeThread.user_vote || 0) : 0);
  const atReactions = activeThread ? (threadReactions[activeThread.id] || activeThread.reactions || {}) : {};

  return (
    <div>
      {activeThread === null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <SortBar sort={sort} onSort={s => setSort(s)} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative" }}>
                <I.search style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--ink-3)", pointerEvents: "none" }} />
                <input className="cinput" placeholder="Search threads…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 28, width: 170, fontSize: 13 }} />
              </div>
              {canPost && (
                <button className="hbtn hbtn--primary hbtn--sm" onClick={() => setShowNewThreadModal(true)}>
                  <I.plus style={{ width: 14, height: 14 }} /> New Thread
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <button onClick={() => setActiveTag(null)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 12, border: "1px solid var(--border)", background: activeTag === null ? "var(--ink)" : "transparent", color: activeTag === null ? "#fff" : "var(--ink-2)", cursor: "pointer", fontWeight: activeTag === null ? 600 : 400 }}>All</button>
            {ALL_FORUM_TAGS.map(t => {
              const tc = TAG_COLORS[t] || TAG_COLORS.General;
              const isActive = activeTag === t;
              return (
                <button key={t} onClick={() => setActiveTag(isActive ? null : t)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 12, border: `1px solid ${isActive ? tc.color : 'var(--border)'}`, background: isActive ? tc.bg : "transparent", color: isActive ? tc.color : "var(--ink-2)", cursor: "pointer", fontWeight: isActive ? 700 : 400 }}>{t}</button>
              );
            })}
          </div>

          {/* Pending Approvals section — visible to owners/admins/moderators */}
          {(isOwner || isAdmin || isModerator) && (() => {
            const pendingPosts = posts.filter(p => p.status === 'hidden');
            if (pendingPosts.length === 0) return null;
            return (
              <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)", border: "1px solid #fde68a", borderRadius: "var(--r-md)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14, color: "#92400e" }}>
                  <span>⏳</span>
                  <span>Pending Thread Approvals ({pendingPosts.length})</span>
                </div>
                {pendingPosts.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#fff", borderRadius: 8, border: "1px solid #fde68a", padding: "10px 12px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: "var(--ink)", marginBottom: 2 }}>{p.title || p.body?.slice(0, 80) || 'Untitled'}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>by {p.author_name || 'Unknown'} · {getRelativeTime(p.created_at)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button className="hbtn hbtn--primary hbtn--sm" style={{ fontSize: 12 }} onClick={() => handleApproveThread(p.id)}>✓ Approve</button>
                      <button className="hbtn hbtn--ghost hbtn--sm" style={{ fontSize: 12, color: "#e74c3c" }} onClick={() => handleRejectThread(p.id)}>✗ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {!forumsEnabled && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-2)" }}>
              <I.lock style={{ width: 18, height: 18, opacity: 0.5 }} />
              <span style={{ fontSize: 14 }}>The discussion forum is disabled for this scope.</span>
            </div>
          )}
          {!canPost && forumsEnabled && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)" }}>
              <I.lock style={{ width: 16, height: 16, opacity: 0.5 }} />
              <span style={{ fontSize: 13 }}>Only selected roles can create new threads.</span>
            </div>
          )}
          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
              <I.comment style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
              <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No threads {activeTag || searchQuery ? "found" : "yet"}.</h4>
              <p style={{ margin: 0 }}>{activeTag || searchQuery ? "Try a different filter or search." : canPost ? "Start the first discussion." : "No discussions yet."}</p>
            </div>
          ) : (
            filteredPosts.map(p => (
              <ThreadCard key={p.id} p={p} onOpen={openThread} voteData={threadVotes[p.id]} onVote={handleVoteThread} reactions={threadReactions[p.id]} onReact={handleReactThread} isLiked={myLikes.has(p.id)} onLike={handleLikeThread} currentUserId={currentUserId} isPrivileged={isOwner || isAdmin || isModerator} onApprove={handleApproveThread} onReject={handleRejectThread} />
            ))
          )}
        </div>
      )}

      {activeThread !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button className="hbtn hbtn--ghost hbtn--sm" style={{ alignSelf: "flex-start" }} onClick={() => { setActiveThread(null); setReplyDraft(""); setReplyingToId(null); }}>
            <I.arrowL style={{ width: 14, height: 14 }} /> Back to Discussions
          </button>

          <div className={`post ${activeThread.pinned ? "pinned" : ""}`}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <VoteWidget
                score={atVoteScore}
                userVote={atUserVote}
                onUpvote={() => handleVoteThread(activeThread.id, atUserVote === 1 ? 0 : 1)}
                onDownvote={() => handleVoteThread(activeThread.id, atUserVote === -1 ? 0 : -1)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {activeThread.pinned && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-2)", display: "flex", alignItems: "center", gap: 3 }}><I.bookmarkF style={{ width: 10, height: 10 }} />Pinned</span>}
                  {activeThread.locked && <span style={{ fontSize: 11, fontWeight: 600, color: "#e74c3c", display: "flex", alignItems: "center", gap: 3 }}><I.lock style={{ width: 10, height: 10 }} />Locked</span>}
                  {activeThread.solved && <span style={{ fontSize: 11, fontWeight: 700, color: "#1a7f37", background: "#e6ffed", borderRadius: 8, padding: "1px 7px" }}>✓ Solved</span>}
                  {(activeThread.tags || []).map(t => <TagPill key={t.id || t.name} tag={t.name} />)}
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
                      <button className="hbtn hbtn--primary hbtn--sm" onClick={handleEditPost}>Save</button>
                    </div>
                  </div>
                ) : (
                  activeThread.body && <div className="pbody" style={{ marginBottom: 12 }}>{activeThread.body}</div>
                )}
                <EmojiBar counts={atReactions} onReact={emoji => handleReactThread(activeThread.id, emoji)} />
                {isOwner && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    <button className="hbtn hbtn--ghost hbtn--sm" onClick={async () => {
                      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                      const r = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/pin`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ pinned: !activeThread.pinned }) });
                      const d = await r.json();
                      if (d.success) { setActiveThread(prev => ({ ...prev, pinned: !prev.pinned })); setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, pinned: !p.pinned } : p)); }
                    }}>{activeThread.pinned ? "Unpin" : "Pin"}</button>
                    <button className="hbtn hbtn--ghost hbtn--sm" onClick={async () => {
                      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                      const r = await fetch(`${apiBase}${apiPathBase}/posts/${activeThread.id}/lock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ locked: !activeThread.locked }) });
                      const d = await r.json();
                      if (d.success) { setActiveThread(prev => ({ ...prev, locked: !prev.locked })); setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, locked: !p.locked } : p)); }
                    }}>{activeThread.locked ? "Unlock" : "Lock"}</button>
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: activeThread.solved ? "var(--ink-2)" : "#1a7f37" }} onClick={() => handleSolveThread(activeThread.id, !activeThread.solved)}>
                      {activeThread.solved ? "Unmark Solved" : "✓ Mark Solved"}
                    </button>
                  </div>
                )}
                {(isOwner || activeThread.author_user_id === currentUserId) && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                    {canEdit(activeThread.created_at) && activeThread.author_user_id === currentUserId && (
                      <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { setEditingPostId(activeThread.id); setEditPostDraft(activeThread.body); }}>
                        <I.edit style={{ width: 13, height: 13 }} /> Edit thread
                      </button>
                    )}
                    <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "#e74c3c" }} title="Delete thread" onClick={() => { if (!confirm("Delete this thread and all replies?")) return; handleDeletePost(activeThread.id); setActiveThread(null); }}>
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

          {!loadingThread && (activeThread.comments || []).map(c => (
            <div key={c.id} style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
              <CommentItem c={c} depth={0} canReply={canReply && !activeThread.locked} isOwner={isOwner} currentUserId={currentUserId} replyingToId={replyingToId} inlineReplyDraft={inlineReplyDraft} submittingInlineReply={submittingInlineReply} commentVotes={commentVotes} onVote={handleVoteComment} onDelete={handleDeleteComment} onStartReply={handleStartReply} onCancelReply={handleCancelReply} onInlineReplyChange={setInlineReplyDraft} onSubmitInlineReply={handleSubmitInlineReply} canEdit={canEdit} editingCommentId={editingCommentId} editCommentDraft={editCommentDraft} onEditStart={(c) => { setEditingCommentId(c.id); setEditCommentDraft(c.body); }} onEditCancel={() => { setEditingCommentId(null); setEditCommentDraft(""); }} onEditChange={v => setEditCommentDraft(v)} onEditSubmit={handleEditComment} />
            </div>
          ))}

          {canReply && !activeThread.locked && (
            <div className="composer">
              <Avatar name={ME.name} img={ME.img} size={36} />
              <div className="ci">
                <textarea placeholder="Write a reply…" value={replyDraft} onChange={e => setReplyDraft(e.target.value)} rows={replyDraft ? 3 : 1} />
                <div className="cbar">
                  <button className="hbtn hbtn--primary hbtn--sm" style={{ marginLeft: "auto" }} disabled={!replyDraft.trim() || submittingReply} onClick={handleSubmitReply}>
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
          {!canReply && !activeThread.locked && forumsEnabled && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)" }}>
              <I.lock style={{ width: 16, height: 16, opacity: 0.6 }} />
              <span style={{ fontSize: 13 }}>Only selected roles can reply here.</span>
            </div>
          )}
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThreadModal && (
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
      )}
    </div>
  );
}

export default DiscussionPanel;
