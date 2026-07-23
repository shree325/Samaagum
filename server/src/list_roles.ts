import prisma from './config/prisma';

async function main() {
    const roles = await prisma.$queryRawUnsafe<any[]>(`SELECT name, is_active FROM admin_roles`);
    console.log('Admin Roles remaining in DB:');
    roles.forEach(r => console.log(`${r.name} - active: ${r.is_active}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
