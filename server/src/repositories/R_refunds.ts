import { PrismaClient } from '@prisma/client';
import { IRefund, IR_refunds } from "./IR_refunds";

export class R_refunds implements IR_refunds {
  constructor(private db: PrismaClient) {}

  async create(r: IRefund): Promise<IRefund> {
    const query = `
      INSERT INTO refunds (
        tenant_id, payment_id, line_item_id, approved_by,
        amount_minor, currency, mode, status, is_partial,
        reason, external_ref, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *;
    `;
    const values = [
      r.tenant_id, r.payment_id, r.line_item_id, r.approved_by,
      r.amount_minor, r.currency, r.mode, r.status, r.is_partial,
      r.reason, r.external_ref, r.created_by, r.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IRefund | null> {
    const result = await this.db.query(`SELECT * FROM refunds WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByPaymentId(paymentId: string): Promise<IRefund[]> {
    const result = await this.db.query(
      `SELECT * FROM refunds WHERE payment_id = $1 ORDER BY created_at DESC`,
      [paymentId]
    );
    return result.rows;
  }

  async getAll(): Promise<IRefund[]> {
    const result = await this.db.query(`SELECT * FROM refunds ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, r: Partial<IRefund>): Promise<IRefund | null> {
    const result = await this.db.query(
      `
      UPDATE refunds
      SET
        status = COALESCE($1, status),
        approved_by = COALESCE($2, approved_by),
        approved_at = COALESCE($3, approved_at),
        processed_at = COALESCE($4, processed_at),
        external_ref = COALESCE($5, external_ref),
        updated_at = now(),
        updated_by = $6
      WHERE id = $7
      RETURNING *;
      `,
      [r.status, r.approved_by, r.approved_at, r.processed_at, r.external_ref, r.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM refunds WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}