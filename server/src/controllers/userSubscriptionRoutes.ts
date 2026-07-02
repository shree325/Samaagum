import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { R_adminSubscriptionPlans } from '../repositories/R_adminSubscriptionPlans';
import { R_adminCoupons } from '../repositories/R_adminCoupons';
import { SubscriptionActivationService } from '../services/SubscriptionActivationService';

// Lazy-initialize Razorpay
let razorpayInstance: any = null;
const getRazorpay = () => {
    if (razorpayInstance) return razorpayInstance;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
        console.warn('⚠️ Razorpay environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing.');
        return null;
    }
    try {
        const Razorpay = require('razorpay');
        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });
        return razorpayInstance;
    } catch (err) {
        console.error('Failed to initialize Razorpay SDK:', err);
        return null;
    }
};

// In-memory cache for subscription previews (15 mins TTL)
const previewCache = new Map<string, any>();

export const userSubscriptionRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const planRepo = new R_adminSubscriptionPlans();
    const couponRepo = new R_adminCoupons();

    // 1. GET /plans/public — List all active public plans
    fastify.get('/plans/public', async (request, reply) => {
        try {
            const plans = await planRepo.findPublic();
            return { success: true, data: plans };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 1b. POST /check-expiring-test — Trigger manual check for expiring subscriptions (for admin / testing)
    fastify.post('/check-expiring-test', async (request, reply) => {
        try {
            const { SubscriptionNotificationService } = await import('../services/SubscriptionNotificationService');
            await SubscriptionNotificationService.checkExpiringSubscriptions();
            return { success: true, message: 'Expiring subscriptions check triggered successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 2. GET /status — Get active subscription status and details of the current logged-in user
    fastify.get('/status', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            // Fetch user
            const user = await prisma.users.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return reply.status(404).send({ success: false, message: 'User not found' });
            }

            // Fetch ALL completed orders for this user
            const allOrders = await prisma.subscription_orders.findMany({
                where: {
                    user_id: userId,
                    status: 'completed'
                },
                orderBy: { completed_at: 'desc' }
            });

            const activeOrder = allOrders.find(o => o.subscription_status === 'active' && o.subscription_end_date && o.subscription_end_date > new Date());
            
            // We need the plan names for the active and previous plans
            const planIdsToFetch = Array.from(new Set(allOrders.map(o => o.plan_id)));
            const planRecords = await prisma.admin_subscription_plans.findMany({
                where: { id: { in: planIdsToFetch } },
                select: { id: true, name: true }
            });
            const planMap = new Map(planRecords.map(p => [p.id, p.name.toLowerCase()]));

            // Collect all previously purchased plans, separating switchable (unexpired) from expired
            const switchablePlans: { plan: string, planId: string, billingCycle: string, orderId: string }[] = [];
            const previousPlans: { plan: string, planId: string, billingCycle: string }[] = [];
            
            for (const order of allOrders) {
                if (order.id === activeOrder?.id) continue;
                const planName = planMap.get(order.plan_id);
                if (planName) {
                    const cycle = order.plan_type;
                    const isExpired = !order.subscription_end_date || order.subscription_end_date <= new Date();

                    if (!isExpired) {
                        if (!switchablePlans.find(p => p.planId === order.plan_id && p.billingCycle === cycle)) {
                            switchablePlans.push({ plan: planName, planId: order.plan_id, billingCycle: cycle, orderId: order.id });
                        }
                    } else {
                        if (!switchablePlans.find(p => p.planId === order.plan_id && p.billingCycle === cycle)) {
                            if (!previousPlans.find(p => p.planId === order.plan_id && p.billingCycle === cycle)) {
                                previousPlans.push({ plan: planName, planId: order.plan_id, billingCycle: cycle });
                            }
                        }
                    }
                }
            }

            // Fetch user access profile (role, position, responsibilities)
            const roleAssignment = await prisma.$queryRawUnsafe<any[]>(
                `SELECT ra.*, r.name as role_name, r.display_name as role_display, r.default_position_id
                 FROM role_assignments ra
                 JOIN admin_roles r ON r.id = ra.role_id
                 WHERE ra.user_id = $1::uuid AND (ra.expires_at IS NULL OR ra.expires_at > now())
                 LIMIT 1`,
                userId
            );

            let roleDetails = null;
            let positionDetails = null;

            if (roleAssignment && roleAssignment.length > 0) {
                const ra = roleAssignment[0];
                roleDetails = {
                    id: ra.role_id,
                    name: ra.role_name,
                    displayName: ra.role_display
                };

                if (ra.default_position_id) {
                    const position = await prisma.admin_positions.findUnique({
                        where: { id: ra.default_position_id }
                    });
                    if (position) {
                        positionDetails = {
                            id: position.id,
                            name: position.name,
                            displayName: position.display_name,
                            dataAccessLevel: position.data_access_level,
                            dataAccessLimits: position.data_access_limits
                        };
                    }
                }
            }

            let actualPlanName = activeOrder ? (planMap.get(activeOrder.plan_id) || 'free') : null;

            return {
                success: true,
                data: {
                    subscription: activeOrder ? {
                        plan: actualPlanName,
                        billingCycle: activeOrder.plan_type,
                        status: 'active',
                        startDate: activeOrder.subscription_start_date,
                        endDate: activeOrder.subscription_end_date,
                        planId: activeOrder.plan_id,
                        orderNumber: activeOrder.order_number,
                        switchablePlans,
                        previousPlans
                    } : {
                        plan: null,
                        status: 'inactive',
                        switchablePlans,
                        previousPlans
                    },
                    role: roleDetails,
                    position: positionDetails,
                    user: {
                        id: user.id,
                        email: user.primary_email,
                        state: user.state
                    }
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 2.5 POST /switch - Switch active plan freely
    fastify.post('/switch', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const userId = request.user.id;
            const { orderId } = request.body as { orderId: string };

            if (!orderId) {
                return reply.status(400).send({ success: false, message: 'Missing orderId' });
            }

            const targetOrder = await prisma.subscription_orders.findUnique({
                where: { id: orderId }
            });

            if (!targetOrder || targetOrder.user_id !== userId || targetOrder.status !== 'completed') {
                return reply.status(400).send({ success: false, message: 'Invalid order for switching' });
            }

            if (!targetOrder.subscription_end_date || targetOrder.subscription_end_date <= new Date()) {
                return reply.status(400).send({ success: false, message: 'Order has expired' });
            }

            const { SubscriptionActivationService } = await import('../services/SubscriptionActivationService');
            const success = await SubscriptionActivationService.switchPlan(orderId);

            if (success) {
                return { success: true, message: 'Successfully switched active plan' };
            } else {
                return reply.status(500).send({ success: false, message: 'Failed to switch plan' });
            }
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 3. POST /coupons/validate — Validate a coupon code
    fastify.post('/coupons/validate', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { code, cartTotal, subscriptionPlanId } = request.body as any;
            const tenantId = request.user?.tenantId || null;
            const userEmail = request.user?.email || request.user?.primary_email || '';

            if (!code) {
                return reply.status(400).send({ success: false, message: 'Coupon code is required' });
            }

            const coupon = await couponRepo.findByCode(code, tenantId);
            if (!coupon || !coupon.is_active) {
                return reply.status(404).send({ success: false, message: 'Invalid or inactive coupon code' });
            }

            // Verify expiration
            if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
                return reply.status(400).send({ success: false, message: 'This coupon has expired' });
            }

            // Verify total usage limit
            const limits = coupon.usage_limits as any;
            if (limits?.usageLimit && coupon.usage_count >= limits.usageLimit) {
                return reply.status(400).send({ success: false, message: 'Coupon usage limit has been reached' });
            }

            // Verify minimum spend restriction
            const restrictions = coupon.usage_restrictions as any;
            if (restrictions?.minimumAmount && cartTotal < restrictions.minimumAmount) {
                return reply.status(400).send({
                    success: false,
                    message: `Minimum purchase of ₹${restrictions.minimumAmount} required`
                });
            }

            // Verify email whitelist restriction
            if (restrictions?.allowedEmails && Array.isArray(restrictions.allowedEmails) && restrictions.allowedEmails.length > 0) {
                const emailMatch = restrictions.allowedEmails.map((e: string) => e.toLowerCase()).includes(userEmail.toLowerCase());
                if (!emailMatch) {
                    return reply.status(400).send({ success: false, message: 'This coupon is not valid for your email address' });
                }
            }

            // Verify plan restriction
            const planIds = coupon.applicable_plan_ids as any;
            if (planIds && Array.isArray(planIds) && planIds.length > 0 && !planIds.includes(subscriptionPlanId)) {
                return reply.status(400).send({ success: false, message: 'This coupon is not applicable to the selected plan' });
            }

            // Calculate discount amount
            let discountAmount = 0;
            const couponAmount = Number(coupon.amount);
            if (coupon.discount_type === 'percent') {
                discountAmount = (cartTotal * couponAmount) / 100;
            } else {
                discountAmount = couponAmount;
            }

            discountAmount = Math.min(discountAmount, cartTotal);

            return {
                success: true,
                data: {
                    coupon: {
                        id: coupon.id,
                        code: coupon.code,
                        discountType: coupon.discount_type,
                        amount: couponAmount
                    },
                    discountAmount,
                    finalTotal: Math.max(0, cartTotal - discountAmount)
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 4. POST /orders — Create a subscription order
    fastify.post('/orders', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { planId, planType, shippingAddress = {}, billingAddress = {}, paymentMethod, customerNote, couponCode } = request.body as any;
            const userId = request.user?.id;
            const tenantId = request.user?.tenantId || null;

            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            // Fetch Plan
            const plan = await planRepo.getById(planId);
            if (!plan || !plan.is_active) {
                return reply.status(404).send({ success: false, message: 'Subscription plan not found or inactive' });
            }

            const pricingInfo = plan.pricing as any;
            const priceObj = planType === 'yearly' ? pricingInfo.yearly : pricingInfo.monthly;
            if (!priceObj) {
                return reply.status(400).send({ success: false, message: `Pricing details not found for plan type: ${planType}` });
            }

            const subtotal = Number(priceObj.amount || 0);

            // Validate Coupon if present
            let discountAmount = 0;
            let finalCouponCode = null;

            if (couponCode) {
                const coupon = await couponRepo.findByCode(couponCode, tenantId);
                if (coupon && coupon.is_active) {
                    const isExpired = coupon.date_expires && new Date(coupon.date_expires) < new Date();
                    const limits = coupon.usage_limits as any;
                    const limitReached = limits?.usageLimit && coupon.usage_count >= limits.usageLimit;
                    const restrictions = coupon.usage_restrictions as any;
                    const meetsMinSpend = !restrictions?.minimumAmount || subtotal >= restrictions.minimumAmount;

                    if (!isExpired && !limitReached && meetsMinSpend) {
                        const couponAmount = Number(coupon.amount);
                        if (coupon.discount_type === 'percent') {
                            discountAmount = (subtotal * couponAmount) / 100;
                        } else {
                            discountAmount = couponAmount;
                        }
                        discountAmount = Math.min(discountAmount, subtotal);
                        finalCouponCode = coupon.code;

                        // Increment coupon usage
                        await couponRepo.incrementUsage(coupon.id!);
                    }
                }
            }

            const discountedSubtotal = Math.max(0, subtotal - discountAmount);

            // Taxes (e.g. GST 18% for Indian billing address country = 'IN')
            const taxes: any[] = [];
            let taxTotal = 0;

            if (billingAddress?.country === 'IN') {
                const gstAmount = discountedSubtotal * 0.18;
                taxes.push({ name: 'GST', rate: 18, amount: Number(gstAmount.toFixed(2)), compound: false });
                taxTotal = Number(gstAmount.toFixed(2));
            }

            const total = Number((discountedSubtotal + taxTotal).toFixed(2));

            // Generate unique order number
            const orderCount = await prisma.subscription_orders.count();
            const orderNumber = `SUB-${String(orderCount + 1).padStart(6, '0')}`;

            // Create pending order
            const order = await prisma.subscription_orders.create({
                data: {
                    order_number: orderNumber,
                    user_id: userId,
                    tenant_id: tenantId,
                    status: total === 0 ? 'completed' : 'pending',
                    plan_id: plan.id!,
                    plan_type: planType,
                    shipping_address: shippingAddress,
                    billing_address: billingAddress,
                    subtotal,
                    tax_total: taxTotal,
                    total,
                    currency: priceObj.currency || 'INR',
                    taxes,
                    coupon_code: finalCouponCode,
                    discount_amount: discountAmount,
                    payment_method: total === 0 ? 'free' : paymentMethod,
                    payment_method_title: total === 0 ? 'Free Subscription' : (paymentMethod === 'razorpay' ? 'Razorpay' : paymentMethod),
                    payment_status: total === 0 ? 'completed' : 'pending',
                    subscription_status: total === 0 ? 'active' : 'pending',
                    customer_note: customerNote || null,
                    completed_at: total === 0 ? new Date() : null
                }
            });

            // If it is a free order, activate right away!
            if (total === 0) {
                await SubscriptionActivationService.activate(order.id);
                try {
                    const { InvoiceService } = await import('../services/InvoiceService');
                    await InvoiceService.generateInvoice(order.id);
                } catch (invErr) {
                    console.error(`[userSubscriptionRoutes] Failed to generate invoice for free order ${order.id}:`, invErr);
                }
            }

            return reply.status(201).send({
                success: true,
                data: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    total: order.total,
                    currency: order.currency,
                    status: order.status,
                    subscriptionStatus: order.subscription_status
                }
            });
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 5. POST /payment/create-intent — Create Razorpay order intent
    fastify.post('/payment/create-intent', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { orderId } = request.body as any;
            const userId = request.user?.id;

            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            const order = await prisma.subscription_orders.findFirst({
                where: { id: orderId, user_id: userId, status: 'pending' }
            });

            if (!order) {
                return reply.status(404).send({ success: false, message: 'Pending subscription order not found' });
            }

            const razorpay = getRazorpay();
            if (!razorpay) {
                // If Razorpay not configured, support a bypass/sandbox flow for testing if requested
                if (process.env.NODE_ENV !== 'production' || true) {
                    console.log('Sandbox/Mock payment mode activated due to missing Razorpay keys');
                    const mockPaymentIntentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
                    await prisma.subscription_orders.update({
                        where: { id: orderId },
                        data: {
                            payment_intent_id: mockPaymentIntentId,
                            payment_status: 'processing',
                            updated_at: new Date()
                        }
                    });
                    return {
                        success: true,
                        sandbox: true,
                        data: {
                            orderId: mockPaymentIntentId,
                            amount: Math.round(Number(order.total) * 100),
                            currency: order.currency,
                            key: 'mock_key_id'
                        }
                    };
                }
                return reply.status(500).send({ success: false, message: 'Razorpay is not configured on this server' });
            }

            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(Number(order.total) * 100), // paise
                currency: order.currency || 'INR',
                receipt: order.order_number,
                notes: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    userId
                }
            });

            await prisma.subscription_orders.update({
                where: { id: orderId },
                data: {
                    payment_intent_id: razorpayOrder.id,
                    payment_status: 'processing',
                    updated_at: new Date()
                }
            });

            return {
                success: true,
                data: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 6. POST /payment/confirm — Confirm Razorpay payment and activate
    fastify.post('/payment/confirm', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { orderId, paymentIntentId, razorpayPaymentId, razorpaySignature } = request.body as any;
            const userId = request.user?.id;

            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            const order = await prisma.subscription_orders.findFirst({
                where: {
                    id: orderId,
                    user_id: userId,
                    payment_intent_id: paymentIntentId
                }
            });

            if (!order) {
                return reply.status(404).send({ success: false, message: 'Subscription order not found' });
            }

            // Verify Signature
            const secret = process.env.RAZORPAY_KEY_SECRET || '';
            const text = `${paymentIntentId}|${razorpayPaymentId}`;
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(text)
                .digest('hex');

            // Support mock/sandbox bypass if signature verification matches mock layout
            const isMockBypass = paymentIntentId.startsWith('pay_mock_') && razorpayPaymentId === 'mock_payment_id';

            if (!isMockBypass && expectedSignature !== razorpaySignature) {
                await prisma.subscription_orders.update({
                    where: { id: orderId },
                    data: {
                        payment_status: 'failed',
                        status: 'failed',
                        updated_at: new Date()
                    }
                });
                return reply.status(400).send({ success: false, message: 'Payment verification failed' });
            }

            // Success
            await prisma.subscription_orders.update({
                where: { id: orderId },
                data: {
                    payment_transaction_id: razorpayPaymentId,
                    payment_status: 'completed',
                    payment_paid_date: new Date(),
                    payment_gateway_response: { signatureVerified: true },
                    status: 'completed',
                    completed_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Activate subscription benefits & role assignment
            await SubscriptionActivationService.activate(orderId);

            return {
                success: true,
                message: 'Payment confirmed and subscription activated successfully',
                data: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    status: 'completed',
                    subscriptionStatus: 'active'
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 7. GET /orders — Retrieve user's order history
    fastify.get('/orders', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const userId = request.user?.id;
            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }
            const orders = await prisma.subscription_orders.findMany({
                where: { user_id: userId },
                include: {
                    admin_subscription_plans: {
                        select: { name: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });
            return { success: true, data: orders };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 7.5 POST /payment/preview — Generate a preview for subscription
    fastify.post('/payment/preview', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { planId, billingCycle, shippingAddress = {}, billingAddress = {}, couponCode } = request.body as any;
            const tenantId = request.user?.tenantId || null;
            const userEmail = request.user?.email || request.user?.primary_email || '';

            const plan = await planRepo.getById(planId);
            if (!plan || !plan.is_active) {
                return reply.status(404).send({ success: false, message: 'Subscription plan not found or inactive' });
            }

            const pricingInfo = plan.pricing as any;
            const priceObj = billingCycle === 'yearly' ? pricingInfo.yearly : pricingInfo.monthly;
            if (!priceObj) {
                return reply.status(400).send({ success: false, message: `Pricing details not found for cycle: ${billingCycle}` });
            }

            const subtotal = Number(priceObj.amount || 0);

            // Validate Coupon
            let discountAmount = 0;
            if (couponCode) {
                const coupon = await couponRepo.findByCode(couponCode, tenantId);
                let couponValid = false;

                if (coupon && coupon.is_active) {
                    const isExpired = coupon.date_expires && new Date(coupon.date_expires) < new Date();
                    const limits = coupon.usage_limits as any;
                    const limitReached = limits?.usageLimit && coupon.usage_count >= limits.usageLimit;
                    const restrictions = coupon.usage_restrictions as any;
                    const meetsMinSpend = !restrictions?.minimumAmount || subtotal >= restrictions.minimumAmount;

                    let emailAllowed = true;
                    if (restrictions?.allowedEmails && Array.isArray(restrictions.allowedEmails) && restrictions.allowedEmails.length > 0) {
                        emailAllowed = restrictions.allowedEmails.map((e: string) => e.toLowerCase()).includes(userEmail.toLowerCase());
                    }

                    if (!isExpired && !limitReached && meetsMinSpend && emailAllowed) {
                        couponValid = true;
                        const couponAmount = Number(coupon.amount);
                        if (coupon.discount_type === 'percent') {
                            discountAmount = (subtotal * couponAmount) / 100;
                        } else {
                            discountAmount = couponAmount;
                        }
                        discountAmount = Math.min(discountAmount, subtotal);
                    }
                }

                if (!couponValid) {
                    return reply.status(400).send({
                        success: false,
                        code: 'COUPON_INVALID',
                        message: 'Coupon is no longer valid.'
                    });
                }
            }

            const discountedSubtotal = Math.max(0, subtotal - discountAmount);
            let taxTotal = 0;
            if (billingAddress?.country === 'IN') {
                const gstAmount = discountedSubtotal * 0.18;
                taxTotal = Number(gstAmount.toFixed(2));
            }

            const totalAmount = Number((discountedSubtotal + taxTotal).toFixed(2));

            // Generate previewId and cache
            const previewId = `prev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

            const previewData = {
                previewId,
                planName: plan.display_name,
                billingCycle,
                currency: priceObj.currency || 'INR',
                baseAmount: subtotal,
                discountAmount: discountAmount,
                gstAmount: taxTotal,
                totalAmount: totalAmount,
                expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
            };

            previewCache.set(previewId, previewData);

            // Auto cleanup after 15 mins
            setTimeout(() => {
                previewCache.delete(previewId);
            }, 15 * 60 * 1000);

            return { success: true, data: previewData };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 8. POST /payment/create-order — Create local order and Razorpay order intent
    fastify.post('/payment/create-order', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { planId, billingCycle, shippingAddress = {}, billingAddress = {}, couponCode, previewId } = request.body as any;
            const userId = request.user?.id;
            const tenantId = request.user?.tenantId || null;
            const userEmail = request.user?.email || request.user?.primary_email || '';

            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            // Preview Validation
            if (!previewId || !previewCache.has(previewId)) {
                return reply.status(400).send({
                    success: false,
                    code: 'PREVIEW_EXPIRED',
                    message: 'Pricing has expired. Please review your order again.'
                });
            }

            const plan = await planRepo.getById(planId);
            if (!plan || !plan.is_active) {
                return reply.status(404).send({ success: false, message: 'Subscription plan not found or inactive' });
            }

            const pricingInfo = plan.pricing as any;
            const priceObj = billingCycle === 'yearly' ? pricingInfo.yearly : pricingInfo.monthly;
            if (!priceObj) {
                return reply.status(400).send({ success: false, message: `Pricing details not found for cycle: ${billingCycle}` });
            }

            const subtotal = Number(priceObj.amount || 0);

            // Validate Coupon (Revalidation)
            let discountAmount = 0;
            let finalCouponCode = null;
            if (couponCode) {
                const coupon = await couponRepo.findByCode(couponCode, tenantId);
                let couponValid = false;

                if (coupon && coupon.is_active) {
                    const isExpired = coupon.date_expires && new Date(coupon.date_expires) < new Date();
                    const limits = coupon.usage_limits as any;
                    const limitReached = limits?.usageLimit && coupon.usage_count >= limits.usageLimit;
                    const restrictions = coupon.usage_restrictions as any;
                    const meetsMinSpend = !restrictions?.minimumAmount || subtotal >= restrictions.minimumAmount;

                    // Check email restriction
                    let emailAllowed = true;
                    if (restrictions?.allowedEmails && Array.isArray(restrictions.allowedEmails) && restrictions.allowedEmails.length > 0) {
                        emailAllowed = restrictions.allowedEmails.map((e: string) => e.toLowerCase()).includes(userEmail.toLowerCase());
                    }

                    if (!isExpired && !limitReached && meetsMinSpend && emailAllowed) {
                        couponValid = true;
                        const couponAmount = Number(coupon.amount);
                        if (coupon.discount_type === 'percent') {
                            discountAmount = (subtotal * couponAmount) / 100;
                        } else {
                            discountAmount = couponAmount;
                        }
                        discountAmount = Math.min(discountAmount, subtotal);
                        finalCouponCode = coupon.code;
                        await couponRepo.incrementUsage(coupon.id!);
                    }
                }

                if (!couponValid) {
                    return reply.status(400).send({
                        success: false,
                        code: 'COUPON_INVALID',
                        message: 'Coupon is no longer valid.'
                    });
                }
            }

            const discountedSubtotal = Math.max(0, subtotal - discountAmount);
            let taxTotal = 0;
            const taxes: any[] = [];
            if (billingAddress?.country === 'IN') {
                const gstAmount = discountedSubtotal * 0.18;
                taxes.push({ name: 'GST', rate: 18, amount: Number(gstAmount.toFixed(2)), compound: false });
                taxTotal = Number(gstAmount.toFixed(2));
            }

            const total = Number((discountedSubtotal + taxTotal).toFixed(2));

            // Generate unique order number
            const orderCount = await prisma.subscription_orders.count();
            const orderNumber = `SUB-${String(orderCount + 1).padStart(6, '0')}`;

            // Create local pending order record
            const order = await prisma.subscription_orders.create({
                data: {
                    order_number: orderNumber,
                    user_id: userId,
                    tenant_id: tenantId,
                    status: 'pending',
                    plan_id: plan.id!,
                    plan_type: billingCycle,
                    shipping_address: shippingAddress,
                    billing_address: billingAddress,
                    subtotal,
                    tax_total: taxTotal,
                    total,
                    currency: priceObj.currency || 'INR',
                    taxes,
                    coupon_code: finalCouponCode,
                    discount_amount: discountAmount,
                    payment_method: 'razorpay',
                    payment_method_title: 'Razorpay',
                    payment_status: 'pending',
                    subscription_status: 'pending',
                    completed_at: null
                }
            });

            // Initialize Razorpay
            const razorpay = getRazorpay();
            if (!razorpay) {
                // Sandbox/Mock payment mode activated due to missing Razorpay keys
                console.log('Sandbox/Mock payment mode activated due to missing Razorpay keys');
                const mockPaymentIntentId = `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
                await prisma.subscription_orders.update({
                    where: { id: order.id },
                    data: {
                        payment_intent_id: mockPaymentIntentId,
                        payment_status: 'processing',
                        updated_at: new Date()
                    }
                });
                return {
                    success: true,
                    sandbox: true,
                    data: {
                        orderId: mockPaymentIntentId,
                        amount: Math.round(total * 100),
                        currency: order.currency,
                        key: 'mock_key_id',
                        localOrderId: order.id
                    }
                };
            }

            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(total * 100), // paise
                currency: order.currency || 'INR',
                receipt: order.order_number,
                notes: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    userId
                }
            });

            await prisma.subscription_orders.update({
                where: { id: order.id },
                data: {
                    payment_intent_id: razorpayOrder.id,
                    payment_status: 'processing',
                    updated_at: new Date()
                }
            });

            return {
                success: true,
                sandbox: false,
                data: {
                    orderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                    localOrderId: order.id
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 9. POST /payment/verify — Verify Razorpay payment and activate subscription
    fastify.post('/payment/verify', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { localOrderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = request.body as any;
            const userId = request.user?.id;

            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            const order = await prisma.subscription_orders.findFirst({
                where: {
                    id: localOrderId,
                    user_id: userId,
                    payment_intent_id: razorpayOrderId
                }
            });

            if (!order) {
                return reply.status(404).send({ success: false, message: 'Subscription order not found' });
            }

            // Verify Signature
            const isMockBypass = razorpayOrderId.startsWith('pay_mock_') && razorpayPaymentId === 'mock_payment_id';

            if (!isMockBypass) {
                const secret = process.env.RAZORPAY_KEY_SECRET || '';
                const text = `${razorpayOrderId}|${razorpayPaymentId}`;
                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(text)
                    .digest('hex');

                if (expectedSignature !== razorpaySignature) {
                    await prisma.subscription_orders.update({
                        where: { id: localOrderId },
                        data: {
                            payment_status: 'failed',
                            status: 'failed',
                            updated_at: new Date()
                        }
                    });
                    return reply.status(400).send({ success: false, message: 'Payment verification signature mismatch' });
                }
            }

            // Success
            await prisma.subscription_orders.update({
                where: { id: localOrderId },
                data: {
                    payment_transaction_id: razorpayPaymentId,
                    payment_status: 'completed',
                    payment_paid_date: new Date(),
                    payment_gateway_response: { signatureVerified: true, isMock: isMockBypass },
                    status: 'completed',
                    completed_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Activate subscription benefits & role assignment
            await SubscriptionActivationService.activate(localOrderId);

            // Generate invoice
            try {
                const { InvoiceService } = await import('../services/InvoiceService');
                await InvoiceService.generateInvoice(localOrderId);
            } catch (invErr) {
                console.error(`[userSubscriptionRoutes] Failed to generate invoice for order ${localOrderId}:`, invErr);
            }

            // Fetch Plan details to get plan display name
            const plan = await planRepo.getById(order.plan_id);

            // Fetch updated order to get recalculated dates from activation service
            const updatedOrder = await prisma.subscription_orders.findUnique({
                where: { id: localOrderId }
            });

            return {
                success: true,
                message: 'Payment verified and subscription activated successfully',
                data: {
                    order_number: order.order_number,
                    plan_name: plan?.display_name || 'Samaagum Subscription',
                    billing_cycle: order.plan_type,
                    activated_at: updatedOrder?.subscription_start_date?.toISOString() || new Date().toISOString(),
                    next_billing_at: updatedOrder?.subscription_end_date?.toISOString() || new Date().toISOString(),
                    subscription_status: 'active',
                    total: Number(order.total)
                }
            };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // 10. GET /orders/:orderId/invoice — Download PDF invoice
    fastify.get('/orders/:orderId/invoice', { preHandler: [(fastify as any).authenticate] }, async (request: any, reply) => {
        try {
            const { orderId } = request.params as { orderId: string };
            const userId = request.user?.id;

            if (!userId) {
                return reply.status(401).send({ success: false, message: 'Unauthorized' });
            }

            // 1. Fetch Order and verify ownership
            const order = await prisma.subscription_orders.findUnique({
                where: { id: orderId }
            });

            if (!order) {
                return reply.status(404).send({ success: false, message: 'Order not found' });
            }

            if (order.user_id !== userId) {
                return reply.status(403).send({ success: false, message: 'Forbidden: You do not own this order' });
            }

            if (order.status !== 'completed') {
                return reply.status(400).send({ success: false, message: 'Invoice only available for completed orders' });
            }

            // 2. Find or generate invoice
            const { InvoiceService } = await import('../services/InvoiceService');
            let invoice = await prisma.invoices.findUnique({
                where: { order_id: orderId }
            });

            if (!invoice) {
                console.log(`[userSubscriptionRoutes] Invoice not found for completed order ${orderId}, generating now.`);
                invoice = await InvoiceService.generateInvoice(orderId);
            }

            if (!invoice || !invoice.pdf_data) {
                return reply.status(500).send({ success: false, message: 'Failed to retrieve or generate invoice' });
            }

            reply.header('Content-Type', 'application/pdf');
            reply.header('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);
            return reply.send(invoice.pdf_data);
        } catch (e: any) {
            console.error(`[userSubscriptionRoutes] Error downloading invoice:`, e);
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
};

export default userSubscriptionRoutes;
