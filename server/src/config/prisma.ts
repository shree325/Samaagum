/// <reference path="../types/prisma.d.ts" />
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

const pool = new pg.Pool({
  connectionString,
  max: 50,
  idleTimeoutMillis: 1000
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Attach query method for repository backward compatibility
(prisma as any).query = async function (sql: string, params?: any[]) {
  try {
    const result = await prisma.$queryRawUnsafe(sql, ...(params || []));
    let rows: any[] = [];
    let rowCount = 0;

    if (Array.isArray(result)) {
      rows = result;
      rowCount = result.length;
    } else if (typeof result === 'number') {
      rowCount = result;
    }

    return {
      rows,
      rowCount,
      command: '',
      oid: 0,
      fields: []
    };
  } catch (error: any) {
    console.error('❌ Prisma query execution error:', error.message || error);
    throw error;
  }
};

export default prisma;
