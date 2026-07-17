import React from 'react';
export interface Group {
  id: string;
  entity_id?: string;
  name: string;
  owner: string;
  visibility: 'public' | 'private';
  online?: number;
  posts?: number;
  cat?: string;
  cover?: string;
  banner?: string;
  icon?: string | React.ReactNode;
  joinMode?: 'open' | 'invite_only' | 'approval';
  isFull?: boolean;
  hasWaitlist?: boolean;
  memberNames?: any[];
  forumPermissions?: string[];
  rules?: string;
  description?: string;
  desc?: string;
  settings?: {
    forums?: {
      enabled?: boolean;
      threadPerm?: 'everyone' | 'members' | 'selected' | 'admins';
      replyPerm?: 'everyone' | 'members' | 'selected' | 'admins';
      threadRoles?: { public?: boolean };
      replyRoles?: { public?: boolean };
    };
    gallery?: {
      enabled?: boolean;
      imageOnly?: boolean;
      videoOnly?: boolean;
      approve?: boolean;
      allow?: boolean;
      viewRoles?: { public?: boolean; roles: string[] };
    };
    location?: any;
    city?: string;
    rules?: string;
    capacity?: {
      limit?: boolean;
      max?: number;
      waitlist?: boolean;
    };
    questionnaires?: Array<{
      q: string;
      req?: boolean;
      type: string;
      options?: string[];
      id?: string;
    }>;
    isArchived?: boolean;
    isDraft?: boolean;
  };
}

export interface Post {
  id: string;
  title?: string;
  body?: string;
  created_at?: string;
  author_name?: string;
  author_username?: string;
  author_user_id?: string;
  author_photo?: string;
  comments_count?: number;
  vote_score?: number;
  user_vote?: number;
  reactions?: Record<string, number>;
  tags?: Array<{ id: string | number; name: string }>;
  pinned?: boolean;
  locked?: boolean;
  solved?: boolean;
  archived?: boolean;
  view_count?: number;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  parent_id?: string;
  body: string;
  created_at?: string;
  author_name?: string;
  author_username?: string;
  author_user_id?: string;
  author_photo?: string;
  vote_score?: number;
  user_vote?: number;
  replies?: Comment[];
}
