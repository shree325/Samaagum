import { seedAdminRBAC } from '../services/adminRbacSeeder';
import { seedPlatformSettings } from '../settings-library/settingsSeeder';
import prisma from '../config/prisma';

async function main() {
    try {
        console.log('🔄 Seeding Admin RBAC...');
        await seedAdminRBAC();
        
        console.log('🔄 Seeding Platform Settings...');
        await seedPlatformSettings(async (query: string, params: any[]) => {
            return prisma.$queryRawUnsafe(query, ...params);
        });

        console.log('✅ Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

main();
