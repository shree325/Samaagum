import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ITenant, IR_tenants } from './IR_tenants';
import pool from '../config/database';

export class R_tenants extends PostgresBaseRepository<ITenant> implements IR_tenants {
  constructor() {
    super('tenants', 'tenant_id');
  }

  async findBySlug(slug: string): Promise<ITenant | null> {
    const query = `SELECT * FROM tenants WHERE slug = $1`;
    const { rows } = await pool.query(query, [slug]);
    return rows[0] || null;
  }
}
