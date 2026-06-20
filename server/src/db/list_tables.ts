import prisma from '../config/prisma';

async function main() {
  const result = await prisma.$queryRawUnsafe('SELECT tablename FROM pg_tables WHERE tablename LIKE \'%geolite%\'');
  console.log(result);
}

main().finally(() => prisma.$disconnect());
