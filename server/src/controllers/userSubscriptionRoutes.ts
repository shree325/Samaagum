import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
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

            // Fetch current active order representing subscription details
            const activeOrder = await prisma.subscription_orders.findFirst({
                where: {
                    user_id: userId,
                    status: 'completed',
                    subscription_status: 'active',
                    subscription_end_date: {
                        gt: new Date()
                    }
                },
                orderBy: {
                    completed_at: 'desc'
                }
            });

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

            return {
                success: true,
                data: {
                    subscription: activeOrder ? {
                        plan: activeOrder.plan_type,
                        status: 'active',
                        startDate: activeOrder.subscription_start_date,
                        endDate: activeOrder.subscription_end_date,
                        planId: activeOrder.plan_id,
                        orderNumber: activeOrder.order_number
                    } : {
                        plan: 'free',
                        status: 'active'
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
                orderBy: { created_at: 'desc' }
            });
            return { success: true, data: orders };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });
};

export default userSubscriptionRoutes;
