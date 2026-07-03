import { QueryResult, QueryResultRow } from 'pg';

declare module '@prisma/client' {
  export interface PrismaClient {
    invoices: any;
    query<T extends QueryResultRow = any>(
      queryText: string,
      values?: any[]
    ): Promise<QueryResult<T>>;
  }
}
