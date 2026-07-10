import prisma from '../config/prisma';
import { PlanEntitlementService } from '../services/PlanEntitlementService';

async function main() {
    console.log('--- Plan Entitlements Repair Script ---');
    const plans = await prisma.plans.findMany();
    console.log(`Found ${plans.length} core plans in database.`);

    let repairCount = 0;

    for (const corePlan of plans) {
        console.log(`Checking plan: ${corePlan.key} (ID: ${corePlan.id})`);
        
        const adminPlan = await prisma.admin_subscription_plans.findFirst({
            where: { name: corePlan.key }
        });

        if (!adminPlan) {
            console.log(`  No matching admin plan found for key: ${corePlan.key}`);
            continue;
        }

        const coreEnt = corePlan.entitlements;
        const adminLimits = adminPlan.limits || {};

        const isCoreEntArray = Array.isArray(coreEnt);
        const isAdminLimitsArray = Array.isArray(adminLimits);

        console.log(`  Core Plan Entitlements is array: ${isCoreEntArray}`);
        console.log(`  Admin Plan Limits is array: ${isAdminLimitsArray}`);

        // If core plan entitlements is an array, or different from admin limits, let's repair it
        if (isCoreEntArray || JSON.stringify(coreEnt) !== JSON.stringify(adminLimits)) {
            console.log(`  Mismatch or corrupt entitlements detected. Overwriting core entitlements with admin plan limits...`);
            await prisma.plans.update({
                where: { id: corePlan.id },
                data: {
                    entitlements: adminLimits
                }
            });
            console.log(`  Plan ${corePlan.key} entitlements updated successfully.`);
            repairCount++;
        } else {
            console.log(`  Plan ${corePlan.key} entitlements are already healthy.`);
        }
    }

    if (repairCount > 0) {
        console.log(`Successfully repaired ${repairCount} plans.`);
        PlanEntitlementService.clearCache();
        console.log('Cache cleared successfully.');
    } else {
        console.log('No plans needed repair.');
    }
}

main()
    .catch(e => {
        console.error('Error running repair script:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
