import React from 'react';
import { TAG_COLORS } from '../../utils/constants';

interface TagPillProps {
  tag: string;
}

export function TagPill({ tag }: TagPillProps) {
  const c = TAG_COLORS[tag] || TAG_COLORS.General;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 12, display: "inline-block", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>{tag}</span>
  );
}
