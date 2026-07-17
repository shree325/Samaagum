// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock } from './app';
import { Mark } from './components';
import { EVENTS, GROUPS, ME, copyText } from './home-data';
import { Discover } from './home-feed';
import { Avatar, Grain } from './home-icons';
import { Empty } from './home-shell';
import { apiBase } from './home-subscription';
import { Waitlist } from './home-waitlist';
import { Discussions, Footer } from './landing-activity';
import { I } from './home-icons';
import { Events } from './landing-features';
import { EventCard } from './home-cards';
import { GroupDashboard } from './group-dashboard';

/* ============================================================
   Samaagum Home — Group detail (forum, events, members, gallery)
   ============================================================ */

export function getRelativeTime(d) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

export const TAG_COLORS = {
  Question: { bg: "#e8f4ff", color: "#0969da" },
  Announcement: { bg: "#fff3e0", color: "#e05000" },
  Help: { bg: "#f3e8ff", color: "#8250df" },
  Bug: { bg: "#ffebe9", color: "#cf222e" },
  Feature: { bg: "#e6ffed", color: "#1a7f37" },
  News: { bg: "#e0f7fa", color: "#00838f" },
  Discussion: { bg: "#f6f8fa", color: "#57606a" },
  General: { bg: "#f6f8fa", color: "#57606a" }
};

export const ALL_FORUM_TAGS = ["Question", "Announcement", "Help", "Bug", "Feature", "News", "Discussion", "General"];
export const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥"];

export function TagPill({ tag }) {
  const c = TAG_COLORS[tag] || TAG_COLORS.General;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, display: "inline-block", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{tag}</span>
  );
}

export function VoteWidget({ score, userVote, onUpvote, onDownvote }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 32 }}>
      <button onClick={e => { e.stopPropagation(); onUpvote(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 15, fontWeight: 800, color: userVote === 1 ? "var(--accent-2)" : "var(--ink-3)", lineHeight: 1 }} title="Upvote">▲</button>
      <span style={{ fontSize: 13, fontWeight: 700, color: score > 0 ? "var(--accent-2)" : score < 0 ? "#e74c3c" : "var(--ink-3)", minWidth: 20, textAlign: "center" }}>{score}</span>
      <button onClick={e => { e.stopPropagation(); onDownvote(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 15, fontWeight: 800, color: userVote === -1 ? "#e74c3c" : "var(--ink-3)", lineHeight: 1 }} title="Downvote">▼</button>
    </div>
  );
}

