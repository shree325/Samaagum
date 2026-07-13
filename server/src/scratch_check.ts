import prisma from './config/prisma';

async function main() {
    try {
        const settings = await prisma.platform_settings.findFirst({
            where: { scope_tenant_id: null, key: 'auth_settings' }
        });
        console.log('auth_settings:', JSON.stringify(settings, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message || e);
    } finally {
        process.exit(0);
    }
}

main();
