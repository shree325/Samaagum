import fs from 'fs';
import prisma from '../config/prisma';

async function main() {
  const sql = fs.readFileSync(__dirname + '/add_index.sql', 'utf-8');
  await prisma.$executeRawUnsafe(sql);
  console.log('Index created successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
