import { PrismaClient } from '@prisma/client';
import { ISignal, IR_signals } from "./IR_signals";

export class R_signals implements IR_signals {
  constructor(private db: PrismaClient) {}

  async create(s: ISignal): Promise<ISignal> {
    const query = `
      INSERT INTO signals (bu_id, entity_type, entity_id, signal_type, signal_value, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      s.bu_id, s.entity_type, s.entity_id, s.signal_type, s.signal_value || 1.0, s.created_by || null
    ];
    const { rows } = await this.db.query(query, values);
    return rows[0];
  }

  async getById(rowId: string): Promise<ISignal | null> {
    const { rows } = await this.db.query(`SELECT * FROM signals WHERE row_id = $1`, [rowId]);
    return rows[0] || null;
  }

  async getByEntity(entityType: string, entityId: string): Promise<ISignal[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM signals WHERE entity_type = $1 AND entity_id = $2 ORDER BY created DESC`,
      [entityType, entityId]
    );
    return rows;
  }

  async getAll(buId: string): Promise<ISignal[]> {
    const { rows } = await this.db.query(
      `SELECT * FROM signals WHERE bu_id = $1 ORDER BY created DESC`,
      [buId]
    );
    return rows;
  }

  async delete(rowId: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM signals WHERE row_id = $1`, [rowId]);
    return (result.rowCount ?? 0) > 0;
  }
}
