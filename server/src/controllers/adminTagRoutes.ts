import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { R_tags } from '../repositories/R_tags';
import prisma from '../config/prisma';

export const adminTagRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const tagRepo = new R_tags();

    const toClientTag = (dbTag: any) => ({
        id: dbTag.id,
        name: dbTag.name,
        slug: dbTag.slug,
        category: dbTag.category_name || dbTag.category_name_fallback || '',
        status: dbTag.status,
        isDeleted: dbTag.is_deleted,
        createdAt: dbTag.created_at,
        updatedAt: dbTag.updated_at
    });

    // GET /tags
    fastify.get('/tags', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const sql = `
                SELECT t.*, c.name as category_name
                FROM tags t
                LEFT JOIN categories c ON t.category_id = c.id
            `;
            const dbTags = await prisma.$queryRawUnsafe<any[]>(sql);
            const tags = dbTags.map(toClientTag);
            return { success: true, data: tags };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /tags
    fastify.post('/tags', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const body = request.body as any;
            if (!body.name || !body.slug || !body.category) {
                return reply.status(400).send({ success: false, message: 'Name, slug, and category are required' });
            }

            // Look up category ID by category name
            const cats = await prisma.$queryRawUnsafe<any[]>('SELECT id FROM categories WHERE name = $1 LIMIT 1', body.category);
            const categoryId = cats[0]?.id;
            if (!categoryId) {
                return reply.status(400).send({ success: false, message: `Category "${body.category}" not found` });
            }

            const dbTag = await tagRepo.create({
                name: body.name,
                slug: body.slug,
                category_id: categoryId,
                status: body.status || 'active',
                is_deleted: false
            } as any);

            // Fetch created tag with category name for return
            const tagWithCat = await prisma.$queryRawUnsafe<any[]>(
                'SELECT t.*, c.name as category_name FROM tags t JOIN categories c ON t.category_id = c.id WHERE t.id = $1 LIMIT 1',
                dbTag.id
            );

            return reply.status(201).send({ success: true, data: toClientTag(tagWithCat[0]), message: 'Tag created' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PUT /tags/:id
    fastify.put('/tags/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const body = request.body as any;

            const tag = await tagRepo.getById(id);
            if (!tag) {
                return reply.status(404).send({ success: false, message: 'Tag not found' });
            }

            const updateData: any = { updated_at: new Date() };
            if (body.name !== undefined) updateData.name = body.name;
            if (body.slug !== undefined) updateData.slug = body.slug;
            if (body.status !== undefined) updateData.status = body.status;
            if (body.isDeleted !== undefined) updateData.is_deleted = body.isDeleted;

            if (body.category !== undefined) {
                const cats = await prisma.$queryRawUnsafe<any[]>('SELECT id FROM categories WHERE name = $1 LIMIT 1', body.category);
                const categoryId = cats[0]?.id;
                if (!categoryId) {
                    return reply.status(400).send({ success: false, message: `Category "${body.category}" not found` });
                }
                updateData.category_id = categoryId;
            }

            const updated = await tagRepo.update(id, updateData);

            if (!updated) {
                return reply.status(404).send({
                    success: false,
                    message: 'Tag not found'
                });
            }

            // Fetch updated tag with category name for return
            const tagWithCat = await prisma.$queryRawUnsafe<any[]>(
                'SELECT t.*, c.name as category_name FROM tags t JOIN categories c ON t.category_id = c.id WHERE t.id = $1 LIMIT 1',
                updated.id
            );

            return { success: true, data: toClientTag(tagWithCat[0]), message: 'Tag updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /tags/:id
    fastify.delete('/tags/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const tag = await tagRepo.getById(id);
            if (!tag) {
                return reply.status(404).send({ success: false, message: 'Tag not found' });
            }

            // Soft delete
            await tagRepo.update(id, { is_deleted: true, updated_at: new Date() });
            return { success: true, message: 'Tag soft-deleted successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
};

export default adminTagRoutes;
