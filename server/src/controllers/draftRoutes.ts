import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';

export const draftRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // GET /api/drafts/latest?type=event|group
    fastify.get('/latest', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            const { type } = request.query as any;
            if (!type || !['event', 'group'].includes(type)) {
                return reply.status(400).send({ success: false, message: 'Invalid type parameter' });
            }

            if (type === 'event') {
                const userEntities = await prisma.entities.findMany({
                    where: { user_id: request.user.id },
                    select: { id: true }
                });
                const userEntityIds = userEntities.map(e => e.id);

                const drafts = await prisma.events.findMany({
                    where: {
                        status: 'draft',
                        hosted_by_entity_id: { in: userEntityIds }
                    },
                    orderBy: { updated_at: 'desc' }
                });

                return reply.send({
                    success: true,
                    data: drafts.map(draft => ({
                        id: draft.id,
                        title: draft.title || 'Untitled Draft',
                        updated_at: draft.updated_at,
                        created_at: draft.created_at,
                        type: 'event',
                        cover: draft.venue && typeof draft.venue === 'object' && (draft.venue as any).meta ? (draft.venue as any).meta.cover : null
                    }))
                });
            } else if (type === 'group') {
                const userEntities = await prisma.entities.findMany({
                    where: { user_id: request.user.id, entity_type: 'group' },
                    select: { id: true }
                });
                const userEntityIds = userEntities.map(e => e.id);

                const drafts = await prisma.groups.findMany({
                    where: {
                        entity_id: { in: userEntityIds },
                        listed: 'unlisted',
                        settings: {
                            path: ['isDraft'],
                            equals: true
                        }
                    },
                    orderBy: {
                        entities: { updated_at: 'desc' }
                    },
                    include: {
                        entities: true
                    }
                });

                return reply.send({
                    success: true,
                    data: drafts.map(draft => ({
                        id: draft.entity_id,
                        title: draft.name || 'Untitled Draft',
                        updated_at: draft.entities.updated_at,
                        created_at: draft.entities.created_at,
                        type: 'group',
                        cover: draft.cover
                    }))
                });
            }

            return reply.send({ success: true, data: [] });
        } catch (error: any) {
            console.error('Error fetching latest draft:', error);
            return reply.status(500).send({ success: false, message: error.message });
        }
    });

    // DELETE /api/drafts/:type/:id
    fastify.delete('/:type/:id', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            if (!request.user) return reply.status(401).send({ success: false, message: 'Unauthorized' });
            
            const { type, id } = request.params as any;
            
            if (type === 'event') {
                // Ensure ownership
                const userEntities = await prisma.entities.findMany({
                    where: { user_id: request.user.id },
                    select: { id: true }
                });
                const userEntityIds = userEntities.map(e => e.id);
                
                const event = await prisma.events.findFirst({
                    where: { id, hosted_by_entity_id: { in: userEntityIds } }
                });
                
                if (event && event.status === 'draft') {
                    // Only allow deleting drafts this way
                    await prisma.events.delete({ where: { id } });
                }
            } else if (type === 'group') {
                const userEntities = await prisma.entities.findMany({
                    where: { user_id: request.user.id, entity_type: 'group', id },
                    select: { id: true }
                });
                
                if (userEntities.length > 0) {
                    const grp = await prisma.groups.findUnique({ where: { entity_id: id }});
                    const settings = grp?.settings as any;
                    if (grp && grp.listed === 'unlisted' && settings && settings.isDraft) {
                        await prisma.entities.delete({ where: { id } });
                    }
                }
            }
            
            return reply.send({ success: true });
        } catch (error: any) {
            console.error('Error deleting draft:', error);
            return reply.status(500).send({ success: false, message: error.message });
        }
    });
};
