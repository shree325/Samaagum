import prisma from './config/prisma';

async function main() {
    try {
        const cols = await prisma.$queryRawUnsafe<any[]>(
            `SELECT column_name, data_type 
             FROM information_schema.columns 
             WHERE table_name = 'entities'`
        );
        console.log('Columns of entities table:', cols);
    } catch (e: any) {
        console.error('Error:', e.message || e);
    } finally {
        process.exit(0);
    }
}

main();
