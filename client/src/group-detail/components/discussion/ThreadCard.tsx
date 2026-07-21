import React from 'react';
import { Avatar, I } from '../../../home-icons';
import { getRelativeTime } from '../../utils/date';
import { VoteWidget } from './VoteWidget';
import { TagPill } from './TagPill';
import { Post } from '../../types';

interface ThreadCardProps {
  p: Post;
  onOpen: (post: Post) => void;
  voteData: { score: number; userVote: number } | undefined;
  onVote: (postId: string, vote: number) => void;
  reactions: Record<string, number> | undefined;
  onReact: (postId: string, emoji: string) => void;
  isLiked: boolean;
  onLike: (postId: string) => void;
  canApprove?: boolean;
  onApprove?: (postId: string) => void;
  onDecline?: (postId: string) => void;
}

export function ThreadCard({ p, onOpen, voteData, onVote, reactions, onReact, isLiked, onLike, canApprove, onApprove, onDecline }: ThreadCardProps) {
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
          {p.view_count !== undefined && p.view_count > 0 && <span>{p.view_count} views</span>}
          {/* Like button */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onLike && onLike(p.id); }}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 20, color: isLiked ? "#e0245e" : "var(--ink-3)", fontWeight: isLiked ? 700 : 400, fontSize: 13, transition: "all 0.15s" }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>{isLiked ? "❤️" : "🤍"}</span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          
          {p.status === 'hidden' && canApprove && (
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onApprove && onApprove(p.id); }}
                style={{ padding: '2px 10px', fontSize: 12, borderRadius: 12, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Approve
              </button>
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); onDecline && onDecline(p.id); }}
                style={{ padding: '2px 10px', fontSize: 12, borderRadius: 12, border: '1px solid #e74c3c', background: 'transparent', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}
              >
                Decline
              </button>
            </div>
          )}
          {p.status === 'hidden' && !canApprove && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: '#f39c12', padding: '2px 8px', borderRadius: 12, border: '1px solid #f39c12' }}>
              Pending Approval
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
