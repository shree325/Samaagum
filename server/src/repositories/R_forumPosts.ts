import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumPost, IR_forumPosts } from './IR_forumPosts';
import pool from '../config/database';

export class R_forumPosts extends PostgresBaseRepository<IForumPost> implements IR_forumPosts {
  constructor() {
    super('forum_posts', 'post_id');
  }

  async findByAuthorUserId(authorUserId: string): Promise<IForumPost[]> {
    const query = `SELECT * FROM forum_posts WHERE author_user_id = $1`;
    const { rows } = await pool.query(query, [authorUserId]);
    return rows;
  }

  async findByScope(scopeType: string, scopeId: string): Promise<IForumPost[]> {
    const query = `SELECT * FROM forum_posts WHERE scope_type = $1 AND scope_id = $2`;
    const { rows } = await pool.query(query, [scopeType, scopeId]);
    return rows;
  }
}
