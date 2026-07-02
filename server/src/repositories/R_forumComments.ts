// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumComment, IR_forumComments } from './IR_forumComments';
import prisma from '../config/prisma';

export class R_forumComments extends PostgresBaseRepository<IForumComment> implements IR_forumComments {
  constructor() {
    super('forum_comments', 'id');
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

  async getRecursiveComments(postId: string, userId: string | null): Promise<any[]> {
    const safeUserId = userId || '00000000-0000-0000-0000-000000000000';
    return await prisma.$queryRawUnsafe(`
        WITH RECURSIVE comment_tree AS (
            SELECT fc.id, fc.post_id, fc.parent_id, fc.author_user_id, fc.body, fc.status,
                   fc.deleted_at, fc.created_at, fc.updated_at, 0 AS depth
            FROM forum_comments fc
            WHERE fc.post_id = $1::uuid AND fc.parent_id IS NULL AND fc.deleted_at IS NULL
            UNION ALL
            SELECT fc.id, fc.post_id, fc.parent_id, fc.author_user_id, fc.body, fc.status,
                   fc.deleted_at, fc.created_at, fc.updated_at, ct.depth + 1
            FROM forum_comments fc
            JOIN comment_tree ct ON ct.id = fc.parent_id
            WHERE fc.deleted_at IS NULL
        )
        SELECT ct.*,
               u.first_name, u.last_name, u.primary_email,
               COALESCE(SUM(fv.vote), 0)::int AS vote_score,
               (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = ct.id AND fv2.target_type = 'comment' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote
        FROM comment_tree ct
        LEFT JOIN users u ON u.id = ct.author_user_id
        LEFT JOIN forum_votes fv ON fv.target_id = ct.id AND fv.target_type = 'comment'
        GROUP BY ct.id, ct.post_id, ct.parent_id, ct.author_user_id, ct.body, ct.status,
                 ct.deleted_at, ct.created_at, ct.updated_at, ct.depth,
                 u.first_name, u.last_name, u.primary_email
        ORDER BY ct.depth ASC, ct.created_at ASC
    `, postId, safeUserId);
  }

  async updateCommentRaw(commentId: string, body: string): Promise<void> {
    await prisma.$executeRawUnsafe(`UPDATE forum_comments SET body=$1 WHERE id=$2::uuid`, body, commentId);
  }

  async softDeleteComment(commentId: string): Promise<void> {
    await prisma.$executeRawUnsafe(`UPDATE forum_comments SET deleted_at = NOW() WHERE id = $1::uuid`, commentId);
  }
}
