import { IBaseRepository } from './IBaseRepository';

export interface IForumPost {
  id?: string;
  tenant_id: string;
  author_user_id: string;
  scope_type: string;
  scope_id?: string | null;
  title: string;
  body: string;
  pinned?: boolean;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
  solved?: boolean;
  locked?: boolean;
  archived?: boolean;
}

export interface IR_forumPosts extends IBaseRepository<IForumPost> {
  findByAuthorUserId(authorUserId: string): Promise<IForumPost[]>;
  findByScope(scopeType: string, scopeId: string): Promise<IForumPost[]>;
  getGroupPostsRaw(groupId: string, userId: string | null, limit: number, skip: number, orderBy: string, whereExtra: string, queryParams: any[]): Promise<any[]>;
  getReactionCounts(postIds: string[]): Promise<any[]>;
  getTagRows(postIds: string[]): Promise<any[]>;
  updatePostRaw(postId: string, body: string, title: string | null): Promise<void>;
  softDeletePost(postId: string): Promise<void>;
  getPostWithAuthorAndVotes(postId: string, userId: string | null, groupId: string): Promise<any>;
  incrementViewCount(postId: string): Promise<void>;
  getPostReactions(postId: string): Promise<any[]>;
  getPostTags(postId: string): Promise<any[]>;
  updateSolveStatus(postId: string, solved: boolean): Promise<void>;
  updateArchiveStatus(postId: string, archived: boolean): Promise<void>;
  updatePinStatus(postId: string, pinned: boolean): Promise<void>;
  updateLockStatus(postId: string, locked: boolean): Promise<void>;
}
