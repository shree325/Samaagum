import { QueryResult, QueryResultRow } from 'pg';

declare module '@prisma/client' {
  export interface PrismaClient {
    query<T extends QueryResultRow = any>(
      queryText: string,
      values?: any[]
    ): Promise<QueryResult<T>>;
  }
}
