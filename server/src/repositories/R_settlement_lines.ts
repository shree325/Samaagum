import { PrismaClient } from '@prisma/client';
import { ISettlementLine, IR_settlement_lines } from "./IR_settlement_lines";

export class R_settlement_lines implements IR_settlement_lines {
  constructor(private db: PrismaClient) {}

  async create(l: ISettlementLine): Promise<ISettlementLine> {
    const query = `INSERT INTO settlement_lines (tenant_id, settlement_id, source_type, source_id, journal_id, amount_minor, currency, line_type, description, created_by, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *;`;
    const values = [l.tenant_id, l.settlement_id, l.source_type, l.source_id, l.journal_id, l.amount_minor, l.currency, l.line_type, l.description, l.created_by, l.updated_by];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ISettlementLine | null> {
    const result = await this.db.query(`SELECT * FROM settlement_lines WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getBySettlementId(settlementId: string): Promise<ISettlementLine[]> {
    const result = await this.db.query(`SELECT * FROM settlement_lines WHERE settlement_id = $1`, [settlementId]);
    return result.rows;
  }

  async getAll(): Promise<ISettlementLine[]> {
    const result = await this.db.query(`SELECT * FROM settlement_lines ORDER BY created_at DESC`);
    return result.rows;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM settlement_lines WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
