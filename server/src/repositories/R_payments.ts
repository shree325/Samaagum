import { Pool } from "pg";
import { IPayment, IR_payments } from "./IR_payments";

export class R_payments implements IR_payments {
  constructor(private db: Pool) {}

  async create(p: IPayment): Promise<IPayment> {
    const query = `
      INSERT INTO payments (
        tenant_id, booking_id, method, gateway_order_id, gateway_payment_id,
        amount_minor, currency, status, proof_asset_id,
        collected_at, received_by_user_id, provider_payload,
        modification_num, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *;
    `;
    const values = [
      p.tenant_id, p.booking_id, p.method, p.gateway_order_id, p.gateway_payment_id,
      p.amount_minor, p.currency, p.status, p.proof_asset_id,
      p.collected_at, p.received_by_user_id,
      p.provider_payload ? JSON.stringify(p.provider_payload) : null,
      p.modification_num ?? 0, p.created_by, p.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<IPayment | null> {
    const result = await this.db.query(`SELECT * FROM payments WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByBookingId(bookingId: string): Promise<IPayment[]> {
    const result = await this.db.query(
      `SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC`,
      [bookingId]
    );
    return result.rows;
  }

  async getByGatewayPaymentId(gatewayPaymentId: string): Promise<IPayment | null> {
    const result = await this.db.query(
      `SELECT * FROM payments WHERE gateway_payment_id = $1`,
      [gatewayPaymentId]
    );
    return result.rows[0] || null;
  }

  async getAll(): Promise<IPayment[]> {
    const result = await this.db.query(`SELECT * FROM payments ORDER BY created_at DESC`);
    return result.rows;
  }

  async update(id: string, p: Partial<IPayment>): Promise<IPayment | null> {
    const result = await this.db.query(
      `
      UPDATE payments
      SET
        status = COALESCE($1, status),
        gateway_payment_id = COALESCE($2, gateway_payment_id),
        collected_at = COALESCE($3, collected_at),
        received_by_user_id = COALESCE($4, received_by_user_id),
        updated_at = now(),
        updated_by = $5,
        modification_num = modification_num + 1
      WHERE id = $6
      RETURNING *;
      `,
      [p.status, p.gateway_payment_id, p.collected_at, p.received_by_user_id, p.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM payments WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}