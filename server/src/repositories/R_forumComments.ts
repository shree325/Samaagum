import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumComment, IR_forumComments } from './IR_forumComments';
import prisma from '../config/prisma';

export class R_forumComments extends PostgresBaseRepository<IForumComment> implements IR_forumComments {
  constructor() {
    super('forum_comments', 'comment_id');
  }

  async findByPostId(postId: string): Promise<IForumComment[]> {
    const query = `SELECT * FROM forum_comments WHERE post_id = $1 ORDER BY created_at ASC`;
    const { rows } = await prisma.query(query, [postId]);
    return rows;
  }

  async findByAuthorUserId(authorUserId: string): Promise<IForumComment[]> {
    const query = `SELECT * FROM forum_comments WHERE author_user_id = $1`;
    const { rows } = await prisma.query(query, [authorUserId]);
    return rows;
  }
}
