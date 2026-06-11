import { Pool } from 'pg';
import { ITenant, IR_tenants } from './IR_tenants';

export class R_tenants implements IR_tenants {
  constructor(private db: Pool) {}

  async create(tenant: ITenant): Promise<ITenant> {
    const query = `
      INSERT INTO tenants (slug, name, status, default_currency, default_locale)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
    `;
    const values = [
      tenant.slug, tenant.name, tenant.status ?? 'active',
      tenant.default_currency ?? 'INR', tenant.default_locale ?? 'en',
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ITenant | null> {
    const result = await this.db.query('SELECT * FROM tenants WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getBySlug(slug: string): Promise<ITenant | null> {
    const result = await this.db.query('SELECT * FROM tenants WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  }

  async getAll(): Promise<ITenant[]> {
    const result = await this.db.query('SELECT * FROM tenants ORDER BY created_at DESC');
    return result.rows;
  }

  async update(id: string, tenant: Partial<ITenant>): Promise<ITenant | null> {
    const result = await this.db.query(
      `UPDATE tenants SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        status = COALESCE($3, status),
        default_currency = COALESCE($4, default_currency),
        default_locale = COALESCE($5, default_locale)
      WHERE id = $6
      RETURNING *;`,
      [tenant.name, tenant.slug, tenant.status, tenant.default_currency, tenant.default_locale, id]
    );
    return result.rows[0] || null;
  }
}
