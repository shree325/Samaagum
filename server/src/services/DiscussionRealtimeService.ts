import prisma from '../config/prisma';
import { R_forumPosts } from '../repositories/R_forumPosts';
import { EventService } from './EventService';

export interface DiscussionThread {
    id: string;
    title: string | null;
    body: string | null;
    pinned: boolean;
    locked: boolean;
    solved: boolean;
    archived: boolean;
    view_count: number;
    status: string;
    created_at: Date;
    updated_at: Date | null;
    author_user_id: string;
    author_name: string;
    author_username: string;
    author_photo: string | null;
    vote_score: number;
    user_vote?: number; // Only in REST response
    comments_count: number;
    reactions: Record<string, number>;
    tags: Array<{ id: string, name: string, color: string }>;
    replies: any[]; // nested comments
}

export interface DiscussionPayload {
    version: 1;
    eventId: string;
    threads: DiscussionThread[];
    counts: {
        threads: number;
        replies: number;
    };
    permissions?: {
        canCreate: boolean;
        canReply: boolean;
        canModerate: boolean;
    };
    generatedAt: string;
}

export class DiscussionRealtimeService {
    private static forumPostsRepo = new R_forumPosts();

    static async buildPayload(eventId: string, requestingUser?: any): Promise<DiscussionPayload> {
        const userId = requestingUser?.id || null;

        const isPrivileged = userId ? await EventService.verifyEventHostOrCoHost(userId, eventId) : false;
        
        // 1. Fetch threads (forum_posts)
        let whereClause: any = {
            scope_type: 'event',
            scope_id: eventId,
            deleted_at: null,
            status: isPrivileged ? { in: ['active', 'hidden'] } : 'active'
        };

        const threadsRaw = await prisma.forum_posts.findMany({
            where: whereClause,
            orderBy: [
                { pinned: 'desc' },
                { updated_at: 'desc' }, // fallback for pinned ordering
                { created_at: 'desc' }
            ],
            take: 100,
            include: {
                users: {
                    select: { first_name: true, last_name: true, primary_email: true, profile_image_data: true }
                }
            }
        });

        const postIds = threadsRaw.map(t => t.id);

        // 2. Bulk fetch reactions, tags
        const reactionMap: Record<string, Record<string, number>> = {};
        const tagMap: Record<string, any[]> = {};
        
        let commentsRaw: any[] = [];

        if (postIds.length > 0) {
            const reactionRows = await this.forumPostsRepo.getReactionCounts(postIds);
            reactionRows.forEach((r: any) => {
                const pid = String(r.target_id);
                if (!reactionMap[pid]) reactionMap[pid] = {};
                reactionMap[pid][r.emoji] = Number(r.cnt);
            });

            const tagRows = await this.forumPostsRepo.getTagRows(postIds);
            tagRows.forEach((r: any) => {
                const pid = String(r.post_id);
                if (!tagMap[pid]) tagMap[pid] = [];
                tagMap[pid].push({ id: String(r.tag_id), name: r.name, color: r.color });
            });

            // 3. Fetch comments (forum_comments) for these threads
            commentsRaw = await prisma.forum_comments.findMany({
                where: {
                    post_id: { in: postIds },
                    deleted_at: null,
                    status: 'active'
                },
                orderBy: { created_at: 'asc' },
                include: {
                    users: {
                        select: { first_name: true, last_name: true, primary_email: true, profile_image_data: true }
                    }
                }
            });
        }

        // Map comments to objects and build tree
        const commentsMap = new Map<string, any>();
        
        for (const c of commentsRaw) {
            const user = (c as any).users || {} as any;
            const username = user.primary_email ? user.primary_email.split('@')[0] : 'unknown';
            const name = (`${user.first_name || ''} ${user.last_name || ''}`).trim() || username || 'Unknown User';
            const cid = String(c.id);
            
            commentsMap.set(cid, {
                id: cid,
                body: c.body,
                created_at: c.created_at,
                updated_at: c.updated_at,
                author_user_id: c.author_user_id,
                author_name: name,
                author_username: username,
                author_photo: user.profile_image_data || null,
                vote_score: 0, // usually comments have their own votes in forum_comment_votes if used
                replies: [],
                post_id: c.post_id,
                parent_id: c.parent_id
            });
        }

        // Build comment tree per post
        const commentsByPost: Record<string, any[]> = {};
        for (const pid of postIds) {
            commentsByPost[pid] = [];
        }

        let totalReplies = 0;
        for (const c of commentsRaw) {
            const cid = String(c.id);
            const node = commentsMap.get(cid);
            totalReplies++;
            
            if (c.parent_id) {
                const parentNode = commentsMap.get(String(c.parent_id));
                if (parentNode) {
                    parentNode.replies.push(node);
                } else {
                    // fallback if parent deleted
                    commentsByPost[String(c.post_id)].push(node);
                }
            } else {
                commentsByPost[String(c.post_id)].push(node);
            }
        }

        // Build threads
        const threads: DiscussionThread[] = threadsRaw.map(t => {
            const user = (t as any).users || {} as any;
            const username = user.primary_email ? user.primary_email.split('@')[0] : 'unknown';
            const name = (`${user.first_name || ''} ${user.last_name || ''}`).trim() || username || 'Unknown User';
            const pid = String(t.id);
            
            return {
                id: pid,
                title: t.title,
                body: t.body,
                pinned: t.pinned,
                locked: t.locked,
                solved: t.solved,
                archived: t.archived,
                view_count: Number(t.view_count || 0),
                status: t.status,
                created_at: t.created_at,
                updated_at: t.updated_at,
                author_user_id: t.author_user_id,
                author_name: name,
                author_username: username,
                author_photo: user.profile_image_data || null,
                vote_score: 0, // vote_score usually aggregated from forum_reactions / upvotes
                comments_count: commentsByPost[pid] ? commentsByPost[pid].length : 0, // top-level count or total?
                reactions: reactionMap[pid] || {},
                tags: tagMap[pid] || [],
                replies: commentsByPost[pid] || []
            };
        });

        const payload: DiscussionPayload = {
            version: 1,
            eventId,
            threads: threads,
            counts: {
                threads: threads.length,
                replies: totalReplies
            },
            generatedAt: new Date().toISOString()
        };

        if (requestingUser) {
            const event = await prisma.events.findUnique({ where: { id: eventId }, select: { venue: true } });
            const meta = ((event?.venue as any)?.meta) || {};
            const disc = meta.discussion || {};
            
            const isManager = await EventService.verifyEventHostOrCoHost(userId, eventId);
            const isMember = await prisma.attendees.findFirst({
                where: { user_id: userId, bookings: { status: 'confirmed', event_id: eventId } }
            }).then(Boolean);

            payload.permissions = {
                canCreate: isManager || isMember,
                canReply: isManager || isMember,
                canModerate: isManager
            };
        }

        return payload;
    }
}
