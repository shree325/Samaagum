import React from 'react';

interface VoteWidgetProps {
  score: number;
  userVote: number;
  onUpvote: () => void;
  onDownvote: () => void;
}

export function VoteWidget({ score, userVote, onUpvote, onDownvote }: VoteWidgetProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 32 }}>
      <button onClick={e => { e.stopPropagation(); onUpvote(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 15, fontWeight: 800, color: userVote === 1 ? "var(--accent-2)" : "var(--ink-3)", lineHeight: 1 }} title="Upvote">▲</button>
      <span style={{ fontSize: 13, fontWeight: 700, color: score > 0 ? "var(--accent-2)" : score < 0 ? "#e74c3c" : "var(--ink-3)", minWidth: 20, textAlign: "center" }}>{score}</span>
      <button onClick={e => { e.stopPropagation(); onDownvote(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 6px", fontSize: 15, fontWeight: 800, color: userVote === -1 ? "#e74c3c" : "var(--ink-3)", lineHeight: 1 }} title="Downvote">▼</button>
    </div>
  );
}
