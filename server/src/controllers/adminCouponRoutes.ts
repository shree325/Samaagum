import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { R_adminCoupons } from '../repositories/R_adminCoupons';
import prisma from '../config/prisma';

export const adminCouponRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const couponRepo = new R_adminCoupons();

    // GET /coupons
    fastify.get('/coupons', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { search, discountType, isActive, page = 1, limit = 20 } = request.query as any;
            let sql = `SELECT * FROM admin_coupons WHERE 1=1`;
            const params: any[] = [];
            let i = 1;
            if (search) { sql += ` AND (code ILIKE $${i} OR description ILIKE $${i})`; params.push(`%${search}%`); i++; }
            if (discountType) { sql += ` AND discount_type = $${i}`; params.push(discountType); i++; }
            if (isActive !== undefined) { sql += ` AND is_active = $${i}`; params.push(isActive === 'true'); i++; }

            const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
            const offset = (Number(page) - 1) * Number(limit);
            sql += ` ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`;
            params.push(Number(limit), offset);

            const [coupons, countRows] = await Promise.all([
                prisma.$queryRawUnsafe<any[]>(sql, ...params),
                prisma.$queryRawUnsafe<{ count: string }[]>(countSql, ...params.slice(0, -2))
            ]);
            const total = parseInt(countRows[0]?.count || '0', 10);
            return { success: true, data: { coupons, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // POST /coupons/validate — public endpoint for checkout
    fastify.post('/coupons/validate', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { code, userEmail, orderAmount } = request.body as any;
            if (!code) return reply.status(400).send({ success: false, message: 'Coupon code is required' });

            const coupon = await couponRepo.findByCode(code, request.user?.tenantId);
            if (!coupon) return reply.status(404).send({ success: false, message: 'Invalid coupon code' });
            if (!coupon.is_active) return reply.status(400).send({ success: false, message: 'This coupon is inactive' });
            if (coupon.date_expires && new Date(coupon.date_expires) < new Date())
                return reply.status(400).send({ success: false, message: 'This coupon has expired' });

            const limits = coupon.usage_limits as any;
            if (limits?.usageLimit && coupon.usage_count >= limits.usageLimit)
                return reply.status(400).send({ success: false, message: 'Coupon usage limit reached' });

            const restrictions = coupon.usage_restrictions as any;
            if (restrictions?.minimumAmount && orderAmount < restrictions.minimumAmount)
                return reply.status(400).send({ success: false, message: `Minimum order amount of ${restrictions.minimumAmount} required` });
            if (restrictions?.allowedEmails?.length > 0 && !restrictions.allowedEmails.includes(userEmail?.toLowerCase()))
                return reply.status(400).send({ success: false, message: 'This coupon is not valid for your account' });

            const discount = coupon.discount_type === 'percent'
                ? (orderAmount * coupon.amount) / 100
                : coupon.amount;

            return { success: true, data: { coupon, discountPreview: discount } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // GET /coupons/:id
    fastify.get('/coupons/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const coupon = await couponRepo.getById(request.params.id);
            if (!coupon) return reply.status(404).send({ success: false, message: 'Coupon not found' });
            return { success: true, data: coupon };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // POST /coupons
    fastify.post('/coupons', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { code, description, discountType = 'percent', amount, dateExpires, freeShipping = false, usageRestrictions = {}, usageLimits = {}, emailSettings = {}, applicablePlans = [], metaData = [] } = request.body as any;
            if (!code || amount === undefined) return reply.status(400).send({ success: false, message: 'code and amount required' });

            const existing = await couponRepo.findByCode(code, request.user?.tenantId);
            if (existing) return reply.status(400).send({ success: false, message: 'Coupon code already exists' });

            const coupon = await couponRepo.create({
                code: code.toUpperCase().trim(), description, discount_type: discountType,
                amount: Number(amount), date_expires: dateExpires ? new Date(dateExpires) : null,
                usage_count: 0, is_active: true, free_shipping: freeShipping,
                usage_restrictions: usageRestrictions, usage_limits: usageLimits,
                email_settings: emailSettings, applicable_plan_ids: applicablePlans,
                meta_data: metaData, tenant_id: request.user?.tenantId || null
            });
            return reply.status(201).send({ success: true, data: coupon, message: 'Coupon created' });
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // PUT /coupons/:id
    fastify.put('/coupons/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const coupon = await couponRepo.getById(request.params.id);
            if (!coupon) return reply.status(404).send({ success: false, message: 'Coupon not found' });
            const { description, discountType, amount, dateExpires, isActive, freeShipping, usageRestrictions, usageLimits, emailSettings, metaData } = request.body as any;
            const update: any = { updated_at: new Date() };
            if (description !== undefined) update.description = description;
            if (discountType !== undefined) update.discount_type = discountType;
            if (amount !== undefined) update.amount = Number(amount);
            if (dateExpires !== undefined) update.date_expires = dateExpires ? new Date(dateExpires) : null;
            if (isActive !== undefined) update.is_active = isActive;
            if (freeShipping !== undefined) update.free_shipping = freeShipping;
            if (usageRestrictions !== undefined) update.usage_restrictions = usageRestrictions;
            if (usageLimits !== undefined) update.usage_limits = usageLimits;
            if (emailSettings !== undefined) update.email_settings = emailSettings;
            if (metaData !== undefined) update.meta_data = metaData;
            const updated = await couponRepo.update(request.params.id, update);
            return { success: true, data: updated, message: 'Coupon updated' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // DELETE /coupons/:id
    fastify.delete('/coupons/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const deleted = await couponRepo.delete(request.params.id);
            if (!deleted) return reply.status(404).send({ success: false, message: 'Coupon not found' });
            return { success: true, message: 'Coupon deleted' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });
};

export default adminCouponRoutes;