export function EmojiBar({ counts, onReact }) {
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

export function SortBar({ sort, onSort }) {
  const opts = [["new", "New"], ["hot", "🔥 Hot"], ["top", "Top"], ["pinned", "📌 Pinned"]];
  return (
    <div style={{ display: "flex", gap: 2, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
      {opts.map(([k, l]) => (
        <button key={k} onClick={() => onSort(k)} style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: sort === k ? 600 : 400, background: sort === k ? "var(--ink)" : "transparent", color: sort === k ? "var(--surface)" : "var(--ink-2)", transition: "all .15s" }}>{l}</button>
      ))}
    </div>
  );
}

export function ThreadCard({ p, onOpen, voteData, onVote, reactions, onReact, isLiked, onLike }) {
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

export function CommentItem({ c, depth, canReply, isOwner, currentUserId, replyingToId, inlineReplyDraft, submittingInlineReply, commentVotes, onVote, onDelete, onStartReply, onCancelReply, onInlineReplyChange, onSubmitInlineReply, canEdit, editingCommentId, editCommentDraft, onEditStart, onEditCancel, onEditChange, onEditSubmit }) {
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

/* ─── Conducted Events Section ─────────────────────────────────────────────── */

function ConductedEventsSection({ groupId }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [imgLoaded, setImgLoaded] = React.useState({});

  React.useEffect(() => {
    if (!groupId || groupId === 'newg') { setLoading(false); return; }
    const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
    const token = localStorage.getItem('token');
    setLoading(true);
    fetch(`${apiBase}/api/groups/${groupId}/conducted-events`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => {
        const raw = (d.data || []);
        // Secondary client-side filter for safety
        const past = raw.filter(ev => {
          if (ev.status === 'completed' || ev.status === 'ended') return true;
          const end = ev.ends_at ? new Date(ev.ends_at) : (ev.starts_at ? new Date(new Date(ev.starts_at).getTime() + 3 * 60 * 60 * 1000) : null);
          return end && end < new Date();
        });
        // Already sorted by server desc, but sort again for safety
        past.sort((a, b) => new Date(b.starts_at || 0).getTime() - new Date(a.starts_at || 0).getTime());
        setEvents(past);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [groupId]);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };
  const apiBase = window.location.port === '8080' ? 'http://localhost:3000' : '';
  const resolveUrl = (u) => u && !u.startsWith('blob:') ? (u.startsWith('/api/') ? apiBase + u : u) : null;

  const cardStyle = {
    display: 'grid',
    gridTemplateColumns: '180px 1fr auto auto auto',
    gap: '20px',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '16px 20px',
    cursor: 'default',
    userSelect: 'none',
    transition: 'background 0.15s',
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Conducted Events</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...cardStyle, animation: 'pulse 1.5s ease-in-out infinite' }}>
              <div style={{ width: 180, height: 101, borderRadius: 10, background: 'var(--surface-2)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ height: 18, width: '60%', borderRadius: 6, background: 'var(--surface-2)' }} />
                <div style={{ height: 13, width: '80%', borderRadius: 6, background: 'var(--surface-2)' }} />
              </div>
              <div style={{ height: 40, width: 80, borderRadius: 8, background: 'var(--surface-2)' }} />
              <div style={{ height: 40, width: 80, borderRadius: 8, background: 'var(--surface-2)' }} />
              <div style={{ height: 40, width: 64, borderRadius: 8, background: 'var(--surface-2)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Conducted Events</h3>
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-3)' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" style={{ marginBottom: 16, opacity: 0.35 }}>
            <rect x="8" y="16" width="56" height="44" rx="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            <path d="M8 28h56" stroke="currentColor" strokeWidth="2.5"/>
            <path d="M24 8v12M48 8v12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M22 42h10M22 52h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
          </svg>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>No Events Conducted Yet</div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
            This group hasn't organized any events yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px' }}>
      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
        Conducted Events
        <span style={{ marginLeft: 10, fontSize: 13, fontWeight: 500, color: 'var(--ink-3)', background: 'var(--surface-2)', padding: '2px 10px', borderRadius: 20 }}>
          {events.length}
        </span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((ev) => {
          const banner = resolveUrl(ev.cover || ev.banner || ev.image);
          const attendeeCount = ev.attendees_count ?? ev.attendee_count ?? ev.registrations_count ?? ev.checkin_count ?? ev.joined ?? 0;
          const category = ev.category || ev.cat || null;

          const coverBg = banner && (banner.startsWith("linear-gradient") || banner.startsWith("radial-gradient") || banner.startsWith("var(") || banner.startsWith("#") || banner.startsWith("rgb"))
            ? banner
            : (banner ? `url(${banner}) center/cover no-repeat` : 'var(--dusk)');

          return (
            <div
              key={ev.id}
              style={cardStyle}
              onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in srgb, var(--surface) 80%, var(--ink) 3%)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
            >
              {/* Banner */}
              <div style={{
                width: 180,
                height: 101,
                borderRadius: 10,
                overflow: 'hidden',
                background: coverBg,
                flexShrink: 0,
                position: 'relative'
              }}>
                <Grain />
              </div>


              {/* Event info */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--ink)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ev.name || ev.title || 'Untitled Event'}
                </div>
                {(ev.description || ev.desc) && (
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>
                    {ev.description || ev.desc}
                  </div>
                )}
                {category && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--accent-2)', background: 'color-mix(in srgb, var(--accent-2) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-2) 25%, transparent)', borderRadius: 20, padding: '2px 9px' }}>
                    {category}
                  </span>
                )}
              </div>

              {/* Start */}
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Start</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(ev.starts_at)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatTime(ev.starts_at)}
                </div>
              </div>

              {/* End */}
              <div style={{ textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>End</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-2)', marginBottom: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(ev.ends_at || ev.starts_at)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--ink-3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {formatTime(ev.ends_at || ev.starts_at)}
                </div>
              </div>

              {/* Attendees */}
              <div style={{ textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Attendees</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-2)', lineHeight: 1 }}>{attendeeCount.toLocaleString()}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>Joined</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function MemberOnlyScreen({ onJoin, isPending }) {

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

export function GroupDetail({ group, st, go }) {
  const [fullGroup, setFullGroup] = useState(null);
  const [membershipState, setMembershipState] = useState(null);
  const [globalChatSettings, setGlobalChatSettings] = useState(null);

  useEffect(() => {
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    fetch(`${apiBase}/api/messaging/settings`)
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setGlobalChatSettings(res.data);
        }
      })
      .catch(err => console.error("Error fetching global chat settings in home-group:", err));
  }, []);

  const g = fullGroup || group || {};
  const forumsEnabled = !g.settings?.forums || g.settings.forums.enabled !== false;
  const gallerySettings = g.settings?.gallery || {};
  const galleryEnabled = gallerySettings.enabled !== false;

  React.useEffect(() => {
    setFullGroup(null);
    setMembershipState(null);
  }, [group?.id]);

  const { joined, pending, toggleJoin } = st;
  const isJoined = joined.has(g.id) || membershipState === 'active';
  const isPending = pending.has(g.id) || membershipState === 'pending';
  const [isOwner, setIsOwner] = useState(ME.name === g.owner);
  const isMember = isOwner || isJoined;
  const canShare = isOwner || (isMember && g.visibility === 'public');
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const chatSettings = st.chatSettings || {
    allowSiteMessaging: true,
    allowDirectMessaging: true,
    allowGroupChat: true,
    allowEventChat: true
  };
  const showChatButton = chatSettings.allowSiteMessaging !== false && (
    chatSettings.allowDirectMessaging ||
    (chatSettings.allowGroupChat || chatSettings.allowEventChat)
  );
  const [tab, setTab] = useState(() => {
    return sessionStorage.getItem(`group_tab_${g.id || g.entity_id}`) || "about";
  });
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState([]);
  const [posting, setPosting] = useState(false);

  const [showQModal, setShowQModal] = useState(false);
  const [answers, setAnswers] = useState({});
  const [onlineCount, setOnlineCount] = useState(g.online || 0);
  const [galleryItems, setGalleryItems] = useState([]);
  const [callerIsAdmin, setCallerIsAdmin] = useState(false);
  const [conductedEvents, setConductedEvents] = useState([]);
  const [conductedEventsLoading, setConductedEventsLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageOrigin, setImageOrigin] = useState({ x: '50%', y: '50%' });
  const [activeThread, setActiveThread] = useState(null);
  const activeThreadRef = React.useRef(null);
  React.useEffect(() => {
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
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedMsg, setAccessDeniedMsg] = useState("");

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

  const refreshThreadComments = React.useCallback(async (threadId) => {
    if (!threadId) return;
    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/posts/${threadId}`, {
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
  }, [g.id, token]);

  const refreshThreadCommentsRef = React.useRef(refreshThreadComments);
  React.useEffect(() => {
    refreshThreadCommentsRef.current = refreshThreadComments;
  }, [refreshThreadComments]);

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
    ["about", <span style={{ fontSize: 13, fontWeight: 600 }}>About</span>],
    ["events", <span style={{ fontSize: 13, fontWeight: 600 }}>Events</span>],
    ["members", <span style={{ fontSize: 13, fontWeight: 600 }}>Members</span>],
    ["gallery", <span style={{ fontSize: 13, fontWeight: 600 }}>Gallery</span>],
    ["discussion", <span style={{ fontSize: 13, fontWeight: 600 }}>Discussions</span>]
  ];
  const [members, setMembers] = useState(g.memberNames || []);
  const [joinRequests, setJoinRequests] = useState([]);
  const [newJoinRequestNotif, setNewJoinRequestNotif] = useState(false);
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);

  const roleHasCap = (roleKey, cap) => (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes(cap);

  React.useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
        const res = await fetch(`${apiBase}/api/groups/available-roles`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (data.success) setAvailableRoles(data.data || []);
      } catch (err) { console.error(err); }
    })();
  }, []);

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
    const roleKey = isOwner ? 'group_owner' :
                    (members.find(m => m.id === currentUserId)?.role === 'admin' ? 'group_admin' :
                     members.find(m => m.id === currentUserId)?.role === 'moderator' ? 'group_moderator' : 'group_member');
    const hasManageCap = isOwner || (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes('group.manage');
    if (!g.id || g.id === "newg" || !hasManageCap) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        let list = data.data;
        // Unlisted groups always need a shareable link — auto-create one if it doesn't exist yet
        // instead of requiring a manual "Generate" click.
        const hasShareLink = list.some(inv => !inv.email && !inv.username && inv.status !== 'revoked');
        if (g.visibility === 'private' && !hasShareLink) {
          const linkRes = await fetch(`${apiBase}/api/groups/${g.id}/invites/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: JSON.stringify({ maxUses: null })
          });
          const linkData = await linkRes.json();
          if (linkData.success) {
            const res2 = await fetch(`${apiBase}/api/groups/${g.id}/invites`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data2 = await res2.json();
            if (data2.success) list = data2.data;
          }
        }
        setInvites(list);
      }
    } catch (e) { console.error(e); }
  }, [g.id, isOwner, g.visibility]);

  const fetchJoinRequests = React.useCallback(async () => {
    const roleKey = isOwner ? 'group_owner' :
                    (members.find(m => m.id === currentUserId)?.role === 'admin' ? 'group_admin' :
                     members.find(m => m.id === currentUserId)?.role === 'moderator' ? 'group_moderator' : 'group_member');
    const hasManageCap = isOwner || (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes('group.manage');
    if (!g.id || g.id === "newg" || !hasManageCap) return;
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
        setFullGroup(groupData.data.group);
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

  React.useEffect(() => {
    if (group && group.postId) {
      openThread({ id: group.postId });
    }
  }, [group?.postId]);

  const handleJoinClick = async () => {
    if (isJoined || isPending) return;
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

  const handleLeaveClick = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMembershipState(null);
        fetchGroupDetails();
        alert("You have left the group successfully.");
      } else {
        alert(data.message || "Failed to leave group");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to leave group due to a network error.");
    }
  };

  const handleCancelJoinRequestClick = async () => {
    if (!confirm("Are you sure you want to cancel your request to join this group?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/join/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMembershipState(null);
        fetchGroupDetails();
        if (window.toast) window.toast("Join request cancelled.");
      } else {
        alert(data.message || "Failed to cancel request");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to cancel request due to a network error.");
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
      if (!canManageGroup) return;
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
    const socket = window.io(socketUrl, { transports: ['websocket'] });

    // Only count as "online" if the user is an active member or owner
    if (isMember) {
      socket.emit('join_group', { groupId: g.id, userId: currentUserId });
    }

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

    socket.on('thread_deleted', (data) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(null);
        alert("This thread has been deleted.");
      }
    });

    socket.on('thread_edited', (data) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('thread_solved', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, solved: data.solved } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, solved: data.solved } : null);
      }
    });

    socket.on('thread_pinned', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, pinned: data.pinned } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, pinned: data.pinned } : null);
      }
    });

    socket.on('thread_locked', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, locked: data.locked } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, locked: data.locked } : null);
      }
    });

    socket.on('thread_archived', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, archived: data.archived } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setActiveThread(prev => prev ? { ...prev, archived: data.archived } : null);
      }
    });

    socket.on('thread_voted', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, vote_score: data.score } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setThreadVotes(prev => ({ ...prev, [data.postId]: { ...prev[data.postId], score: data.score } }));
      }
    });

    socket.on('thread_reacted', (data) => {
      if (tab === 'discussion') {
        setPosts(prev => prev.map(t => t.id === data.postId ? { ...t, reactions: data.reactions } : t));
      }
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        setThreadReactions(prev => ({ ...prev, [data.postId]: data.reactions }));
      }
    });

    socket.on('new_comment', (data) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('comment_deleted', (data) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('comment_voted', (data) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('comment_edited', (data) => {
      if (tab === 'discussion') fetchPosts(sort);
      if (activeThreadRef.current && activeThreadRef.current.id === data.postId) {
        refreshThreadCommentsRef.current(data.postId);
      }
    });

    socket.on('online_count', (data) => {
      if (data.groupId === g.id) setOnlineCount(data.count);
    });

    socket.on('gallery_updated', (payload) => {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const tkn = localStorage.getItem('token');
      fetch(`${apiBase}/api/groups/${g.id}/gallery`, {
        headers: tkn ? { 'Authorization': `Bearer ${tkn}` } : {}
      }).then(r => r.json()).then(d => {
        if (d.success) {
          const isManager = myRoleRef.current === 'group_owner' || myRoleRef.current === 'group_admin' || myRoleRef.current === 'group_moderator';
          if (isManager && payload && payload.action === 'upload') {
            if (window.toast) window.toast("New media approval request received!", "info");
          }
          setGalleryItems(d.data);
          setCallerIsAdmin(d.callerIsAdmin || false);
        }
      }).catch(console.error);
    });

    return () => {
      if (isMember) socket.emit('leave_group', g.id);
      socket.disconnect();
    };
  }, [g.id, isOwner, isMember, tab, sort, fetchPosts]);

  const myMemberEntry = (members || []).find(m => m.id === currentUserId);
  const myRoleKey = isOwner ? 'group_owner' :
                    (myMemberEntry?.role === 'owner' ? 'group_owner' :
                     myMemberEntry?.role === 'admin' ? 'group_admin' :
                     myMemberEntry?.role === 'moderator' ? 'group_moderator' : 'group_member');

  const myRoleRef = React.useRef(myRoleKey);
  React.useEffect(() => {
    myRoleRef.current = myRoleKey;
  }, [myRoleKey]);

  const canManageGroup = isOwner || roleHasCap(myRoleKey, 'group.manage');

  if (canManageGroup) {
    if ((g.joinMode === 'invite_only' || g.joinMode === 'approval') && !tabs.find(t => t[0] === 'invites')) {
      tabs.push(["invites", "Invites"]);
    }
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
      const req = joinRequests.find(r => r.id === reqId);
      if (req && req.name && window.initiateChatWithName) {
        window.initiateChatWithName(req.name);
      } else {
        alert("Opening direct chat with user...");
      }
    }
  };

  const rawEvents = (window.EVENTS || EVENTS).filter(e => e.hosted_by_entity_id === g.id);
  const gEvents = rawEvents.map(e => {
    const venueObj = e.venue || {};
    const meta = venueObj.meta || {};
    const startsAt = e.starts_at ? new Date(e.starts_at) : null;
    const priceVal = e.tickets?.[0] ? `₹${(e.tickets[0].price_minor / 100).toFixed(0)}` : (e.registration_mode === 'free' ? 'Free' : '—');

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = startsAt ? months[startsAt.getMonth()] : "TBD";
    const day = startsAt ? startsAt.getDate().toString() : "TBD";
    const time = startsAt ? startsAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "Time TBD";
    const dateStr = startsAt ? startsAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD";

    return {
      ...e,
      month,
      day,
      date: dateStr,
      time,
      price: priceVal,
      type: (e.registration_mode === 'free' || e.registration_mode === 'free_rsvp') ? 'Free' : 'Paid',
      online: e.location_type === 'online',
      cover: e.cover || meta.cover || "",
      venue: e.location_type === 'online' ? 'Online' : (venueObj.name || 'Venue TBD'),
    };
  });

  const threadPerm = g.settings?.forums?.threadPerm || "everyone";
  const replyPerm = g.settings?.forums?.replyPerm || "everyone";
  const forumPermissions = g.forumPermissions || [];
  const isArchived = Boolean(g.settings?.isArchived);
  const canPost = !isArchived && forumsEnabled && isMember && (isOwner || threadPerm === "everyone" || threadPerm === "members" || (threadPerm === "selected" && forumPermissions.includes("create_thread")));
  const canReply = !isArchived && forumsEnabled && isMember && (isOwner || replyPerm === "everyone" || replyPerm === "members" || (replyPerm === "selected" && forumPermissions.includes("reply_thread")));

  const forumsPublic = g.settings?.forums?.threadRoles
    ? (g.settings.forums.threadRoles.public === true || g.settings.forums.replyRoles?.public === true)
    : (threadPerm === 'everyone' || replyPerm === 'everyone');

  const galleryPublic = g.settings?.gallery?.viewRoles
    ? g.settings.gallery.viewRoles.public === true
    : (g.settings?.gallery?.allow !== false);

  const canViewGallery = (() => {
    const viewRoles = g.settings?.gallery?.viewRoles;
    if (!viewRoles) return true;
    if (viewRoles.public) return true;
    if (isOwner) return true;
    return viewRoles.roles.includes(myRoleKey);
  })();

  const isAccessRestricted = !isJoined && !isOwner;
  const isPublicGroup = g.visibility === 'public' && g.joinMode === 'open';

  const showMemberOnlyScreen = (() => {
    if (!isAccessRestricted) return false;
    if (tab === 'members') return true;
    if (tab === 'discussion') return !forumsPublic;
    if (tab === 'gallery') return !galleryPublic;
    if (tab === 'events') return !isPublicGroup;
    return false;
  })();

  const visibleTabs = tabs.filter(([k]) => {
    if (k === 'gallery' && !galleryEnabled) return false;
    if (k === 'discussion' && !forumsEnabled) return false;
    
    if (isAccessRestricted) {
      if (k === 'members') return false;
      if (k === 'discussion') return forumsPublic;
      if (k === 'gallery') return galleryPublic;
      if (k === 'events') return isPublicGroup;
    } else {
      if (k === 'gallery') return canViewGallery;
    }
    return true;
  });

  React.useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some(t => t[0] === tab)) {
      setTab(visibleTabs[0][0]);
    }
  }, [tab, visibleTabs]);

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

  const canUpload = !isArchived && galleryEnabled && (isOwner || isJoined);
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
      if (data.success) { setGalleryItems(data.data); setCallerIsAdmin(data.callerIsAdmin || false); }
    } catch (e) { console.error(e); }
  }, [g.id]);

  React.useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

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

  const openMediaPreview = (item) => {
    setPreviewMedia(item);
    setImageZoom(1);
    setImageOrigin({ x: '50%', y: '50%' });
  };
  const closeMediaPreview = () => {
    setPreviewMedia(null);
    setImageZoom(1);
    setImageOrigin({ x: '50%', y: '50%' });
  };
  const zoomIn = () => {
    setImageOrigin({ x: '50%', y: '50%' });
    setImageZoom(prev => Math.min(prev + 0.25, 3));
  };
  const zoomOut = () => {
    if (imageZoom <= 1.25) {
      setImageOrigin({ x: '50%', y: '50%' });
      setImageZoom(1);
    } else {
      setImageZoom(prev => Math.max(prev - 0.25, 1));
    }
  };
  const toggleImageZoom = (e) => {
    e.preventDefault();
    if (!previewMedia || previewMedia.type === 'video') return;
    if (imageZoom > 1) {
      setImageZoom(1);
      setImageOrigin({ x: '50%', y: '50%' });
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    const xPct = Math.min(100, Math.max(0, (offsetX / rect.width) * 100));
    const yPct = Math.min(100, Math.max(0, (offsetY / rect.height) * 100));
    setImageOrigin({ x: `${xPct}%`, y: `${yPct}%` });
    setImageZoom(2);
  };

  const _isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const _gdApiBase = _isLocalhost ? "http://localhost:3000" : "";
  const _resolveUrl = (u) => u && !u.startsWith('blob:') ? (u.startsWith('/api/') ? _gdApiBase + u : u) : null;
  const bannerSrc = _resolveUrl(g.banner);
  const iconSrc = _resolveUrl(g.icon);
  const isCustomIcon = iconSrc && (iconSrc.startsWith("http") || iconSrc.startsWith("data:") || iconSrc.includes("/"));
  const nonOwnerMembers = members.filter(m => m.role !== 'owner');
  const capacityFull = g.isFull !== undefined ? g.isFull : (g.settings && g.settings.capacity && g.settings.capacity.limit === true && g.settings.capacity.max > 0 && nonOwnerMembers.length >= g.settings.capacity.max);
  const hasWaitlist = g.hasWaitlist !== undefined ? g.hasWaitlist : (capacityFull && g.settings && g.settings.capacity && g.settings.capacity.waitlist === true);

  let displayLocation = null;
  const loc = g.settings?.location;
  if (loc) {
    if (loc.city && loc.state && loc.country) displayLocation = `${loc.city}, ${loc.state}, ${loc.country}`;
    else if (loc.city && loc.state) displayLocation = `${loc.city}, ${loc.state}`;
    else if (loc.city && loc.country) displayLocation = `${loc.city}, ${loc.country}`;
    else if (loc.city) displayLocation = loc.city;
    else if (typeof loc === 'string') displayLocation = loc;
  } else if (g.settings?.city) {
    displayLocation = g.settings.city;
  }

  if (!g.id) return null;

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
          background: bannerSrc ? `url("${bannerSrc}") center/cover no-repeat` : g.cover
        }}>
          {!bannerSrc && <Grain />}
          <div className="scrim" />
          <button className="detail-back" onClick={() => go("back")}><I.arrowL />Back</button>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#1f9d57", fontWeight: 600 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2bb673" }} />{onlineCount} online</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.comment /> {g.posts || 0} posts</span>
                <span className="fchip on" style={{ pointerEvents: "none", padding: "4px 11px", fontSize: 12 }}>{g.cat || "Community"}</span>
              </div>
              {displayLocation && (
                <div className="sub" style={{ marginTop: 4 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.pin /> {displayLocation}</span>
                </div>
              )}
            </div>
            <div className="gh-act">
              {canShare && (
                <div style={{ position: "relative" }}>
                  <button className="hbtn hbtn--ghost hbtn--sm" onClick={() => setShowShareSheet(!showShareSheet)}>
                    <I.share /> Share
                  </button>
                  {showShareSheet && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setShowShareSheet(false)} />
                      <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, display: "flex", gap: 8, padding: 8, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--sh-md)", zIndex: 9999 }}>
                        {(() => {
                          const link = encodeURIComponent(`${window.location.origin}${window.location.pathname}#group=${g.id}`);
                          const msg = encodeURIComponent(`Join the ${g.name} group on Samaagum!\n\n${window.location.origin}${window.location.pathname}#group=${g.id}`);
                          const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${encodeURIComponent(`Join the ${g.name} group on Samaagum!`)}&body=${msg}`;
                          const btnStyle = { display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", textDecoration: "none" };
                          return (
                            <>
                              <a href={`https://wa.me/?text=${msg}`} target="_blank" style={btnStyle} title="WhatsApp">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a5.8 5.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.81 11.81 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/></svg>
                              </a>
                              <a href={`https://www.facebook.com/sharer/sharer.php?u=${link}`} target="_blank" style={btnStyle} title="Facebook">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                              </a>
                              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`} target="_blank" style={btnStyle} title="LinkedIn">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2"><path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06s2.06.92 2.06 2.06c0 1.14-.92 2.06-2.06 2.06zM20.45 20.45h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.63-1.84 3.36-1.84 3.59 0 4.25 2.36 4.25 5.43v6.3z"/></svg>
                              </a>
                              <a href={gmailUrl} target="_blank" style={btnStyle} title="Email (Gmail)">
                                <svg viewBox="0 0 24 24" width="20" height="20">
                                  <path d="M2.25 7.313v9.937c0 1.242 1.008 2.25 2.25 2.25h3V12L2.25 7.313z" fill="#4285f4"/>
                                  <path d="M16.5 19.5h3c1.242 0 2.25-1.008 2.25-2.25V7.313L16.5 12v7.5z" fill="#34a853"/>
                                  <path d="M16.5 7.313V12l5.25-3.938c-.126-.816-.807-1.442-1.65-1.442h-3.6L16.5 7.313z" fill="#fbbc04"/>
                                  <path d="M7.5 7.313V12L2.25 8.062c.126-.816.807-1.442 1.65-1.442h3.6l-7.5-.693z" fill="#c11812"/>
                                  <path d="M21.75 8.062L12 15.375 2.25 8.062 7.5 4.125h9l5.25 3.937z" fill="#ea4335"/>
                                </svg>
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              )}
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
              )}
            </div>
          </div>

          <div className="grp-tabs">
            {visibleTabs.map(([k, l]) => (
              <button key={k} className={`grp-tab ${tab === k ? "on" : ""}`} onClick={() => { setTab(k); sessionStorage.setItem(`group_tab_${g.id || g.entity_id}`, k); if (k === "dashboard" || k === "members") setNewJoinRequestNotif(false); }}>
                {l}
                {k === "members" && canManageGroup && (dashboardStats.pendingMembers > 0 || newJoinRequestNotif) && (
                  <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
                )}
                {k === "dashboard" && newJoinRequestNotif && (
                  <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
                )}
                {k === "gallery" && (myRoleKey === 'group_owner' || myRoleKey === 'group_admin' || myRoleKey === 'group_moderator') && galleryItems.some(item => item.status === 'pending') && (
                  <span style={{ marginLeft: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent-2)", display: "inline-block" }} />
                )}
              </button>
            ))}
          </div>

          <div className="grp-cols" style={tab === "dashboard" ? { gridTemplateColumns: "1fr" } : undefined}>
            <div style={{ minWidth: 0 }}>
              {showMemberOnlyScreen ? (
                <MemberOnlyScreen onJoin={handleJoinClick} isPending={isPending} />
              ) : (
                <>
                  {tab === "about" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "24px" }}>
                        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>About this group</h3>
                        <div style={{ color: "var(--ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                          {g.description || g.desc || "No description provided."}
                        </div>
                      </div>
                      {(g.rules || (g.settings && g.settings.rules)) && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "24px" }}>
                          <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 18 }}>Group Rules</h3>
                          <div style={{ color: "var(--ink-2)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                            {g.rules || g.settings.rules}
                          </div>
                        </div>
                      )}
                      <ConductedEventsSection groupId={g.id} />
                    </div>
                  )}
                  {tab === "discussion" && (
                    globalChatSettings && (
                      globalChatSettings.allowGroupChat === false || 
                      globalChatSettings.communicationPolicies?.groupChatsEnabled === false
                    ) ? (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "50vh",
                        padding: "48px 24px",
                        textAlign: "center",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-md)",
                        boxShadow: "none",
                        margin: "20px 0",
                        color: "var(--ink)",
                        width: "100%"
                      }}>
                        <div style={{
                          fontSize: "56px",
                          marginBottom: "20px",
                          userSelect: "none"
                        }}>
                          🔒
                        </div>
                        <h2 style={{
                          margin: "0 0 10px 0",
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "var(--ink)",
                          letterSpacing: "-0.01em"
                        }}>
                          This feature is currently disabled from admin side
                        </h2>
                        <p style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "var(--ink-3)",
                          lineHeight: "1.6",
                          maxWidth: "360px"
                        }}>
                          For further information, please contact the administrator.
                        </p>
                      </div>
                    ) : (
                      <>
                        {activeThread === null ? (
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
                              <button onClick={() => setActiveTag(null)} style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 12, border: "1px solid var(--border)", background: activeTag === null ? "var(--ink)" : "transparent", color: activeTag === null ? "var(--surface)" : "var(--ink-2)", cursor: "pointer", fontWeight: activeTag === null ? 600 : 400 }}>All</button>
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
                            {!canPost && forumsEnabled && isMember && (
                              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, color: "var(--ink-2)" }}>
                                <I.lock style={{ width: 16, height: 16, opacity: 0.5 }} />
                                <span style={{ fontSize: 13 }}>Only {threadPerm === "admins" ? "moderators and admins" : "selected members"} can create new threads.</span>
                              </div>
                            )}
                            {!isMember && isPublicGroup && forumsEnabled && (
                              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Join this group to create threads and reply to discussions.</span>
                                <button className="hbtn hbtn--primary hbtn--sm" onClick={handleJoinClick}>{isPending ? "Pending" : "Join group"}</button>
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
                        ) : (
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
                                <span style={{ fontSize: 13 }}>Only selected roles can reply here.</span>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )
                  )}
                  {tab === "events" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {/* Create Event button — visible to group owner and admin */}
                      {isOwner && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                          <button
                            className="hbtn hbtn--primary hbtn--sm"
                            onClick={() => go("create-event", { hostGroupId: g.id, hostGroupName: g.name })}
                            style={{ display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <I.plus style={{ width: 14 }} />
                            Create Event
                          </button>
                        </div>
                      )}

                      {gEvents.length > 0 ? (
                        <div className="ev-grid">
                          {gEvents.map(ev => <EventCard key={ev.id} ev={ev} onOpen={(e) => go("event", e)} wishlisted={st.wishlisted?.has(ev.id)} wishlistCount={st.wishlistCounts?.[ev.id] !== undefined ? st.wishlistCounts[ev.id] : (ev.wishlistCount || 0)} onWishlist={() => st.toggleWishlist(ev.id, ev.wishlistCount)} registered={st.registered.has(ev.id)} />)}
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
                          <I.cal style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                          <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No events scheduled</h4>
                          <p style={{ margin: 0 }}>
                            {isOwner
                              ? "Click \"Create Event\" above to host your first group event."
                              : "There are currently no events scheduled for this group."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {tab === "members" && (
                    <MemberManagementPanel group={g} st={st} go={go} />
                  )}

                  {tab === "dashboard" && (
                    <GroupDashboard group={g} st={st} go={go} embedded={true} setTab={setTab} members={members} />
                  )}
                  {tab === "invites" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Invitations</h3>
                      <div className="form-card" style={{ padding: 20 }}>
                        <div style={{ display: "grid", gridTemplateColumns: g.visibility === "private" ? "1fr 1fr" : "1fr", gap: 16 }}>
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
                                  alert("Invitation email sent successfully!");
                                  setInviteEmail("");
                                  fetchInvites();
                                } else {
                                  alert((data.data?.[0]?.message) || data.message || "Failed to send invite");
                                }
                              }}>Send</button>
                            </div>
                          </div>
                          {g.visibility === "private" && (
                            <div>
                              <h4 style={{ margin: "0 0 8px 0", fontSize: 14 }}>Unlisted Group Link</h4>
                              {(() => {
                                const shareInvite = invites.find(inv => !inv.email && !inv.username && inv.status !== 'revoked');
                                const link = shareInvite ? `${window.location.origin}${window.location.pathname}#/groups/invite/${shareInvite.token}` : inviteLink;
                                if (!link) return <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Generating link…</div>;
                                return (
                                  <div style={{ display: "flex", gap: 8 }}>
                                    <input className="cinput" readOnly value={link} />
                                    <button className="hbtn hbtn--soft" onClick={async () => { await copyText(link); alert("Copied!"); }}>Copy</button>
                                  </div>
                                );
                              })()}
                            </div>
                          )}
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
                                <button className="hbtn hbtn--ghost hbtn--sm" onClick={async () => { await copyText(`${window.location.origin}${window.location.pathname}#/groups/invite/${inv.token}`); alert("Copied!"); }}>Copy Link</button>
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
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 600 }}>Forum Management</h3>
                        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)" }}>
                          Grant or revoke forum permissions for group members.
                        </p>
                      </div>

                      <div className="form-card" style={{ padding: 20 }}>
                        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                          <input
                            className="cinput"
                            placeholder="Search members..."
                            value={forumMemberSearch}
                            onChange={e => setForumMemberSearch(e.target.value)}
                            style={{ maxWidth: 300 }}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {members.filter(m => (m.name || m.username || "").toLowerCase().includes(forumMemberSearch.toLowerCase())).map(m => {
                            const hasCreate = forumMembers.some(fm => fm.user_id === m.id && fm.perm_type === 'create_thread');
                            const hasReply = forumMembers.some(fm => fm.user_id === m.id && fm.perm_type === 'reply_thread');

                            const threadPermSelected = g.settings?.forums?.threadPerm === 'selected';
                            const replyPermSelected = g.settings?.forums?.replyPerm === 'selected';

                            return (
                              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)" }}>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                  <Avatar name={m.name} userId={m.id} img={m.profilePhoto} size={36} />
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>@{m.username} ({m.role})</div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: threadPermSelected ? "pointer" : "default", opacity: threadPermSelected ? 1 : 0.5 }} title={!threadPermSelected ? `Thread creation is set to '${g.settings?.forums?.threadPerm || 'everyone'}' in settings` : ""}>
                                    <input
                                      type="checkbox"
                                      checked={!threadPermSelected ? (g.settings?.forums?.threadPerm === 'everyone' || g.settings?.forums?.threadPerm === 'members' || m.role === 'owner' || m.role === 'admin') : hasCreate}
                                      disabled={!threadPermSelected}
                                      onChange={async (e) => {
                                        if (e.target.checked) {
                                          await handleGrantForumPerm(m.id, 'create_thread');
                                        } else {
                                          await handleRevokeForumPerm(m.id, 'create_thread');
                                        }
                                      }}
                                    />
                                    Create Thread
                                  </label>

                                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: replyPermSelected ? "pointer" : "default", opacity: replyPermSelected ? 1 : 0.5 }} title={!replyPermSelected ? `Replying is set to '${g.settings?.forums?.replyPerm || 'everyone'}' in settings` : ""}>
                                    <input
                                      type="checkbox"
                                      checked={!replyPermSelected ? (g.settings?.forums?.replyPerm === 'everyone' || g.settings?.forums?.replyPerm === 'members' || m.role === 'owner' || m.role === 'admin') : hasReply}
                                      disabled={!replyPermSelected}
                                      onChange={async (e) => {
                                        if (e.target.checked) {
                                          await handleGrantForumPerm(m.id, 'reply_thread');
                                        } else {
                                          await handleRevokeForumPerm(m.id, 'reply_thread');
                                        }
                                      }}
                                    />
                                    Reply
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                          {members.filter(m => (m.name || m.username || "").toLowerCase().includes(forumMemberSearch.toLowerCase())).length === 0 && (
                            <div style={{ textAlign: "center", padding: 20, color: "var(--ink-3)" }}>
                              No members found.
                            </div>
                          )}
                        </div>
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
                    !canViewGallery ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--ink-3)", textAlign: "center" }}>
                        <I.lock style={{ width: 32, height: 32, marginBottom: 12, color: "var(--ink-3)" }} />
                        <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>Access Restricted</h4>
                        <p style={{ margin: 0 }}>You do not have permission to view the media gallery.</p>
                      </div>
                    ) : (
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
                      {!isMember && isPublicGroup && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Join this group to upload media.</span>
                          <button className="hbtn hbtn--primary hbtn--sm" onClick={handleJoinClick}>{isPending ? "Pending" : "Join group"}</button>
                        </div>
                      )}
                      {galleryItems.filter(item => callerIsAdmin || item.status === 'approved').length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border)" }}>
                          <I.image style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                          <h4 style={{ margin: "0 0 8px 0", color: "var(--ink)", fontSize: 16 }}>No media yet</h4>
                          <p style={{ margin: 0 }}>{canUpload ? "Be the first to share a photo or video." : "The group has no media uploads yet."}</p>
                        </div>
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                          {galleryItems.filter(item => callerIsAdmin || item.status === 'approved').map(item => (
                            <div key={item.id} style={{ position: "relative", borderRadius: "var(--r-sm)", overflow: "hidden", aspectRatio: "1", background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer" }} onClick={() => openMediaPreview(item)}>
                              {item.type === 'video' ? (
                                <video src={item.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline preload="metadata" />
                              ) : (
                                <img src={item.src} alt="gallery" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              )}
                              {callerIsAdmin && item.uploaderName && (
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(rgba(0,0,0,0.55),transparent)", color: "#fff", fontSize: 10, padding: "4px 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.uploaderName}
                                </div>
                              )}
                              {item.status === 'pending' && (
                                <div style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.65)", color: "#fff", borderRadius: 4, fontSize: 10, padding: "2px 6px", fontWeight: 600 }}>
                                  Pending
                                </div>
                              )}
                              {(callerIsAdmin || item.uploaderUserId === currentUserId) && (
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", gap: 4, padding: 6 }}>
                                  {callerIsAdmin && item.status === 'pending' && (
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
                  )
                )}
                </>
              )}
            </div>

            {tab !== "dashboard" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="side-card">
                  <h4>About</h4>
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
                    const targetRole = typeof m === 'object' ? (m.role || (m.roles ? getHighestRole(m.roles) : (i === 0 ? "group_owner" : i < 3 ? "group_moderator" : "group_member"))) : "group_member";
                    const mRole = targetRole.replace('group_', '');
                    return (
                      <div
                        key={m.id || mName}
                        className="member-row"
                        onClick={() => {
                          const targetUser = typeof m === 'object' && m.users ? m.users : (typeof m === 'object' ? m : { id: m.id, name: mName, username: mUsername.replace('@', '') });
                          if (targetUser && targetUser.id) {
                            go("public-profile", targetUser);
                          }
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <Avatar name={mName} userId={m.id || m.user_id} img={m.profilePhoto || m.users?.profilePhoto} size={32} />
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
            )}
          </div>
        </div>
      </div>



      {previewMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeMediaPreview}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 960, maxHeight: '90vh', background: 'var(--bg)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.35)' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeMediaPreview} className="tool" style={{ position: 'absolute', top: 16, right: 16, zIndex: 2, background: 'rgba(0,0,0,0.45)', borderRadius: 999, color: '#fff', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.x style={{ width: 18, height: 18 }} />
            </button>
            {previewMedia.type === 'video' ? (
              <video src={previewMedia.src} controls autoPlay style={{ display: 'block', width: '100%', maxHeight: '90vh', background: '#000' }} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', background: '#000', maxHeight: '90vh' }}>
                <img
                  src={previewMedia.src}
                  alt="Preview"
                  onDoubleClick={toggleImageZoom}
                  style={{
                    transform: `scale(${imageZoom})`,
                    transformOrigin: `${imageOrigin.x} ${imageOrigin.y}`,
                    transition: 'transform 0.15s ease',
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    cursor: 'zoom-in'
                  }}
                />
              </div>
            )}
            {previewMedia.type !== 'video' && (
              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10, background: 'rgba(0,0,0,0.45)', borderRadius: 999, padding: '8px 10px' }}>
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: '#fff' }} onClick={zoomOut} disabled={imageZoom <= 1}>-</button>
                <span style={{ color: '#fff', fontSize: 13, minWidth: 48, textAlign: 'center' }}>{Math.round(imageZoom * 100)}%</span>
                <button className="hbtn hbtn--ghost hbtn--sm" style={{ color: '#fff' }} onClick={zoomIn} disabled={imageZoom >= 3}>+</button>
              </div>
            )}
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
                  ) : q.type === 'multiselect' && q.options && q.options.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                      {q.options.map((opt, optIdx) => (
                        <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            value={opt}
                            checked={(answers[i] || []).includes(opt)}
                            onChange={(e) => {
                              const cur = answers[i] || [];
                              const next = e.target.checked ? [...cur, opt] : cur.filter(x => x !== opt);
                              setAnswers({ ...answers, [i]: next });
                            }}
                            style={{ margin: 0, cursor: 'pointer' }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : q.type === 'email' ? (
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'phone' ? (
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'date' ? (
                    <input
                      type="date"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
                  ) : q.type === 'time' ? (
                    <input
                      type="time"
                      value={answers[i] || ""}
                      onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                    />
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
                const isAnswered = (val) => Array.isArray(val) ? val.length > 0 : !!(val && String(val).trim());
                const requiredMissing = g.settings.questionnaires.some((q, i) => q.req && !isAnswered(answers[i]));
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

export function MyGroups({ go, param }) {
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
          <p style={{ fontSize: 12.5, color: "var(--ink-2)", margin: "8px 0 16px", flex: 1, lineBreak: "anywhere", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.description || g.desc}</p>
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

export function MemberManagementPanel({ group, st, go }) {
  const g = group || st.createdGroups[0];
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('group_member');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [groupSettings, setGroupSettings] = useState(g?.settings || {});
  const [availableRoles, setAvailableRoles] = useState([]);

  const roleHasCap = (roleKey, cap) => (availableRoles || []).find(r => r.key === roleKey)?.capabilities?.includes(cap);

  const [selectedMember, setSelectedMember] = useState(null);
  const QUESTIONNAIRE_INIT = { loading: false, error: null, hasForm: null, data: null };
  const [questionnaireData, setQuestionnaireData] = useState(QUESTIONNAIRE_INIT);

  const fetchMembers = React.useCallback(async () => {
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

    try {
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const [membRes, groupRes, rolesRes] = await Promise.all([
        fetch(`${apiBase}/api/groups/${g.id}/members`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
        fetch(`${apiBase}/api/groups/${g.id}`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }),
        fetch(`${apiBase}/api/groups/available-roles`, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
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
      const rolesData = await rolesRes.json();
      if (rolesData.success) {
        setAvailableRoles(rolesData.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [g?.id]);

  const fetchQuestionnaire = async (memberId) => {
    setQuestionnaireData({ ...QUESTIONNAIRE_INIT, loading: true });
    try {
      const token = localStorage.getItem('token');
      const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
      const res = await fetch(`${apiBase}/api/groups/${g.id}/members/${memberId}/questionnaire`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestionnaireData({ loading: false, error: null, hasForm: data.data.hasForm, data: data.data });
      } else {
        setQuestionnaireData({ loading: false, error: data.message || 'Failed to load', hasForm: null, data: null });
      }
    } catch {
      setQuestionnaireData({ loading: false, error: 'Network error. Please retry.', hasForm: null, data: null });
    }
  };

  const closeModal = () => {
    setSelectedMember(null);
    setQuestionnaireData(QUESTIONNAIRE_INIT);
  };
  React.useEffect(() => {
    if (g?.id) fetchMembers();
  }, [g?.id, fetchMembers]);

  React.useEffect(() => {
    if (!g?.id || !window.io) return;
    const apiBase = window.location.port === "8080" ? "http://localhost:3000" : "";
    const socketUrl = apiBase ? `${apiBase}/groups` : "/groups";
    const socket = window.io(socketUrl, { transports: ['websocket'] });

    socket.emit('join_group', g.id);

    socket.on('dashboard_updated', () => {
      fetchMembers();
    });

    return () => {
      socket.emit('leave_group', g.id);
      socket.disconnect();
    };
  }, [g?.id, fetchMembers]);

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
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to approve request.");
      }
    } catch (e) {
      alert("An error occurred while approving the request.");
    }
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
      {g.joinMode === 'approval' && requests.length > 0 && (currentUserRole === 'group_owner' || roleHasCap(currentUserRole, 'group.moderate') || roleHasCap(currentUserRole, 'group.manage')) && (
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

            const getRoleHierarchy = (role) => {
              const meta = (availableRoles || []).find(r => r.key === role);
              if (meta) return meta.hierarchy_level;
              if (role === 'group_owner') return 100;
              if (role === 'group_admin') return 110;
              if (role === 'group_moderator') return 120;
              return 1000;
            };

            const myLevel = getRoleHierarchy(currentUserRole);
            const theirLevel = getRoleHierarchy(targetRole);

            if (!isMe && myLevel < 1000) {
              if (myLevel < theirLevel) {
                showMakeOwner = currentUserRole === 'group_owner';
                showMakeAdmin = myLevel <= 110 && targetRole !== 'group_admin';
                showMakeMod = myLevel <= 120 && targetRole !== 'group_moderator';
                showMakeMember = myLevel <= 1000 && targetRole !== 'group_member';
                showRemove = true;
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

            const canViewResponses = currentUserRole === 'group_owner' || roleHasCap(currentUserRole, 'group.moderate') || roleHasCap(currentUserRole, 'group.manage');

            return (
              <div key={m.user_id} style={{ position: "relative", zIndex: openMenuId === m.user_id ? 50 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                  onClick={() => m.users && go("public-profile", m.users)}
                >
                  <Avatar name={m.users?.display_name || "Unknown"} userId={m.users?.id} img={m.users?.profilePhoto} size={40} />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.users?.display_name || "Unknown"}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>@{m.users?.username || "unknown"}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {canViewResponses && (
                    <button
                      className="hbtn hbtn--ghost hbtn--sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(m);
                        fetchQuestionnaire(m.user_id);
                      }}
                      title="View Join Responses"
                      style={{ padding: "4px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, height: 28 }}
                    >
                      Responses
                    </button>
                  )}
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
                          {showMakeOwner && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_owner')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Owner</button>}
                          {showMakeAdmin && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_admin')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Admin</button>}
                          {showMakeMod && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_moderator')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Moderator</button>}
                          {showMakeMember && <button className="menu-btn" onClick={() => handleRoleChange(m.user_id, 'group_member')} style={{ width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--ink)" }}>Make Member</button>}
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

      {selectedMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }} onClick={closeModal}>
          <div style={{ background: 'var(--bg)', width: '90%', maxWidth: 500, borderRadius: 12, display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={selectedMember.users?.display_name || "Unknown"} userId={selectedMember.users?.id} img={selectedMember.users?.profilePhoto} size={48} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{selectedMember.users?.display_name || "Unknown"}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>@{selectedMember.users?.username || "unknown"}</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: roleColors[getHighestRole(selectedMember.roles)] || 'var(--ink-2)' }}>Role: {roleLabels[getHighestRole(selectedMember.roles)]}</span>
                    <span style={{ color: 'var(--ink-3)' }}>|</span>
                    <span style={{ color: selectedMember.state === 'active' ? 'var(--accent)' : 'var(--accent-2)' }}>Status: {selectedMember.state === 'active' ? 'Approved' : 'Pending'}</span>
                  </div>
                  {questionnaireData.data?.submittedAt && (
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      Joined on: {new Date(questionnaireData.data.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <button className="tool" onClick={closeModal}>
                <I.x style={{ width: 20, height: 20 }} />
              </button>
            </div>

            <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px 0', color: 'var(--ink)' }}>Join Questionnaire Responses</h3>

              {questionnaireData.loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                  <div className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
                </div>
              )}

              {!questionnaireData.loading && questionnaireData.error && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32, gap: 12 }}>
                  <span style={{ color: '#ef4444', fontSize: 14 }}>{questionnaireData.error}</span>
                  <button className="hbtn hbtn--primary hbtn--sm" onClick={() => fetchQuestionnaire(selectedMember.user_id)}>Retry</button>
                </div>
              )}

              {!questionnaireData.loading && !questionnaireData.error && questionnaireData.hasForm === false && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--ink-3)', fontSize: 14 }}>
                  This group has no join questionnaire.
                </div>
              )}

              {!questionnaireData.loading && !questionnaireData.error && questionnaireData.data?.questions && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {questionnaireData.data.questions.map((q, idx) => (
                    <div key={q.fieldId} style={{ display: 'flex', flexDirection: 'column', borderBottom: idx < questionnaireData.data.questions.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx < questionnaireData.data.questions.length - 1 ? 16 : 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>Q{q.number}. {q.label} {q.required && <span style={{ color: '#ef4444' }}>*</span>}</span>
                      <div style={{ marginTop: 6, fontSize: 14, color: 'var(--ink)' }}>
                        {!q.answered ? (
                          <span style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>(No response submitted)</span>
                        ) : (q.type === 'multiple_choice' || q.type === 'multiselect') ? (
                          <ul style={{ margin: 0, paddingLeft: 20 }}>
                            {q.answer.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        ) : q.type === 'checkbox' ? (
                          <span>{q.answer ? 'Yes' : 'No'}</span>
                        ) : (
                          <span style={{ whiteSpace: 'pre-wrap' }}>{String(q.answer)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


