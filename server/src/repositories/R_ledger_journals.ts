import { Pool } from "pg";
import { ILedgerJournal, IR_ledger_journals } from "./IR_ledger_journals";

export class R_ledger_journals implements IR_ledger_journals {
  constructor(private db: Pool) {}

  async create(j: ILedgerJournal): Promise<ILedgerJournal> {
    const query = `
      INSERT INTO ledger_journals (
        tenant_id, journal_type, source_type, source_id,
        narration, posted_at, reversal_of_journal_id, status,
        modification_num, created_by, updated_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *;
    `;
    const values = [
      j.tenant_id, j.journal_type, j.source_type, j.source_id,
      j.narration, j.posted_at, j.reversal_of_journal_id, j.status,
      j.modification_num ?? 0, j.created_by, j.updated_by,
    ];
    const result = await this.db.query(query, values);
    return result.rows[0];
  }

  async getById(id: string): Promise<ILedgerJournal | null> {
    const result = await this.db.query(`SELECT * FROM ledger_journals WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async getBySource(sourceType: string, sourceId: string): Promise<ILedgerJournal[]> {
    const result = await this.db.query(
      `SELECT * FROM ledger_journals WHERE source_type = $1 AND source_id = $2 ORDER BY posted_at DESC`,
      [sourceType, sourceId]
    );
    return result.rows;
  }

  async getAll(): Promise<ILedgerJournal[]> {
    const result = await this.db.query(`SELECT * FROM ledger_journals ORDER BY posted_at DESC`);
    return result.rows;
  }

  async update(id: string, j: Partial<ILedgerJournal>): Promise<ILedgerJournal | null> {
    const result = await this.db.query(
      `
      UPDATE ledger_journals
      SET
        status = COALESCE($1, status),
        narration = COALESCE($2, narration),
        updated_at = now(),
        updated_by = $3,
        modification_num = modification_num + 1
      WHERE id = $4
      RETURNING *;
      `,
      [j.status, j.narration, j.updated_by, id]
    );
    return result.rows[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.query(`DELETE FROM ledger_journals WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}