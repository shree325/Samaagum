import { Pool } from "pg";
import { ISettlement, IR_settlements } from "./IR_settlements";

export class R_settlements implements IR_settlements {
  constructor(private db: Pool) {}

  async create(s: ISettlement): Promise<ISettlement> {
    const query = `INSERT INTO settlements (tenant_id, owner_entity_id, period_start, period_end, gross_minor, fees_minor, refunds_minor, net_minor, currency, status, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *;`;
    const values = [s.tenant_id, s.owner_entity_id, s.period_start, s.period_end, s.gross_minor, s.fees_minor, s.refunds_minor, s.net_minor, s.currency, s.status, s.created_by, s.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ISettlement | null> {
    const result = await this.db.query(`SELECT * FROM settlements WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getByOwnerEntityId(ownerEntityId: string): Promise<ISettlement[]> {
    const result = await this.db.query(`SELECT * FROM settlements WHERE owner_entity_id = $1 ORDER BY period_start DESC`, [ownerEntityId]);
    return result.rows;
  }

  async getByStatus(status: string): Promise<ISettlement[]> {
    const result = await this.db.query(`SELECT * FROM settlements WHERE status = $1`, [status]);
    return result.rows;
  }

  async getAll(): Promise<ISettlement[]> {
    const result = await this.db.query(`SELECT * FROM settlements ORDER BY period_start DESC`);
    return result.rows;
  }

  async update(id: string, s: Partial<ISettlement>): Promise<ISettlement | null> {
    const result = await this.db.query(
      `UPDATE settlements SET status = COALESCE($1, status), reconciled_at = COALESCE($2, reconciled_at), payout_reference = COALESCE($3, payout_reference), net_minor = COALESCE($4, net_minor), updated_at = now(), updated_by = $5 WHERE id = $6 RETURNING *;`,
      [s.status, s.reconciled_at, s.payout_reference, s.net_minor, s.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM settlements WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
