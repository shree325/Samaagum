import { seedAdminRBAC } from '../services/adminRbacSeeder';
import { seedPlatformSettings } from '../settings-library/settingsSeeder';
import prisma from '../config/prisma';

async function seedPlans() {
    console.log('🧹 Cleaning up old plans and referencing records...');

    try {
        // Delete subscription_orders of non-free/non-standard plans
        await prisma.$executeRawUnsafe(`
            DELETE FROM subscription_orders 
            WHERE plan_id NOT IN (
                SELECT id FROM admin_subscription_plans 
                WHERE name IN ('free', 'standard')
            )
        `);

        // Delete subscriptions of non-free/non-standard plans
        await prisma.$executeRawUnsafe(`
            DELETE FROM subscriptions 
            WHERE plan_id NOT IN (
                SELECT id FROM plans 
                WHERE key IN ('free', 'standard')
            )
        `);

        // Delete plans that are not free or standard
        await prisma.plans.deleteMany({
            where: {
                NOT: {
                    key: {
                        in: ['free', 'standard']
                    }
                }
            }
        });

        // Delete admin_subscription_plans that are not free or standard
        await prisma.admin_subscription_plans.deleteMany({
            where: {
                NOT: {
                    name: {
                        in: ['free', 'standard']
                    }
                }
            }
        });
    } catch (cleanupErr) {
        console.warn('⚠️ Non-critical warning during old plans cleanup:', cleanupErr);
    }

    const freeEntitlements = {
        group_max_groups: -1,
        group_allowed_visibility: ["unlisted"],
        group_allowed_join_modes: ["open", "invite_only"],
        group_max_capacity: 25,
        group_can_restricted_access: false,
        event_allowed_registration_modes: ["free", "cash"],
        event_allowed_visibility: ["unlisted", "invite_only"],
        event_max_participants: 100,
        event_checkin_methods: ["scanner", "manual", "gate"],
        event_can_create_paid_tickets: false
    };

    const standardEntitlements = {
        group_max_groups: -1,
        group_allowed_visibility: ["public", "unlisted", "restricted"],
        group_allowed_join_modes: ["open", "invite_only", "restricted_access"],
        group_max_capacity: -1,
        group_can_restricted_access: true,
        event_allowed_registration_modes: ["free", "cash", "paid"],
        event_allowed_visibility: ["public", "unlisted", "invite_only"],
        event_max_participants: -1,
        event_checkin_methods: ["scanner", "manual", "gate"],
        event_can_create_paid_tickets: true
    };

    // 1. Seed plans
    await prisma.plans.upsert({
        where: { key: 'free' },
        update: { entitlements: freeEntitlements },
        create: {
            key: 'free',
            plan_type: 'free',
            version: 1,
            entitlements: freeEntitlements,
            status: 'active'
        }
    });

    await prisma.plans.upsert({
        where: { key: 'standard' },
        update: { entitlements: standardEntitlements },
        create: {
            key: 'standard',
            plan_type: 'monthly',
            version: 1,
            entitlements: standardEntitlements,
            status: 'active'
        }
    });

    const freePlan = await prisma.admin_subscription_plans.upsert({
        where: { name: 'free' },
        update: {
            display_name: 'Free Plan',
            description: 'Basic plan for casual users',
            limits: freeEntitlements,
            features: [
                { name: "Create unlimited unlisted groups" },
                { name: "Up to 25 members per group" },
                { name: "Create free or cash events up to 100 participants" },
                { name: "Basic checkin methods available" }
            ]
        },
        create: {
            name: 'free',
            display_name: 'Free Plan',
            description: 'Basic plan for casual users',
            category: 'individual',
            plan_type: 'free',
            is_active: true,
            is_popular: false,
            pricing: {},
            features: [
                { name: "Create unlimited unlisted groups" },
                { name: "Up to 25 members per group" },
                { name: "Create free or cash events up to 100 participants" },
                { name: "Basic checkin methods available" }
            ],
            limits: freeEntitlements
        }
    });

    // Separately set is_default to true to avoid any IDE type-checking lag
    await (prisma.admin_subscription_plans as any).update({
        where: { id: freePlan.id },
        data: { is_default: true }
    });

    await prisma.admin_subscription_plans.upsert({
        where: { name: 'standard' },
        update: {
            display_name: 'Standard Plan',
            description: 'Premium features for professional hosts',
            limits: standardEntitlements,
            pricing: {
                monthly: { amount: 499, currency: "INR" },
                yearly: { amount: 4790, currency: "INR" }
            },
            features: [
                { name: "Create public and restricted groups" },
                { name: "Unlimited group members" },
                { name: "Paid ticket sales and paid event registration" },
                { name: "Unlimited event participants" },
                { name: "Full admin checkin features" }
            ]
        },
        create: {
            name: 'standard',
            display_name: 'Standard Plan',
            description: 'Premium features for professional hosts',
            category: 'individual',
            plan_type: 'monthly',
            is_active: true,
            is_popular: true,
            pricing: {
                monthly: { amount: 499, currency: "INR" },
                yearly: { amount: 4790, currency: "INR" }
            },
            features: [
                { name: "Create public and restricted groups" },
                { name: "Unlimited group members" },
                { name: "Paid ticket sales and paid event registration" },
                { name: "Unlimited event participants" },
                { name: "Full admin checkin features" }
            ],
            limits: standardEntitlements
        }
    });
}

async function main() {
    try {
        console.log('🔄 Seeding Admin RBAC...');
        await seedAdminRBAC();

        console.log('🔄 Seeding Platform Settings...');
        await seedPlatformSettings(async (query: string, params: any[]) => {
            return prisma.$queryRawUnsafe(query, ...params);
        });

        console.log('🔄 Seeding Subscription Plans...');
        await seedPlans();

        console.log('✅ Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

main();
