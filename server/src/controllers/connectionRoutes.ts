// @ts-nocheck
/* ============================================================
   Samaagum — Connection Routes
   GET  /api/connections/incoming
   GET  /api/connections/status/:targetUserId
   POST /api/connections/send
   POST /api/connections/:id/accept
   POST /api/connections/:id/decline
   POST /api/connections/:id/block
   ============================================================ */

import { FastifyInstance } from 'fastify';
import prisma from '../config/prisma';

// In-memory rate limiter: max 20 requests per user per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

/** Extract & decode the JWT from the Authorization header */
function getUserFromRequest(request: any): { userId: string; tenantId: string } | null {
  try {
    const header = request.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    const token = header.slice(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    const uid = payload.sub || payload.userId || payload.id;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uid && UUID_REGEX.test(uid)) {
      return { userId: uid, tenantId: payload.tenantId || payload.tenant_id };
    }
    return null;
  } catch {
    return null;
  }
}

export async function connectionRoutes(fastify: FastifyInstance) {

  /** GET /api/connections/incoming — list all pending connection requests sent TO the current user */
  fastify.get('/incoming', async (request, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    try {
      const incoming = await prisma.connections.findMany({
        where: {
          addressee_user_id: auth.userId,
          state: 'requested',
        },
        include: {
          users_connections_requester_user_idTousers: {
            select: {
              id: true,
              primary_email: true,
              profiles: {
                select: { display_name: true, headline: true }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
      });

      const data = incoming.map(c => ({
        id: c.id,
        created_at: c.created_at,
        requester: {
          id: c.users_connections_requester_user_idTousers.id,
          email: c.users_connections_requester_user_idTousers.primary_email,
          display_name: c.users_connections_requester_user_idTousers.profiles?.display_name || null,
          headline: c.users_connections_requester_user_idTousers.profiles?.headline || null,
          avatar_url: null,
        }
      }));

      return reply.send({ success: true, data });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /**
   * GET /api/connections/status/:targetUserId
   * Returns the connection relationship between the current user and a target user,
   * plus the target user's messaging preference.
   * Response: { state: 'none'|'requested'|'accepted'|'blocked', isRequester: boolean,
   *             connectionId: string|null, messagingPreference: 'anyone'|'only_connected'|'no_one' }
   */
  fastify.get('/status/:targetUserId', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { targetUserId } = request.params as any;
    try {
      // Look up connection in either direction
      const conn = await prisma.connections.findFirst({
        where: {
          OR: [
            { requester_user_id: auth.userId, addressee_user_id: targetUserId },
            { requester_user_id: targetUserId, addressee_user_id: auth.userId },
          ]
        }
      });

      // Look up target's messaging preference
      const targetProfile = await prisma.profiles.findUnique({
        where: { user_id: targetUserId },
        select: { messaging_restriction: true }
      });

      // Treat legacy 'approval_required' as 'only_connected'
      let messagingPreference = targetProfile?.messaging_restriction || 'anyone';
      if (messagingPreference === 'approval_required') messagingPreference = 'only_connected';

      if (!conn) {
        return reply.send({
          success: true,
          data: {
            state: 'none',
            isRequester: false,
            connectionId: null,
            messagingPreference
          }
        });
      }

      return reply.send({
        success: true,
        data: {
          state: conn.state,
          isRequester: conn.requester_user_id === auth.userId,
          connectionId: conn.id,
          messagingPreference
        }
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** POST /api/connections/send — send a connection request */
  fastify.post('/send', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { allowed, remaining } = checkRateLimit(auth.userId);
    if (!allowed) {
      return reply.status(429).send({
        success: false,
        message: 'Rate limit exceeded. You can send at most 20 connection requests per hour.',
        remaining: 0
      });
    }

    const { addresseeUserId } = request.body as any;
    if (!addresseeUserId) return reply.status(400).send({ success: false, message: 'addresseeUserId is required' });
    if (addresseeUserId === auth.userId) return reply.status(400).send({ success: false, message: 'Cannot connect with yourself' });

    try {
      // Check for an existing connection in either direction
      const existing = await prisma.connections.findFirst({
        where: {
          OR: [
            { requester_user_id: auth.userId, addressee_user_id: addresseeUserId },
            { requester_user_id: addresseeUserId, addressee_user_id: auth.userId },
          ]
        }
      });

      if (existing) {
        if (existing.state === 'blocked') return reply.status(403).send({ success: false, message: 'This user is blocked.' });
        if (existing.state === 'accepted') return reply.status(409).send({ success: false, message: 'Already connected.' });
        if (existing.state === 'requested') return reply.status(409).send({ success: false, message: 'Request already sent.' });
      }

      // Look up tenant id from requester
      const user = await prisma.users.findUnique({ where: { id: auth.userId }, select: { tenant_id: true } });
      if (!user) return reply.status(404).send({ success: false, message: 'User not found' });

      const connection = await prisma.connections.create({
        data: {
          tenant_id: user.tenant_id,
          requester_user_id: auth.userId,
          addressee_user_id: addresseeUserId,
          state: 'requested',
        }
      });

      // Emit real-time notification to the addressee
      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        // Fetch requester profile for the notification payload
        const requesterProfile = await prisma.profiles.findUnique({
          where: { user_id: auth.userId },
          select: { display_name: true, headline: true }
        });
        chatNamespace.to(`user:${addresseeUserId}`).emit('connection.request.received', {
          connectionId: connection.id,
          requester: {
            id: auth.userId,
            display_name: requesterProfile?.display_name || null,
            headline: requesterProfile?.headline || null,
          }
        });
      }

      return reply.status(201).send({ success: true, data: connection, remaining });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** POST /api/connections/:id/accept */
  fastify.post('/:id/accept', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { id } = request.params as any;
    try {
      const conn = await prisma.connections.findUnique({ where: { id } });
      if (!conn) return reply.status(404).send({ success: false, message: 'Request not found' });
      if (conn.addressee_user_id !== auth.userId) return reply.status(403).send({ success: false, message: 'Forbidden' });
      if (conn.state !== 'requested') return reply.status(409).send({ success: false, message: `Cannot accept a request in state: ${conn.state}` });

      const updated = await prisma.connections.update({ where: { id }, data: { state: 'accepted' } });

      // Create a persistent notification log entry for the requester (if they allow it)
      try {
        const { notificationService } = require('../services/NotificationService');
        const canDeliver = await notificationService.shouldDeliverByTemplateKey(conn.requester_user_id, 'connection_accepted');
        if (canDeliver) {
          await prisma.notification_log.create({
            data: {
              tenant_id: conn.tenant_id,
              user_id: conn.requester_user_id,
              channel: 'socket',
              template_key: 'connection_accepted',
              provider_ref: conn.addressee_user_id,
              status: 'queued'
            }
          });
        }
      } catch (err) {
        console.error("Failed to create notification log for accepted connection:", err);
      }

      // Notify both users so the PublicProfile CTA updates in real-time
      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        const payload = {
          connectionId: conn.id,
          requesterId: conn.requester_user_id,
          addresseeId: conn.addressee_user_id
        };
        chatNamespace.to(`user:${conn.requester_user_id}`).emit('connection.accepted', payload);
        chatNamespace.to(`user:${conn.addressee_user_id}`).emit('connection.accepted', payload);
      }

      return reply.send({ success: true, data: updated });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** POST /api/connections/:id/decline */
  fastify.post('/:id/decline', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { id } = request.params as any;
    try {
      const conn = await prisma.connections.findUnique({ where: { id } });
      if (!conn) return reply.status(404).send({ success: false, message: 'Request not found' });
      if (conn.addressee_user_id !== auth.userId) return reply.status(403).send({ success: false, message: 'Forbidden' });

      // Delete the request on decline (keeps the table clean)
      await prisma.connections.delete({ where: { id } });

      // Notify the requester their request was declined
      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        chatNamespace.to(`user:${conn.requester_user_id}`).emit('connection.declined', {
          connectionId: conn.id,
          addresseeId: conn.addressee_user_id
        });
      }

      return reply.send({ success: true, message: 'Request declined.' });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** POST /api/connections/:id/revoke */
  fastify.post('/:id/revoke', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { id } = request.params as any;
    try {
      const conn = await prisma.connections.findUnique({ where: { id } });
      if (!conn) return reply.status(404).send({ success: false, message: 'Request not found' });
      if (conn.requester_user_id !== auth.userId) return reply.status(403).send({ success: false, message: 'Forbidden' });
      if (conn.state !== 'requested') return reply.status(409).send({ success: false, message: 'Cannot revoke a request that is not pending' });

      // Delete the request on revoke
      await prisma.connections.delete({ where: { id } });

      // Notify the addressee and requester so their UI updates in real-time
      const chatNamespace = (fastify as any).io?.of('/chat');
      if (chatNamespace) {
        const payload = {
          connectionId: conn.id,
          requesterId: conn.requester_user_id,
          addresseeId: conn.addressee_user_id
        };
        chatNamespace.to(`user:${conn.requester_user_id}`).emit('connection.declined', payload);
        chatNamespace.to(`user:${conn.addressee_user_id}`).emit('connection.declined', payload);
      }

      return reply.send({ success: true, message: 'Request revoked.' });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** POST /api/connections/:id/block — block the requester */
  fastify.post('/:id/block', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { id } = request.params as any;
    try {
      const conn = await prisma.connections.findUnique({ where: { id } });
      if (!conn) return reply.status(404).send({ success: false, message: 'Request not found' });
      // Only the addressee or either party can block
      if (conn.addressee_user_id !== auth.userId && conn.requester_user_id !== auth.userId) {
        return reply.status(403).send({ success: false, message: 'Forbidden' });
      }

      const updated = await prisma.connections.update({ where: { id }, data: { state: 'blocked' } });
      return reply.send({ success: true, data: updated, message: 'User blocked.' });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });

  /** GET /api/connections/network/:targetUserId */
  fastify.get('/network/:targetUserId', async (request: any, reply) => {
    const auth = getUserFromRequest(request);
    if (!auth?.userId) return reply.status(401).send({ success: false, message: 'Unauthorized' });

    const { targetUserId } = request.params;
    const query = request.query as any;
    const q = (query.q || '').trim();
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
      // 1. Get total connections of User B (accepted only) matching search query.
      // We will perform a search query check. First let's query the accepted connections of User B.
      const rawConnections = await prisma.$queryRawUnsafe<any[]>(
        `WITH b_connections AS (
          SELECT
            CASE
              WHEN requester_user_id = $1::uuid THEN addressee_user_id
              ELSE requester_user_id
            END AS peer_id
          FROM connections
          WHERE (requester_user_id = $1::uuid OR addressee_user_id = $1::uuid)
            AND state = 'accepted'
        ),
        a_connections AS (
          SELECT
            CASE
              WHEN requester_user_id = $2::uuid THEN addressee_user_id
              ELSE requester_user_id
            END AS peer_id,
            id AS connection_id,
            state,
            CASE WHEN requester_user_id = $2::uuid THEN true ELSE false END AS is_requester
          FROM connections
          WHERE requester_user_id = $2::uuid OR addressee_user_id = $2::uuid
        )
        SELECT
          bc.peer_id,
          u.id as user_id,
          p.display_name,
          u.primary_email,
          p.headline,
          u.profile_image_data,
          p.cover_image_data,
          ac.connection_id,
          ac.state AS a_state,
          ac.is_requester
        FROM b_connections bc
        JOIN users u ON u.id = bc.peer_id
        LEFT JOIN profiles p ON p.user_id = u.id
        LEFT JOIN a_connections ac ON ac.peer_id = bc.peer_id
        WHERE (
            $3 = '' OR
            p.display_name ILIKE $4 OR
            u.primary_email ILIKE $4
          )
        ORDER BY p.display_name ASC NULLS LAST
        LIMIT $5 OFFSET $6`,
        targetUserId,
        auth.userId,
        q,
        `%${q}%`,
        limit,
        offset
      );

      // Get count matching the same query
      const countRes = await prisma.$queryRawUnsafe<any[]>(
        `WITH b_connections AS (
          SELECT
            CASE
              WHEN requester_user_id = $1::uuid THEN addressee_user_id
              ELSE requester_user_id
            END AS peer_id
          FROM connections
          WHERE (requester_user_id = $1::uuid OR addressee_user_id = $1::uuid)
            AND state = 'accepted'
        )
        SELECT COUNT(bc.peer_id)::integer as total
        FROM b_connections bc
        JOIN users u ON u.id = bc.peer_id
        LEFT JOIN profiles p ON p.user_id = u.id
        WHERE (
            $2 = '' OR
            p.display_name ILIKE $3 OR
            u.primary_email ILIKE $3
          )`,
        targetUserId,
        q,
        `%${q}%`
      );

      const totalCount = countRes[0]?.total || 0;

      const mutual: any[] = [];
      const newConns: any[] = [];

      for (const row of rawConnections) {
        let profilePhoto = '';
        if (row.profile_image_data) {
          profilePhoto = `data:image/jpeg;base64,${Buffer.from(row.profile_image_data).toString('base64')}`;
        }
        
        // Map states relative to User A
        let connectionState = 'none';
        if (row.user_id === auth.userId) {
          connectionState = 'accepted';
        } else if (row.a_state === 'accepted') {
          connectionState = 'accepted';
        } else if (row.a_state === 'requested') {
          connectionState = row.is_requester ? 'requested' : 'requested_by_them';
        } else if (row.a_state === 'blocked') {
          connectionState = 'blocked';
        }

        const username = row.primary_email ? row.primary_email.split('@')[0] : '';

        const item = {
          userId: row.user_id,
          displayName: row.display_name || username || 'Someone',
          username: username,
          profilePhoto: profilePhoto,
          headline: row.headline || '',
          connectionId: row.connection_id || null,
          connectionState: connectionState
        };

        if (connectionState === 'accepted') {
          mutual.push(item);
        } else if (connectionState !== 'blocked') {
          newConns.push(item);
        }
      }

      return reply.send({
        success: true,
        data: {
          totalCount,
          mutual,
          new: newConns,
          pagination: {
            page,
            limit,
            hasMore: offset + rawConnections.length < totalCount
          }
        }
      });
    } catch (err: any) {
      return reply.status(500).send({ success: false, message: err.message });
    }
  });
}
