// @ts-nocheck
import { R_events } from '../repositories/R_events';
import { R_ticket_types } from '../repositories/R_ticket_types';
import { R_forumPosts } from '../repositories/R_forumPosts';
import { R_forumComments } from '../repositories/R_forumComments';
import { R_forum_reactions } from '../repositories/R_forum_reactions';
import { R_forum_votes } from '../repositories/R_forum_votes';
import { R_forum_tags } from '../repositories/R_forum_tags';
import { R_forum_post_tags } from '../repositories/R_forum_post_tags';
import { R_users } from '../repositories/R_users';
import prisma from '../config/prisma';

export class EventService {
  private static eventsRepo = new R_events(prisma);
  private static ticketTypesRepo = new R_ticket_types(prisma);
  private static forumPostsRepo = new R_forumPosts();
  private static forumCommentsRepo = new R_forumComments();
  private static postTagsRepo = new R_forum_post_tags();
  private static tagsRepo = new R_forum_tags();
  private static votesRepo = new R_forum_votes();
  private static reactionsRepo = new R_forum_reactions();
  private static usersRepo = new R_users(prisma);

  static async createEvent(userId: string, tenantId: string, body: any) {
    // 1. Resolve hosted_by_entity_id (the user's own entity or chosen group)
    let hostedByEntityId = body.host_entity_id;

    if (!hostedByEntityId || hostedByEntityId === 'standalone') {
      const entityRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM entities WHERE user_id = $1::uuid AND entity_type = 'user' LIMIT 1`,
        userId
      );
      hostedByEntityId = entityRows[0]?.id;

      if (!hostedByEntityId) {
        // Fallback: create a user entity if one does not exist
        const newEntity = await prisma.$queryRawUnsafe<{ id: string }[]>(
          `INSERT INTO entities (tenant_id, entity_type, user_id, status, visibility)
           VALUES ($1::uuid, 'user', $2::uuid, 'active', 'public')
           RETURNING id`,
          tenantId, userId
        );
        hostedByEntityId = newEntity[0].id;
      }
    }

    // 2. Perform transactional event + tickets creation
    const event = await this.eventsRepo.create({
      tenant_id: tenantId,
      hosted_by_entity_id: hostedByEntityId,
      title: body.title,
      description: body.description,
      status: body.status || 'published',
      starts_at: body.starts_at ? new Date(body.starts_at) : null,
      ends_at: body.ends_at ? new Date(body.ends_at) : null,
      venue_timezone: body.venue_timezone,
      location_type: body.location_type,
      venue: body.venue,
      online_link: body.online_link,
      capacity_total: body.capacity_total,
      registration_mode: body.registration_mode === 'free' ? 'free_rsvp' : (body.registration_mode || 'free_rsvp'),
      approval_required: body.approval_required || false,
      instruction: body.instruction,
    });

    const tickets = body.tickets || [];
    const createdTickets = [];

    for (const t of tickets) {
      const ticketType = await this.ticketTypesRepo.create({
        tenant_id: tenantId,
        event_id: event.id!,
        name: t.name,
        description: t.description || null,
        price_minor: t.price_minor || 0,
        currency: 'INR',
        capacity: t.capacity || null,
        quantity_sold: 0,
        is_active: true,
        status: 'active',
        sort_order: t.sort_order || 0,
        created_by: userId,
        updated_by: userId,
      });
      createdTickets.push(ticketType);
    }

    return { event, tickets: createdTickets };
  }

  static async getPublicEvents(tenantId: string) {
    const list = await this.eventsRepo.getByStatus(tenantId, 'published');
    const enrichedList = [];
    for (const ev of list) {
      const tickets = await this.ticketTypesRepo.getByEventId(ev.id!);
      enrichedList.push({ ...ev, tickets });
    }
    return enrichedList;
  }

  static async getUserEvents(userId: string) {
    const entityRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM entities WHERE user_id = $1::uuid AND entity_type = 'user' LIMIT 1`,
      userId
    );
    const hostedByEntityId = entityRows[0]?.id;
    if (!hostedByEntityId) return [];

    const list = await this.eventsRepo.getByHostEntity(hostedByEntityId);
    const enrichedList = [];
    for (const ev of list) {
      const tickets = await this.ticketTypesRepo.getByEventId(ev.id!);
      enrichedList.push({ ...ev, tickets });
    }
    return enrichedList;
  }

