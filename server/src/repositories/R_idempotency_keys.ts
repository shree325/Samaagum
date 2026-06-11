import { PrismaClient } from '@prisma/client';
import { IIdempotencyKey, IR_idempotency_keys } from "./IR_idempotency_keys";

export class R_idempotency_keys implements IR_idempotency_keys {
  constructor(private db: PrismaClient) {}

  async create(ik: IIdempotencyKey): Promise<IIdempotencyKey> {
    const query = `
      INSERT INTO idempotency_keys (bu_id, idempotency_key, request_hash, response_data, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      ik.bu_id, ik.idempotency_key, ik.request_hash,
      ik.response_data ? JSON.stringify(ik.response_data) : null, ik.expires_at
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<IIdempotencyKey | null> {
    const { rows } = await this.db.query(`SELECT * FROM idempotency_keys WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByKey(buId: string, idempotencyKey: string): Promise<IIdempotencyKey | null> {
    const { rows } = await this.db.query(
      `SELECT * FROM idempotency_keys WHERE bu_id = $1 AND idempotency_key = $2`,
      [buId, idempotencyKey]
    );
    return rows[0] || null;
  }

  async updateResponse(buId: string, idempotencyKey: string, responseData: Record<string, unknown>): Promise<IIdempotencyKey | null> {
    const query = `
      UPDATE idempotency_keys
      SET response_data = $1,
          db_last_upd = now()
      WHERE bu_id = $2 AND idempotency_key = $3
      RETURNING *;
    `;
    const { rows } = await this.db.query(query, [JSON.stringify(responseData), buId, idempotencyKey]);
    return rows[0] || null;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM idempotency_keys WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
