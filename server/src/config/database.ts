import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import prisma from './prisma';

dotenv.config();

export class PrismaPool extends Pool {
  constructor() {
    // Call parent constructor with basic environment credentials
    super({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }

  // Override query to route through Prisma Client
  override async query<T extends QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: any,
    values?: any
  ): Promise<QueryResult<T>> {
    let sql = '';
    let params: any[] = [];

    if (typeof queryTextOrConfig === 'string') {
      sql = queryTextOrConfig;
      params = values || [];
    } else if (queryTextOrConfig && typeof queryTextOrConfig === 'object') {
      sql = queryTextOrConfig.text || '';
      params = queryTextOrConfig.values || [];
    }

    try {
      const result = await prisma.$queryRawUnsafe(sql, ...params);
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
      } as unknown as QueryResult<T>;
    } catch (error: any) {
      console.error('❌ PrismaPool query execution error:', error.message || error);
      throw error;
    }
  }

  // Override end to gracefully disconnect Prisma Client
  override async end(): Promise<void> {
    await prisma.$disconnect();
  }
}

// Create singleton pool instance
const pool = new PrismaPool();

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ PostgreSQL Database connected successfully via Prisma.');
  })
  .catch((err) => {
    console.error('❌ Database connection failed via Prisma:', err.message || err);
  });

export default pool;
