import { IBaseRepository } from './IBaseRepository';

export interface IForumPost {
  post_id?: string;
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
}

export interface IR_forumPosts extends IBaseRepository<IForumPost> {
  findByAuthorUserId(authorUserId: string): Promise<IForumPost[]>;
  findByScope(scopeType: string, scopeId: string): Promise<IForumPost[]>;
}
