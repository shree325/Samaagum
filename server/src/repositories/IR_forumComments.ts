import { IBaseRepository } from './IBaseRepository';

export interface IForumComment {
  id?: string;
  post_id: string;
  author_user_id: string;
  body: string;
  status?: string;
  created_by_user_id?: string | null;
  updated_by_user_id?: string | null;
  modification_num?: number;
  created_at?: Date;
  updated_at?: Date;
  parent_id?: string | null;
}

export interface IR_forumComments extends IBaseRepository<IForumComment> {
  findByPostId(postId: string): Promise<IForumComment[]>;
  findByAuthorUserId(authorUserId: string): Promise<IForumComment[]>;
  getRecursiveComments(postId: string, userId: string | null): Promise<any[]>;
  updateCommentRaw(commentId: string, body: string): Promise<void>;
  softDeleteComment(commentId: string): Promise<void>;
}
