import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { R_categories } from '../repositories/R_categories';
import prisma from '../config/prisma';

export const adminCategoryRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const categoryRepo = new R_categories();

    const toClientCategory = (dbCat: any) => ({
        id: dbCat.id,
        parentId: dbCat.parent_id,
        slug: dbCat.slug,
        name: dbCat.name,
        description: dbCat.description,
        kind: dbCat.kind,
        iconType: dbCat.icon_type,
        iconValue: dbCat.icon_value,
        displayOrder: dbCat.display_order,
        status: dbCat.status,
        isDeleted: dbCat.is_deleted,
        createdAt: dbCat.created_at,
        updatedAt: dbCat.updated_at
    });

    // GET /categories
    fastify.get('/categories', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const dbCategories = await categoryRepo.findAll();
            const categories = dbCategories.map(toClientCategory);
            return { success: true, data: categories };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // POST /categories
    fastify.post('/categories', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const body = request.body as any;
            if (!body.name || !body.slug) {
                return reply.status(400).send({ success: false, message: 'Name and slug are required' });
            }

            const dbCat = await categoryRepo.create({
                name: body.name,
                slug: body.slug,
                description: body.description || null,
                icon_type: body.iconType || 'emoji',
                icon_value: body.iconValue || '💻',
                display_order: body.displayOrder !== undefined ? Number(body.displayOrder) : 999,
                status: body.status || 'active',
                is_deleted: false
            } as any);

            return reply.status(201).send({ success: true, data: toClientCategory(dbCat), message: 'Category created' });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // PUT /categories/:id
    fastify.put('/categories/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const body = request.body as any;

            const category = await categoryRepo.getById(id);
            if (!category) {
                return reply.status(404).send({ success: false, message: 'Category not found' });
            }

            const updateData: any = { updated_at: new Date() };
            if (body.name !== undefined) updateData.name = body.name;
            if (body.slug !== undefined) updateData.slug = body.slug;
            if (body.description !== undefined) updateData.description = body.description;
            if (body.iconType !== undefined) updateData.icon_type = body.iconType;
            if (body.iconValue !== undefined) updateData.icon_value = body.iconValue;
            if (body.displayOrder !== undefined) updateData.display_order = Number(body.displayOrder);
            if (body.status !== undefined) updateData.status = body.status;
            if (body.isDeleted !== undefined) updateData.is_deleted = body.isDeleted;

            const updated = await categoryRepo.update(id, updateData);
            return { success: true, data: toClientCategory(updated), message: 'Category updated' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /categories/:id
    fastify.delete('/categories/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const category = await categoryRepo.getById(id);
            if (!category) {
                return reply.status(404).send({ success: false, message: 'Category not found' });
            }

            // Soft delete
            await categoryRepo.update(id, { is_deleted: true, updated_at: new Date() });
            return { success: true, message: 'Category soft-deleted successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
};

export default adminCategoryRoutes;
