import { seedAdminRBAC } from '../services/adminRbacSeeder';

async function main() {
    try {
        await seedAdminRBAC();
        console.log('✅ Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

main();
