// @ts-nocheck
/* ============================================================
   Samaagum Home — Group detail (forum, events, members, gallery)
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
  const [showPicker, setShowPicker] = useState(false);
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
              <button key={e} onClick={ev => { ev.stopPropagation(); onReact(e); setShowPicker(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}>{e}</button>
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

function ThreadCard({ p, onOpen, voteData, onVote, reactions, onReact, isLiked, onLike }) {
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
  return (
    <div className={`post ${p.pinned ? "pinned" : ""}`} style={{ display: "flex", gap: 12, cursor: "pointer" }} onClick={() => onOpen(p)}>
      <div onClick={e => e.stopPropagation()}>
        <VoteWidget score={score} userVote={userVote} onUpvote={() => onVote(p.id, userVote === 1 ? 0 : 1)} onDownvote={() => onVote(p.id, userVote === -1 ? 0 : -1)} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
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
          <Avatar name={authorName} size={18} />
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
      <Avatar name={c.author_name || "Unknown"} size={28} />
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

function GroupDetail({ group, st, go }) {
  const [fullGroup, setFullGroup] = useState(null);
  const g = fullGroup || group || GROUPS[0];
  const [membershipState, setMembershipState] = useState(null);
  const isJoined = membershipState === 'active';
  const isPending = membershipState === 'pending';
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState("");
  const [tab, setTab] = useState("discussion");
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState([]);
  const [posting, setPosting] = useState(false);

  const [showQModal, setShowQModal] = useState(false);
  const [answers, setAnswers] = useState({});
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
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

  const token = localStorage.getItem('token');
  let currentUserId = null;
  if (token) {
    try { currentUserId = JSON.parse(atob(token.split('.')[1])).id; } catch (e) { }
  }

  const fetchPosts = React.useCallback(async (sortArg) => {
    if (!g.id || g.id === "newg") return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const params = new URLSearchParams({ page: "1", limit: "50", sort: sortArg || "new" });
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts?${params}`, {
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
  }, [g.id]);

  React.useEffect(() => {
    if (tab === "discussion") fetchPosts(sort);
  }, [tab, sort, fetchPosts]);

  const handlePost = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ body: draft })
      });
      const data = await res.json();
      if (data.success) {
        setDraft("");
        fetchPosts();
      } else alert(data.message);
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Delete this discussion?")) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}`, {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${post.id}`, {
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

  const handleNewThread = async () => {
    if (!newThreadTitle.trim() && !newThreadBody.trim()) return;
    setPostingThread(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts`, {
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
        fetchPosts(sort);
      } else {
        alert(data.message);
      }
    } catch (e) { console.error(e); }
    setPostingThread(false);
  };

  const handleSubmitReply = async () => {
    if (!replyDraft.trim() || !activeThread) return;
    setSubmittingReply(true);
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments/${commentId}`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/vote`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments/${commentId}/vote`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/react`, {
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
    // Optimistic update
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emoji: '❤️' })
      });
      const data = await res.json();
      if (data.success) {
        setThreadReactions(r => ({ ...r, [postId]: data.data.reactions }));
      }
    } catch (e) {
      // Revert optimistic update on error
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${postId}/solve`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${editingPostId}`, {
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
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/comments/${commentId}`, {
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

  const tabs = [
    ["discussion", "Discussion"],
    ["events", "Events"],
    ["members", "Members"],
    ["gallery", "Gallery"]
  ];
  const [members, setMembers] = useState(g.memberNames || []);
  const [isOwner, setIsOwner] = useState(ME.name === g.owner);
  const [joinRequests, setJoinRequests] = useState([]);
  const [newJoinRequestNotif, setNewJoinRequestNotif] = useState(false);
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // Forum management state
  const [forumMembers, setForumMembers] = useState([]);
  const [forumMemberSearch, setForumMemberSearch] = useState("");
  const [forumMemberSearchResults, setForumMemberSearchResults] = useState([]);
  const [forumMgmtSearching, setForumMgmtSearching] = useState(false);

  const fetchForumMembers = React.useCallback(async () => {
    if (!g.id || g.id === "newg") return;
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/forum-members`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) setForumMembers(data.data);
    } catch (e) { console.error(e); }
  }, [g.id]);

  const handleForumMemberSearch = async (q) => {
    setForumMemberSearch(q);
    if (!q.trim()) { setForumMemberSearchResults([]); return; }
    setForumMgmtSearching(true);
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/members`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        const filtered = (data.data || []).filter(m =>
          (m.name || m.email || "").toLowerCase().includes(q.toLowerCase()) && m.state === 'active'
        );
        setForumMemberSearchResults(filtered);
      }
    } catch (e) { console.error(e); }
    setForumMgmtSearching(false);
  };

  const handleGrantForumPerm = async (userId, permType) => {
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/forum-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}) },
        body: JSON.stringify({ user_id: userId, perm_type: permType })
      });
      const data = await res.json();
      if (data.success) fetchForumMembers();
      else alert(data.message);
    } catch (e) { console.error(e); }
  };

  const handleRevokeForumPerm = async (userId, permType) => {
    try {
      const tkn = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      await fetch(`${apiBase}/api/groups/${g.id}/forum-members/${userId}/${permType}`, {
        method: 'DELETE',
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      fetchForumMembers();
    } catch (e) { console.error(e); }
  };

  const fetchInvites = React.useCallback(async () => {
    if (!g.id || g.id === "newg" || !isOwner) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setInvites(data.data);
      }
    } catch (e) { console.error(e); }
  }, [g.id, isOwner]);

  const fetchJoinRequests = React.useCallback(async () => {
    if (!g.id || g.id === "newg" || !isOwner) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/members?state=pending`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setJoinRequests(data.data.map(m => ({
          id: m.user_id,
          user: { name: m.users?.display_name || "Unknown User", role: "member" },
          date: new Date(m.joined_at || m.created_at).toLocaleDateString(),
          status: "pending"
        })));
      }
    } catch (e) { console.error(e); }
  }, [g.id, isOwner]);

  React.useEffect(() => {
    if (tab === "invites") fetchInvites();
    if (tab === "requests") fetchJoinRequests();
    if (tab === "forum-mgmt") fetchForumMembers();
  }, [tab, fetchInvites, fetchJoinRequests, fetchForumMembers]);

  const fetchGroupDetails = React.useCallback(async () => {
    if (!g.id || g.id === "newg") return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

      const groupRes = await fetch(`${apiBase}/api/groups/${g.id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const groupData = await groupRes.json();
      if (groupData.success) {
        setFullGroup(groupData.data);
        setMembershipState(groupData.data.membershipState);
        setIsOwner(groupData.data.isOwner);
        if (groupData.data.members) {
          setMembers(groupData.data.members);
        }
      } else if (groupRes.status === 403) {
        setAccessDenied(true);
        setAccessDeniedMsg(groupData.message || "You do not have access to view this group.");
      }
    } catch (e) {
      console.error("Failed to fetch group details:", e);
    }
  }, [g.id]);

  React.useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  const handleJoinClick = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert("Please log in to join groups.");

      if (g.settings && g.settings.questionnaires && g.settings.questionnaires.length > 0) {
        setShowQModal(true);
        return;
      }

      await submitJoinRequest({});
    } catch (e) {
      console.error(e);
    }
  };

  const submitJoinRequest = async (submissionAnswers) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: submissionAnswers })
      });
      const data = await res.json();
      if (data.success) {
        setMembershipState(data.data.state);
        setShowQModal(false);
        if (data.data.state === 'active') {
          fetchGroupDetails();
        }
      } else {
        alert(data.message || "Failed to join");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [dashboardStats, setDashboardStats] = useState({
    totalPosts: 0,
    pinnedPosts: 0,
    lockedPosts: 0,
    reportedPosts: 0,
    activeMembers: 0,
    pendingMembers: 0
  });

  React.useEffect(() => {
    if (!g.id || g.id === "newg") return;

    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";

    const fetchStats = async () => {
      if (!isOwner) return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiBase}/api/groups/${g.id}/dashboard-stats`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success) {
          setDashboardStats(data.data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchStats();

    if (!window.io) return;
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = window.io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.emit('join_group', g.id);

    socket.on('dashboard_updated', () => {
      fetchGroupDetails();
      fetchStats();
    });

    socket.on('new_join_request', () => {
      fetchStats();
      setNewJoinRequestNotif(true);
    });

    socket.on('new_thread', () => {
      if (tab === 'discussion') fetchPosts(sort);
    });

    socket.on('thread_deleted', () => {
      if (tab === 'discussion') fetchPosts(sort);
    });

    socket.on('thread_voted', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, vote_score: data.score } : t));
      }
    });

    socket.on('thread_reacted', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, reactions: data.reactions } : t));
      }
    });

    socket.on('new_comment', () => {
      if (tab === 'discussion') fetchPosts(sort);
    });

    socket.on('comment_deleted', () => {
      if (tab === 'discussion') fetchPosts(sort);
    });

    socket.on('comment_voted', () => {
      if (tab === 'discussion') fetchPosts(sort);
    });

    socket.on('gallery_updated', () => {
      if (tab === 'gallery') {
        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
        const tkn = localStorage.getItem('token');
        fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
          headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
        }).then(r => r.json()).then(d => { if (d.success) setGalleryItems(d.data); }).catch(console.error);
      }
    });

    return () => {
      socket.emit('leave_group', g.id);
      socket.disconnect();
    };
  }, [g.id, isOwner, tab, sort, fetchPosts]);

  if (isOwner) {
    if (g.joinMode === 'invite_only' && !tabs.find(t => t[0] === 'invites')) {
      tabs.push(["invites", "Invites"]);
    }
    const forumsEnabled = !g.settings?.forums || g.settings.forums.enabled !== false;
    const threadPerm = g.settings?.forums?.threadPerm || 'everyone';
    const replyPerm = g.settings?.forums?.replyPerm || 'everyone';
    if (forumsEnabled && (threadPerm === 'selected' || replyPerm === 'selected') && !tabs.find(t => t[0] === 'forum-mgmt')) {
      tabs.push(["forum-mgmt", "Forum Management"]);
    }
    if (!tabs.find(t => t[0] === 'dashboard')) {
      tabs.push(["dashboard", "Dashboard"]);
    }
  }

  const handleRequestAction = async (userId, action) => {
    if (action === "approve" || action === "decline") {
      try {
        const token = localStorage.getItem('token');
        const endpoint = action === "approve" ? "approve" : "reject";
        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
        const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${userId}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: "{}"
        });
        const data = await res.json();
        if (data.success) {
          if (action === "approve") {
            setJoinRequests(prev => prev.map(r => r.id === userId ? { ...r, status: "approved" } : r));
            // Let's refetch members to update the list
            const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
            fetch(`${apiBase}/api/groups/${g.id}/members`).then(r => r.json()).then(data => {
              if (data.success) {
                const all = data.data;
                setMembers(all.filter(m => m.state === 'active').map(m => ({
                  id: m.user_id,
                  name: m.users?.display_name || 'Unknown User',
                  role: m.roles.includes('group_owner') ? 'owner' : m.roles.includes('group_admin') ? 'admin' : m.roles.includes('group_moderator') ? 'moderator' : 'member'
                })));
              }
            });
          } else {
            setJoinRequests(prev => prev.filter(r => r.id !== userId));
          }
        } else {
          alert(data.message || "Failed to process request");
        }
      } catch (e) {
        console.error(e);
      }
    } else if (action === "message") {
      alert("Opening direct chat with user...");
    }
  };

  const gEvents = EVENTS.filter(e => e.cat === g.cat).slice(0, 3);

  const forumsEnabled = !g.settings?.forums || g.settings.forums.enabled !== false;
  const threadPerm = g.settings?.forums?.threadPerm || "everyone";
  const replyPerm = g.settings?.forums?.replyPerm || "everyone";
  const isMember = isOwner || isJoined;
  const canPost = forumsEnabled && isMember && (isOwner || threadPerm === "everyone" || threadPerm === "members");
  const canReply = forumsEnabled && isMember && (isOwner || replyPerm === "everyone" || replyPerm === "members");

  const filteredPosts = (activeTag
    ? posts.filter(p => (p.tags || []).some(t => t.name === activeTag))
    : posts
  ).filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.body || '').toLowerCase().includes(q);
  });

  const atVotes = activeThread ? (threadVotes[activeThread.id] || {}) : {};
  const atVoteScore = atVotes.score !== undefined ? atVotes.score : (activeThread ? (activeThread.vote_score || 0) : 0);
  const atUserVote = atVotes.userVote !== undefined ? atVotes.userVote : (activeThread ? (activeThread.user_vote || 0) : 0);
  const atReactions = activeThread ? (threadReactions[activeThread.id] || activeThread.reactions || {}) : {};

  const gallerySettings = g.settings?.gallery || {};
  const galleryEnabled = gallerySettings.enabled !== false;
  const canUpload = galleryEnabled && (isOwner || (isJoined && gallerySettings.allow !== false));
  const galleryMediaType = gallerySettings.imageOnly ? "Images only" : gallerySettings.videoOnly ? "Videos only" : "Images & videos";
  const galleryNeedsApproval = gallerySettings.approve === true;
  const galleryAcceptTypes = gallerySettings.videoOnly ? "video/*" : gallerySettings.imageOnly ? "image/*" : "image/*,video/*";

  const fetchGallery = React.useCallback(async () => {
    if (!g.id || g.id === "newg") return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      });
      const data = await res.json();
      if (data.success) setGalleryItems(data.data);
    } catch (e) { console.error(e); }
  }, [g.id]);

  React.useEffect(() => {
    if (tab === "gallery") fetchGallery();
  }, [tab, fetchGallery]);

  const handleGalleryUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setGalleryUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      const uploadRes = await fetch(`${apiBase}/api/upload-group-media`, {
        method: 'POST',
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {},
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) { alert(uploadData.message || "Upload failed"); return; }
      const isVideo = file.type.startsWith('video/');
      const saveRes = await fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}) },
        body: JSON.stringify({ url: uploadData.imageUrl, type: isVideo ? 'video' : 'image', needsApproval: galleryNeedsApproval })
      });
      const saveData = await saveRes.json();
      if (saveData.success) {
        setGalleryItems(prev => [saveData.data, ...prev]);
      } else {
        alert(saveData.message || "Failed to save to gallery");
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  };

  const _gdApiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const _resolveUrl = (u) => u && !u.startsWith('blob:') ? (u.startsWith('/api/') ? _gdApiBase + u : u) : null;
  const bannerSrc = _resolveUrl(g.banner);
  const iconSrc = _resolveUrl(g.icon);
  const isCustomIcon = iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/"));
  const capacityFull = g.settings && g.settings.capacity && g.settings.capacity.limit === true && g.settings.capacity.max > 0 && members.length >= g.settings.capacity.max;
  const hasWaitlist = capacityFull && g.settings && g.settings.capacity && g.settings.capacity.waitlist === true;

  if (accessDenied) {
    return (
      <div className="scroll">
        <div className="view-enter" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", maxWidth: 420, padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 22 }}>Access Restricted</h2>
            <p style={{ color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 24px 0" }}>{accessDeniedMsg}</p>
            <button className="hbtn hbtn--soft" onClick={() => go("discover")}>Back to Discover</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div className="view-enter">
        <div className="detail-cover" style={{
          height: 200,
          backgroundSize: "cover",
          backgroundPosition: "center",
          ...(bannerSrc ? { backgroundImage: 'url("' + bannerSrc + '")' } : { background: g.cover })
        }}>
          {!bannerSrc && <Grain />}
          <div className="scrim" />
          <button className="detail-back" onClick={() => go("home")}><I.arrowL />Back</button>
        </div>
        <div className="grp-detail">
          <div className="grp-head">
            <div className="gicon-lg" style={{ background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {isCustomIcon ? (
                <img src={iconSrc} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              ) : g.icon}
            </div>
            <div className="gh-meta">
              <div className="nm">{g.name} {g.visibility === "private" && <I.lock style={{ width: 18, height: 18, color: "var(--ink-3)", marginLeft: 6 }} title="Private" />}</div>
              <div className="sub">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.users /> {members.length.toLocaleString()} members</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1f9d57", fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bb673" }} />{g.online || 1} online</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.comment /> {g.posts || 0} posts</span>
                <span className="fchip on" style={{ pointerEvents: "none", padding: "4px 11px", fontSize: 12 }}>{g.cat || "Community"}</span>
              </div>
            </div>
            <div className="gh-act">
              <button className="hbtn hbtn--ghost hbtn--sm"><I.share /></button>
              {isOwner ? (
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
              ) : capacityFull && !hasWaitlist ? (
                <button className="hbtn hbtn--sm hbtn--ghost" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
                  <I.users style={{ width: 14, height: 14 }} /> Group is Full
                </button>
              ) : (
                <button className={`hbtn hbtn--sm ${isJoined || isPending ? "hbtn--ghost" : "hbtn--primary"}`} onClick={handleJoinClick}>
                  {isPending ? <><I.clock />Requested</> : isJoined ? <><I.check />Joined</> : capacityFull ? <><I.users style={{ width: 14, height: 14 }} />Join Waitlist</> : <><I.plus />Join group</>}
                </button>
              )}
            </div>
          </div>

          <div className="grp-tabs">
            {tabs.map(([k, l]) => (
              <button key={k} className={`grp-tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); if (k === "dashboard") setNewJoinRequestNotif(false); }}>
                {l}
                {k === "members" && isOwner && g.joinMode === "approval" && dashboardStats.pendingMembers > 0 && (
                  <span className="qs-badge" style={{ marginLeft: 6, background: "var(--accent-2)", color: "white", padding: "2px 6px", fontSize: 11 }}>
                    {dashboardStats.pendingMembers}
                  </span>
                )}
                {k === "dashboard" && newJoinRequestNotif && (
                  <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
                )}
              </button>
            ))}
          </div>

          <div className="grp-cols">
            <div style={{ minWidth: 0 }}>
              {tab === "discussion" && activeThread === null && (
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
                  {!forumsEnabled && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-2)" }}>
                      <I.lock style={{ width: 18, height: 18, opacity: 0.5 }} />
                      <span style={{ fontSize: 14 }}>The discussion forum is disabled for this group.</span>
                    </div>
                  )}
                  {!canPost && forumsEnabled && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)" }}>
                      <I.lock style={{ width: 16, height: 16, opacity: 0.5 }} />
                      <span style={{ fontSize: 13 }}>Only {threadPerm === "admins" ? "moderators and admins" : "selected members"} can create new threads.</span>
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
                      <ThreadCard key={p.id} p={p} onOpen={openThread} voteData={threadVotes[p.id]} onVote={handleVoteThread} reactions={threadReactions[p.id]} onReact={handleReactThread} isLiked={myLikes.has(p.id)} onLike={handleLikeThread} />
                    ))
                  )}
                </div>
              )}
              {tab === "discussion" && activeThread !== null && (
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
                          <Avatar name={activeThread.author_name || "Unknown"} size={22} />
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
                              const r = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/pin`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ pinned: !activeThread.pinned }) });
                              const d = await r.json();
                              if (d.success) { setActiveThread(prev => ({ ...prev, pinned: !prev.pinned })); setPosts(prev => prev.map(p => p.id === activeThread.id ? { ...p, pinned: !p.pinned } : p)); }
                            }}>{activeThread.pinned ? "Unpin" : "Pin"}</button>
                            <button className="hbtn hbtn--ghost hbtn--sm" onClick={async () => {
                              const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                              const r = await fetch(`${apiBase}/api/groups/${g.id}/posts/${activeThread.id}/lock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, body: JSON.stringify({ locked: !activeThread.locked }) });
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
                      <span style={{ fontSize: 13 }}>Only {replyPerm === "admins" ? "moderators and admins" : "selected members"} can reply here.</span>
                    </div>
                  )}
                </div>
              )}
              {tab === "events" && (
                <div className="ev-grid">
                  {gEvents.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)} saved={st.saved.has(ev.id)} onSave={() => st.toggleSave(ev.id)} registered={st.registered.has(ev.id)} />)}
                </div>
              )}
              {tab === "members" && (
                <MemberManagementPanel group={g} st={st} go={go} />
              )}
              {tab === "dashboard" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Moderation Dashboard</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="hbtn hbtn--soft hbtn--sm" onClick={() => go("edit-group", g)}>
                        <I.edit style={{ width: 14 }} /> Edit Group Settings
                      </button>
                      {!g.settings?.isArchived && (
                        <button className="hbtn hbtn--sm" style={{ background: "var(--surface-2)", color: "var(--ink-2)" }} onClick={async () => {
                          if (!confirm("Archive this group? It will be hidden from Discover but visible in your My Groups > Archive.")) return;
                          const _ab = window.location.port === "8080" ? "http://localhost:3000" : "";
                          const _tk = localStorage.getItem('token');
                          const _res = await fetch(`${_ab}/api/groups/${g.id}/archive`, {
                            method: 'POST',
                            headers: _tk ? { 'Authorization': `Bearer ${_tk}` } : {}
                          });
                          const _d = await _res.json();
                          if (_d.success) { go("groups", { tab: "created", createdSub: "archive" }); } else { alert(_d.message || "Failed to archive"); }
                        }}>
                          Archive Group
                        </button>
                      )}
                      {g.settings?.isArchived && (
                        <button className="hbtn hbtn--sm hbtn--soft" onClick={async () => {
                          const _ab = window.location.port === "8080" ? "http://localhost:3000" : "";
                          const _tk = localStorage.getItem('token');
                          const _res = await fetch(`${_ab}/api/groups/${g.id}/unarchive`, {
                            method: 'POST',
                            headers: _tk ? { 'Authorization': `Bearer ${_tk}` } : {}
                          });
                          const _d = await _res.json();
                          if (_d.success) { go("groups", { tab: "created", createdSub: "active" }); } else { alert(_d.message || "Failed to unarchive"); }
                        }}>
                          Unarchive Group
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="side-card" style={{ padding: 16 }}>
                      <div style={{ color: "var(--ink-2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>Total Posts</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.totalPosts}</div>
                    </div>
                    <div className="side-card" style={{ padding: 16 }}>
                      <div style={{ color: "var(--ink-2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>Active Members</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{dashboardStats.activeMembers}</div>
                    </div>
                    <div className="side-card" style={{ padding: 16 }}>
                      <div style={{ color: "var(--ink-2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>Reported Posts</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: dashboardStats.reportedPosts > 0 ? "var(--red)" : "inherit" }}>{dashboardStats.reportedPosts}</div>
                    </div>
                    {g.joinMode === 'approval' && (
                      <div className="side-card" style={{ padding: 16 }}>
                        <div style={{ color: "var(--ink-2)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>Pending Join Requests</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: dashboardStats.pendingMembers > 0 ? "var(--accent-2)" : "inherit" }}>{dashboardStats.pendingMembers}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {tab === "invites" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Invitations</h3>
                  <div className="form-card" style={{ padding: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Send Invite via Email</h4>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input className="cinput" placeholder="email@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                          <button className="hbtn hbtn--primary" onClick={async () => {
                            if (!inviteEmail) return;
                            const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                            const token = localStorage.getItem('token');
                            let senderEmail = "";
                            try { senderEmail = JSON.parse(atob(token.split('.')[1])).email || ""; } catch (e) { }
                            const res = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                              body: JSON.stringify({ targets: [{ email: inviteEmail }] })
                            });
                            const data = await res.json();
                            if (data.success && data.data[0]?.success) {
                              const tkn = data.data[0].token;
                              const inviteLink = `${window.location.origin}${window.location.pathname}#/groups/invite/${tkn}`;
                              const subject = encodeURIComponent(`You're invited to join ${g.name} on Samaagum`);
                              const body = encodeURIComponent(`Hi!\n\n${senderEmail || "Someone"} has invited you to join "${g.name}" on Samaagum.\n\nClick the link below to accept:\n${inviteLink}\n\nThis link is for your use only.`);
                              window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`);
                              setInviteEmail("");
                              fetchInvites();
                            } else {
                              alert((data.data?.[0]?.message) || data.message || "Failed to send invite");
                            }
                          }}>Send</button>
                        </div>
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Generate Shareable Link</h4>
                        {inviteLink ? (
                          <div style={{ display: "flex", gap: 8 }}>
                            <input className="cinput" readOnly value={inviteLink} />
                            <button className="hbtn hbtn--soft" onClick={() => { navigator.clipboard.writeText(inviteLink); alert("Copied!"); }}>Copy</button>
                          </div>
                        ) : (
                          <button className="hbtn hbtn--soft" onClick={async () => {
                            const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${apiBase}/api/groups/${g.id}/invites/link`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                              body: JSON.stringify({ maxUses: null })
                            });
                            const data = await res.json();
                            if (data.success && data.data.token) {
                              setInviteLink(`${window.location.origin}${window.location.pathname}#/groups/invite/${data.data.token}`);
                              fetchInvites();
                            } else alert(data.message);
                          }}>Generate Link</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {invites.map(inv => (
                      <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{inv.email || inv.username || 'Shareable Link'}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                            {inv.status === 'pending' ? 'Pending' : inv.status === 'accepted' ? 'Accepted' : 'Revoked'} • {inv.link_type === 'single_use' ? 'Single Use' : 'Multi Use'}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {inv.status === 'pending' && inv.link_type !== 'single_use' && (
                            <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#/groups/invite/${inv.token}`); alert("Copied!"); }}>Copy Link</button>
                          )}
                          {inv.status === 'pending' && (
                            <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "var(--red)" }} onClick={async () => {
                              const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                              const token = localStorage.getItem('token');
                              await fetch(`${apiBase}/api/groups/${g.id}/invites/${inv.id}`, {
                                method: 'DELETE',
                                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                              });
                              fetchInvites();
                            }}>Revoke</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === "forum-mgmt" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Forum Management</h3>
                  <div className="form-card" style={{ padding: 20 }}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Add Member Permission</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input className="cinput" placeholder="Search members..." value={forumMemberSearch} onChange={e => handleForumMemberSearch(e.target.value)} />
                      </div>
                      {forumMemberSearchResults.length > 0 && (
                        <div style={{ marginTop: 8, border: "1px solid var(--border)", borderRadius: "var(--r-sm)", maxHeight: 200, overflowY: "auto" }}>
                          {forumMemberSearchResults.map(m => (
                            <div key={m.user_id} style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-2)" }}>
                              <span style={{ fontSize: 13 }}>{m.name || m.email}</span>
                              <div style={{ display: "flex", gap: 4 }}>
                                {(g.settings?.forums?.threadPerm === 'selected') && (
                                  <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleGrantForumPerm(m.user_id, 'create_thread')}>
                                    + Thread
                                  </button>
                                )}
                                {(g.settings?.forums?.replyPerm === 'selected') && (
                                  <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleGrantForumPerm(m.user_id, 'reply_thread')}>
                                    + Reply
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Members with Permissions</h4>
                    {forumMembers.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-sm)", border: "1px dashed var(--border)" }}>
                        No members have forum permissions yet.
                      </div>
                    ) : (
                      forumMembers.map(fm => (
                        <div key={fm.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{fm.name}</div>
                            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
                              {fm.perm_type === 'create_thread' ? 'Can create threads' : 'Can reply to threads'}
                            </div>
                          </div>
                          <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: "var(--red)" }} onClick={() => handleRevokeForumPerm(fm.user_id, fm.perm_type)}>
                            Revoke
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {tab === "gallery" && !galleryEnabled && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
                  <I.image style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                  <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>Gallery is disabled</h4>
                  <p style={{ margin: 0 }}>The group owner has not enabled the media gallery for this group.</p>
                </div>
              )}
              {tab === "gallery" && galleryEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: 17, fontWeight: 600 }}>Media Gallery</h3>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                        {galleryMediaType}{galleryNeedsApproval ? " · Uploads require approval" : ""}
                      </div>
                    </div>
                    {canUpload && (
                      <label className="hbtn hbtn--soft hbtn--sm" style={{ cursor: "pointer" }}>
                        {galleryUploading ? "Uploading..." : <><I.plus style={{ width: 14 }} /> Add Media</>}
                        <input type="file" accept={galleryAcceptTypes} style={{ display: "none" }} disabled={galleryUploading} onChange={handleGalleryUpload} />
                      </label>
                    )}
                  </div>
                  {galleryItems.filter(item => isOwner || item.status === 'approved').length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
                      <I.image style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                      <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No media yet</h4>
                      <p style={{ margin: 0 }}>{canUpload ? "Be the first to share a photo or video." : "The group has no media uploads yet."}</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                      {galleryItems.filter(item => isOwner || item.status === 'approved').map(item => (
                        <div key={item.id} style={{ position: "relative", borderRadius: "var(--r-sm)", overflow: "hidden", aspectRatio: "1", background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                          {item.type === 'video' ? (
                            <video src={item.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted onClick={e => e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()} />
                          ) : (
                            <img src={item.src} alt="gallery" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                          {item.status === 'pending' && (
                            <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.65)", color: "#fff", borderRadius: 4, fontSize: 10, padding: "2px 6px", fontWeight: 600 }}>
                              Pending
                            </div>
                          )}
                          {(isOwner || item.user_id === currentUserId) && (
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 4, padding: 6 }}>
                              {isOwner && item.status === 'pending' && (
                                <button className="hbtn hbtn--primary hbtn--sm" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={async () => {
                                  const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                                  const tkn = localStorage.getItem('token');
                                  const res = await fetch(`${apiBase}/api/groups/${g.id}/gallery/${item.id}/approve`, { method: 'PATCH', headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {} });
                                  if ((await res.json()).success) setGalleryItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'approved' } : i));
                                }}>Approve</button>
                              )}
                              <button className="hbtn hbtn--ghost hbtn--sm" style={{ flex: 1, justifyContent: "center", fontSize: 11, color: "var(--red)" }} onClick={async () => {
                                if (!confirm("Delete this media?")) return;
                                const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
                                const tkn = localStorage.getItem('token');
                                const res = await fetch(`${apiBase}/api/groups/${g.id}/gallery/${item.id}`, { method: 'DELETE', headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {} });
                                if ((await res.json()).success) setGalleryItems(prev => prev.filter(i => i.id !== item.id));
                              }}>{item.status === 'pending' ? 'Remove' : 'Delete'}</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="side-card">
                <h4>About</h4>
                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>{g.description || g.desc}</p>
                <div style={{ marginTop: 12 }}>
                  <div className="side-stat"><span className="k">Members</span><span className="v">{members.length.toLocaleString()}</span></div>
                  <div className="side-stat"><span className="k">Posts</span><span className="v">{g.posts || 0}</span></div>
                  <div className="side-stat"><span className="k">Join policy</span><span className="v">{g.joinMode === 'open' ? 'Anyone can join' : g.joinMode === 'invite_only' ? 'Invite only' : 'Approval required'}</span></div>
                </div>
              </div>
              <div className="side-card">
                <h4>Top members</h4>
                {members.slice(0, 5).map((m, i) => {
                  const mName = typeof m === 'object' ? (m.users?.display_name || m.name || m) : m;
                  const mUsername = typeof m === 'object' ? `@${m.users?.username || m.username || 'unknown'}` : '';
                  const targetRole = typeof m === 'object' && m.roles ? getHighestRole(m.roles) : (i === 0 ? "group_owner" : i < 3 ? "group_moderator" : "group_member");
                  const mRole = targetRole.replace('group_', '');
                  return (
                    <div key={m.id || mName} className="member-row">
                      <Avatar name={mName} size={32} />
                      <div className="mi">
                        <div className="n" style={{ display: "flex", alignItems: "center", gap: 5 }}>{mName} {mRole === 'owner' && <I.crown className="crown" />}</div>
                        <div className="r" style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ color: "var(--ink-2)" }}>{mUsername}</span>
                          <span>·</span>
                          <span style={{ textTransform: "capitalize" }}>{mRole}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showNewThreadModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowNewThreadModal(false); setNewThreadTitle(""); setNewThreadBody(""); setNewThreadTag(""); } }}
        >
          <div style={{ width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto", background: "var(--surface)", borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.28)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>New Thread</h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-3)" }}>Share something with the group</p>
              </div>
              <button className="tool" onClick={() => { setShowNewThreadModal(false); setNewThreadTitle(""); setNewThreadBody(""); setNewThreadTag(""); }}>
                <I.x style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title <span style={{ color: "var(--accent-2)" }}>*</span></label>
                <input
                  className="cinput"
                  placeholder="Give your thread a clear, descriptive title"
                  value={newThreadTitle}
                  onChange={e => setNewThreadTitle(e.target.value)}
                  style={{ fontSize: 15, fontWeight: 500 }}
                  autoFocus
                />
              </div>

              {/* Body */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Body</label>
                <textarea
                  className="cinput"
                  placeholder="What's on your mind? Share details, questions, or anything relevant…"
                  value={newThreadBody}
                  onChange={e => setNewThreadBody(e.target.value)}
                  rows={5}
                  style={{ resize: "vertical", fontFamily: "inherit", fontSize: 14, lineHeight: 1.6, minHeight: 110 }}
                />
                <div style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "right" }}>{newThreadBody.length} / 5000</div>
              </div>

              {/* Tag picker */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tag <span style={{ color: "var(--ink-3)", fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setNewThreadTag("")}
                    style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, border: "1px solid var(--border)", background: newThreadTag === "" ? "var(--ink)" : "transparent", color: newThreadTag === "" ? "#fff" : "var(--ink-2)", cursor: "pointer", transition: "all 0.15s" }}
                  >None</button>
                  {ALL_FORUM_TAGS.map(t => {
                    const tc = TAG_COLORS[t] || TAG_COLORS.General;
                    const isSelected = newThreadTag === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewThreadTag(isSelected ? "" : t)}
                        style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, border: `1px solid ${isSelected ? tc.color : "var(--border)"}`, background: isSelected ? tc.bg : "transparent", color: isSelected ? tc.color : "var(--ink-2)", cursor: "pointer", fontWeight: isSelected ? 700 : 400, transition: "all 0.15s" }}
                      >{t}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="hbtn hbtn--ghost" onClick={() => { setShowNewThreadModal(false); setNewThreadTitle(""); setNewThreadBody(""); setNewThreadTag(""); }}>Cancel</button>
              <button className="hbtn hbtn--primary" disabled={!newThreadTitle.trim() || postingThread} onClick={handleNewThread}>
                {postingThread ? "Posting…" : <><I.check style={{ width: 14 }} /> Post Thread</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQModal && g.settings && g.settings.questionnaires && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowQModal(false); }}>
          <div style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', padding: 28, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.28)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Join Questionnaire</h2>
              <button className="tool" onClick={() => setShowQModal(false)}><I.x style={{ width: 20, height: 20 }} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Please answer the following questions to join.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {g.settings.questionnaires.map((q, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: 14, fontWeight: 500 }}>{q.q} {q.req && <span style={{ color: 'red' }}>*</span>}</label>
                  {q.type === 'long' ? (
                    <textarea
                      placeholder="Your answer..."
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'yesno' ? (
                    <select
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : q.type === 'multiplechoice' && q.options && q.options.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`q_${i}`}
                            value={opt}
                            checked={answers[i] === opt}
                            onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                            style={{ margin: 0, cursor: 'pointer' }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              className="hbtn hbtn--primary"
              style={{ marginTop: 16 }}
              onClick={() => {
                const requiredMissing = g.settings.questionnaires.some((q, i) => q.req && !answers[i]?.trim());
                if (requiredMissing) {
                  return alert("Please answer all required questions.");
                }
                submitJoinRequest(answers);
              }}
            >
              Submit & Join
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MyGroups({ go, param }) {
  const [tab, setTab] = useState((param && param.tab) || "joined");
  const [createdSubTab, setCreatedSubTab] = useState((param && param.createdSub) || "active");
  const [ownedGroups, setOwnedGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [pendingGroups, setPendingGroups] = useState([]);
  const [draftGroups, setDraftGroups] = useState([]);
  const [archivedGroups, setArchivedGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const mgApiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
  const mgResolveImg = (url) => url && !url.startsWith('blob:') ? (url.startsWith('/api/') ? mgApiBase + url : url) : null;

  React.useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { setLoading(false); return; }
        const res = await fetch(`${mgApiBase}/api/groups/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          setOwnedGroups(data.data.ownedGroups || []);
          setJoinedGroups(data.data.joinedGroups || []);
          setPendingGroups(data.data.pendingGroups || []);
          setDraftGroups(data.data.draftGroups || []);
          setArchivedGroups(data.data.archivedGroups || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyGroups();
  }, []);

  const createdList = createdSubTab === "drafts" ? draftGroups : createdSubTab === "archive" ? archivedGroups : ownedGroups;
  const list = tab === "joined" ? joinedGroups : tab === "pending" ? pendingGroups : createdList;

  const renderGroupCard = (g) => {
    const bannerSrc = mgResolveImg(g.banner);
    const iconSrc = mgResolveImg(g.icon);
    const isCustomIcon = iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/"));
    return (
      <div key={g.id} className="fcard" style={{ overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => {
        if (g.settings?.isDraft) {
          go("create-group", g);
        } else {
          go("group", g);
        }
      }}>
        <div style={{ height: 80, backgroundImage: bannerSrc ? `url("${bannerSrc}")` : undefined, backgroundColor: g.cover, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
          <Grain />
          <div style={{ position: "absolute", left: 16, bottom: -20, width: 48, height: 48, borderRadius: 12, background: g.cover, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "var(--sh-sm)", border: "2px solid var(--surface)", overflow: "hidden" }}>
            {isCustomIcon ? <img src={iconSrc} alt="icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : g.icon}
          </div>
        </div>
        <div style={{ padding: "30px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{g.name}</h3>
            {g.settings?.isDraft && <span className="type-pill" style={{ padding: "2px 6px", fontSize: 10 }}>Draft</span>}
            {g.settings?.isArchived && <span className="type-pill" style={{ padding: "2px 6px", fontSize: 10, background: "var(--surface-2)", color: "var(--ink-3)" }}>Archived</span>}
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "8px 0 16px", flex: 1, lineBreak: "anywhere" }}>{g.description || g.desc}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-3)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <span>{g.members?.toLocaleString() || 1} members</span>
            {tab === "created" ? (
              <span style={{ color: "var(--accent-2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                Manage <I.arrowR style={{ width: 12, height: 12 }} />
              </span>
            ) : (
              <span style={{ color: "var(--ink-3)" }}>{tab === "pending" ? "Pending" : "Joined"}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="scroll">
      <div className="page view-enter">
        <div className="sec-bar" style={{ marginBottom: 18 }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            My Groups
            <span style={{ fontSize: 18, color: "var(--ink-3)", fontWeight: 500 }}>{!loading && (joinedGroups.length + ownedGroups.length + pendingGroups.length)}</span>
          </h2>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <div className="seg-tabs">
              <button className={tab === "joined" ? "on" : ""} onClick={() => setTab("joined")}>Joined · {joinedGroups.length}</button>
              <button className={tab === "created" ? "on" : ""} onClick={() => setTab("created")}>Created · {ownedGroups.length + draftGroups.length + archivedGroups.length}</button>
              {pendingGroups.length > 0 && <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>Pending · {pendingGroups.length}</button>}
            </div>
            <button className="hbtn hbtn--primary hbtn--sm" onClick={() => go("create-group")}>
              <I.plus style={{ width: 14, height: 14 }} /> Create Group
            </button>
          </div>
        </div>

        {tab === "created" && (
          <div className="seg-tabs" style={{ marginBottom: 16, maxWidth: 380 }}>
            <button className={createdSubTab === "active" ? "on" : ""} onClick={() => setCreatedSubTab("active")}>Active · {ownedGroups.length}</button>
            <button className={createdSubTab === "drafts" ? "on" : ""} onClick={() => setCreatedSubTab("drafts")}>Drafts · {draftGroups.length}</button>
            <button className={createdSubTab === "archive" ? "on" : ""} onClick={() => setCreatedSubTab("archive")}>Archive · {archivedGroups.length}</button>
          </div>
        )}

        {list.length === 0 ? (
          <Empty icon={<I.groups />} title="No groups found" text={tab === "created" && createdSubTab === "drafts" ? "Save a group as draft while creating to see it here." : tab === "created" && createdSubTab === "archive" ? "Archived groups will appear here." : "Join or create a community to see them here."} action={<button className="hbtn hbtn--primary" onClick={() => go("discover")}>Explore groups</button>} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {list.map(g => renderGroupCard(g))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemberManagementPanel({ group, st, go }) {
  const g = group || st.createdGroups[0];
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('group_member');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [groupSettings, setGroupSettings] = useState(g?.settings || {});

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    let uid = null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          uid = payload.id;
          setCurrentUserId(uid);
        }
      } catch (e) { }
    }

    const fetchMembers = async () => {
      try {
        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
        const [membRes, groupRes] = await Promise.all([
          fetch(`${apiBase}/api/groups/${g.id}/members`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
          fetch(`${apiBase}/api/groups/${g.id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
        ]);
        const data = await membRes.json();
        if (data.success && data.data) {
          const active = data.data.filter(m => m.state === 'active');
          const pending = data.data.filter(m => m.state === 'pending');
          setMembers(active);
          setRequests(pending);

          const myMem = active.find(m => m.user_id === uid);
          if (myMem) {
            const roles = myMem.roles || [];
            if (roles.includes('group_owner')) setCurrentUserRole('group_owner');
            else if (roles.includes('group_admin')) setCurrentUserRole('group_admin');
            else if (roles.includes('group_moderator')) setCurrentUserRole('group_moderator');
            else setCurrentUserRole('group_member');
          }
        }
        const groupData = await groupRes.json();
        if (groupData.success && groupData.data?.settings) {
          setGroupSettings(groupData.data.settings);
        }
      } catch (e) {
        console.error(e);
      }
    };
    if (g?.id) fetchMembers();
  }, [g?.id]);

  const handleApprove = async (r) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${r.user_id}/approve`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setRequests(prev => prev.filter(req => req.user_id !== r.user_id));
        setMembers(prev => [...prev, { ...r, state: 'active', roles: ['group_member'] }]);
      }
    } catch (e) { }
  };
  const handleDecline = async (r) => {
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${r.user_id}/reject`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setRequests(prev => prev.filter(req => req.user_id !== r.user_id));
      }
    } catch (e) { }
  };

  const handleRoleChange = async (memberId, roleKey) => {
    setOpenMenuId(null);

    if (roleKey === 'group_owner') {
      if (!confirm("Transfer ownership of this group?\n\nYou will become an Admin.\n\n[Cancel] - [OK]")) return;
    }

    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${memberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ role: roleKey })
      });
      const data = await res.json();

      if (data.success) {
        if (roleKey === 'group_owner') {
          const fetchRes = await fetch(`${apiBase}/api/groups/${g.id}/members`, {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {}
          });

          const membersData = await fetchRes.json();

          if (membersData.success) {
            const activeMembers = membersData.data.filter(
              m => m.state === 'active'
            );

            setMembers(activeMembers);

            const me = activeMembers.find(
              m => m.user_id === currentUserId
            );

            if (me) {
              setCurrentUserRole(getHighestRole(me.roles));
            }
          }
        } else if (data.data) {
          setMembers(prev =>
            prev.map(m =>
              m.user_id === memberId ? data.data : m
            )
          );
        }
      } else {
        alert(data.message || "Failed to update role");
      }
    } catch (e) { alert("Error updating role"); }
  };

  const handleRemove = async (memberId) => {
    setOpenMenuId(null);
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/memberships/${memberId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setMembers(prev => prev.filter(m => m.user_id !== memberId));
      } else {
        alert(data.message || "Failed to remove member");
      }
    } catch (e) { alert("Error removing member"); }
  };

  const getHighestRole = (roles = []) => {
    if (roles.includes('group_owner')) return 'group_owner';
    if (roles.includes('group_admin')) return 'group_admin';
    if (roles.includes('group_moderator')) return 'group_moderator';
    return 'group_member';
  };

  const roleColors = {
    'group_owner': '#eab308', // Gold
    'group_admin': '#a855f7', // Purple
    'group_moderator': '#3b82f6', // Blue
    'group_member': 'var(--ink-3)'
  };
  const roleLabels = {
    'group_owner': 'Owner',
    'group_admin': 'Admin',
    'group_moderator': 'Moderator',
    'group_member': 'Member'
  };

  return (
    <div onClick={() => setOpenMenuId(null)} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {g.joinMode === 'approval' && requests.length > 0 && ['group_owner', 'group_admin', 'group_moderator'].includes(currentUserRole) && (
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
                    <Avatar name={r.users?.display_name || "Unknown"} size={32} />
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.users?.display_name || "Unknown"}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="hbtn hbtn--soft hbtn--sm" onClick={() => handleDecline(r)} style={{ color: "#ef4444" }}>Decline</button>
                    <button className="hbtn hbtn--primary hbtn--sm" onClick={() => handleApprove(r)}>Approve</button>
                  </div>
                </div>
                {r.answers && Object.keys(r.answers).length > 0 && (
                  <div style={{ marginTop: 12, padding: 12, background: "var(--bg)", borderRadius: 6, fontSize: 13, border: "1px solid var(--border)" }}>
                    <h5 style={{ margin: "0 0 8px 0", fontSize: 12, textTransform: "uppercase", color: "var(--ink-3)", letterSpacing: "0.05em" }}>Questionnaire Answers</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {Object.entries(r.answers).map(([key, ans]) => {
                        const idx = parseInt(key);
                        const qs = groupSettings?.questionnaires || [];
                        const q = (!isNaN(idx) && idx < 1000) ? qs[idx] : qs.find(x => x.id === key);
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
      )}

      <div>
        <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Members ({members.length})</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {members.map((m) => {
            const targetRole = getHighestRole(m.roles);
            const isMe = m.user_id === currentUserId;

            console.log(`[Role Menu] user_id: ${m.user_id}, targetRole: ${targetRole}, currentUserRole: ${currentUserRole}, m.roles:`, m.roles);

            // Permission logic for the menu
            let showMakeOwner = false;
            let showMakeAdmin = false;
            let showMakeMod = false;
            let showMakeMember = false;
            let showRemove = false;

            if (!isMe && targetRole !== 'group_owner') {
              if (currentUserRole === 'group_owner') {
                showMakeOwner = true;
                showMakeAdmin = targetRole !== 'group_admin';
                showMakeMod = targetRole !== 'group_moderator';
                showMakeMember = targetRole !== 'group_member';
                showRemove = true;
              } else if (currentUserRole === 'group_admin') {
                if (targetRole !== 'group_admin') {
                  showMakeMod = targetRole !== 'group_moderator';
                  showMakeMember = targetRole !== 'group_member';
                  showRemove = true;
                }
              }
            }
            const hasMenuOptions = showMakeOwner || showMakeAdmin || showMakeMod || showMakeMember || showRemove;

            console.log("Dropdown flags for", m.user_id, {
              showMakeOwner,
              showMakeAdmin,
              showMakeMod,
              showMakeMember,
              showRemove
            });

            return (
              <div key={m.user_id} style={{ position: "relative", zIndex: openMenuId === m.user_id ? 50 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={m.users?.display_name || "Unknown"} size={40} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.users?.display_name || "Unknown"}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>@{m.users?.username || "unknown"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: roleColors[targetRole] }}>
                    {roleLabels[targetRole]}
                  </span>
                  {hasMenuOptions && (
                    <div style={{ position: "relative" }}>
                      <button className="tool" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === m.user_id ? null : m.user_id); }}>
                        <I.more style={{ width: 16, height: 16 }} />
                      </button>
                      {openMenuId === m.user_id && (
                        <div style={{ display: "flex", flexDirection: "column", position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--sh-md)", zIndex: 9999, minWidth: 160, padding: 4 }}>
                          {showMakeOwner && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_owner')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Make Owner</button>}
                          {showMakeAdmin && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_admin')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Make Admin</button>}
                          {showMakeMod && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_moderator')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Make Moderator</button>}
                          {showMakeMember && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_member')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>Make Member</button>}
                          {showRemove && <button className="menu-btn" onClick={() => handleRemove(m.user_id)} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "#ef4444", borderTop: "1px solid var(--border)", marginTop: 4, paddingTop: 6 }}>Remove Member</button>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GroupDetail, MyGroups, MemberManagementPanel });
