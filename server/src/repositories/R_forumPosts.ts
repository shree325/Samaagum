// @ts-nocheck
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IForumPost, IR_forumPosts } from './IR_forumPosts';
import prisma from '../config/prisma';

export class R_forumPosts extends PostgresBaseRepository<IForumPost> implements IR_forumPosts {
  constructor() {
    super('forum_posts', 'id');
  }

  async findByAuthorUserId(authorUserId: string): Promise<IForumPost[]> {
    const query = `SELECT * FROM forum_posts WHERE author_user_id = $1`;
    const { rows } = await prisma.query(query, [authorUserId]);
    return rows;
  }

  async findByScope(scopeType: string, scopeId: string): Promise<IForumPost[]> {
    const query = `SELECT * FROM forum_posts WHERE scope_type = $1 AND scope_id = $2`;
    const { rows } = await prisma.query(query, [scopeType, scopeId]);
    return rows;
  }

  async getGroupPostsRaw(groupId: string, userId: string | null, limit: number, skip: number, orderBy: string, whereExtra: string, queryParams: any[]): Promise<any[]> {
    const safeUserId = userId || '00000000-0000-0000-0000-000000000000';
    return await prisma.$queryRawUnsafe(`
        SELECT
            fp.id, fp.title, fp.body, fp.pinned, fp.locked, fp.solved, fp.archived,
            fp.view_count, fp.status, fp.created_at, fp.updated_at, fp.deleted_at,
            fp.author_user_id, fp.scope_type, fp.scope_id,
            u.first_name, u.last_name, u.primary_email, u.profile_image_data,
            COALESCE(SUM(fv.vote), 0)::int AS vote_score,
            (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote,
            COUNT(DISTINCT fc.id)::int AS comments_count
        FROM forum_posts fp
        LEFT JOIN users u ON u.id = fp.author_user_id
        LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
        LEFT JOIN forum_comments fc ON fc.post_id = fp.id AND fc.deleted_at IS NULL
        WHERE fp.scope_type = 'group' AND fp.scope_id = $1::uuid AND fp.deleted_at IS NULL${whereExtra}
        GROUP BY fp.id, u.first_name, u.last_name, u.primary_email, u.profile_image_data
        ORDER BY ${orderBy}
        LIMIT $3 OFFSET $4
    `, groupId, safeUserId, limit, skip, ...queryParams);
  }

  async getEventPostsRaw(eventId: string, userId: string | null, limit: number, skip: number, orderBy: string, whereExtra: string, queryParams: any[], isPrivileged?: boolean): Promise<any[]> {
    // Privileged users (owners/hosts/admins) see all posts incl. hidden (pending approval).
    // Regular users see active posts OR their own hidden posts (so author sees their pending thread).
    const statusFilter = isPrivileged
      ? `AND fp.status IN ('active', 'hidden')`
      : userId
        ? `AND (fp.status = 'active' OR (fp.status = 'hidden' AND fp.author_user_id = $2::uuid))`
        : `AND fp.status = 'active'`;

    return await prisma.$queryRawUnsafe(`
        SELECT
            fp.id, fp.title, fp.body, fp.pinned, fp.locked, fp.solved, fp.archived,
            fp.view_count, fp.status, fp.created_at, fp.updated_at, fp.deleted_at,
            fp.author_user_id, fp.scope_type, fp.scope_id,
            u.first_name, u.last_name, u.primary_email, u.profile_image_data,
            COALESCE(SUM(fv.vote), 0)::int AS vote_score,
            (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote,
            COUNT(DISTINCT fc.id)::int AS comments_count
        FROM forum_posts fp
        LEFT JOIN users u ON u.id = fp.author_user_id
        LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
        LEFT JOIN forum_comments fc ON fc.post_id = fp.id AND fc.deleted_at IS NULL
        WHERE fp.scope_type = 'event' AND fp.scope_id = $1::uuid AND fp.deleted_at IS NULL ${statusFilter}${whereExtra}
        GROUP BY fp.id, u.first_name, u.last_name, u.primary_email, u.profile_image_data
        ORDER BY ${orderBy}
        LIMIT $3 OFFSET $4
    `, eventId, userId, limit, skip, ...queryParams);
  }

  async getReactionCounts(postIds: string[]): Promise<any[]> {
    return await prisma.$queryRawUnsafe(`
        SELECT target_id, emoji, COUNT(*)::int AS cnt
        FROM forum_reactions
        WHERE target_id = ANY($1::uuid[]) AND target_type = 'post'
        GROUP BY target_id, emoji
    `, postIds);
  }