  static async getEventById(id: string) {
    const event = await this.eventsRepo.getById(id);
    if (!event) return null;
    const tickets = await this.ticketTypesRepo.getByEventId(id);
    return { event, tickets };
  }

  static async verifyEventHostOrCoHost(userId: string, eventId: string): Promise<boolean> {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return false;
    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id === userId) return true;

    const assignment = await prisma.event_team_assignments.findFirst({
      where: {
        event_id: eventId,
        user_id: userId,
        state: 'active',
        roles: {
          key: { in: ['event_host', 'event_cohost'] }
        }
      },
      include: { roles: true }
    });
    return !!assignment;
  }

  static async updateEvent(id: string, userId: string, body: any) {
    const event = await this.eventsRepo.getById(id);
    if (!event) throw new Error('Event not found');

    const isAuthorized = await this.verifyEventHostOrCoHost(userId, id);
    if (!isAuthorized) {
      throw new Error('Forbidden: You do not have permission to edit this event');
    }

    const updated = await this.eventsRepo.update(id, {
      title: body.title,
      description: body.description,
      status: body.status,
      starts_at: body.starts_at ? new Date(body.starts_at) : undefined,
      ends_at: body.ends_at ? new Date(body.ends_at) : undefined,
      capacity_total: body.capacity_total,
      registration_mode: body.registration_mode,
      approval_required: body.approval_required,
      location_type: body.location_type,
      venue: body.venue,
      online_link: body.online_link,
      instruction: body.instruction,
    });

    return updated;
  }

  static async deleteEvent(id: string, userId: string) {
    const event = await this.eventsRepo.getById(id);
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id !== userId) {
      throw new Error('Forbidden: You do not own this event');
    }

    // Soft-delete
    await this.eventsRepo.update(id, { status: 'cancelled' });
  }

  static async publishDraft(id: string, userId: string) {
    const event = await this.eventsRepo.getById(id);
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id !== userId) {
      throw new Error('Forbidden: You do not own this event');
    }

    const updated = await this.eventsRepo.update(id, { status: 'published' });
    return updated;
  }

  static async verifyEventAdmin(userId: string, eventId: string): Promise<boolean> {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return false;
    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id === userId) return true;

    // Check if user is the group owner via role assignments
    const ownerRole = await prisma.roles.findFirst({
      where: { key: 'group_owner' }
    });
    if (ownerRole) {
      const assignment = await prisma.role_assignments.findFirst({
        where: {
          scope_entity_id: event.hosted_by_entity_id,
          role_id: ownerRole.id,
          user_id: userId
        }
      });
      if (assignment) return true;
    }

    const assignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: userId, state: 'active' }
    });
    return !!assignment;
  }

  static async getEventPosts(eventId: string, query: any, requestingUser?: any) {
    const { page = 1, limit = 20, sort = 'new', tag, q } = query;

    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const userId = requestingUser?.id || null;
    const skip = (Number(page) - 1) * Number(limit);
    const lim = Number(limit);

    const allowedSorts: Record<string, string> = {
      new: 'fp.created_at DESC',
      hot: 'vote_score DESC, fp.created_at DESC',
      top: 'vote_score DESC',
      pinned: 'fp.pinned DESC, fp.created_at DESC',
    };
    const orderBy = allowedSorts[sort] || allowedSorts['new'];

    const queryParams: any[] = [];
    let whereExtra = '';
    if (sort === 'pinned') whereExtra += ' AND fp.pinned = true';
    if (q) {
      queryParams.push(`%${q}%`);
      whereExtra += ` AND (fp.title ILIKE $5 OR fp.body ILIKE $5)`;
    }

    const posts = await this.forumPostsRepo.getEventPostsRaw(eventId, userId, lim, skip, orderBy, whereExtra, queryParams);

    const postIds = posts.map((p: any) => String(p.id));
    const reactionMap: Record<string, Record<string, number>> = {};
    const tagMap: Record<string, any[]> = {};
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
    }

    let filteredPosts = posts;
    if (tag) {
      filteredPosts = posts.filter((p: any) => {
        const tags = tagMap[String(p.id)] || [];
        return tags.some((t: any) => t.name === tag);
      });
    }

    return filteredPosts.map((p: any) => {
      const username = p.primary_email ? p.primary_email.split('@')[0] : 'unknown';
      const name = (`${p.first_name || ''} ${p.last_name || ''}`).trim() || username || 'Unknown User';
      const pid = String(p.id);
      return {
        id: pid, title: p.title, body: p.body, pinned: p.pinned, locked: p.locked,
        solved: p.solved, archived: p.archived, view_count: Number(p.view_count),
        status: p.status, created_at: p.created_at, updated_at: p.updated_at,
        author_user_id: p.author_user_id, scope_type: p.scope_type, scope_id: p.scope_id,
        author_name: name, author_username: username,
        vote_score: Number(p.vote_score || 0),
        user_vote: p.user_vote ? Number(p.user_vote) : 0,
        comments_count: Number(p.comments_count || 0),
        reactions: reactionMap[pid] || {},
        tags: tagMap[pid] || []
      };
    });
  }

  static async createEventPost(eventId: string, user: any, body: any) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const post = await this.forumPostsRepo.create({
      tenant_id: user.tenantId,
      scope_type: 'event',
      scope_id: eventId,
      author_user_id: user.id,
      title: body.title || null,
      body: body.body,
      status: 'active'
    });

    const tagColorMap: Record<string, string> = {
      Question: 'blue', Announcement: 'orange', Help: 'purple', Bug: 'red',
      Feature: 'green', News: 'cyan', Discussion: 'gray', General: 'gray'
    };

    if (Array.isArray(body.tags) && body.tags.length > 0) {
      for (const tagName of body.tags) {
        const tagRows = await prisma.$queryRawUnsafe<any[]>(
          `INSERT INTO forum_tags(tenant_id, scope_id, scope_type, name, color)
           VALUES ($1::uuid, $2::uuid, 'event', $3, $4)
           ON CONFLICT (scope_id, name) DO UPDATE SET name=EXCLUDED.name
           RETURNING id`,
          user.tenantId, eventId, tagName, tagColorMap[tagName] || 'gray'
        );
        if (tagRows[0]) {
          await this.postTagsRepo.create({
            post_id: post.id!,
            tag_id: String(tagRows[0].id)
          });
        }
      }
    }

    return { ...post, tags: body.tags || [], reactions: {}, vote_score: 0, user_vote: 0, comments_count: 0 };
  }

  static async editEventPost(eventId: string, postId: string, user: any, body: any) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Post not found');
    if (post.author_user_id !== user.id) throw new Error('Only author can edit');

    const createdAt = new Date(post.created_at!);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 5 * 60 * 1000) throw new Error('Edit window expired (5 minutes)');

    await this.forumPostsRepo.updatePostRaw(postId, body.body, body.title);
  }

  static async deleteEventPost(eventId: string, postId: string, user: any) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Post not found');

    const isAdmin = await this.verifyEventAdmin(user.id, eventId);
    if (!isAdmin && post.author_user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await this.forumPostsRepo.softDeletePost(postId);
  }

  static async getEventPost(eventId: string, postId: string, requestingUser?: any) {
    const userId = requestingUser?.id || null;
    const post = await this.forumPostsRepo.getEventPostWithAuthorAndVotes(postId, userId, eventId);
    if (!post) return null;

    await this.forumPostsRepo.incrementViewCount(postId);

    const commentRows = await this.forumCommentsRepo.getRecursiveComments(postId, userId);

    const buildCommentTree = (flat: any[]): any[] => {
      const map = new Map<string, any>();
      flat.forEach(c => map.set(String(c.id), { ...c, replies: [] }));
      const roots: any[] = [];
      flat.forEach(c => {
        if (c.parent_id) {
          const parent = map.get(String(c.parent_id));
          if (parent) parent.replies.push(map.get(String(c.id)));
        } else {
          roots.push(map.get(String(c.id)));
        }
      });
      return roots;
    };

    const flatComments = commentRows.map((c: any) => {
      const username = c.primary_email ? c.primary_email.split('@')[0] : 'unknown';
      const name = (`${c.first_name || ''} ${c.last_name || ''}`).trim() || username || 'Unknown User';
      return {
        id: String(c.id), post_id: String(c.post_id), parent_id: c.parent_id ? String(c.parent_id) : null,
        author_user_id: String(c.author_user_id), body: c.body, status: c.status,
        created_at: c.created_at, updated_at: c.updated_at, depth: Number(c.depth),
        author_name: name, author_username: username,
        vote_score: Number(c.vote_score || 0), user_vote: c.user_vote ? Number(c.user_vote) : 0,
        replies: []
      };
    });

    const comments = buildCommentTree(flatComments);

    const reactionRows = await this.forumPostsRepo.getPostReactions(postId);
    const reactions: Record<string, number> = {};
    reactionRows.forEach((r: any) => { reactions[r.emoji] = Number(r.cnt); });

    const tagRows = await this.forumPostsRepo.getPostTags(postId);
    const tags = tagRows.map((t: any) => ({ id: String(t.id), name: t.name, color: t.color }));

    const username = post.primary_email ? post.primary_email.split('@')[0] : 'unknown';
    const name = (`${post.first_name || ''} ${post.last_name || ''}`).trim() || username || 'Unknown User';

    return {
      id: String(post.id), title: post.title, body: post.body, pinned: post.pinned, locked: post.locked,
      solved: post.solved, archived: post.archived, view_count: Number(post.view_count) + 1,
      status: post.status, created_at: post.created_at, updated_at: post.updated_at,
      author_user_id: String(post.author_user_id), scope_type: post.scope_type, scope_id: String(post.scope_id),
      author_name: name, author_username: username,
      vote_score: Number(post.vote_score || 0), user_vote: post.user_vote ? Number(post.user_vote) : 0,
      reactions, tags, comments
    };
  }

  static async createEventComment(eventId: string, postId: string, user: any, body: any) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId, deleted_at: null } as any);
    if (!post) throw new Error('Thread not found');
    if (post.locked) throw new Error('This thread is locked');

    const data: any = { tenant_id: user.tenantId, post_id: postId, author_user_id: user.id, body: body.body, status: 'active' };
    if (body.parent_id) data.parent_id = body.parent_id;

    const comment = await this.forumCommentsRepo.create(data);
    const commentUser = await this.usersRepo.findOne({ id: comment.author_user_id });
    
    const username = commentUser?.primary_email ? commentUser.primary_email.split('@')[0] : 'unknown';
    const name = commentUser ? (`${commentUser.first_name || ''} ${commentUser.last_name || ''}`.trim() || username) : 'Unknown User';

    return {
      id: comment.id, post_id: comment.post_id, parent_id: comment.parent_id || null,
      author_user_id: comment.author_user_id, body: comment.body, status: comment.status,
      created_at: comment.created_at, author_name: name, author_username: username,
      vote_score: 0, user_vote: 0, replies: []
    };
  }

  static async editEventComment(eventId: string, postId: string, commentId: string, user: any, body: any) {
    const comment = await this.forumCommentsRepo.findOne({ id: commentId, post_id: postId, deleted_at: null } as any);
    if (!comment) throw new Error('Comment not found');
    if (comment.author_user_id !== user.id) throw new Error('Only author can edit');

    const createdAt = new Date(comment.created_at!);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 5 * 60 * 1000) throw new Error('Edit window expired (5 minutes)');

    await this.forumCommentsRepo.updateCommentRaw(commentId, body.body);
  }

  static async deleteEventComment(eventId: string, postId: string, commentId: string, user: any) {
    const comment = await this.forumCommentsRepo.findOne({ id: commentId, post_id: postId, deleted_at: null } as any);
    if (!comment) throw new Error('Comment not found');

    const isAdmin = await this.verifyEventAdmin(user.id, eventId);
    if (!isAdmin && comment.author_user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await this.forumCommentsRepo.softDeleteComment(commentId);
  }

  static async voteEventPost(eventId: string, postId: string, user: any, vote: number) {
    if (vote === 0) {
      await this.votesRepo.dbModel.deleteMany({
        where: { user_id: user.id, target_id: postId, target_type: 'post' }
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
         VALUES($1::uuid, $2::uuid, $3::uuid, 'post', $4)
         ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
        user.tenantId, user.id, postId, vote
      );
    }

    const scoreRows = await this.votesRepo.findAll({ target_id: postId, target_type: 'post' });
    const score = scoreRows.reduce((acc, curr) => acc + curr.vote, 0);
    return { vote_score: score, user_vote: vote };
  }

  static async voteEventComment(eventId: string, commentId: string, user: any, vote: number) {
    if (vote === 0) {
      await this.votesRepo.dbModel.deleteMany({
        where: { user_id: user.id, target_id: commentId, target_type: 'comment' }
      });
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO forum_votes(tenant_id, user_id, target_id, target_type, vote)
         VALUES($1::uuid, $2::uuid, $3::uuid, 'comment', $4)
         ON CONFLICT (user_id, target_id, target_type) DO UPDATE SET vote=EXCLUDED.vote`,
        user.tenantId, user.id, commentId, vote
      );
    }

    const scoreRows = await this.votesRepo.findAll({ target_id: commentId, target_type: 'comment' });
    const score = scoreRows.reduce((acc, curr) => acc + curr.vote, 0);
    return { vote_score: score, user_vote: vote };
  }

  static async reactEventPost(eventId: string, postId: string, user: any, emoji: string) {
    const existing = await this.reactionsRepo.findAll({ user_id: user.id, target_id: postId, target_type: 'post', emoji });
    if (existing.length > 0) {
      await this.reactionsRepo.delete(existing[0].id);
    } else {
      await this.reactionsRepo.create({
        tenant_id: user.tenantId,
        user_id: user.id,
        target_id: postId,
        target_type: 'post',
        emoji
      });
    }

    const rows = await this.reactionsRepo.findAll({ target_id: postId, target_type: 'post' });
    const reactions: Record<string, number> = {};
    rows.forEach(r => {
      reactions[r.emoji] = (reactions[r.emoji] || 0) + 1;
    });

    return reactions;
  }

  static async solveEventPost(eventId: string, postId: string, user: any, solved: boolean) {
    const post = await this.forumPostsRepo.findOne({ id: postId, scope_type: 'event', scope_id: eventId } as any);
    if (!post) throw new Error('Post not found');

    const isAdmin = await this.verifyEventAdmin(user.id, eventId);
    if (!isAdmin && post.author_user_id !== user.id) {
      throw new Error('Forbidden');
    }

    await this.forumPostsRepo.updateSolveStatus(postId, solved);
  }

  static async archiveEventPost(eventId: string, postId: string, user: any, archived: boolean) {
    if (!(await this.verifyEventAdmin(user.id, eventId))) {
      throw new Error('Forbidden');
    }
    await this.forumPostsRepo.updateArchiveStatus(postId, archived);
  }

  static async pinEventPost(eventId: string, postId: string, user: any, pinned: boolean) {
    if (!(await this.verifyEventAdmin(user.id, eventId))) {
      throw new Error('Forbidden');
    }
    await this.forumPostsRepo.updatePinStatus(postId, pinned);
  }

  static async lockEventPost(eventId: string, postId: string, user: any, locked: boolean) {
    if (!(await this.verifyEventAdmin(user.id, eventId))) {
      throw new Error('Forbidden');
    }
    await this.forumPostsRepo.updateLockStatus(postId, locked);
  }

  static async getEventMembers(eventId: string) {
    const assignments = await prisma.event_team_assignments.findMany({
      where: { event_id: eventId },
      include: {
        users_event_team_assignments_user_idTousers: { select: { id: true, first_name: true, last_name: true, primary_email: true, profiles: { select: { display_name: true } } } },
        roles: true
      }
    });

    const bookings = await prisma.bookings.findMany({
      where: { event_id: eventId, status: { in: ['confirmed', 'pending_approval'] } },
      include: {
        users: { select: { id: true, first_name: true, last_name: true, primary_email: true, profiles: { select: { display_name: true } } } }
      }
    });

    const memberMap = new Map();

    for (const a of assignments) {
      if (a.users_event_team_assignments_user_idTousers) {
        memberMap.set(a.user_id, {
          id: a.users_event_team_assignments_user_idTousers.id,
          name: a.users_event_team_assignments_user_idTousers.first_name ? `${a.users_event_team_assignments_user_idTousers.first_name} ${a.users_event_team_assignments_user_idTousers.last_name || ''}`.trim() : 'Unknown',
          display_name: a.users_event_team_assignments_user_idTousers.profiles?.display_name || a.users_event_team_assignments_user_idTousers.first_name,
          picture: null,
          email: a.users_event_team_assignments_user_idTousers.primary_email,
          role: a.roles?.key || 'event_member',
          state: a.state
        });
      }
    }

    for (const b of bookings) {
      if (!memberMap.has(b.booker_user_id) && b.users) {
        memberMap.set(b.booker_user_id, {
          id: b.users.id,
          name: b.users.first_name ? `${b.users.first_name} ${b.users.last_name || ''}`.trim() : 'Unknown',
          display_name: b.users.profiles?.display_name || b.users.first_name,
          picture: null,
          email: b.users.primary_email,
          role: 'event_member',
          state: b.status === 'pending_approval' ? 'pending' : 'active'
        });
      }
    }

    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (event) {
        const entity = await prisma.entities.findUnique({ where: { id: event.hosted_by_entity_id }, include: { users: { select: { id: true, first_name: true, last_name: true, primary_email: true, profiles: { select: { display_name: true } } } } }});
        if (entity && entity.entity_type === 'user' && !memberMap.has(entity.user_id) && entity.users) {
            memberMap.set(entity.user_id, {
                id: entity.users.id,
                name: entity.users.first_name ? `${entity.users.first_name} ${entity.users.last_name || ''}`.trim() : 'Unknown',
                display_name: entity.users.profiles?.display_name || entity.users.first_name,
                picture: null,
                email: entity.users.primary_email,
                role: 'event_host',
                state: 'active'
            });
        }
    }

    return Array.from(memberMap.values());
  }

  static async updateMemberRole(eventId: string, targetUserId: string, newRoleKey: string, currentUserId: string) {
    const callerAssignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: currentUserId },
      include: { roles: true }
    });
    
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    let isOwner = false;
    const creatorEntity = await prisma.entities.findFirst({ where: { id: event.hosted_by_entity_id, user_id: currentUserId }});
    if (creatorEntity) isOwner = true;

    const callerRole = isOwner ? 'event_host' : callerAssignment?.roles?.key;
    if (!callerRole || callerRole === 'event_member') {
      throw new Error('Forbidden: You do not have permission to change roles.');
    }

    const hierarchy: Record<string, number> = {
      'event_host': 4,
      'event_cohost': 3,
      'event_scanner': 2,
      'event_member': 1
    };

    const callerLevel = hierarchy[callerRole] || 0;
    const targetLevel = hierarchy[newRoleKey] || 0;

    if (callerLevel <= targetLevel && !isOwner) {
      throw new Error('Forbidden: Cannot assign a role equal to or higher than your own.');
    }

    const targetAssignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: targetUserId },
      include: { roles: true }
    });

    const currentTargetRole = targetAssignment?.roles?.key || 'event_member';
    const currentTargetLevel = hierarchy[currentTargetRole] || 0;

    if (callerLevel <= currentTargetLevel && !isOwner) {
      throw new Error('Forbidden: Cannot change the role of someone with equal or higher permissions.');
    }

    const newRole = await prisma.roles.findUnique({ where: { key: newRoleKey } });
    if (!newRole) throw new Error('Role not found');

    if (targetAssignment) {
      await prisma.event_team_assignments.update({
        where: { id: targetAssignment.id },
        data: { role_id: newRole.id }
      });
    } else {
      await prisma.event_team_assignments.create({
        data: {
          tenant_id: event.tenant_id,
          event_id: eventId,
          user_id: targetUserId,
          role_id: newRole.id,
          state: 'active'
        }
      });
    }
    return { success: true };
  }

  static async getEventUserRole(userId: string, eventId: string): Promise<string> {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) return 'none';

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    if (entityRows[0]?.user_id === userId) return 'event_host';

    const assignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, user_id: userId, state: 'active' },
      include: { roles: true }
    });
    if (assignment?.roles?.key) {
      return assignment.roles.key; // 'event_host', 'event_cohost', 'event_scanner'
    }

    const booking = await prisma.bookings.findFirst({
      where: { event_id: eventId, booker_user_id: userId, status: 'confirmed' }
    });
    if (booking) return 'event_member';

    return 'none';
  }

  static async getEventGallery(eventId: string, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const venue = (event.venue as any) || {};
    const meta = venue.meta || {};
    const gallery = meta.gallery || {};
    const items = gallery.items || [];

    const role = await this.getEventUserRole(userId, eventId);
    const isHostOrCoHost = role === 'event_host' || role === 'event_cohost';
    const isScanner = role === 'event_scanner';

    const user = await prisma.users.findUnique({ where: { id: userId } });
    const isGlobalStaff = user?.role && (user.role.toLowerCase().includes('admin') || user.role.toLowerCase().includes('moderator'));

    if (isHostOrCoHost || isScanner || isGlobalStaff) {
      return items;
    }
    return items.filter((item: any) => item.approved);
  }

  static async uploadToEventGallery(eventId: string, userId: string, body: any) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const venue = (event.venue as any) || {};
    const meta = venue.meta || {};
    const gallery = meta.gallery || {};
    const items = gallery.items || [];

    const role = await this.getEventUserRole(userId, eventId);
    const isHostOrCoHost = role === 'event_host' || role === 'event_cohost';
    const isScanner = role === 'event_scanner';
    const isMember = role === 'event_member';

    const user = await prisma.users.findUnique({ where: { id: userId } });
    const uploaderName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.primary_email.split('@')[0] : 'Unknown';

    if (!gallery.enabled) {
      throw new Error('Gallery is disabled for this event');
    }

    const uploadRoles = gallery.uploadRoles || { owner: true, admin: true, moderator: true, public: false };
    const canUpload = uploadRoles.public ||
      (isMember && uploadRoles.member) ||
      (isHostOrCoHost && (uploadRoles.owner !== false || uploadRoles.admin !== false)) ||
      (isScanner && uploadRoles.moderator !== false);

    if (!canUpload) {
      throw new Error('You do not have permission to upload to this gallery');
    }

    const needsApproval = gallery.approvalRequired;
    const isAuthorizedApprover = isHostOrCoHost || isScanner;
    const approved = !(needsApproval && !isAuthorizedApprover);

    const newItem = {
      id: Date.now(),
      url: body.url,
      type: body.type || 'image',
      approved,
      uploadedBy: uploaderName,
      uploaderId: userId,
      created_at: new Date().toISOString()
    };

    const nextItems = [...items, newItem];
    const newMeta = { ...meta, gallery: { ...gallery, items: nextItems } };
    const newVenue = { ...venue, meta: newMeta };

    await prisma.events.update({
      where: { id: eventId },
      data: { venue: newVenue }
    });

    return newItem;
  }

  static async approveEventGalleryItem(eventId: string, itemId: number, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const role = await this.getEventUserRole(userId, eventId);
    const isHostOrCoHost = role === 'event_host' || role === 'event_cohost';
    const isScanner = role === 'event_scanner';

    if (!isHostOrCoHost && !isScanner) {
      throw new Error('Forbidden: Only organizers can approve media');
    }

    const venue = (event.venue as any) || {};
    const meta = venue.meta || {};
    const gallery = meta.gallery || {};
    const items = gallery.items || [];

    const nextItems = items.map((item: any) => {
      if (item.id === itemId) {
        return { ...item, approved: true };
      }
      return item;
    });

    const newMeta = { ...meta, gallery: { ...gallery, items: nextItems } };
    const newVenue = { ...venue, meta: newMeta };

    await prisma.events.update({
      where: { id: eventId },
      data: { venue: newVenue }
    });
  }

  static async deleteEventGalleryItem(eventId: string, itemId: number, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const role = await this.getEventUserRole(userId, eventId);
    const isHostOrCoHost = role === 'event_host' || role === 'event_cohost';
    const isScanner = role === 'event_scanner';

    const venue = (event.venue as any) || {};
    const meta = venue.meta || {};
    const gallery = meta.gallery || {};
    const items = gallery.items || [];

    const itemToDelete = items.find((item: any) => item.id === itemId);
    if (!itemToDelete) throw new Error('Item not found');

    const isUploader = itemToDelete.uploaderId === userId;

    if (!isHostOrCoHost && !isScanner && !isUploader) {
      throw new Error('Forbidden: You do not have permission to delete this media');
    }

    const nextItems = items.filter((item: any) => item.id !== itemId);

    const newMeta = { ...meta, gallery: { ...gallery, items: nextItems } };
    const newVenue = { ...venue, meta: newMeta };

    await prisma.events.update({
      where: { id: eventId },
      data: { venue: newVenue }
    });
  }

  static async leaveEvent(eventId: string, userId: string) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
      `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
      event.hosted_by_entity_id
    );
    const isOwner = entityRows[0]?.user_id === userId;

    const hostRole = await prisma.roles.findFirst({ where: { key: 'event_host' } });
    const hostAssignment = await prisma.event_team_assignments.findFirst({
      where: { event_id: eventId, role_id: hostRole?.id, state: 'active' }
    });
    const isAssignedHost = hostAssignment?.user_id === userId;

    if (isOwner || isAssignedHost) {
      const otherHostsCount = await prisma.event_team_assignments.count({
        where: {
          event_id: eventId,
          role_id: hostRole?.id,
          state: 'active',
          NOT: { user_id: userId }
        }
      });
      if (otherHostsCount === 0) {
        throw new Error('Host cannot leave event without assigning another Host first.');
      }
    }

    await prisma.event_team_assignments.deleteMany({
      where: { event_id: eventId, user_id: userId }
    });

    const bookings = await prisma.bookings.findMany({
      where: { event_id: eventId, booker_user_id: userId }
    });
    for (const b of bookings) {
      await prisma.$transaction(async (tx) => {
        await tx.bookings.update({
          where: { id: b.id },
          data: { status: 'cancelled' }
        });
        const lineItems = await tx.booking_line_items.findMany({
          where: { booking_id: b.id }
        });
        const liIds = lineItems.map(li => li.id);
        await tx.tickets.updateMany({
          where: { line_item_id: { in: liIds } },
          data: { status: 'cancelled' }
        });
      });
    }
  }
}
