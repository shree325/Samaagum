import prisma from '../config/prisma';

async function main() {
  try {
    const cats = await prisma.$queryRawUnsafe('SELECT * FROM categories LIMIT 1') as any[];
    console.log('Categories table exists and is accessible. Rows count:', cats.length);
  } catch (e: any) {
    console.log('Categories error:', e.message);
  }

  try {
    const tags = await prisma.$queryRawUnsafe('SELECT * FROM tags LIMIT 1') as any[];
    console.log('Tags table exists and is accessible. Rows count:', tags.length);
  } catch (e: any) {
    console.log('Tags error:', e.message);
  }
  process.exit(0);
}

main();