  async getTagRows(postIds: string[]): Promise<any[]> {
    return await prisma.$queryRawUnsafe(`
        SELECT fpt.post_id, ft.id AS tag_id, ft.name, ft.color
        FROM forum_post_tags fpt
        JOIN forum_tags ft ON ft.id = fpt.tag_id
        WHERE fpt.post_id = ANY($1::uuid[])
    `, postIds);
  }

  async updatePostRaw(postId: string, body: string, title: string | null): Promise<void> {
    await prisma.$executeRawUnsafe(`UPDATE forum_posts SET body=$1, title=$2 WHERE id=$3::uuid`, body, title || null, postId);
  }

  async softDeletePost(postId: string): Promise<void> {
    await prisma.$executeRawUnsafe(`UPDATE forum_posts SET deleted_at = NOW() WHERE id = $1::uuid`, postId);
  }

  async getPostWithAuthorAndVotes(postId: string, userId: string | null, groupId: string): Promise<any> {
    const safeUserId = userId || '00000000-0000-0000-0000-000000000000';
    const postRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT fp.*, u.first_name, u.last_name, u.primary_email, u.profile_image_data,
            COALESCE(SUM(fv.vote), 0)::int AS vote_score,
            (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote
        FROM forum_posts fp
        LEFT JOIN users u ON u.id = fp.author_user_id
        LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
        WHERE fp.id = $1::uuid AND fp.scope_type = 'group' AND fp.scope_id = $3::uuid AND fp.deleted_at IS NULL
        GROUP BY fp.id, u.first_name, u.last_name, u.primary_email, u.profile_image_data
    `, postId, safeUserId, groupId);
    return postRows[0] || null;
  }

  async getEventPostWithAuthorAndVotes(postId: string, userId: string | null, eventId: string): Promise<any> {
    const postRows: any[] = await prisma.$queryRawUnsafe(`
        SELECT fp.*, u.first_name, u.last_name, u.primary_email, u.profile_image_data,
            COALESCE(SUM(fv.vote), 0)::int AS vote_score,
            (SELECT fv2.vote FROM forum_votes fv2 WHERE fv2.target_id = fp.id AND fv2.target_type = 'post' AND fv2.user_id = $2::uuid LIMIT 1) AS user_vote
        FROM forum_posts fp
        LEFT JOIN users u ON u.id = fp.author_user_id
        LEFT JOIN forum_votes fv ON fv.target_id = fp.id AND fv.target_type = 'post'
        WHERE fp.id = $1::uuid AND fp.scope_type = 'event' AND fp.scope_id = $3::uuid AND fp.deleted_at IS NULL
        GROUP BY fp.id, u.first_name, u.last_name, u.primary_email, u.profile_image_data
    `, postId, userId, eventId);
    return postRows[0] || null;
  }

  async incrementViewCount(postId: string): Promise<void> {
    await prisma.$executeRawUnsafe(`UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1::uuid`, postId);
  }

  async getPostReactions(postId: string): Promise<any[]> {
    return await prisma.$queryRawUnsafe(`
        SELECT emoji, COUNT(*)::int AS cnt FROM forum_reactions
        WHERE target_id = $1::uuid AND target_type = 'post' GROUP BY emoji
    `, postId);
  }

  async getPostTags(postId: string): Promise<any[]> {
    return await prisma.$queryRawUnsafe(`
        SELECT ft.id, ft.name, ft.color FROM forum_post_tags fpt
        JOIN forum_tags ft ON ft.id = fpt.tag_id WHERE fpt.post_id = $1::uuid
    `, postId);
  }

  async updateSolveStatus(postId: string, solved: boolean): Promise<void> {
    await prisma.forum_posts.update({ where: { id: postId }, data: { solved } });
  }

  async updateArchiveStatus(postId: string, archived: boolean): Promise<void> {
    await prisma.forum_posts.update({ where: { id: postId }, data: { archived } });
  }

  async updatePinStatus(postId: string, pinned: boolean): Promise<void> {
    await prisma.forum_posts.updateMany({ where: { id: postId }, data: { pinned } });
  }

  async updateLockStatus(postId: string, locked: boolean): Promise<void> {
    await prisma.forum_posts.updateMany({ where: { id: postId }, data: { locked } });
  }
}
