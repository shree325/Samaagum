import prisma from '../config/prisma';

async function cleanup() {
    console.log('🔄 Starting cleanup of duplicate platform settings...');

    // Get all settings keys
    const keysResult = await prisma.$queryRawUnsafe<{ key: string }[]>(
        `SELECT DISTINCT key FROM platform_settings WHERE scope_tenant_id IS NULL`
    );

    for (const { key } of keysResult) {
        // Get all rows for this key, ordered by updated_at descending
        const rows = await prisma.$queryRawUnsafe<{ id: string; updated_at: string; value: any }[]>(
            `SELECT id, updated_at, value FROM platform_settings 
             WHERE scope_tenant_id IS NULL AND key = $1 
             ORDER BY updated_at DESC`,
            key
        );

        if (rows.length > 1) {
            console.log(`⚠️ Found ${rows.length} rows for key: "${key}"`);
            
            // Keep the first one (newest), delete the rest
            const keepId = rows[0].id;
            const deleteIds = rows.slice(1).map(r => r.id);

            console.log(`👉 Keeping row ID: ${keepId} (Updated at: ${rows[0].updated_at})`);
            console.log(`🗑️ Deleting row IDs: ${deleteIds.join(', ')}`);

            for (const id of deleteIds) {
                await prisma.$executeRawUnsafe(
                    `DELETE FROM platform_settings WHERE id = $1::uuid`,
                    id
                );
            }
        } else {
            console.log(`✅ Key "${key}" is clean (has ${rows.length} row).`);
        }
    }

    console.log('🎉 Database cleanup complete.');
}

cleanup()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    });
