import { PrismaClient } from '@prisma/client';
import { ICoupon, IR_coupons } from "./IR_coupons";

export class R_coupons implements IR_coupons {
  constructor(private db: PrismaClient) {}

  async create(c: ICoupon): Promise<ICoupon> {
    const query = `
      INSERT INTO coupons (
        tenant_id, event_id, code, description, discount_type,
        amount_minor, percent, min_order_minor, currency,
        valid_from, valid_to, max_total, max_per_user,
        stackable_with_early_bird, status, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *;
    `;
    const values = [
      c.tenant_id, c.event_id, c.code, c.description, c.discount_type,
      c.amount_minor, c.percent, c.min_order_minor, c.currency,
      c.valid_from, c.valid_to, c.max_total, c.max_per_user,
      c.stackable_with_early_bird, c.status, c.created_by, c.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ICoupon | null> {
    const result = await this.db.query(`SELECT * FROM coupons WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByCode(tenantId: string, code: string): Promise<ICoupon | null> {
    const result = await this.db.query(
      `SELECT * FROM coupons WHERE tenant_id = $1 AND code = $2`,
      [tenantId, code]
    );
    return result.rows[0] || null;
  }

  async getByEventId(eventId: string): Promise<ICoupon[]> {
    const result = await this.db.query(
      `SELECT * FROM coupons WHERE event_id = $1 ORDER BY created_at DESC`,
      [eventId]
    );
    return result.rows;
  }

  async getAll(): Promise<ICoupon[]> {
    const result = await this.db.query(`SELECT * FROM coupons ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, c: Partial<ICoupon>): Promise<ICoupon | null> {
    const result = await this.db.query(
      `
      UPDATE coupons
      SET
        status = COALESCE($1, status),
        max_total = COALESCE($2, max_total),
        valid_to = COALESCE($3, valid_to),
        usage_count = COALESCE($4, usage_count),
        updated_at = now(),
        updated_by = $5
      WHERE id = $6
      RETURNING *;
      `,
      [c.status, c.max_total, c.valid_to, c.usage_count, c.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM coupons WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}